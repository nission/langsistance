# API 路由端点对比文档

本文档列出了 `api_routes` 目录下各模块定义的所有 FastAPI 路由端点，包括 HTTP 方法和路径，方便与文档中的路由信息进行对比。

## 1. Knowledge 模块 (knowledge.py)

| HTTP 方法 | 路径 | 功能描述 |
|-----------|------|----------|
| POST | `/create_knowledge` | 创建知识记录 |
| POST | `/delete_knowledge` | 删除知识记录 |
| POST | `/update_knowledge` | 修改知识记录 |
| GET | `/query_knowledge` | 查询知识记录 |
| GET | `/query_public_knowledge` | 查询公开知识记录 |
| POST | `/copy_knowledge` | 复制知识记录 |

## 2. Tools 模块 (tools.py)

| HTTP 方法 | 路径 | 功能描述 |
|-----------|------|----------|
| POST | `/create_tool_and_knowledge` | 创建工具和知识记录 |
| POST | `/update_tool` | 更新工具 |
| POST | `/delete_tool` | 删除工具 |
| GET | `/query_tools` | 查询工具记录 |
| GET | `/query_public_tools` | 查询公开工具记录 |
| GET | `/query_tool_by_id` | 根据ID查询工具详情 |
| POST | `/get_tool_request` | 获取工具请求 |
| POST | `/save_tool_response` | 保存工具响应 |

## 3. Core 模块 (core.py)

| HTTP 方法 | 路径 | 功能描述 |
|-----------|------|----------|
| GET | `/latest_answer` | 获取最新答案 |
| POST | `/query` | 处理查询请求 |
| GET | `/screenshot` | 获取截图 |
| POST | `/find_knowledge_tool` | 根据问题查找相关知识和工具 |

## 4. System 模块 (system.py)

| HTTP 方法 | 路径 | 功能描述 |
|-----------|------|----------|
| GET | `/health` | 健康检查 |
| GET | `/is_active` | 检查系统是否活跃 |
| GET | `/stop` | 停止当前操作 |

## 总结

总共定义了 18 个 API 路由端点，其中：
- POST 方法：9 个端点
- GET 方法：9 个端点

这些端点涵盖了知识管理、工具管理、核心查询功能和系统管理等方面。