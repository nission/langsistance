# Query Processing API 文档

## 概述
查询处理 API 提供系统核心查询功能，包括智能问答处理、知识工具匹配、系统状态查询和截图功能等。

## 基础路径
```
/api/query
```

---

## API 接口列表

### 1. 获取截图
**GET** `/api/query/screenshot`

获取系统最新的屏幕截图。

#### 请求示例
```
GET /api/query/screenshot
```

#### 响应
- **成功**: 返回 PNG 图像文件
- **失败**: 返回 JSON 错误信息

#### 响应示例（失败）
```json
{
  "error": "No screenshot available"
}
```

#### 截图路径
```
.screenshots/updated_screen.png
```

---

### 2. 健康检查
**GET** `/api/query/health`

检查 API 服务的健康状态。

#### 请求示例
```
GET /api/query/health
```

#### 响应示例
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

---

### 3. 查询系统活跃状态
**GET** `/api/query/is_active`

检查系统当前是否处于活跃状态（是否有正在处理的任务）。

#### 请求示例
```
GET /api/query/is_active
```

#### 响应示例
```json
{
  "is_active": true
}
```

#### 状态说明
- `true`: 系统正在处理任务
- `false`: 系统空闲状态

---

### 4. 停止当前任务
**GET** `/api/query/stop`

停止当前正在执行的任务。

#### 请求示例
```
GET /api/query/stop
```

#### 响应示例
```json
{
  "status": "stopped"
}
```

#### 功能说明
- 发送停止信号给当前执行的代理
- 适用于需要中断长时间运行的任务

---

### 5. 获取最新答案
**GET** `/api/query/latest_answer`

获取系统生成的最新答案和相关信息。

#### 请求示例
```
GET /api/query/latest_answer
```

#### 响应示例
```json
{
  "done": "false",
  "answer": "正在处理您的问题...",
  "reasoning": "分析问题中...",
  "agent_name": "General",
  "success": true,
  "blocks": {
    "0": {
      "type": "text",
      "content": "处理结果..."
    }
  },
  "status": "Processing",
  "uid": "uuid-string"
}
```

#### 错误响应
```json
{
  "error": "No agent available"
}
```

#### 字段说明
- `done`: 任务是否完成 ("true"/"false")
- `answer`: 答案内容
- `reasoning`: 推理过程
- `agent_name`: 处理的代理名称
- `success`: 处理是否成功
- `blocks`: 结构化的处理结果块
- `status`: 当前状态
- `uid`: 唯一标识符

---

### 6. 处理查询
**POST** `/api/query/query`

处理用户的查询请求，这是系统的核心功能。

#### 请求参数
```json
{
  "query": "string",        // 用户查询内容，必填
  "query_id": "string"      // 查询唯一标识符，必填
}
```

#### 请求示例
```json
{
  "query": "什么是人工智能？",
  "query_id": "query-12345"
}
```

#### 响应示例
```json
{
  "done": "true",
  "answer": "人工智能（AI）是计算机科学的一个分支...",
  "reasoning": "基于问题分析，这是一个关于AI定义的问题...",
  "agent_name": "General",
  "success": "true",
  "blocks": {
    "0": {
      "type": "text",
      "content": "详细答案内容..."
    },
    "1": {
      "type": "reference",
      "content": "参考资料链接..."
    }
  },
  "status": "Completed",
  "uid": "uuid-string"
}
```

#### 错误响应
```json
{
  "done": "false",
  "answer": "Error: No answer from agent",
  "reasoning": "Error: No reasoning from agent",
  "agent_name": "Unknown",
  "success": "false",
  "blocks": {},
  "status": "Ready",
  "uid": "uuid-string"
}
```

#### HTTP 状态码
- `200`: 处理成功
- `400`: 处理失败但有错误信息
- `429`: 系统繁忙，有其他查询正在处理
- `500`: 服务器内部错误

---

### 7. 查找知识工具
**POST** `/api/query/find_knowledge_tool`

根据用户问题查找最相关的知识记录和对应的工具。

#### 请求参数
```json
{
  "userId": "string",                    // 用户ID，必填，最大50字符
  "question": "string",                  // 问题内容，必填
  "top_k": number,                      // 返回前K个结果，可选，默认3
  "similarity_threshold": number         // 相似度阈值，可选，默认0.7
}
```

#### 请求示例
```json
{
  "userId": "12345",
  "question": "如何使用计算器工具？",
  "top_k": 5,
  "similarity_threshold": 0.8
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge and tool found successfully",
  "knowledge": {
    "userId": "12345"
  },
  "tool": {
    "id": 123,
    "title": "Calculator Tool",
    "description": "A simple calculator for basic math operations",
    "url": "https://example.com/calculator"
  }
}
```

#### 无匹配结果响应
```json
{
  "success": false,
  "message": "No matching knowledge found above similarity threshold"
}
```

