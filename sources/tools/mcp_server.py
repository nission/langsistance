# mcp_server.py
from fastmcp import FastMCP


# 配置日志


# 创建 FastMCP 实例
mcp = FastMCP("ProtoTypeTools")

# 定义第一个工具：加法计算
@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b

# 定义第二个工具：生成问候语
@mcp.tool()
def greet(name: str) -> str:

    """Generate a greeting for the given name."""
    return f"Hello, {name}! Welcome to MCP tools."

if __name__ == "__main__":
    # 使用 stdio 传输模式运行服务器（适合本地调试）
    mcp.run(transport="stdio")