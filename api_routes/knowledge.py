#!/usr/bin/env python3

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from typing import List

from .models import (
    KnowledgeCreateRequest, KnowledgeCreateResponse,
    KnowledgeDeleteRequest, KnowledgeDeleteResponse,
    KnowledgeUpdateRequest, KnowledgeUpdateResponse,
    KnowledgeQueryResponse, KnowledgeItem,
    KnowledgeCopyRequest, KnowledgeCopyResponse
)
from sources.knowledge.knowledge import get_embedding, get_db_connection, get_redis_connection
from sources.logger import Logger

logger = Logger("backend.log")
router = APIRouter()

@router.post("/create_knowledge", response_model=KnowledgeCreateResponse)
async def create_knowledge_record(request: KnowledgeCreateRequest):
    """
    创建知识记录接口
    """
    logger.info(f"Creating knowledge record for user: {request.userId}")

    # 参数校验
    errors = []

    if not request.userId or len(request.userId) > 50:
        errors.append("userId is required and must be no more than 50 characters")

    if not request.question or len(request.question) > 100:
        errors.append("question is required and must be no more than 100 characters")

    if not request.description or len(request.description) > 5000:
        errors.append("description is required and must be no more than 5000 characters")

    if not request.answer or len(request.answer) > 5000:
        errors.append("answer is required and must be no more than 5000 characters")

    if len(request.modelName) > 200:
        errors.append("modelName must be no more than 200 characters")

    if len(request.params) > 5000:
        errors.append("params must be no more than 5000 characters")

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
            # 插入数据
            sql = """
                  INSERT INTO knowledge
                  (user_id, question, description, answer, public, model_name, tool_id, params, status, embedding_id)
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                  """
            cursor.execute(sql, (
                request.userId,
                request.question,
                request.description,
                request.answer,
                request.public,
                "gpt-4o-mini",
                request.toolId,
                request.params,
                1,
                0
            ))
            connection.commit()

            # 获取插入的记录ID
            record_id = cursor.lastrowid
            logger.info(f"Knowledge record created successfully with ID: {record_id}")

            query_embedding = get_embedding(request.question + request.answer)

            # 将 embedding 写入 Redis
            try:
                redis_conn = get_redis_connection()
                # 使用记录ID作为键，将embedding存储到Redis中
                redis_key = f"knowledge_embedding_{record_id}"
                redis_conn.set(redis_key, str(query_embedding))
                logger.info(f"Embedding stored in Redis with key: {redis_key}")
            except Exception as redis_error:
                logger.error(f"Failed to store embedding in Redis: {str(redis_error)}")
                # 注意：即使Redis存储失败，我们也不会中断主流程

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Knowledge record created successfully",
                    "id": record_id
                }
            )

    except Exception as e:
        logger.error(f"Error creating knowledge record: {str(e)}")
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

@router.post("/delete_knowledge", response_model=KnowledgeDeleteResponse)
async def delete_knowledge_record(request: KnowledgeDeleteRequest):
    """
    删除知识记录接口
    """
    logger.info(f"Deleting knowledge record {request.knowledgeId} for user: {request.userId}")

    # 参数校验
    errors = []

    if not request.userId or len(request.userId) > 50:
        errors.append("userId is required and must be no more than 50 characters")

    if not request.knowledgeId:
        errors.append("knowledgeId is required")

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
            check_sql = "SELECT user_id FROM knowledge WHERE id = %s"
            cursor.execute(check_sql, (request.knowledgeId,))
            result = cursor.fetchone()

            if not result:
                logger.warning(f"Knowledge record {request.knowledgeId} not found")
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": "Knowledge record not found"
                    }
                )

            # 校验用户ID是否匹配
            record_user_id = result["user_id"]
            if str(record_user_id) != request.userId:
                logger.warning(f"User {request.userId} not authorized to delete knowledge record {request.knowledgeId}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "message": "Not authorized to delete this knowledge record"
                    }
                )

            # 删除数据库记录
            delete_sql = "UPDATE knowledge SET status = %s WHERE id = %s"
            cursor.execute(delete_sql, (2, request.knowledgeId))
            connection.commit()

            # 删除Redis中的embedding
            try:
                redis_conn = get_redis_connection()
                redis_key = f"knowledge_embedding_{request.knowledgeId}"
                redis_result = redis_conn.delete(redis_key)
                if redis_result:
                    logger.info(f"Embedding deleted from Redis with key: {redis_key}")
                else:
                    logger.warning(f"Embedding not found in Redis with key: {redis_key}")
            except Exception as redis_error:
                logger.error(f"Failed to delete embedding from Redis: {str(redis_error)}")
                # 即使Redis删除失败，我们也不会中断主流程

            logger.info(f"Knowledge record {request.knowledgeId} deleted successfully")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Knowledge record deleted successfully"
                }
            )

    except Exception as e:
        logger.error(f"Error deleting knowledge record: {str(e)}")
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

