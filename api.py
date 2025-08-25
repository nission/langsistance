#!/usr/bin/env python3

import os, sys
import uvicorn
import aiofiles
import configparser
import asyncio
import time
from typing import List
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uuid

from sources.agents.general_agent import GeneralAgent
from sources.llm_provider import Provider
from sources.interaction import Interaction
from sources.agents import CasualAgent, CoderAgent, FileAgent, PlannerAgent, BrowserAgent
from sources.browser import Browser, create_driver
from sources.utility import pretty_print
from sources.logger import Logger
from sources.schemas import QueryRequest, QueryResponse
from sources.knowledge.knowledge import get_embedding

import redis
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

def get_db_connection():
    """创建并返回数据库连接"""
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'langsistance'),
        'charset': 'utf8mb4'
    }
    return pymysql.connect(**db_config)

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

async def think_wrapper(interaction, query):
    try:
        success = False   #断点
        interaction.last_query = query
        logger.info("Agents request is being processed")
        # success = await interaction.think()
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
        success = await think_wrapper(interaction, request.query)
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
@api.post("/knowledge", response_model=KnowledgeCreateResponse)
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
                  (userId, question, description, answer, public, embeddingId, model_name, tool_id, params)
                  VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) \
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
                request.params
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