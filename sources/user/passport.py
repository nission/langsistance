import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException
from sources.knowledge.knowledge import get_db_connection, get_redis_connection, create_tool_and_knowledge_records
import random

cred = credentials.Certificate("firebase_service_key.json")
firebase_admin.initialize_app(cred)

# 初始化 Redis 连接
redis_client = get_redis_connection()  # 根据实际情况调整配置


def verify_firebase_token(auth_header: str):
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    id_token = auth_header.split("Bearer ")[1]

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
            cursor.execute("SELECT user_id FROM user WHERE firebase_uid = ?", (firebase_uid,))
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
                        "INSERT INTO user (user_id, firebase_uid) VALUES (?, ?)",
                        (user_id, firebase_uid)
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