@router.post("/update_knowledge", response_model=KnowledgeUpdateResponse)
async def update_knowledge_record(request: KnowledgeUpdateRequest):
    """
    修改知识记录接口
    """
    logger.info(f"Updating knowledge record {request.knowledgeId} for user: {request.userId}")

    # 参数校验
    errors = []

    if not request.userId or len(request.userId) > 50:
        errors.append("userId is required and must be no more than 50 characters")

    if not request.knowledgeId:
        errors.append("knowledgeId is required")

    if request.question and len(request.question) > 100:
        errors.append("question must be no more than 100 characters")

    if request.description and len(request.description) > 5000:
        errors.append("description must be no more than 5000 characters")

    if request.answer and len(request.answer) > 5000:
        errors.append("answer must be no more than 5000 characters")

    if request.modelName and len(request.modelName) > 200:
        errors.append("modelName must be no more than 200 characters")

    if request.params and len(request.params) > 5000:
        errors.append("params must be no more than 5000 characters")

    if request.toolId and not request.toolId:
        errors.append("toolId must be a valid integer")

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
            check_sql = "SELECT user_id, question, answer FROM knowledge WHERE id = %s AND status = %s"
            cursor.execute(check_sql, (request.knowledgeId, 1))
            result = cursor.fetchone()

            if not result:
                logger.warning(f"Knowledge record {request.knowledgeId} not found or inactive")
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": "Knowledge record not found or inactive"
                    }
                )

            # 校验用户ID是否匹配
            record_user_id = result["user_id"]
            if str(record_user_id) != request.userId:
                logger.warning(f"User {request.userId} not authorized to update knowledge record {request.knowledgeId}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "message": "Not authorized to update this knowledge record"
                    }
                )

            # 构建更新语句
            update_fields = []
            update_params = []

            if request.question is not None:
                update_fields.append("question = '" + request.question + "'")

            if request.description is not None:
                update_fields.append("description = '" + request.description + "'")

            if request.answer is not None:
                update_fields.append("answer = '" + request.answer + "'")

            if request.public is not None:
                update_fields.append("public = " + str(request.public))

            if request.modelName is not None:
                update_fields.append("modelName = '" + request.modelName + "'")

            if request.toolId is not None:
                update_fields.append("tool_id = " + str(request.toolId))

            if request.params is not None:
                update_fields.append("params = '" + request.params + "'")

            # 如果没有任何字段需要更新
            if not update_fields:
                logger.info(f"No fields to update for knowledge record {request.knowledgeId}")
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "message": "No fields to update"
                    }
                )

            # 添加记录ID到参数列表
            update_params.append(request.knowledgeId)

            # 更新数据库记录
            update_sql = f"UPDATE knowledge SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(update_sql, update_params)
            connection.commit()

            # 检查是否需要重新计算embedding (question或answer有变更)
            need_recalculate_embedding = False
            original_question = result["question"]
            original_answer = result["answer"]

            if ((request.question is not None and request.question != original_question) or
                    (request.answer is not None and request.answer != original_answer)):
                need_recalculate_embedding = True

            if need_recalculate_embedding:
                # 获取更新后的question和answer
                new_question = request.question if request.question is not None else original_question
                new_answer = request.answer if request.answer is not None else original_answer

                # 重新计算embedding
                query_embedding = get_embedding(new_question + new_answer)

                # 更新Redis中的embedding
                try:
                    redis_conn = get_redis_connection()
                    redis_key = f"knowledge_embedding_{request.knowledgeId}"
                    redis_conn.set(redis_key, str(query_embedding))
                    logger.info(f"Embedding updated in Redis with key: {redis_key}")
                except Exception as redis_error:
                    logger.error(f"Failed to update embedding in Redis: {str(redis_error)}")
                    # 即使Redis更新失败，我们也不会中断主流程

            logger.info(f"Knowledge record {request.knowledgeId} updated successfully")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Knowledge record updated successfully"
                }
            )

    except Exception as e:
        logger.error(f"Error updating knowledge record: {str(e)}")
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

