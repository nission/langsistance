#!/usr/bin/env python3

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from typing import List
import json

from .models import (
    ToolAndKnowledgeCreateRequest, ToolAndKnowledgeCreateResponse,
    ToolUpdateRequest, ToolUpdateResponse,
    ToolDeleteRequest, ToolDeleteResponse,
    ToolQueryResponse, ToolItem,
    ToolFetchRequest, ToolFetchResponse,
    ToolResponseRequest, ToolResponseResponse
)
from sources.knowledge.knowledge import get_embedding, get_db_connection, get_redis_connection, create_tool_and_knowledge_records
from sources.logger import Logger
from sources.user.passport import verify_firebase_token

logger = Logger("backend.log")
router = APIRouter()

@router.post("/create_tool_and_knowledge", response_model=ToolAndKnowledgeCreateResponse)
async def create_tool_and_knowledge(request: ToolAndKnowledgeCreateRequest, http_request:  Request):
    """
    创建tool和knowledge记录接口
    首先创建tool，然后使用tool的id创建knowledge
    """
    auth_header = http_request.headers.get("Authorization")
    user = verify_firebase_token(auth_header)

    user_id = user['uid']

    logger.info(f"Creating tool and knowledge records for user: {user_id}")

    # 参数校验 - Tool部分
    tool_errors = []

    if not user_id or len(user_id) > 50:
        tool_errors.append("tool_userId is required and must be no more than 50 characters")

    if not request.tool_title or len(request.tool_title) > 100:
        tool_errors.append("tool_title is required and must be no more than 100 characters")

    if not request.tool_description or len(request.tool_description) > 5000:
        tool_errors.append("tool_description is required and must be no more than 5000 characters")

    if not request.tool_url or len(request.tool_url) > 1000:
        tool_errors.append("tool_url is required and must be no more than 1000 characters")

    if len(request.tool_params) > 5000:
        tool_errors.append("tool_params must be no more than 5000 characters")

    if tool_errors:
        logger.error(f"Tool validation errors: {tool_errors}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Tool validation failed",
                "errors": tool_errors,
                "tool_id": None,
                "knowledge_id": None
            }
        )

    # 参数校验 - Knowledge部分
    knowledge_errors = []

    if not request.knowledge_question or len(request.knowledge_question) > 100:
        knowledge_errors.append("knowledge_question is required and must be no more than 100 characters")

    if not request.knowledge_description or len(request.knowledge_description) > 5000:
        knowledge_errors.append("knowledge_description is required and must be no more than 5000 characters")

    if not request.knowledge_answer or len(request.knowledge_answer) > 5000:
        knowledge_errors.append("knowledge_answer is required and must be no more than 5000 characters")

    if len(request.knowledge_model_name) > 200:
        knowledge_errors.append("knowledge_model_name must be no more than 200 characters")

    if len(request.knowledge_params) > 5000:
        knowledge_errors.append("knowledge_params must be no more than 5000 characters")

    if knowledge_errors:
        logger.error(f"Knowledge validation errors: {knowledge_errors}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Knowledge validation failed",
                "errors": knowledge_errors,
                "tool_id": None,
                "knowledge_id": None
            }
        )

    # 准备工具数据
    tool_data = {
        'user_id': user_id,
        'title': request.tool_title,
        'description': request.tool_description,
        'url': request.tool_url,
        'push': request.tool_push,
        'public': request.tool_public,
        'timeout': request.tool_timeout,
        'params': request.tool_params
    }

    # 准备知识数据
    knowledge_data = {
        'user_id': user_id,
        'question': request.knowledge_question,
        'description': request.knowledge_description,
        'answer': request.knowledge_answer,
        'public': request.knowledge_public,
        'embedding_id': request.knowledge_embeddingId,
        'model_name': request.knowledge_model_name,
        'params': request.knowledge_params
    }

    # 调用核心功能方法
    result = create_tool_and_knowledge_records(tool_data, knowledge_data)

    if result["success"]:
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": result["message"],
                "tool_id": result["tool_id"],
                "knowledge_id": result["knowledge_id"]
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": result["message"],
                "tool_id": result["tool_id"],
                "knowledge_id": result["knowledge_id"]
            }
        )


