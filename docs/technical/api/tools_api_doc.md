# Tools Management API 文档

## 概述
工具管理 API 提供工具和相关知识的管理功能，包括创建工具、更新工具、删除工具、查询工具以及工具请求处理等功能。

## 基础路径
```
/api/tools
```

---

## API 接口列表

### 1. 创建工具和知识记录
**POST** `/api/tools/create_tool_and_knowledge`

同时创建工具记录和对应的知识记录，在一个事务中完成。

#### 请求参数
```json
{
  "tool_userId": "string",              // 工具用户ID，必填，最大50字符
  "tool_title": "string",               // 工具标题，必填，最大100字符
  "tool_description": "string",         // 工具描述，必填，最大5000字符
  "tool_url": "string",                 // 工具URL，必填，最大1000字符
  "tool_push": number,                  // 推送状态
  "tool_public": boolean,               // 是否公开
  "tool_timeout": number,               // 超时时间（秒）
  "tool_params": "string",              // 工具参数，最大5000字符
  
  "knowledge_userId": "string",         // 知识用户ID，必填，最大50字符
  "knowledge_question": "string",       // 知识问题，必填，最大100字符
  "knowledge_description": "string",    // 知识描述，必填，最大5000字符
  "knowledge_answer": "string",         // 知识答案，必填，最大5000字符
  "knowledge_public": boolean,          // 知识是否公开
  "knowledge_embeddingId": number,      // 嵌入ID
  "knowledge_model_name": "string",     // 知识模型名称，最大200字符
  "knowledge_params": "string"          // 知识参数，最大5000字符
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool and knowledge records created successfully",
  "tool_id": 123,
  "knowledge_id": 456
}
```

#### 事务处理
- 如果工具创建失败，不会创建知识记录
- 如果知识创建失败，工具创建会被回滚
- 确保数据一致性

---

### 2. 更新工具记录
**POST** `/api/tools/update_tool`

更新工具记录的部分字段（仅允许更新 title、description 和 public 字段）。

#### 请求参数
```json
{
  "userId": "string",           // 用户ID，必填，最大50字符
  "toolId": number,             // 工具ID，必填
  "title": "string",            // 工具标题，可选，1-100字符
  "description": "string",      // 工具描述，可选，1-5000字符
  "public": "string"            // 是否公开，可选
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool record updated successfully"
}
```

#### 权限控制
- 只有工具的创建者才能更新该工具
- 出于安全考虑，只允许更新特定字段

---

### 3. 删除工具记录
**POST** `/api/tools/delete_tool`

软删除工具记录（将状态设置为已删除）。

#### 请求参数
```json
{
  "userId": "string",         // 用户ID，必填，最大50字符
  "toolId": number            // 工具ID，必填
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool record deleted successfully"
}
```

#### 删除说明
- 软删除，不物理删除数据
- 将 status 字段设置为 2（表示已删除）
- 只有创建者可以删除自己的工具

---

### 4. 查询工具记录
**GET** `/api/tools/query_tools`

根据用户ID和搜索关键词查询工具记录。

#### 查询参数
- `userId` (string, 必填): 用户ID，最大50字符
- `query` (string, 可选): 搜索关键词，默认为空
- `limit` (int, 可选): 返回记录数量限制，默认10，最大100
- `offset` (int, 可选): 分页偏移量，默认0

#### 请求示例
```
GET /api/tools/query_tools?userId=12345&query=calculator&limit=20&offset=0
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool records retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": "12345",
      "title": "Calculator Tool",
      "description": "A simple calculator tool",
      "url": "https://example.com/calculator",
      "push": 0,
      "public": true,
      "status": 1,
      "timeout": 30,
      "params": "{}"
    }
  ],
  "total": 1
}
```

#### 搜索规则
- 在 `title` 和 `description` 字段中进行模糊搜索
- 只返回当前用户创建的工具记录
- 按更新时间倒序排列

---

### 5. 查询公开工具记录
**GET** `/api/tools/query_public_tools`

查询所有公开的工具记录。

#### 查询参数
- `query` (string, 可选): 搜索关键词，默认为空
- `limit` (int, 可选): 返回记录数量限制，默认10，最大100
- `offset` (int, 可选): 分页偏移量，默认0

