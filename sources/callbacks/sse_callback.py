import asyncio
from langchain_core.callbacks.base import BaseCallbackHandler


class SSECallbackHandler(BaseCallbackHandler):
    def __init__(self, queue: asyncio.Queue):
        self.queue = queue

    def on_llm_new_token(self, token: str, **kwargs):
        self.queue.put_nowait(token)

    def on_llm_end(self, response, **kwargs):
        self.queue.put_nowait("[DONE]")

    def on_llm_error(self, error, **kwargs):
        self.queue.put_nowait(f"[ERROR] {error}")