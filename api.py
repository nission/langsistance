#!/usr/bin/env python3

import os, sys
import uvicorn
import configparser
from typing import List
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uuid
import json

from sources.agents.general_agent import GeneralAgent
from sources.llm_provider import Provider
from sources.interaction import Interaction
from sources.browser import Browser, create_driver
from sources.utility import pretty_print
from sources.logger import Logger
from sources.schemas import QueryRequest, QueryResponse
from sources.knowledge.knowledge import get_embedding, get_db_connection, get_redis_connection, get_knowledge_tool, KnowledgeItem, ToolItem

import pymysql
from pydantic import BaseModel
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


def is_running_in_docker():
    """Detect if code is running inside a Docker container."""
    # Method 1: Check for .dockerenv file
    if os.path.exists('/.dockerenv'):
        return True
    
    # Method 2: Check cgroup
    try:
        with open('/proc/1/cgroup', 'r') as f:
            return 'docker' in f.read()
    except:
        pass
    
    return False


from celery import Celery

api = FastAPI(title="AgenticSeek API", version="0.1.0")
celery_app = Celery("tasks", broker="redis://localhost:6379/0", backend="redis://localhost:6379/0")
celery_app.conf.update(task_track_started=True)
logger = Logger("backend.log")
config = configparser.ConfigParser()
config.read('config.ini')

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists(".screenshots"):
    os.makedirs(".screenshots")
api.mount("/screenshots", StaticFiles(directory=".screenshots"), name="screenshots")

class KnowledgeCreateRequest(BaseModel):
    userId: str
    question: str
    description: str
    answer: str
    public: bool
    embeddingId: int
    model_name: str
    tool_id: int
    params: str

class KnowledgeCreateResponse(BaseModel):
    success: bool
    message: str
    id: Optional[int] = None

class KnowledgeDeleteRequest(BaseModel):
    userId: str
    knowledgeId: int

class KnowledgeDeleteResponse(BaseModel):
    success: bool
    message: str

class KnowledgeUpdateRequest(BaseModel):
    userId: str
    knowledgeId: int
    question: Optional[str] = None
    description: Optional[str] = None
    answer: Optional[str] = None
    public: Optional[bool] = None
    modelName: Optional[str] = None
    toolId: Optional[int] = None
    params: Optional[str] = None

class KnowledgeUpdateResponse(BaseModel):
    success: bool
    message: str

class KnowledgeQueryResponse(BaseModel):
    success: bool
    message: str
    data: List[KnowledgeItem]
    total: int

class ToolAndKnowledgeCreateRequest(BaseModel):
    # Tool fields
    tool_userId: str
    tool_title: str
    tool_description: str
    tool_url: str
    tool_push: int
    tool_public: bool
    tool_timeout: int
    tool_params: str
    # Knowledge fields
    knowledge_userId: str
    knowledge_question: str
    knowledge_description: str
    knowledge_answer: str
    knowledge_public: bool
    knowledge_embeddingId: int
    knowledge_model_name: str
    knowledge_params: str

class ToolAndKnowledgeCreateResponse(BaseModel):
    success: bool
    message: str
    tool_id: Optional[int] = None
    knowledge_id: Optional[int] = None



