#!/usr/bin/env python3

from fastapi import APIRouter
from sources.knowledge.routes import router

# 创建知识库API路由器，设置前缀和标签
knowledge_api = APIRouter(prefix="/knowledge", tags=["knowledge"])

# 包含所有路由
knowledge_api.include_router(router)