@router.post("/update_tool", response_model=ToolUpdateResponse)
async def update_tool(request: ToolUpdateRequest):
    """
    更新工具接口（仅允许更新title、description和public字段）
    """
    logger.info(f"Updating tool {request.toolId} for user: {request.userId}")

    # 参数校验
    errors = []

    if not request.userId or len(request.userId) > 50:
        errors.append("userId is required and must be no more than 50 characters")

    if request.title is not None and (not request.title or len(request.title) > 100):
        errors.append("title must be between 1 and 100 characters")

    if request.description is not None and (not request.description or len(request.description) > 5000):
        errors.append("description must be between 1 and 5000 characters")

    if errors:
        logger.error(f"Validation errors: {errors}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Validation failed",
                "errors": errors
            }
        )

    connection = None
    try:
        # 获取数据库连接
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 首先检查记录是否存在以及用户ID是否匹配
            check_sql = "SELECT user_id FROM tools WHERE id = %s AND status = %s"
            cursor.execute(check_sql, (request.toolId, 1))
            result = cursor.fetchone()

            if not result:
                logger.warning(f"Tool record {request.toolId} not found or inactive")
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": "Tool record not found or inactive"
                    }
                )

            # 校验用户ID是否匹配
            record_user_id = result["user_id"]
            if str(record_user_id) != request.userId:
                logger.warning(f"User {request.userId} not authorized to update tool record {request.toolId}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "message": "Not authorized to update this tool record"
                    }
                )

            # 构建更新语句（仅包含允许更新的字段）
            update_fields = []
            update_params = []

            if request.title is not None:
                update_fields.append("title = '" + request.title + "'")

            if request.description is not None:
                update_fields.append("description = '" + request.description + "'")

            if request.public is not None:
                update_fields.append("public = " + str(request.public))

            # 如果没有任何字段需要更新
            if not update_fields:
                logger.info(f"No fields to update for tool record {request.toolId}")
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "message": "No fields to update"
                    }
                )

            # 添加工具ID到参数列表
            update_params.append(request.toolId)

            # 更新数据库记录
            update_sql = f"UPDATE tools SET {', '.join(update_fields)} WHERE id = %s"
            logger.info(f"update sql:{update_sql}")
            cursor.execute(update_sql, update_params)
            connection.commit()

            logger.info(f"Tool record {request.toolId} updated successfully")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Tool record updated successfully"
                }
            )

    except Exception as e:
        logger.error(f"Error updating tool record: {str(e)}")
        if connection:
            connection.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}"
            }
        )
    finally:
        if connection:
            connection.close()

@router.post("/delete_tool", response_model=ToolDeleteResponse)
async def delete_tool(request: ToolDeleteRequest):
    """
    删除工具接口（通过修改status字段实现软删除）
    """
    logger.info(f"Deleting tool {request.toolId} for user: {request.userId}")

    # 参数校验
    errors = []

    if not request.userId or len(request.userId) > 50:
        errors.append("userId is required and must be no more than 50 characters")

    if not request.toolId:
        errors.append("toolId is required")

    if errors:
        logger.error(f"Validation errors: {errors}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Validation failed",
                "errors": errors
            }
        )

    connection = None
    try:
        # 获取数据库连接
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 首先检查记录是否存在以及用户ID是否匹配
            check_sql = "SELECT user_id FROM tools WHERE id = %s"
            cursor.execute(check_sql, (request.toolId,))
            result = cursor.fetchone()

            if not result:
                logger.warning(f"Tool record {request.toolId} not found")
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": "Tool record not found"
                    }
                )
            logger.info(f"tool result:{result}")
            # 校验用户ID是否匹配
            record_user_id = result["user_id"]
            if str(record_user_id) != request.userId:
                logger.warning(f"User {request.userId} not authorized to delete tool record {request.toolId}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "message": "Not authorized to delete this tool record"
                    }
                )

            # 软删除数据库记录（将status设置为0表示删除）
            delete_sql = "UPDATE tools SET status = %s WHERE id = %s"
            cursor.execute(delete_sql, (2, request.toolId))
            connection.commit()

            logger.info(f"Tool record {request.toolId} deleted successfully (status set to 0)")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Tool record deleted successfully"
                }
            )

    except Exception as e:
        logger.error(f"Error deleting tool record: {str(e)}")
        if connection:
            connection.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}"
            }
        )
    finally:
        if connection:
            connection.close()

