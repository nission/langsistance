# Knowledge Management API 文档

## 概述
知识管理 API 提供知识库的增删改查功能，包括创建知识、删除知识、更新知识、查询知识和复制知识等核心功能。

## 基础路径
```
/api/knowledge
```

---

## API 接口列表

### 1. 创建知识记录
**POST** `/api/knowledge/create_knowledge`

创建新的知识记录，并自动生成向量嵌入存储到 Redis。

#### 请求参数
```json
{
  "userId": "string",           // 用户ID，必填，最大50字符
  "question": "string",         // 问题，必填，最大100字符
  "description": "string",      // 描述，必填，最大5000字符
  "answer": "string",           // 答案，必填，最大5000字符
  "public": boolean,            // 是否公开，必填
  "modelName": "string",        // 模型名称，最大200字符
  "toolId": number,            // 工具ID，必填
  "params": "string"           // 参数，最大5000字符
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record created successfully",
  "id": 123
}
```

#### 错误响应
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["userId is required and must be no more than 50 characters"]
}
```

---

### 2. 删除知识记录
**POST** `/api/knowledge/delete_knowledge`

软删除知识记录（修改状态为已删除），同时删除 Redis 中的向量嵌入。

#### 请求参数
```json
{
  "userId": "string",         // 用户ID，必填，最大50字符
  "knowledgeId": number       // 知识记录ID，必填
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record deleted successfully"
}
```

#### 权限控制
- 只有知识记录的创建者才能删除该记录
- 返回 403 错误如果用户无权限删除

---

### 3. 更新知识记录
**POST** `/api/knowledge/update_knowledge`

更新知识记录的部分或全部字段，如果问题或答案有变更会重新计算向量嵌入。

#### 请求参数
```json
{
  "userId": "string",           // 用户ID，必填，最大50字符
  "knowledgeId": number,        // 知识记录ID，必填
  "question": "string",         // 问题，可选，最大100字符
  "description": "string",      // 描述，可选，最大5000字符
  "answer": "string",           // 答案，可选，最大5000字符
  "public": boolean,            // 是否公开，可选
  "modelName": "string",        // 模型名称，可选，最大200字符
  "toolId": number,            // 工具ID，可选
  "params": "string"           // 参数，可选，最大5000字符
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record updated successfully"
}
```

#### 特殊功能
- 如果 `question` 或 `answer` 字段有变更，系统会自动重新计算向量嵌入
- 只更新提供的字段，未提供的字段保持不变

---

### 4. 查询知识记录
**GET** `/api/knowledge/query_knowledge`

根据用户ID和搜索关键词查询知识记录。

#### 查询参数
- `userId` (string, 必填): 用户ID，最大50字符
- `query` (string, 必填): 搜索关键词
- `limit` (int, 可选): 返回记录数量限制，默认10，最大100
- `offset` (int, 可选): 分页偏移量，默认0

#### 请求示例
```
GET /api/knowledge/query_knowledge?userId=12345&query=Python&limit=20&offset=0
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge records retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": "12345",
      "question": "What is Python?",
      "description": "Programming language question",
      "answer": "Python is a programming language...",
      "public": true,
      "model_name": "gpt-3.5-turbo",
      "tool_id": 1,
      "params": "{}",
      "create_time": "2024-01-01T12:00:00",
      "update_time": "2024-01-01T12:00:00"
    }
  ],
  "total": 1
}
```

#### 搜索规则
- 在 `question`、`description`、`answer` 字段中进行模糊搜索
- 只返回当前用户创建的知识记录
- 按更新时间倒序排列

---

### 5. 查询公开知识记录
**GET** `/api/knowledge/query_public_knowledge`

查询所有公开的知识记录，无需用户身份验证。

#### 查询参数
- `query` (string, 必填): 搜索关键词
- `limit` (int, 可选): 返回记录数量限制，默认10，最大100
- `offset` (int, 可选): 分页偏移量，默认0

#### 请求示例
```
GET /api/knowledge/query_public_knowledge?query=machine learning&limit=10&offset=0
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge records retrieved successfully",
  "data": [
    {
      "id": 2,
      "user_id": "67890",
      "question": "What is machine learning?",
      "description": "ML basics",
      "answer": "Machine learning is...",
      "public": true,
      "model_name": "gpt-4",
      "tool_id": 2,
      "params": "{}",
      "create_time": "2024-01-02T12:00:00",
      "update_time": "2024-01-02T12:00:00"
    }
  ],
  "total": 1
}
```

#### 特殊说明
- 只返回 `public` 字段为 `true` 的记录
- 不限制用户身份，任何人都可以查询

---

### 6. 复制知识记录
**POST** `/api/knowledge/copy_knowledge`

将现有的知识记录复制到当前用户账户下。

#### 请求参数
```json
{
  "userId": "string",         // 目标用户ID，必填，最大50字符
  "knowledgeId": "string"     // 要复制的知识记录ID，必填
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record copied successfully",
  "id": 124
}
```

#### 功能说明
- 复制原记录的所有内容字段
- 将 `user_id` 设置为当前用户
- 同时复制 Redis 中的向量嵌入数据
- 返回新创建记录的ID

---

## 数据模型

### KnowledgeItem
```typescript
interface KnowledgeItem {
  id: number;
  user_id: string;
  question: string;
  description: string;
  answer: string;
  public: boolean;
  model_name: string;
  tool_id: number;
  params: string;
  create_time?: string;
  update_time?: string;
}
```

---

## 错误代码

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 403 | 权限不足 |
| 404 | 记录不存在 |
| 500 | 服务器内部错误 |

---

## 使用示例

### JavaScript/Fetch
```javascript
// 创建知识记录
const createKnowledge = async (data) => {
  const response = await fetch('/api/knowledge/create_knowledge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return await response.json();
};

// 查询知识记录
const queryKnowledge = async (userId, query, limit = 10, offset = 0) => {
  const url = `/api/knowledge/query_knowledge?userId=${userId}&query=${query}&limit=${limit}&offset=${offset}`;
  const response = await fetch(url);
  return await response.json();
};
```

### Python/Requests
```python
import requests

# 创建知识记录
def create_knowledge(data):
    response = requests.post(
        'http://localhost:7777/api/knowledge/create_knowledge',
        json=data
    )
    return response.json()

# 查询知识记录
def query_knowledge(user_id, query, limit=10, offset=0):
    params = {
        'userId': user_id,
        'query': query,
        'limit': limit,
        'offset': offset
    }
    response = requests.get(
        'http://localhost:7777/api/knowledge/query_knowledge',
        params=params
    )
    return response.json()
```

---

## 注意事项

1. **向量嵌入**: 创建或更新知识记录时会自动生成向量嵌入存储到 Redis
2. **软删除**: 删除操作不会物理删除数据，而是将状态标记为已删除
3. **权限控制**: 用户只能操作自己创建的知识记录
4. **搜索功能**: 支持在问题、描述、答案字段中进行模糊搜索
5. **分页查询**: 所有列表查询都支持 limit/offset 分页参数