#!/usr/bin/env python3

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

def register_system_routes(app_logger, interaction_ref, query_resp_history_ref, config_ref):
    """注册系统路由并传递所需的依赖"""
    
    @router.get("/health")
    async def health_check():
        app_logger.info("Health check endpoint called")
        return {"status": "healthy", "version": "0.1.0"}

    @router.get("/is_active")
    async def is_active():
        app_logger.info("Is active endpoint called")
        return {"is_active": interaction_ref.is_active}

    @router.get("/stop")
    async def stop():
        app_logger.info("Stop endpoint called")
        if interaction_ref.current_agent:
            interaction_ref.current_agent.request_stop()
        return JSONResponse(status_code=200, content={"status": "stopped"})

    return router