@router.get("/query_tools", response_model=ToolQueryResponse)
async def query_tool_records(userId: str, query: str = "", limit: int = 10, offset: int = 0):
    """
    查询工具记录接口
    """
    # logger.info(f"Querying tool records for user: {userId}" + (f" with query: {query}" if query else ""))

    # 参数校验
    errors = []

    if not userId or len(userId) > 50:
        errors.append("userId is required and must be no more than 50 characters")

    if limit <= 0 or limit > 100:
        errors.append("limit must be between 1 and 100")

    if offset < 0:
        errors.append("offset must be greater than or equal to 0")

    if errors:
        logger.error(f"Validation errors: {errors}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Validation failed",
                "errors": errors,
                "data": [],
                "total": 0
            }
        )

    connection = None
    try:
        # 获取数据库连接
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 构建查询条件
            # 1. 用户ID匹配
            # 2. 公开的工具 或者 用户自己的工具
            # 3. 如果query不为空，则进行title或description模糊匹配
            if query:
                search_pattern = f"%{query}%"
                where_condition = "AND (title LIKE %s OR description LIKE %s)"
                params = [1, userId, search_pattern, search_pattern]
            else:
                where_condition = ""
                params = [1, userId]

            count_sql = f"""
                        SELECT COUNT(*) as total
                        FROM tools
                        WHERE status = %s
                          AND user_id = %s
                          {where_condition}
                        """

            cursor.execute(count_sql, params)
            count_result = cursor.fetchone()
            total = count_result['total'] if count_result else 0

            if total == 0:
                # logger.info(f"No tool records found for user: {userId}" + (f" with query: {query}" if query else ""))
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "message": "No records found",
                        "data": [],
                        "total": 0
                    }
                )

            # 查询数据
            if query:
                query_sql = f"""
                            SELECT id,
                                   user_id,
                                   title,
                                   description,
                                   url, push, public, status, timeout, params, create_time, update_time
                            FROM tools
                            WHERE status = %s
                               AND user_id = %s
                              {where_condition}
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, userId, search_pattern, search_pattern, limit, offset]
            else:
                query_sql = """
                            SELECT id,
                                   user_id,
                                   title,
                                   description,
                                   url, push, public, status, timeout, params, create_time, update_time
                            FROM tools
                            WHERE status = %s
                               AND user_id = %s
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, userId, limit, offset]

            cursor.execute(query_sql, params)
            results = cursor.fetchall()

            # 转换为ToolItem对象列表
            tool_items = []
            for row in results:
                tool_item = ToolItem(
                    id=row['id'],
                    user_id=str(row['user_id']),
                    title=row['title'],
                    description=row['description'],
                    url=row['url'],
                    push=row['push'],
                    public=row['public'],
                    status=row['status'],
                    timeout=row['timeout'],
                    params=row['params']
                )
                tool_items.append(tool_item)

            # logger.info(f"Found {len(tool_items)} tool records for user: {userId}" + (f" with query: {query}" if query else ""))
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Tool records retrieved successfully",
                    "data": [item.dict() for item in tool_items],
                    "total": total
                }
            )

    except Exception as e:
        logger.error(f"Error querying tool records: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}",
                "data": [],
                "total": 0
            }
        )
    finally:
        if connection:
            connection.close()