def initialize_system():
    stealth_mode = config.getboolean('BROWSER', 'stealth_mode')
    personality_folder = "jarvis" if config.getboolean('MAIN', 'jarvis_personality') else "base"
    languages = config["MAIN"]["languages"].split(' ')
    
    # Force headless mode in Docker containers
    headless = config.getboolean('BROWSER', 'headless_browser')
    if is_running_in_docker() and not headless:
        # Print prominent warning to console (visible in docker-compose output)
        print("\n" + "*" * 70)
        print("*** WARNING: Detected Docker environment - forcing headless_browser=True ***")
        print("*** INFO: To see the browser, run 'python cli.py' on your host machine ***")
        print("*" * 70 + "\n")
        
        # Flush to ensure it's displayed immediately
        sys.stdout.flush()
        
        # Also log to file
        logger.warning("Detected Docker environment - forcing headless_browser=True")
        logger.info("To see the browser, run 'python cli.py' on your host machine instead")
        
        headless = True
    
    provider = Provider(
        provider_name=config["MAIN"]["provider_name"],
        model=config["MAIN"]["provider_model"],
        server_address=config["MAIN"]["provider_server_address"],
        is_local=config.getboolean('MAIN', 'is_local')
    )
    logger.info(f"Provider initialized: {provider.provider_name} ({provider.model})")

    browser = Browser(
        create_driver(headless=headless, stealth_mode=stealth_mode, lang=languages[0]),
        anticaptcha_manual_install=stealth_mode
    )
    logger.info("Browser initialized")

    agents = [
        # CasualAgent(
        #     name=config["MAIN"]["agent_name"],
        #     prompt_path=f"prompts/{personality_folder}/casual_agent.txt",
        #     provider=provider, verbose=False
        # ),
        # CoderAgent(
        #     name="coder",
        #     prompt_path=f"prompts/{personality_folder}/coder_agent.txt",
        #     provider=provider, verbose=False
        # ),
        # FileAgent(
        #     name="File Agent",
        #     prompt_path=f"prompts/{personality_folder}/file_agent.txt",
        #     provider=provider, verbose=False
        # ),
        # BrowserAgent(
        #     name="Browser",
        #     prompt_path=f"prompts/{personality_folder}/browser_agent.txt",
        #     provider=provider, verbose=False, browser=browser
        # ),
        # PlannerAgent(
        #     name="Planner",
        #     prompt_path=f"prompts/{personality_folder}/planner_agent.txt",
        #     provider=provider, verbose=False, browser=browser
        # )
        GeneralAgent(
            name="General",
            prompt_path=f"prompts/{personality_folder}/general_agent.txt",
            provider=provider, verbose=False
        )
    ]
    logger.info("Agents initialized")

    interaction = Interaction(
        agents,
        tts_enabled=config.getboolean('MAIN', 'speak'),
        stt_enabled=config.getboolean('MAIN', 'listen'),
        recover_last_session=config.getboolean('MAIN', 'recover_last_session'),
        langs=languages
    )
    logger.info("Interaction initialized")
    return interaction

# def get_db_connection():
#     """创建并返回数据库连接"""
#     db_config = {
#         'host': os.getenv('MYSQL_HOST', 'localhost'),
#         'port' : int(os.getenv('MYSQL_PORT', 3306)),
#         'user': os.getenv('MYSQL_USER', 'root'),
#         'password': os.getenv('MYSQL_PASSWORD', ''),
#         'database': os.getenv('MYSQL_DATABASE', 'langsistance_db'),
#         'charset': 'utf8mb4'
#     }
#     return pymysql.connect(**db_config)

interaction = initialize_system()
is_generating = False
query_resp_history = []

@api.get("/screenshot")
async def get_screenshot():
    logger.info("Screenshot endpoint called")
    screenshot_path = ".screenshots/updated_screen.png"
    if os.path.exists(screenshot_path):
        return FileResponse(screenshot_path)
    logger.error("No screenshot available")
    return JSONResponse(
        status_code=404,
        content={"error": "No screenshot available"}
    )

@api.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy", "version": "0.1.0"}

@api.get("/is_active")
async def is_active():
    logger.info("Is active endpoint called")
    return {"is_active": interaction.is_active}

@api.get("/stop")
async def stop():
    logger.info("Stop endpoint called")
    interaction.current_agent.request_stop()
    return JSONResponse(status_code=200, content={"status": "stopped"})

