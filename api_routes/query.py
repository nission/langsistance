#!/usr/bin/env python3

from fastapi import APIRouter
from fastapi.responses import JSONResponse, FileResponse
import os
import uuid

from .models import QuestionRequest, KnowledgeToolResponse
from sources.schemas import QueryRequest, QueryResponse
from sources.knowledge.knowledge import get_knowledge_tool
from sources.logger import Logger

logger = Logger("backend.log")
router = APIRouter()

@router.get("/screenshot")
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

@router.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy", "version": "0.1.0"}

@router.get("/is_active")
async def is_active(interaction=None):
    logger.info("Is active endpoint called")
    if interaction:
        return {"is_active": interaction.is_active}
    return {"is_active": False}

@router.get("/stop")
async def stop(interaction=None):
    logger.info("Stop endpoint called")
    if interaction and interaction.current_agent:
        interaction.current_agent.request_stop()
    return JSONResponse(status_code=200, content={"status": "stopped"})

@router.get("/latest_answer")
async def get_latest_answer(interaction=None, query_resp_history=None):
    global query_resp_history
    if not interaction or interaction.current_agent is None:
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

@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest, interaction=None, think_wrapper=None, is_generating=False, query_resp_history=None):
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

    if not interaction or not think_wrapper:
        logger.error("Missing interaction or think_wrapper")
        return JSONResponse(status_code=500, content=query_resp.jsonify())

    try:
        user_id = 11111111
        success = await think_wrapper(user_id, interaction, request.query, request.query_id)

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
        return JSONResponse(status_code=500, content=query_resp.jsonify())

@router.post("/find_knowledge_tool")
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