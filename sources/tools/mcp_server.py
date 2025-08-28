# mcp_server.py
from fastmcp import FastMCP
# from sources.logger import Logger

# 配置日志
# logger = Logger("mcp_server.log")

# 创建 FastMCP 实例
mcp = FastMCP("ProtoTypeTools")

# 定义第一个工具：加法计算
@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers together."""
    logger.info(f"Adding {a} and {b}")
    return a + b

# 定义第二个工具：生成问候语
@mcp.tool()
def greet(name: str) -> str:
    """Generate a greeting for the given name."""
    logger.info(f"Generating greeting for {name}")
    return f"Hello, {name}! Welcome to MCP tools."

if __name__ == "__main__":
    # 使用 stdio 传输模式运行服务器（适合本地调试）
    mcp.run(transport="stdio")