@api.get("/latest_answer")
async def get_latest_answer():
    global query_resp_history
    if interaction.current_agent is None:
        return JSONResponse(status_code=404, content={"error": "No agent available"})
    uid = str(uuid.uuid4())
    if not any(q["answer"] == interaction.current_agent.last_answer for q in query_resp_history):
        query_resp = {
            "done": "false",
            "answer": interaction.current_agent.last_answer,
            "reasoning": interaction.current_agent.last_reasoning,
            "agent_name": interaction.current_agent.agent_name if interaction.current_agent else "None",
            "success": interaction.current_agent.success,
            "blocks": {f'{i}': block.jsonify() for i, block in enumerate(interaction.get_last_blocks_result())} if interaction.current_agent else {},
            "status": interaction.current_agent.get_status_message if interaction.current_agent else "No status available",
            "uid": uid
        }
        interaction.current_agent.last_answer = ""
        interaction.current_agent.last_reasoning = ""
        query_resp_history.append(query_resp)
        return JSONResponse(status_code=200, content=query_resp)
    if query_resp_history:
        return JSONResponse(status_code=200, content=query_resp_history[-1])
    return JSONResponse(status_code=404, content={"error": "No answer available"})

async def think_wrapper(user_id, interaction, query, query_id):
    try:
        success = False   #断点
        interaction.last_query = query
        interaction.query_id = query_id
        logger.info("Agents request is being processed")
        success = await interaction.think(user_id)
        if not success:
            interaction.last_answer = "Error: No answer from agent"
            interaction.last_reasoning = "Error: No reasoning from agent"
            interaction.last_success = False
        else:
            interaction.last_success = True
        pretty_print(interaction.last_answer)
        interaction.speak_answer()
        return success
    except Exception as e:
        logger.error(f"Error in think_wrapper: {str(e)}")
        interaction.last_answer = f""
        interaction.last_reasoning = f"Error: {str(e)}"
        interaction.last_success = False
        raise e

@api.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    global is_generating, query_resp_history
    logger.info(f"Processing query: {request.query}")
    logger.info("Processing start begin")
    query_resp = QueryResponse(
        done="false",
        answer="",
        reasoning="",
        agent_name="Unknown",
        success="false",
        blocks={},
        status="Ready",
        uid=str(uuid.uuid4())
    )
    if is_generating:
        logger.warning("Another query is being processed, please wait.")
        return JSONResponse(status_code=429, content=query_resp.jsonify())

    try:
        is_generating = True
        user_id = 11111111
        success = await think_wrapper(user_id, interaction, request.query, request.query_id)
        is_generating = False

        if not success:
            query_resp.answer = interaction.last_answer
            query_resp.reasoning = interaction.last_reasoning
            return JSONResponse(status_code=400, content=query_resp.jsonify())

        if interaction.current_agent:
            blocks_json = {f'{i}': block.jsonify() for i, block in enumerate(interaction.current_agent.get_blocks_result())}
        else:
            logger.error("No current agent found")
            blocks_json = {}
            query_resp.answer = "Error: No current agent"
            return JSONResponse(status_code=400, content=query_resp.jsonify())

        logger.info(f"Answer: {interaction.last_answer}")
        logger.info(f"Blocks: {blocks_json}")
        query_resp.done = "true"
        query_resp.answer = interaction.last_answer
        query_resp.reasoning = interaction.last_reasoning
        query_resp.agent_name = interaction.current_agent.agent_name
        query_resp.success = str(interaction.last_success)
        query_resp.blocks = blocks_json
        
        query_resp_dict = {
            "done": query_resp.done,
            "answer": query_resp.answer,
            "agent_name": query_resp.agent_name,
            "success": query_resp.success,
            "blocks": query_resp.blocks,
            "status": query_resp.status,
            "uid": query_resp.uid
        }
        query_resp_history.append(query_resp_dict)

        logger.info("Query processed successfully")
        return JSONResponse(status_code=200, content=query_resp.jsonify())
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        sys.exit(1)
    finally:
        logger.info("Processing finished")
        if config.getboolean('MAIN', 'save_session'):
            interaction.save_session()