#### 功能说明
- 使用向量相似度搜索匹配知识
- 根据知识记录关联的工具ID返回工具信息
- 支持相似度阈值过滤
- 支持Top-K结果限制

---

## 数据模型

### QueryRequest
```typescript
interface QueryRequest {
  query: string;      // 查询内容
  query_id: string;   // 查询ID
}
```

### QueryResponse
```typescript
interface QueryResponse {
  done: string;       // "true" | "false"
  answer: string;     // 答案内容
  reasoning: string;  // 推理过程
  agent_name: string; // 代理名称
  success: string;    // "true" | "false"
  blocks: object;     // 结构化结果块
  status: string;     // 处理状态
  uid: string;        // 唯一标识符
}
```

### QuestionRequest
```typescript
interface QuestionRequest {
  userId: string;
  question: string;
  top_k?: number;
  similarity_threshold?: number;
}
```

### Block Structure
```typescript
interface Block {
  type: string;       // "text" | "reference" | "image" | "code" | ...
  content: string;    // 块内容
  metadata?: object;  // 额外元数据
}
```

---

## 错误代码

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误或处理失败 |
| 404 | 资源未找到（如截图文件不存在）|
| 429 | 系统繁忙，有其他查询在处理 |
| 500 | 服务器内部错误 |

---

## 使用示例

### JavaScript/Fetch
```javascript
// 健康检查
const healthCheck = async () => {
  const response = await fetch('/api/query/health');
  return await response.json();
};

// 处理查询
const processQuery = async (query, queryId) => {
  const response = await fetch('/api/query/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: query,
      query_id: queryId
    })
  });
  return await response.json();
};

// 查找知识工具
const findKnowledgeTool = async (userId, question, topK = 3, threshold = 0.7) => {
  const response = await fetch('/api/query/find_knowledge_tool', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: userId,
      question: question,
      top_k: topK,
      similarity_threshold: threshold
    })
  });
  return await response.json();
};

// 获取最新答案（轮询）
const pollLatestAnswer = async () => {
  const response = await fetch('/api/query/latest_answer');
  const data = await response.json();
  
  if (data.done === "false") {
    // 继续轮询
    setTimeout(pollLatestAnswer, 1000);
  }
  
  return data;
};

// 获取截图
const getScreenshot = async () => {
  const response = await fetch('/api/query/screenshot');
  if (response.ok) {
    return await response.blob(); // 返回图片blob
  } else {
    return await response.json(); // 返回错误信息
  }
};
```

### Python/Requests
```python
import requests
import time

# 健康检查
def health_check():
    response = requests.get('http://localhost:7777/api/query/health')
    return response.json()

# 处理查询
def process_query(query, query_id):
    data = {
        'query': query,
        'query_id': query_id
    }
    response = requests.post(
        'http://localhost:7777/api/query/query',
        json=data
    )
    return response.json()

# 查找知识工具
def find_knowledge_tool(user_id, question, top_k=3, similarity_threshold=0.7):
    data = {
        'userId': user_id,
        'question': question,
        'top_k': top_k,
        'similarity_threshold': similarity_threshold
    }
    response = requests.post(
        'http://localhost:7777/api/query/find_knowledge_tool',
        json=data
    )
    return response.json()

# 轮询最新答案
def poll_latest_answer(max_attempts=60):
    for _ in range(max_attempts):
        response = requests.get('http://localhost:7777/api/query/latest_answer')
        data = response.json()
        
        if 'error' not in data and data.get('done') == 'true':
            return data
            
        time.sleep(1)
    
    return None

# 停止当前任务
def stop_current_task():
    response = requests.get('http://localhost:7777/api/query/stop')
    return response.json()
```

---

## 工作流程示例

### 典型的查询处理流程
1. **提交查询**: 调用 `POST /api/query/query`
2. **轮询状态**: 定期调用 `GET /api/query/latest_answer`
3. **检查完成**: 当 `done` 为 `"true"` 时停止轮询
4. **处理结果**: 解析 `answer` 和 `blocks` 字段

### 知识工具匹配流程
1. **提交问题**: 调用 `POST /api/query/find_knowledge_tool`
2. **获得匹配**: 系统返回最相关的知识和工具
3. **使用工具**: 根据返回的工具信息调用相应工具
4. **处理结果**: 整合工具执行结果

---

## 注意事项

1. **并发限制**: 系统同时只能处理一个查询请求
2. **轮询机制**: 长时间查询需要通过轮询 `latest_answer` 获取进度
3. **状态管理**: 查询状态通过全局变量管理，重启后会丢失
4. **截图功能**: 截图文件存储在本地，需要确保目录权限
5. **错误处理**: 查询失败时仍会返回结构化的错误信息
6. **超时处理**: 长时间运行的查询可以通过 `stop` 接口中断