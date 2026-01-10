from langchain_core.callbacks.base import AsyncCallbackHandler
import asyncio


class SSECallbackHandler(AsyncCallbackHandler):
    """自定义异步回调处理器"""

    def __init__(self, queue: asyncio.Queue):
        super().__init__()
        self.queue = queue

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """每个 token 生成时触发 - 最重要！"""
        if token and token.strip():
            await self.queue.put({
                'type': 'token',
                'content': token
            })

    async def on_tool_start(
            self,
            serialized: dict,
            input_str: str,
            **kwargs
    ) -> None:
        """工具调用开始"""
        tool_name = serialized.get('name', 'unknown')
        print(f"[QUEUE PUT] type=tool_start, name={tool_name}, input={input_str}")
        # await self.queue.put({
        #     'type': 'tool_start',
        #     'tool': tool_name,
        #     'input': input_str
        # })

    async def on_tool_end(self, output: str, **kwargs) -> None:
        """工具调用结束"""
        print(f"[QUEUE PUT] tool end type={type(output)}")
        # await self.queue.put({
        #     'type': 'tool_end',
        #     'output': output
        # })

    async def on_tool_error(self, error: Exception, **kwargs) -> None:
        """工具错误处理"""
        await self.queue.put({
            'type': 'error',
            'message': f"Tool error: {str(error)}"
        })

    async def on_llm_error(self, error: Exception, **kwargs) -> None:
        """LLM 错误处理"""
        await self.queue.put({
            'type': 'error',
            'message': str(error)
        })

    async def on_chain_end(self, output, **kwargs) -> None:
        """链结束时触发"""
        print(f"[QUEUE PUT] chain end type={type(output)}, outputs={output}")
        # await self.queue.put({
        #     'type': 'chain_end',
        #     'outputs': output
        # })

    async def on_chain_error(self, error, **kwargs) -> None:
        """链错误时触发"""
        await self.queue.put({
            'type': 'error',
            'message': str(error),
            'details': kwargs  # 这里可能包含复杂对象
        })

    async def on_agent_finish(self, finish, **kwargs):
        print(f"[QUEUE PUT] agent end type={type(finish)}, outputs={finish}")
        await self.queue.put({
            'type': 'end',
            'outputs': ''
        })