@api.post("/create_knowledge", response_model=KnowledgeCreateResponse)
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

    if len(request.model_name) > 200:
        errors.append("model_name must be no more than 200 characters")

    if len(request.params) > 5000:
        errors.append("params must be no more than 5000 characters")

    if not request.tool_id:
        errors.append("tool_id is required")

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
                  (user_id, question, description, answer, public, embedding_id, model_name, tool_id, params, status)
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) \
                  """
            cursor.execute(sql, (
                request.userId,
                request.question,
                request.description,
                request.answer,
                request.public,
                request.embeddingId,
                request.model_name,
                request.tool_id,
                request.params,
                1
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

@api.post("/delete_knowledge", response_model=KnowledgeDeleteResponse)
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
            record_user_id = result[0]
            if record_user_id != request.userId:
                logger.warning(f"User {request.userId} not authorized to delete knowledge record {request.knowledgeId}")
                return JSONResponse(
                    status_code=403,
                    content={
                        "success": False,
                        "message": "Not authorized to delete this knowledge record"
                    }
                )

            # 删除数据库记录
            delete_sql = "UPDATE knowledge WHERE id = %s SET status = %d"
            cursor.execute(delete_sql, (request.knowledgeId, 2))
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


@api.post("/update_knowledge", response_model=KnowledgeUpdateResponse)
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


@api.get("/query_knowledge", response_model=KnowledgeQueryResponse)
async def query_knowledge_records(userId: str, query: str, limit: int = 10, offset: int = 0):
    """
    查询知识记录接口
    """
    logger.info(f"Querying knowledge records for user: {userId} with query: {query}")

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
                        SELECT COUNT(*) as total \
                        FROM knowledge
                        WHERE status = %s
                          AND  user_id = %s
                          {where_condition} \
                        """

            cursor.execute(count_sql, params)
            count_result = cursor.fetchone()
            total = count_result['total'] if count_result else 0

            if total == 0:
                logger.info(f"No knowledge records found for user: {userId} with query: {query}")
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
                            SELECT id, \
                                   user_id, \
                                   question, \
                                   description, \
                                   answer, public, model_name, tool_id, params, create_time, update_time
                            FROM knowledge
                            WHERE status = %s
                               AND user_id = %s
                              {where_condition}
                            ORDER BY update_time DESC
                                LIMIT %s \
                            OFFSET %s \
                            """
                params = [1, userId, search_pattern, search_pattern, search_pattern, limit, offset]
            else:
                query_sql = """
                            SELECT id, \
                                   user_id, \
                                   question, \
                                   description, \
                                   answer, public, model_name, tool_id, params, create_time, update_time
                            FROM knowledge
                            WHERE status = %s
                               AND user_id = %s
                            ORDER BY update_time DESC
                                LIMIT %s \
                            OFFSET %s \
                            """
                params = [1, userId, limit, offset]

            cursor.execute(query_sql, params)
            results = cursor.fetchall()

            # 转换为KnowledgeItem对象列表
            knowledge_items = []
            for row in results:
                knowledge_item = KnowledgeItem(
                    id=row['id'],
                    user_id=row['user_id'],
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

            logger.info(f"Found {len(knowledge_items)} knowledge records for user: {userId} with query: {query}")
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


@api.post("/create_tool_and_knowledge", response_model=ToolAndKnowledgeCreateResponse)
async def create_tool_and_knowledge(request: ToolAndKnowledgeCreateRequest):
    """
    创建tool和knowledge记录接口
    首先创建tool，然后使用tool的id创建knowledge
    """
    logger.info(f"Creating tool and knowledge records for user: {request.tool_userId}")

    connection = None
    try:
        # 获取数据库连接
        connection = get_db_connection()

        # 开始事务
        connection.begin()

        tool_id = None
        knowledge_id = None

        # 1. 创建 Tool
        with connection.cursor() as cursor:
            # 参数校验
            tool_errors = []

            if not request.tool_userId or len(request.tool_userId) > 50:
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

            # 插入 Tool 数据
            tool_sql = """
                       INSERT INTO tools
                       (user_id, title, description, url, push, public, status, timeout, params)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) \
                       """
            cursor.execute(tool_sql, (
                request.tool_userId,
                request.tool_title,
                request.tool_description,
                request.tool_url,
                request.tool_push,
                request.tool_public,
                1,  # status
                request.tool_timeout,
                request.tool_params
            ))

            # 获取插入的 tool ID
            tool_id = cursor.lastrowid
            logger.info(f"Tool record created successfully with ID: {tool_id}")

        # 2. 创建 Knowledge，使用刚刚创建的 tool_id
        with connection.cursor() as cursor:
            # 参数校验
            knowledge_errors = []

            if not request.knowledge_userId or len(request.knowledge_userId) > 50:
                knowledge_errors.append("knowledge_userId is required and must be no more than 50 characters")

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
                        "tool_id": tool_id,  # 已经创建的 tool_id
                        "knowledge_id": None
                    }
                )

            # 插入 Knowledge 数据，使用 tool_id
            knowledge_sql = """
                            INSERT INTO knowledge
                            (user_id, question, description, answer, public, status, embedding_id, model_name, tool_id, \
                             params)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) \
                            """
            cursor.execute(knowledge_sql, (
                request.knowledge_userId,
                request.knowledge_question,
                request.knowledge_description,
                request.knowledge_answer,
                request.knowledge_public,
                1,  # status
                request.knowledge_embeddingId,
                request.knowledge_model_name,
                tool_id,  # 使用刚刚创建的 tool_id
                request.knowledge_params
            ))

            # 获取插入的 knowledge ID
            knowledge_id = cursor.lastrowid


            # 计算并存储 embedding
            query_embedding = get_embedding(request.knowledge_question + request.knowledge_answer)
            logger.info(f"create embedding: {query_embedding}")
            # 将 embedding 写入 Redis
            try:
                redis_conn = get_redis_connection()
                # 使用记录ID作为键，将embedding存储到Redis中
                redis_key = f"knowledge_embedding_{knowledge_id}"
                redis_conn.set(redis_key, str(query_embedding))
                logger.info(f"Embedding stored in Redis with key: {redis_key} - query embedding{query_embedding}")
            except Exception as redis_error:
                logger.error(f"Failed to store embedding in Redis: {str(redis_error)}")
                # 注意：即使Redis存储失败，我们也不会中断主流程

        # 提交事务
        connection.commit()

        logger.info(
            f"Tool and knowledge records created successfully. Tool ID: {tool_id}, Knowledge ID: {knowledge_id}")
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Tool and knowledge records created successfully",
                "tool_id": tool_id,
                "knowledge_id": knowledge_id
            }
        )

    except Exception as e:
        logger.error(f"Error creating tool and knowledge records: {str(e)}")
        if connection:
            connection.rollback()
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}",
                "tool_id": tool_id,  # 如果 tool 已创建，返回其 ID
                "knowledge_id": None
            }
        )
    finally:
        if connection:
            connection.close()

class ToolUpdateRequest(BaseModel):
    userId: str
    toolId: int
    title: Optional[str] = None
    description: Optional[str] = None
    public: Optional[str] = None

class ToolUpdateResponse(BaseModel):
    success: bool
    message: str

class ToolDeleteRequest(BaseModel):
    userId: str
    toolId: int

class ToolDeleteResponse(BaseModel):
    success: bool
    message: str

class ToolQueryResponse(BaseModel):
    success: bool
    message: str
    data: List[ToolItem]
    total: int

@api.post("/update_tool", response_model=ToolUpdateResponse)
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

@api.post("/delete_tool", response_model=ToolDeleteResponse)
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

@api.get("/query_tools", response_model=ToolQueryResponse)
async def query_tool_records(userId: str, query: str = "", limit: int = 10, offset: int = 0):
    """
    查询工具记录接口
    """
    logger.info(f"Querying tool records for user: {userId}" + (f" with query: {query}" if query else ""))

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
                        SELECT COUNT(*) as total \
                        FROM tools
                        WHERE status = %s
                          AND user_id = %s
                          {where_condition} \
                        """

            cursor.execute(count_sql, params)
            count_result = cursor.fetchone()
            total = count_result['total'] if count_result else 0

            if total == 0:
                logger.info(f"No tool records found for user: {userId}" + (f" with query: {query}" if query else ""))
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
                            SELECT id, \
                                   user_id, \
                                   title, \
                                   description, \
                                   url, push, public, status, timeout, params, create_time, update_time
                            FROM tools
                            WHERE status = %s
                               AND user_id = %s
                              {where_condition}
                            ORDER BY update_time DESC
                                LIMIT %s \
                            OFFSET %s \
                            """
                params = [1, userId, search_pattern, search_pattern, limit, offset]
            else:
                query_sql = """
                            SELECT id, \
                                   user_id, \
                                   title, \
                                   description, \
                                   url, push, public, status, timeout, params, create_time, update_time
                            FROM tools
                            WHERE status = %s
                               AND user_id = %s
                            ORDER BY update_time DESC
                                LIMIT %s \
                            OFFSET %s \
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

            logger.info(f"Found {len(tool_items)} tool records for user: {userId}" + (f" with query: {query}" if query else ""))
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