@router.get("/query_knowledge", response_model=KnowledgeQueryResponse)
async def query_knowledge_records(userId: str, query: str, limit: int = 10, offset: int = 0):
    """
    查询知识记录接口
    """
    # logger.info(f"Querying knowledge records for user: {userId} with query: {query}")

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
            # 2. 公开的知识 或者 用户自己的知识
            # 3. question、description、answer字段模糊匹配
            if query:
                search_pattern = f"%{query}%"
                where_condition = "AND (question LIKE %s OR description LIKE %s OR answer LIKE %s)"
                params = [1, userId, search_pattern, search_pattern, search_pattern]
            else:
                where_condition = ""
                params = [1, userId]

            count_sql = f"""
                        SELECT COUNT(*) as total
                        FROM knowledge
                        WHERE status = %s
                          AND  user_id = %s
                          {where_condition}
                        """

            cursor.execute(count_sql, params)
            count_result = cursor.fetchone()
            total = count_result['total'] if count_result else 0

            if total == 0:
                # logger.info(f"No knowledge records found for user: {userId} with query: {query}")
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
                                   question,
                                   description,
                                   answer, public, model_name, tool_id, params, create_time, update_time
                            FROM knowledge
                            WHERE status = %s
                               AND user_id = %s
                              {where_condition}
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, userId, search_pattern, search_pattern, search_pattern, limit, offset]
            else:
                query_sql = """
                            SELECT id,
                                   user_id,
                                   question,
                                   description,
                                   answer, public, model_name, tool_id, params, create_time, update_time
                            FROM knowledge
                            WHERE status = %s
                               AND user_id = %s
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, userId, limit, offset]

            cursor.execute(query_sql, params)
            results = cursor.fetchall()

            # 转换为KnowledgeItem对象列表
            knowledge_items = []
            for row in results:
                knowledge_item = KnowledgeItem(
                    id=row['id'],
                    user_id=str(row['user_id']),
                    question=row['question'],
                    description=row['description'],
                    answer=row['answer'],
                    public=row['public'],
                    model_name=row['model_name'] or "",
                    tool_id=row['tool_id'] or 0,
                    params=row['params'] or ""
                )
                # 处理时间字段
                if row['create_time']:
                    knowledge_item.create_time = row['create_time'].isoformat() if hasattr(row['create_time'],
                                                                                         'isoformat') else str(
                        row['create_time'])
                if row['update_time']:
                    knowledge_item.update_time = row['update_time'].isoformat() if hasattr(row['update_time'],
                                                                                         'isoformat') else str(
                        row['update_time'])

                knowledge_items.append(knowledge_item)

            # logger.info(f"Found {len(knowledge_items)} knowledge records for user: {userId} with query: {query}")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Knowledge records retrieved successfully",
                    "data": [item.dict() for item in knowledge_items],
                    "total": total
                }
            )

    except Exception as e:
        logger.error(f"Error querying knowledge records: {str(e)}")
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

@router.get("/query_public_knowledge", response_model=KnowledgeQueryResponse)
async def query_public_knowledge(query: str, limit: int = 10, offset: int = 0):
    """
    查询公开知识记录接口
    """
    logger.info(f"Querying public knowledge with query: {query}")

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
            # 2. 公开的知识 或者 用户自己的知识
            # 3. question、description、answer字段模糊匹配
            if query:
                search_pattern = f"%{query}%"
                where_condition = "AND (question LIKE %s OR description LIKE %s OR answer LIKE %s)"
                params = [1, 1, search_pattern, search_pattern, search_pattern]
            else:
                where_condition = ""
                params = [1, 1]

            count_sql = f"""
                        SELECT COUNT(*) as total
                        FROM knowledge
                        WHERE status = %s
                          AND  public = %s
                          {where_condition}
                        """

            cursor.execute(count_sql, params)
            count_result = cursor.fetchone()
            total = count_result['total'] if count_result else 0

            if total == 0:
                logger.info(f"No public knowledge with query: {query}")
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
                                   question,
                                   description,
                                   answer, public, model_name, tool_id, params, create_time, update_time
                            FROM knowledge
                            WHERE status = %s
                               AND public = %s
                              {where_condition}
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, 1, search_pattern, search_pattern, search_pattern, limit, offset]
            else:
                query_sql = """
                            SELECT id,
                                   user_id,
                                   question,
                                   description,
                                   answer, public, model_name, tool_id, params, create_time, update_time
                            FROM knowledge
                            WHERE status = %s
                               AND public = %s
                            ORDER BY update_time DESC
                                LIMIT %s
                            OFFSET %s
                            """
                params = [1, 1, limit, offset]

            cursor.execute(query_sql, params)
            results = cursor.fetchall()

            # 转换为KnowledgeItem对象列表
            knowledge_items = []
            for row in results:
                knowledge_item = KnowledgeItem(
                    id=row['id'],
                    user_id=str(row['user_id']),
                    question=row['question'],
                    description=row['description'],
                    answer=row['answer'],
                    public=row['public'],
                    model_name=row['model_name'] or "",
                    tool_id=row['tool_id'] or 0,
                    params=row['params'] or ""
                )
                # 处理时间字段
                if row['create_time']:
                    knowledge_item.create_time = row['create_time'].isoformat() if hasattr(row['create_time'],
                                                                                         'isoformat') else str(
                        row['create_time'])
                if row['update_time']:
                    knowledge_item.update_time = row['update_time'].isoformat() if hasattr(row['update_time'],
                                                                                         'isoformat') else str(
                        row['update_time'])

                knowledge_items.append(knowledge_item)

            logger.info(f"Found {len(knowledge_items)} public knowledge with query: {query}")
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Knowledge records retrieved successfully",
                    "data": [item.dict() for item in knowledge_items],
                    "total": total
                }
            )

    except Exception as e:
        logger.error(f"Error querying knowledge records: {str(e)}")
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

@router.post("/copy_knowledge", response_model=KnowledgeCopyResponse)
async def copy_knowledge(request: KnowledgeCopyRequest):
    """
    复制知识记录接口
    """
    logger.info(f"Copy knowledge record for user: {request.userId}")

    # 参数校验
    errors = []

    if not request.userId or len(request.userId) > 50:
        errors.append("userId is required and must be no more than 50 characters")

    if not request.knowledgeId:
        errors.append("knowledgeId is required")

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

            query_sql = f"""
                        SELECT id,
                               user_id,
                               question,
                               description,
                               answer, public, model_name, tool_id, params
                        FROM knowledge
                        WHERE id = %s AND status = %s
                        """
            params = [request.knowledgeId, 1]

            cursor.execute(query_sql, params)
            results = cursor.fetchall()
            if len(results) == 0:
                logger.info(f"knowledge not exist: {request.knowledgeId}")
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "message": "knowledge not exist"
                    }
                )
            row = results[0]
            logger.info(f"row:{row}")
            # 插入数据
            sql = """
                  INSERT INTO knowledge
                  (user_id, question, description, answer, public, model_name, tool_id, params, status, embedding_id)
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                  """
            cursor.execute(sql, (
                request.userId,
                row["question"],
                row["description"],
                row["answer"],
                1,
                row["model_name"],
                row["tool_id"],
                row["params"],
                1,
                0
            ))
            connection.commit()

            # 获取插入的记录ID
            record_id = cursor.lastrowid
            logger.info(f"Knowledge record copied successfully with ID: {record_id}")

            # 将 embedding 写入 Redis
            try:
                redis_conn = get_redis_connection()
                # 使用记录ID作为键，将embedding存储到Redis中
                origin_key = f"knowledge_embedding_{request.knowledgeId}"
                new_key = f"knowledge_embedding_{record_id}"
                query_embedding = redis_conn.get(origin_key)
                redis_conn.set(new_key, str(query_embedding))
                logger.info(f"Embedding stored in Redis with key: {new_key}")
            except Exception as redis_error:
                logger.error(f"Failed to store embedding in Redis: {str(redis_error)}")
                # 注意：即使Redis存储失败，我们也不会中断主流程

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "message": "Knowledge record copied successfully",
                    "id": record_id
                }
            )

    except Exception as e:
        logger.error(f"Error copy knowledge: {str(e)}")
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