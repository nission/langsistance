# main.py
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from passlib.context import CryptContext
from jose import jwt, JWTError

from authlib.integrations.starlette_client import OAuth  # Authlib
import redis

# ----- CONFIG (use env vars in production) -----
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# OAuth creds (placeholders) - set real ones in env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "your-google-client-id")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "your-google-secret")
FACEBOOK_CLIENT_ID = os.getenv("FACEBOOK_CLIENT_ID", "your-fb-client-id")
FACEBOOK_CLIENT_SECRET = os.getenv("FACEBOOK_CLIENT_SECRET", "your-fb-secret")

MYSQL_HOST = os.getenv("MYSQL_HOST", "langsistance_db")
MYSQL_USER = os.getenv("MYSQL_USER", "langsistance_user")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "12345678")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "langsistance_db")
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:3306/{MYSQL_DATABASE}"
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# Redis (optional, used for token blacklisting/session)
REDIS_URL = os.getenv("REDIS_BASE_URL", "redis://localhost:6379/0")
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# Password hashing
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth client
oauth = OAuth()
# we'll register providers after app is created (need redirect URIs)
app = FastAPI(title="Auth demo")

# ----- MODELS -----
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # nullable for oauth-only users
    oauth_provider = Column(String, nullable=True)   # "google" or "facebook"
    oauth_provider_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ----- SCHEMAS -----
class RegisterIn(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ----- UTILS -----
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# Token blacklist helpers (optional)
def blacklist_token(token: str, ttl_seconds: int = ACCESS_TOKEN_EXPIRE_MINUTES * 60):
    # store key in redis
    r.setex(f"bl_{token}", ttl_seconds, "1")

def is_token_blacklisted(token: str):
    return r.exists(f"bl_{token}") == 1

# ----- Register & Login (email) -----
@app.post("/register", response_model=Token)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    # check exists
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(form_data: RegisterIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# ----- OAuth (Google + Facebook) -----
# Register OAuth clients - ensure redirect_uri matches app route and OAuth provider config
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="facebook",
    client_id=FACEBOOK_CLIENT_ID,
    client_secret=FACEBOOK_CLIENT_SECRET,
    access_token_url="https://graph.facebook.com/v10.0/oauth/access_token",
    authorize_url="https://www.facebook.com/v10.0/dialog/oauth",
    api_base_url="https://graph.facebook.com/v10.0/",
    client_kwargs={"scope": "email"},
)

# Step 1: redirect to provider
@app.get("/oauth/{provider}/login")
async def oauth_login(request: Request, provider: str):
    if provider not in ("google", "facebook"):
        raise HTTPException(status_code=404, detail="Provider not supported")
    redirect_uri = request.url_for("oauth_callback", provider=provider)
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)

# Step 2: callback (provider returns code) -> fetch profile -> create/login user -> return JWT or redirect
@app.get("/oauth/{provider}/callback")
async def oauth_callback(request: Request, provider: str, db: Session = Depends(get_db)):
    if provider not in ("google", "facebook"):
        raise HTTPException(status_code=404, detail="Provider not supported")
    client = oauth.create_client(provider)
    token = await client.authorize_access_token(request)
    user_info = None

    if provider == "google":
        # OpenID Connect userinfo endpoint usually available in metadata
        user_info = await client.parse_id_token(request, token)
        provider_id = user_info.get("sub")
        email = user_info.get("email")
    else:  # facebook
        # get user info via /me?fields=id,email
        resp = await client.get("me?fields=id,email", token=token)
        user_info = resp.json()
        provider_id = user_info.get("id")
        email = user_info.get("email")

    if not email:
        return JSONResponse({"error": "No email returned by provider"}, status_code=400)

    # Find or create user
    user = db.query(User).filter(
        (User.email == email) | ((User.oauth_provider == provider) & (User.oauth_provider_id == provider_id))
    ).first()

    if not user:
        user = User(email=email, oauth_provider=provider, oauth_provider_id=str(provider_id))
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # ensure oauth fields set
        if not user.oauth_provider:
            user.oauth_provider = provider
            user.oauth_provider_id = str(provider_id)
            db.add(user)
            db.commit()
            db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    # For SPA: you might want to redirect to frontend with token in fragment; for server-rendered, set secure cookie
    # Example: redirect to frontend with token (warning: tokens in URLs are visible → production use cookies)
    frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return RedirectResponse(f"{frontend}/oauth-success?token={access_token}")

# ----- Auth dependency (for protecting APIs) -----
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
auth_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme), db: Session = Depends(get_db)):
    token = credentials.credentials
    if is_token_blacklisted(token):
        raise HTTPException(status_code=401, detail="Token revoked")
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Example protected API
@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "oauth_provider": current_user.oauth_provider}

# Logout example (token blacklisting)
@app.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    token = credentials.credentials
    blacklist_token(token)
    return {"detail": "logged out"}

# ----- Run with: uvicorn main:app --reload -----