@router.get("/query_public_tools", response_model=ToolQueryResponse)
async def query_public_tools(query: str = "", limit: int = 10, offset: int = 0):
    """
    查询公开工具记录接口
    """
    logger.info(f"Querying public tool" + (f" with query: {query}" if query else ""))

    # 参数校验
    errors = []

    if limit <= 0 or limit > 100:
        errors.append("limit must be between 1 and 100")

    if offset < 0:
        errors.append("offset must be greater than or equal to 0")

    if errors:
        logger.error(f"Validation errors: {errors}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Validation failed",
                "errors": errors,
                "data": [],
                "total": 0
            }
        )

    connection = None
    try:
        # 获取数据库连接
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 构建查询条件
            # 1. 用户ID匹配
            # 2. 公开的工具 或者 用户自己的工具
            # 3. 如果query不为空，则进行title或description模糊匹配
            if query:
                search_pattern = f"%{query}%"
                where_condition = "AND (title LIKE %s OR description LIKE %s)"
                params = [1, 2, search_pattern, search_pattern]
            else:
                where_condition = ""
                params = [1, 2]

            count_sql = f"""
                        SELECT COUNT(*) as total
                        FROM tools
                        WHERE status = %s
                          AND public = %s
                          {where_condition}
                        """

            cursor.execute(count_sql, params)
            count_result = cursor.fetchone()
            total = count_result['total'] if count_result else 0

            if total == 0:
                logger.info(f"No public tool" + (f" with query: {query}" if query else ""))
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "message": "No records found",
                        "data": [],
                        "total": 0
                    }
                )

            # 查询数据
            if query:
                query_sql = f"""
                            SELECT id,
                                   user_id,
                                   title,
                                   description,
                                   url, push, public, status, timeout, params, create_time, update_time
                            FROM tools
                            WHERE status = %s
                               AND public = %s
                              {where_condition}
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, 2, search_pattern, search_pattern, limit, offset]
            else:
                query_sql = """
                            SELECT id,
                                   user_id,
                                   title,
                                   description,
                                   url, push, public, status, timeout, params, create_time, update_time
                            FROM tools
                            WHERE status = %s
                               AND public = %s
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, 2, limit, offset]

            cursor.execute(query_sql, params)
            results = cursor.fetchall()

            # 转换为ToolItem对象列表
            tool_items = []
            for row in results:
                tool_item = ToolItem(
                    id=row['id'],
                    user_id=str(row['user_id']),
                    title=row['title'],
                    description=row['description'],
                    url=row['url'],
                    push=row['push'],
                    public=row['public'],
                    status=row['status'],
                    timeout=row['timeout'],
                    params=row['params']
                )
                tool_items.append(tool_item)

            logger.info(f"Found {len(tool_items)} public tool" + (f" with query: {query}" if query else ""))
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Tool records retrieved successfully",
                    "data": [item.dict() for item in tool_items],
                    "total": total
                }
            )

    except Exception as e:
        logger.error(f"Error querying tool records: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}",
                "data": [],
                "total": 0
            }
        )
    finally:
        if connection:
            connection.close()

