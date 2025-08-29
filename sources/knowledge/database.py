#!/usr/bin/env python3

import os
import redis
import pymysql


def get_redis_connection():
    """创建并返回 Redis 连接"""
    redis_host = os.getenv('REDIS_HOST', 'localhost')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    redis_db = int(os.getenv('REDIS_DB', 0))
    redis_password = os.getenv('REDIS_PASSWORD', None)

    if redis_password:
        return redis.Redis(host=redis_host, port=redis_port, db=redis_db, password=redis_password,
                           decode_responses=True)
    else:
        return redis.Redis(host=redis_host, port=redis_port, db=redis_db, decode_responses=True)


def get_db_connection():
    """创建并返回数据库连接"""
    db_config = {
        'host': os.getenv('MYSQL_HOST', 'localhost'),
        'port' : int(os.getenv('MYSQL_PORT', 3306)),
        'user': os.getenv('MYSQL_USER', 'root'),
        'password': os.getenv('MYSQL_PASSWORD', ''),
        'database': os.getenv('MYSQL_DATABASE', 'langsistance_db'),
        'charset': 'utf8mb4'
    }
    return pymysql.connect(**db_config)