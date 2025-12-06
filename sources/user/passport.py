import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException

cred = credentials.Certificate("firebase_service_key.json")
firebase_admin.initialize_app(cred)

def verify_firebase_token(auth_header: str):

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    id_token = auth_header.split("Bearer ")[1]

    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
