#!/usr/bin/env python3

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
import os
import uuid
import asyncio

from sources.schemas import QueryResponse
from sources.logger import Logger
from api_routes.models import QueryRequest, QuestionRequest
from sources.knowledge.knowledge import get_knowledge_tool
from sources.user.passport import verify_firebase_token, check_and_increase_usage
from sources.callbacks.sse_callback import SSECallbackHandler

router = APIRouter()

def register_core_routes(app_logger, interaction_ref, query_resp_history_ref, config_ref, is_generating_flag, think_wrapper_func):
    """注册核心路由并传递所需的依赖"""
    
    @router.get("/latest_answer")
    async def get_latest_answer():
        app_logger.info("Latest answer endpoint called")
        if interaction_ref.current_agent is None:
            return JSONResponse(status_code=404, content={"error": "No agent available"})
        
        uid = str(uuid.uuid4())
        if not any(q["answer"] == interaction_ref.current_agent.last_answer for q in query_resp_history_ref):
            query_resp = {
                "done": "false",
                "answer": interaction_ref.current_agent.last_answer,
                "reasoning": interaction_ref.current_agent.last_reasoning,
                "agent_name": interaction_ref.current_agent.agent_name if interaction_ref.current_agent else "None",
                "success": interaction_ref.current_agent.success,
                "blocks": {f'{i}': block.jsonify() for i, block in enumerate(interaction_ref.get_last_blocks_result())} if interaction_ref.current_agent else {},
                "status": interaction_ref.current_agent.get_status_message if interaction_ref.current_agent else "No status available",
                "uid": uid
            }
            interaction_ref.current_agent.last_answer = ""
            interaction_ref.current_agent.last_reasoning = ""
            query_resp_history_ref.append(query_resp)
            return JSONResponse(status_code=200, content=query_resp)
        
        if query_resp_history_ref:
            return JSONResponse(status_code=200, content=query_resp_history_ref[-1])
        return JSONResponse(status_code=404, content={"error": "No answer available"})

    @router.post("/query")
    async def process_query(request: QueryRequest, http_request: Request):
        app_logger.info(f"Processing query: {request.query}")
        app_logger.info("Processing start begin")

        auth_header = http_request.headers.get("Authorization")
        user = verify_firebase_token(auth_header)

        user_id = user['uid']

        allowed = check_and_increase_usage(user_id)
        if not allowed:
            return JSONResponse(status_code=429, content="Daily API usage limit exceeded (100/day)")

        # 如果没有提供 query_id，自动生成一个
        if not request.query_id:
            request.query_id = str(uuid.uuid4())

        query_resp = QueryResponse(
            done="false",
            answer="",
            reasoning="",
            agent_name="Unknown",
            success=False,
            blocks={},
            status="Ready",
            uid=str(uuid.uuid4())
        )
        
        if is_generating_flag:
            app_logger.warning("Another query is being processed, please wait.")
            return JSONResponse(status_code=429, content=query_resp.jsonify())

        try:
            # is_generating = True  # Uncomment if needed
            # 调用 think_wrapper_func 来处理查询
            success = await think_wrapper_func(user_id, interaction_ref, request.query, request.query_id)
            
            if not success:
                query_resp.answer = interaction_ref.last_answer
                query_resp.reasoning = interaction_ref.last_reasoning
                return JSONResponse(status_code=400, content=query_resp.jsonify())

            if interaction_ref.current_agent:
                blocks_json = {f'{i}': block.jsonify() for i, block in enumerate(interaction_ref.current_agent.get_blocks_result())}
            else:
                app_logger.error("No current agent found")
                blocks_json = {}
                query_resp.answer = "Error: No current agent"
                return JSONResponse(status_code=400, content=query_resp.jsonify())

            app_logger.info(f"Answer: {interaction_ref.last_answer}")
            app_logger.info(f"Blocks: {blocks_json}")
            query_resp.done = "true"
            query_resp.answer = interaction_ref.last_answer
            query_resp.reasoning = interaction_ref.last_reasoning
            query_resp.agent_name = interaction_ref.current_agent.agent_name
            query_resp.success = interaction_ref.last_success
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
            query_resp_history_ref.append(query_resp_dict)

            app_logger.info("Query processed successfully")
            return JSONResponse(status_code=200, content=query_resp.jsonify())
        
        except Exception as e:
            app_logger.error(f"An error occurred: {str(e)}")
            # sys.exit(1)  # 不应该在路由中退出应用
            return JSONResponse(status_code=500, content={"error": "Internal server error"})
        finally:
            app_logger.info("Processing finished")
            if config_ref.getboolean('MAIN', 'save_session'):
                interaction_ref.save_session()

    @router.post("/query_stream")
    async def process_query_stream(request: QueryRequest, http_request: Request):
        app_logger.info(f"Processing streaming query: {request.query}")
        app_logger.info("Streaming processing start begin")

        auth_header = http_request.headers.get("Authorization")
        user = verify_firebase_token(auth_header)

        user_id = user['uid']

        allowed = check_and_increase_usage(user_id)
        if not allowed:
            return JSONResponse(status_code=429, content="Daily API usage limit exceeded (100/day)")

        # 如果没有提供 query_id，自动生成一个
        if not request.query_id:
            request.query_id = str(uuid.uuid4())

        if is_generating_flag:
            app_logger.warning("Another query is being processed, please wait.")
            query_resp = QueryResponse(
                done="false",
                answer="",
                reasoning="",
                agent_name="Unknown",
                success=False,
                blocks={},
                status="Ready",
                uid=str(uuid.uuid4())
            )
            return JSONResponse(status_code=429, content=query_resp.jsonify())

        # 创建一个队列用于流式传输
        queue = asyncio.Queue()
        callback_handler = SSECallbackHandler(queue)

        async def event_generator():
            try:
                # 启动处理查询的任务
                task = asyncio.create_task(
                    think_wrapper_func(user_id, interaction_ref, request.query, request.query_id, callback_handler)
                )

                # 从队列中获取并流式传输令牌
                while True:
                    token = await queue.get()
                    if token == "[DONE]":
                        break
                    elif token.startswith("[ERROR]"):
                        yield f"data: {token}\n\n"
                        break
                    else:
                        yield f"data: {token}\n\n"
                    queue.task_done()

                # 等待处理任务完成
                await task

                # 生成最终的完整响应
                # if interaction_ref.current_agent:
                #     blocks_json = {f'{i}': block.jsonify() for i, block in enumerate(interaction_ref.current_agent.get_blocks_result())}
                #     final_response = {
                #         "done": "true",
                #         "answer": interaction_ref.last_answer,
                #         "reasoning": interaction_ref.last_reasoning,
                #         "agent_name": interaction_ref.current_agent.agent_name,
                #         "success": interaction_ref.last_success,
                #         "blocks": blocks_json,
                #         "status": "Completed",
                #         "uid": str(uuid.uuid4())
                #     }
                # else:
                #     final_response = {
                #         "done": "true",
                #         "answer": "Error: No current agent",
                #         "reasoning": "",
                #         "agent_name": "Unknown",
                #         "success": False,
                #         "blocks": {},
                #         "status": "Error",
                #         "uid": str(uuid.uuid4())
                #     }
                #
                # yield f"data: {final_response}\n\n"
                yield "data: [STREAM_DONE]\n\n"

            except Exception as e:
                app_logger.error(f"An error occurred in streaming: {str(e)}")
                yield f"data: [ERROR] {str(e)}\n\n"
            finally:
                app_logger.info("Streaming processing finished")
                if config_ref.getboolean('MAIN', 'save_session'):
                    interaction_ref.save_session()

        # 返回EventSourceResponse
        return StreamingResponse(event_generator(), media_type="text/event-stream")

    @router.get("/screenshot")
    async def get_screenshot():
        app_logger.info("Screenshot endpoint called")
        screenshot_path = ".screenshots/updated_screen.png"
        if os.path.exists(screenshot_path):
            return FileResponse(screenshot_path)
        app_logger.error("No screenshot available")
        return JSONResponse(
            status_code=404,
            content={"error": "No screenshot available"}
        )

    @router.post("/find_knowledge_tool")
    async def find_knowledge_tool(request: QuestionRequest, http_request: Request):
        """根据用户问题查找最相关的知识及其对应的工具"""
        auth_header = http_request.headers.get("Authorization")
        user = verify_firebase_token(auth_header)

        user_id = user['uid']

        app_logger.info(f"Finding knowledge tool for user: {user_id} with question: {request.question}")

        try:
            # 参数校验

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
                user_id,
                request.question,
                request.top_k,
                0
            )

            if not knowledge_item:
                app_logger.info("No matching knowledge found above similarity threshold")
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": False,
                        "message": "No matching knowledge found above similarity threshold"
                    }
                )

            # 构建返回的知识记录对象
            knowledge_response = {
                "userId": knowledge_item.user_id,
                "question": knowledge_item.question,
                "description": knowledge_item.description,
                "answer": knowledge_item.answer,
                "public": knowledge_item.public,
                "modelName": knowledge_item.model_name,
                "toolId": knowledge_item.tool_id,
                "params": knowledge_item.params
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

            app_logger.info(f"Successfully found knowledge and tool for user: {user_id}")
            return JSONResponse(
                status_code=200,
                content=response_data
            )

        except Exception as e:
            app_logger.error(f"Error in find_knowledge_tool: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": f"Internal server error: {str(e)}"
                }
            )

    return router