class QuestionRequest(BaseModel):
    userId: str
    question: str
    top_k: Optional[int] = 3
    similarity_threshold: Optional[float] = 0.7

class KnowledgeToolResponse(BaseModel):
    success: bool
    message: str
    knowledge: Optional[KnowledgeItem] = None
    tool: Optional[ToolItem] = None
    similarity: Optional[float] = None

class ToolFetchRequest(BaseModel):
    query_id: str
    userId: str

class ToolFetchResponse(BaseModel):
    success: bool
    message: str
    tool: Optional[dict] = None

class ToolResponseRequest(BaseModel):
    query_id: str
    userId: str
    tool_response: dict

class ToolResponseResponse(BaseModel):
    success: bool
    message: str


@api.post("/find_knowledge_tool")
async def find_knowledge_tool(request: QuestionRequest):
    """
    根据用户问题查找最相关的知识及其对应的工具
    """
    logger.info(f"Finding knowledge tool for user: {request.userId} with question: {request.question}")

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

        if not request.question:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "question is required"
                }
            )

        # 调用knowledge.py中的方法获取知识项和工具信息
        knowledge_item, tool_info = get_knowledge_tool(
            request.userId,
            request.question,
            request.top_k,
            0
        )

        if not knowledge_item:
            logger.info("No matching knowledge found above similarity threshold")
            return JSONResponse(
                status_code=200,
                content={
                    "success": False,
                    "message": "No matching knowledge found above similarity threshold"
                }
            )

        # 构建返回的知识记录对象
        knowledge_response = {
            "userId": knowledge_item.user_id
        }

        response_data = {
            "success": True,
            "message": "Knowledge and tool found successfully",
            "knowledge": knowledge_response
        }

        if tool_info:
            tool_response = {
                "id": tool_info.id,
                "title": tool_info.title,
                "description": tool_info.description,
                "url": tool_info.url
            }
            response_data["tool"] = tool_response

        logger.info(f"Successfully found knowledge and tool for user: {request.userId}")
        return JSONResponse(
            status_code=200,
            content=response_data
        )

    except Exception as e:
        logger.error(f"Error in find_knowledge_tool: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": f"Internal server error: {str(e)}"
            }
        )

@api.post("/get_tool_request", response_model=ToolFetchResponse)
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
                    status_code=404,
                    content={
                        "success": False,
                        "message": "Tool not found"
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

@api.post("/save_tool_response", response_model=ToolResponseResponse)
async def save_tool_response(request: ToolResponseRequest):
    """
    保存工具响应到Redis

    Args:
        request: 包含query_id、userId和tool_response的请求对象

    Returns:
        ToolResponseResponse: 操作结果响应
    """
    logger.info(f"Saving tool response for user: {request.userId} with query_id: {request.query_id}")

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

if __name__ == "__main__":
    # Print startup info
    if is_running_in_docker():
        print("[AgenticSeek] Starting in Docker container...")
    else:
        print("[AgenticSeek] Starting on host machine...")
    
    envport = os.getenv("BACKEND_PORT")
    if envport:
        port = int(envport)
    else:
        port = 7777
    # uvicorn.run("langsistance.api:api", host="0.0.0.0", port=7777, reload=True)
    uvicorn.run(api, host="0.0.0.0", port=7777)