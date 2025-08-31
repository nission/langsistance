from typing import Dict, Any

from sources.knowledge.knowledge import get_user_knowledge
from sources.utility import pretty_print, animate_thinking
from sources.agents.agent import Agent
from sources.tools.mcpFinder import MCP_finder
from sources.memory import Memory
from sources.logger import Logger

from mcp_use.client import MCPClient
from mcp_use.adapters import LangChainAdapter

import os

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
        tool = {"server_config":{}}
        params = {"tool":tool}
        self.knowledgeTool = {"params":params}
        self.logger.info(self.knowledgeTool)
        system_prompt = f"""
        你是一个MCP智能助手，你的任务是根据用户的问题和上下文，使用MCP服务器提供的工具来解决问题。
        你可以使用的MCP服务器是：
        {", " . join(self.knowledgeTool["params"]["tool"]["server_config"])}
        工具调用完成后基于结果给出最终答案。
        如果不需要使用工具，请直接回答用户的问题。
        """
        # return self.expand_prompt(system_prompt)
        return system_prompt

    async def get_tools(self) -> dict:

        try:
            client = MCPClient.from_config_file("tool_config.json")
            adapter = LangChainAdapter()
            tools = await adapter.create_tools(client)
            self.logger.info(f"tools{tools}")
            return tools
        except Exception as e:
            raise Exception(f"get_tool failed: {str(e)}") from e

    async def process(self,user_id, prompt, speech_module) -> str | tuple[str, str]:
        if not self.enabled:
            return "MCP Agent is disabled."
        self.knowledgeTool = get_user_knowledge(user_id)
        # user_prompt = self.expand_prompt(prompt)
        user_prompt = prompt
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