#### 请求示例
```
GET /api/tools/query_public_tools?query=API&limit=10&offset=0
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool records retrieved successfully",
  "data": [
    {
      "id": 2,
      "user_id": "67890",
      "title": "Weather API Tool",
      "description": "Get weather information",
      "url": "https://api.weather.com",
      "push": 1,
      "public": true,
      "status": 1,
      "timeout": 60,
      "params": "{\"api_key\": \"required\"}"
    }
  ],
  "total": 1
}
```

---

### 6. 获取工具请求
**POST** `/api/tools/get_tool_request`

从 Redis 中获取指定查询ID的工具请求数据。

#### 请求参数
```json
{
  "query_id": "string",       // 查询ID，必填
  "userId": "string"          // 用户ID，必填，最大50字符
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool retrieved successfully",
  "tool": {
    "id": 123,
    "title": "Calculator Tool",
    "url": "https://example.com/calculator",
    "params": "{\"operation\": \"add\"}"
  }
}
```

#### Redis 键格式
```
tool_request_{query_id}_{userId}
```

---

### 7. 保存工具响应
**POST** `/api/tools/save_tool_response`

将工具执行结果保存到 Redis 中。

#### 请求参数
```json
{
  "query_id": "string",        // 查询ID，必填
  "userId": "string",          // 用户ID，必填，最大50字符
  "tool_response": {}          // 工具响应数据，必填，任意JSON对象
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool response saved successfully"
}
```

#### Redis 键格式
```
tool_response_{query_id}_{userId}
```

---

## 数据模型

### ToolItem
```typescript
interface ToolItem {
  id: number;
  user_id: string;
  title: string;
  description: string;
  url: string;
  push: number;
  public: boolean;
  status: number;
  timeout: number;
  params: string;
  create_time?: string;
  update_time?: string;
}
```

### ToolAndKnowledgeCreateRequest
```typescript
interface ToolAndKnowledgeCreateRequest {
  // Tool fields
  tool_userId: string;
  tool_title: string;
  tool_description: string;
  tool_url: string;
  tool_push: number;
  tool_public: boolean;
  tool_timeout: number;
  tool_params: string;
  
  // Knowledge fields
  knowledge_userId: string;
  knowledge_question: string;
  knowledge_description: string;
  knowledge_answer: string;
  knowledge_public: boolean;
  knowledge_embeddingId: number;
  knowledge_model_name: string;
  knowledge_params: string;
}
```

---

## 错误代码

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 403 | 权限不足 |
| 404 | 记录不存在或工具未找到 |
| 500 | 服务器内部错误 |

---

## 使用示例

### JavaScript/Fetch
```javascript
// 创建工具和知识记录
const createToolAndKnowledge = async (data) => {
  const response = await fetch('/api/tools/create_tool_and_knowledge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

// 查询工具记录
const queryTools = async (userId, query = '', limit = 10, offset = 0) => {
  const params = new URLSearchParams({
    userId,
    query,
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  const response = await fetch(`/api/tools/query_tools?${params}`);
  return await response.json();
};

// 保存工具响应
const saveToolResponse = async (queryId, userId, toolResponse) => {
  const response = await fetch('/api/tools/save_tool_response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_id: queryId,
      userId: userId,
      tool_response: toolResponse
    })
  });
  return await response.json();
};
```

### Python/Requests
```python
import requests

# 创建工具和知识记录
def create_tool_and_knowledge(data):
    response = requests.post(
        'http://localhost:7777/api/tools/create_tool_and_knowledge',
        json=data
    )
    return response.json()

# 获取工具请求
def get_tool_request(query_id, user_id):
    data = {
        'query_id': query_id,
        'userId': user_id
    }
    response = requests.post(
        'http://localhost:7777/api/tools/get_tool_request',
        json=data
    )
    return response.json()

# 查询公开工具
def query_public_tools(query='', limit=10, offset=0):
    params = {
        'query': query,
        'limit': limit,
        'offset': offset
    }
    response = requests.get(
        'http://localhost:7777/api/tools/query_public_tools',
        params=params
    )
    return response.json()
```

---

## 注意事项

1. **事务处理**: 创建工具和知识记录使用数据库事务确保一致性
2. **权限控制**: 用户只能操作自己创建的工具记录
3. **软删除**: 删除操作不会物理删除数据
4. **Redis 缓存**: 工具请求和响应通过 Redis 进行临时存储
5. **字段限制**: 更新工具时只能修改特定字段以确保安全性
6. **搜索功能**: 支持在标题和描述字段中进行模糊搜索
7. **超时设置**: 每个工具都有超时时间设置，用于控制执行时长