@router.post("/get_tool_request", response_model=ToolFetchResponse)
async def get_tool_request(request: ToolFetchRequest):
    """
    根据query_id和userId从Redis获取工具对象

    Args:
        request: 包含query_id和userId的请求对象

    Returns:
        ToolFetchResponse: 包含工具对象的响应
    """
    logger.info(f"get tool request for user: {request.userId} with query_id: {request.query_id}")

    try:
        # 参数校验
        if not request.userId or len(request.userId) > 50:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "userId is required and must be no more than 50 characters"
                }
            )

        if not request.query_id:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "query_id is required"
                }
            )

        # 创建Redis连接
        redis_conn = None
        try:
            redis_conn = get_redis_connection()
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"Failed to connect to Redis: {str(e)}"
                }
            )

        # 构造Redis键
        redis_key = f"tool_request_{request.query_id}_{request.userId}"

        # 从Redis获取工具对象
        try:
            tool_data_str = redis_conn.get(redis_key)
            if not tool_data_str:
                logger.warning(f"No tool found in Redis with key: {redis_key}")
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "message": "Tool not found",
                        "tool": None
                    }
                )

            # 尝试解析存储的工具数据
            tool_data = json.loads(tool_data_str)
            logger.info(f"Successfully retrieved tool from Redis with key: {redis_key}")

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Tool retrieved successfully",
                    "tool": tool_data
                }
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse tool data from Redis: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Failed to parse tool data"
                }
            )
        except Exception as e:
            logger.error(f"Error retrieving tool from Redis: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"Error retrieving tool from Redis: {str(e)}"
                }
            )

    except Exception as e:
        logger.error(f"Error in fetch_tool: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}"
            }
        )

@router.post("/save_tool_response", response_model=ToolResponseResponse)
async def save_tool_response(request: ToolResponseRequest):
    """
    保存工具响应到Redis

    Args:
        request: 包含query_id、userId和tool_response的请求对象

    Returns:
        ToolResponseResponse: 操作结果响应
    """
    logger.info(f"Saving tool response for user: {request.userId} with query_id: {request.query_id} - tool response: {request.tool_response}")

    try:
        # 参数校验
        if not request.userId or len(request.userId) > 50:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "userId is required and must be no more than 50 characters"
                }
            )

        if not request.query_id:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "query_id is required"
                }
            )

        if not request.tool_response:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "tool_response is required"
                }
            )

        # 创建Redis连接
        redis_conn = None
        try:
            redis_conn = get_redis_connection()
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"Failed to connect to Redis: {str(e)}"
                }
            )

        # 构造Redis键
        redis_key = f"tool_response_{request.query_id}_{request.userId}"

        # 将tool_response数据存储到Redis
        try:
            tool_response_str = json.dumps(request.tool_response)
            redis_conn.set(redis_key, tool_response_str)
            logger.info(f"Successfully saved tool response to Redis with key: {redis_key}")

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Tool response saved successfully"
                }
            )

        except json.JSONEncodeError as e:
            logger.error(f"Failed to serialize tool response data: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Failed to serialize tool response data"
                }
            )
        except Exception as e:
            logger.error(f"Error saving tool response to Redis: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"Error saving tool response to Redis: {str(e)}"
                }
            )

    except Exception as e:
        logger.error(f"Error in save_tool_response: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}"
            }
        )

@router.get("/query_tool_by_id", response_model=ToolQueryResponse)
async def query_tool_by_id(tool_id: int):
    """
    根据tool_id查询工具详情接口
    """
    logger.info(f"Querying tool by id: {tool_id}")

    # 参数校验
    if not tool_id:
        logger.error("tool_id is required")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "tool_id is required"
            }
        )

    connection = None
    try:
        # 获取数据库连接
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 查询指定ID且状态为有效的工具
            query_sql = """
                        SELECT id, \
                               user_id, \
                               title, \
                               description, \
                               url, push, public, status, timeout, params, create_time, update_time
                        FROM tools
                        WHERE id = %s AND status = %s
                        """
            cursor.execute(query_sql, (tool_id, 1))
            result = cursor.fetchone()

            if not result:
                logger.info(f"No tool found with id: {tool_id}")
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": "Tool not found"
                    }
                )

            # 转换为ToolItem对象
            tool_item = ToolItem(
                id=result['id'],
                user_id=str(result['user_id']),
                title=result['title'],
                description=result['description'],
                url=result['url'],
                status=result['status'],
                timeout=result['timeout'],
                params=result['params']
            )

            logger.info(f"Tool found with id: {tool_id}")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Tool retrieved successfully",
                    "data": tool_item.dict()
                }
            )

    except Exception as e:
        logger.error(f"Error querying tool by id: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}"
            }
        )
    finally:
        if connection:
            connection.close()