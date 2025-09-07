from typing import Dict, Any
import json

from sources.knowledge.knowledge import get_redis_connection, get_knowledge_tool
from sources.utility import pretty_print, animate_thinking
from sources.agents.agent import Agent
from sources.tools.mcpFinder import MCP_finder
from sources.memory import Memory
from sources.logger import Logger

from fastmcp import FastMCP

from mcp_use.client import MCPClient
from mcp_use.adapters import LangChainAdapter

import os
import time

class GeneralAgent(Agent):

    def __init__(self, name, prompt_path, provider, verbose=False):
        """
        The mcp agent is a special agent for using MCPs.
        MCP agent will be disabled if the user does not explicitly set the MCP_FINDER_API_KEY in environment variable.
        """
        super().__init__(name, prompt_path, provider, verbose, None)
        keys = self.get_api_keys()
        self.tools = {
            "mcp_finder": MCP_finder(keys["mcp_finder"]),
            # add mcp tools here
        }
        self.role = "mcp"
        self.type = "mcp_agent"
        self.memory = Memory(self.load_prompt(prompt_path),
                                recover_last_session=False, # session recovery in handled by the interaction class
                                memory_compression=False,
                                model_provider=provider.get_model_name())
        self.enabled = True
        self.knowledgeTool = {}
        self.logger = Logger("general_agent.log")

    def get_api_keys(self) -> dict:
        """
        Returns the API keys for the tools.
        """
        api_key_mcp_finder = os.getenv("MCP_FINDER_API_KEY")
        if not api_key_mcp_finder or api_key_mcp_finder == "":
            pretty_print("MCP Finder disabled.", color="warning")
            self.enabled = False
        return {
            "mcp_finder": api_key_mcp_finder
        }
    
    def set_knowledge_tool(self, knowledge_tool: Dict[str, Any]) -> None:
        """
        设置知识工具字典
        Args:
            knowledge_tool (Dict[str, Any]): 知识工具字典
        """
        self.knowledgeTool = knowledge_tool
    
    def expand_prompt(self, prompt):
        """
        Expands the prompt with the tools available.
        """
        tools_str = self.get_tools_description()
        prompt += f"""
        You can use the following tools and MCPs:
        {tools_str}
        """
        return prompt
    def generate_system_prompt(self) -> str:
        """
        生成系统提示
        """
        knowledge_item, tool_info = self.knowledgeTool
        self.logger.info(f"knowledge item:{knowledge_item} - tool:{tool_info}")
        tool_title = tool_info["title"]
        tool_description = None
        if tool_info["description"]:
            tool_description = tool_info["description"]
        else:
            tool_description = tool_title

        # 解析工具参数信息
        tool_params_info = ""
        if tool_info["params"]:
            try:
                params_data = json.loads(tool_info["params"])
                if isinstance(params_data, dict):
                    tool_params_info = "工具参数要求:user id - query id\n"
                    for param_name, param_info in params_data.items():
                        param_type = param_info.get("type", "unknown")
                        tool_params_info += f"  - {param_name} ({param_type})\n"
                else:
                    tool_params_info = f"工具参数: {tool_info['params']}"
            except json.JSONDecodeError:
                tool_params_info = f"工具参数: {tool_info['params']}"

        system_prompt = f"""
        你是一个MCP智能助手，你的任务是根据用户的问题和上下文，使用MCP服务器提供的工具来解决问题。
        你需要使用的MCP工具是：
        {tool_title}
        功能是：
        {tool_description}
        {tool_params_info}
        工具调用完成后基于结果给出最终答案。
        如果不需要使用工具，请直接回答用户的问题。
        """
        # return self.expand_prompt(system_prompt)
        return system_prompt

    def generate_user_prompt(self, prompt, user_id, query_id) -> str:
        user_prompt = f"""
        {prompt},
        user id is {user_id},
        query id is {query_id},
        """
        self.logger.info(f"user prompt:{user_prompt}")

        return user_prompt

    # async def get_tools(self) -> dict:
    #
    #     try:
    #         client = MCPClient.from_config_file("tool_config.json")
    #         adapter = LangChainAdapter()
    #         tools = await adapter.create_tools(client)
    #         self.logger.info(f"tools{tools}")
    #         return tools
    #     except Exception as e:
    #         raise Exception(f"get_tool failed: {str(e)}") from e

    async def get_tools(self) -> dict:
        try:
            # 如果有知识库中的工具信息，则动态构建MCP工具
            if hasattr(self, 'knowledgeTool') and self.knowledgeTool:
                # 获取工具信息
                knowledge_item, tool_info = self.knowledgeTool

                if tool_info:
                    # 创建动态MCP服务器
                    mcp = FastMCP("DynamicKnowledgeTool")

                    # 解析工具参数
                    try:
                        tool_params = json.loads(tool_info.params) if tool_info.params else {}
                    except json.JSONDecodeError:
                        tool_params = {}

                    # 动态创建工具函数
                    def dynamic_tool_function(query_id, user_id, **params):
                        try:
                            # 连接Redis
                            redis_conn = get_redis_connection()

                            # 构造Redis键
                            redis_key = f"tool_request_{query_id}_{user_id}"

                            # 将参数转换为JSON并存储到Redis
                            params_json = json.dumps(params)
                            redis_conn.set(redis_key, params_json)

                            # 轮询读取tool_response_{query_id}
                            response_key = f"tool_response_{query_id}_{user_id}"
                            timeout = 300  # 5分钟超时
                            interval = 1  # 每秒查询一次
                            elapsed = 0

                            while elapsed < timeout:
                                response_value = redis_conn.get(response_key)
                                if response_value is not None:
                                    # 成功获取到响应值
                                    return response_value
                                # 等待1秒后再次尝试
                                time.sleep(interval)
                                elapsed += interval

                            # 超时未获取到响应值
                            return None
                        except Exception as e:
                            # 如果Redis操作失败，记录日志但仍继续执行工具
                            self.logger.error(f"Failed to write to Redis: {str(e)}")
                            return None

                        return f"执行了工具: {tool_info.title}，参数为: {kwargs}"

                    # 使用工具信息动态注册工具
                    # 工具名称使用tool_info.title，描述使用tool_info.description
                    dynamic_tool = mcp.tool(
                        name=tool_info.title.replace(" ", "_") if tool_info.title else knowledge_item["question"],
                        description=tool_info.description if tool_info.description else ""
                    )(dynamic_tool_function)

                    # 创建临时配置文件用于mcp-use加载动态工具
                    dynamic_config = {
                        "mcpServers": {
                            "dynamic_knowledge_tool": {
                                "command": "python",
                                "args": ["-c",
                                         "from fastmcp import FastMCP; mcp = FastMCP('DynamicKnowledgeTool'); print('Dynamic tool server started')"]
                            }
                        }
                    }

                    # 使用mcp-use加载动态工具
                    client = MCPClient.from_config(dynamic_config)
                    adapter = LangChainAdapter()
                    dynamic_tools = await adapter.create_tools(client)

                    # 合并动态工具
                    tools = dynamic_tools
                else:
                    # 如果没有动态工具信息，使用默认配置
                    tools = None
            else:
                # 如果没有动态工具信息，使用默认配置
                tools = None

            self.logger.info(f"tools{tools}")
            return tools
        except Exception as e:
            raise Exception(f"get_tool failed: {str(e)}") from e

    async def process(self,user_id, prompt, query_id, speech_module) -> str | tuple[str, str]:
        if not self.enabled:
            return "general Agent is disabled."
        self.knowledgeTool = get_knowledge_tool(user_id,  prompt)
        # user_prompt = self.expand_prompt(prompt)
        user_prompt = self.generate_user_prompt(prompt, user_id, query_id)
        system_prompt = self.generate_system_prompt()
        self.memory.push('user', user_prompt)
        self.memory.push('system', system_prompt)
        self.logger.info(f"memory:{self.memory}")
        self.logger.info(f"memory.get():{self.memory.get()}")
        self.tools = await self.get_tools()
        working = True
        while working == True:
            self.logger.info(f"tools:{self.tools}")
            animate_thinking("Thinking...", color="status")
            answer, reasoning = await self.llm_request()
            # exec_success, _ = self.execute_modules(answer)
            # answer = self.remove_blocks(answer)
            self.last_answer = answer
            self.status_message = "Ready"
            if len(self.blocks_result) == 0:
                working = False
        return answer, reasoning

if __name__ == "__main__":
    pass
