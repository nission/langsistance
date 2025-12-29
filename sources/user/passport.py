import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException
from sources.knowledge.knowledge import get_db_connection, get_redis_connection, create_tool_and_knowledge_records
import random
from datetime import datetime, timedelta, timezone
from sources.logger import Logger

logger = Logger("passport.log")

cred = credentials.Certificate("firebase_service_key.json")
firebase_admin.initialize_app(cred)

# 初始化 Redis 连接
redis_client = get_redis_connection()  # 根据实际情况调整配置

# 白名单配置 - 字典形式
WHITELIST_TOKENS = {
    "Bearer whitelist_token_1": {
        'uid': '12957524084372015683',
        'email': 'gray.yuehui@gmail.com'
    },
    # 可以添加更多白名单项
    # "whitelist_token_2": {
    #     'uid': 12345678901234567890,
    #     'email': 'another.user@example.com'
    # }
}

def verify_firebase_token(auth_header: str):
    logger.info(f"verify firebase token auther header: {auth_header}")
    # 检查是否为白名单请求
    if auth_header in WHITELIST_TOKENS:
        return WHITELIST_TOKENS[auth_header]

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    id_token = auth_header.split("Bearer ")[1]
    logger.info(f"verify firebase token id token: {id_token}")
    try:
        decoded_token = auth.verify_id_token(id_token)
        firebase_uid = decoded_token['uid']

        # 先检查 Redis 中是否存在
        user_data = redis_client.get(f"firebase_uid_{firebase_uid}")
        if user_data:
            # Redis 中存在，用缓存的 user_id 覆盖 uid
            decoded_token['uid'] = int(user_data.decode('utf-8'))
        else:
            # Redis 中不存在，查询数据库
            conn = get_db_connection()
            cursor = conn.cursor()

            # 查询数据库中的 user 表
            cursor.execute("SELECT user_id, email FROM user WHERE firebase_uid = ?", (firebase_uid,))
            result = cursor.fetchone()

            if result:
                # 数据库中找到记录，用 user_id 覆盖 uid
                user_id = result[0]
                decoded_token['uid'] = user_id
                # 写入 Redis 缓存
                redis_client.setex(f"firebase_uid_{firebase_uid}", 864000, user_id)  # 缓存1小时
            else:
                # 数据库中也不存在，需要创建新用户
                # 最多尝试5次生成唯一的user_id
                user_id = None
                attempts = 0
                max_attempts = 5

                while attempts < max_attempts:
                    # 生成64位正整数作为 user_id
                    new_user_id = random.randint(10 ** 63, 10 ** 64 - 1)

                    # 检查user_id是否已存在
                    cursor.execute("SELECT COUNT(*) FROM user WHERE user_id = ?", (new_user_id,))
                    user_exists = cursor.fetchone()[0] > 0

                    if not user_exists:
                        # user_id唯一，可以使用
                        user_id = new_user_id
                        break

                    attempts += 1

                # 如果成功生成了唯一的user_id，则插入数据库
                if user_id is not None and attempts < max_attempts:
                    # 插入数据库
                    cursor.execute(
                        "INSERT INTO users (user_id, firebase_uid, email) VALUES (?, ?, ?)",
                        (user_id, firebase_uid, decoded_token['email'])
                    )
                    conn.commit()

                    # 用新生成的 user_id 覆盖 uid
                    decoded_token['uid'] = user_id
                    # 写入 Redis 缓存
                    redis_client.setex(f"firebase_uid_{firebase_uid}", 864000, user_id)  # 缓存10天
                elif attempts >= max_attempts:
                    conn.close()
                    raise HTTPException(status_code=500, detail="Failed to generate unique user_id after 5 attempts")

            conn.close()

        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

def seconds_until_end_of_day() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return int((tomorrow - now).total_seconds())

MAX_DAILY_CALLS = 100

async def check_and_increase_usage(user_id: int) -> bool:
    """
    返回 True：允许调用
    返回 False：超过当日限制
    """
    today = datetime.utcnow().strftime("%Y%m%d")
    key = f"api_usage_{user_id}_{today}"

    count = await redis_client.incr(key)

    if count == 1:
        # 第一次使用，设置过期时间到当天结束
        await redis_client.expire(key, seconds_until_end_of_day())

    if count > MAX_DAILY_CALLS:
        return False

    return True


def get_user_by_id(user_id: str):
    """
    根据user_id查询user表，返回用户数据

    Args:
        user_id (int): 用户ID

    Returns:
        dict: 用户数据，如果用户不存在则返回None
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 查询用户数据
        cursor.execute(
            "SELECT user_id, firebase_uid, email, oauth_provider, oauth_provider_id, is_active, create_time, update_time FROM users WHERE user_id = %s",
            (user_id,)
        )
        result = cursor.fetchone()
        logger.info(f"result email: {result[2]} ")
        if result:
            # 将查询结果转换为字典格式
            user_data = {
                'user_id': result[0],
                'firebase_uid': result[1],
                'email': result[2],
                'oauth_provider': result[3],
                'oauth_provider_id': result[4],
                'is_active': result[5],
                'create_time': result[6],
                'update_time': result[7]
            }
            logger.info(f"user data email: {user_data['email']} ")
            return user_data
        else:
            return None

    except Exception as e:
        logger.error(f"Error querying user by ID {user_id}: {str(e)}")
        return None
    finally:
        if conn:
            conn.close()
