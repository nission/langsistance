# 知识管理 API 文档

## 概述
知识管理 API 提供知识库的增删改查功能，包括创建、删除、更新、查询和复制知识记录。

## 基础路径
```
/
```

## API 接口列表

### 1. 创建知识记录
**POST** `/create_knowledge`

创建新的知识记录，并自动生成向量嵌入存储。

#### 请求参数
```json
{
  "userId": "string",           // 用户ID，必填，最大50字符
  "question": "string",         // 问题，必填，最大100字符
  "description": "string",      // 描述，必填，最大5000字符
  "answer": "string",           // 答案，必填，最大5000字符
  "public": true,               // 是否公开，必填
  "modelName": "string",        // 模型名称，最大200字符
  "toolId": 123,                // 工具ID，必填
  "params": "{}"                // 参数，最大5000字符
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
**POST** `/delete_knowledge`

软删除知识记录（修改状态），并删除对应的向量嵌入。

#### 请求参数
```json
{
  "userId": "string",         // 用户ID，必填，最大50字符
  "knowledgeId": 123          // 知识记录ID，必填
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
- 仅允许创建者删除
- 否则返回 403 错误

---

### 3. 更新知识记录
**POST** `/update_knowledge`

更新知识记录的部分或全部字段，若问题或答案变更则重新计算向量嵌入。

#### 请求参数
```json
{
  "userId": "string",           // 用户ID，必填，最大50字符
  "knowledgeId": 123,           // 知识记录ID，必填
  "question": "string",         // 可选，最大100字符
  "description": "string",      // 可选，最大5000字符
  "answer": "string",           // 可选，最大5000字符
  "public": true,               // 可选
  "modelName": "string",        // 可选，最大200字符
  "toolId": 123,                // 可选
  "params": "{}"                // 可选，最大5000字符
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record updated successfully"
}
```

---

### 4. 查询知识记录
**GET** `/query_knowledge`

根据用户ID和关键词查询个人知识记录。

#### 查询参数
- `userId` (string, 必填，最大50字符)
- `query` (string, 必填)
- `limit` (int, 可选，默认10，最大100)
- `offset` (int, 可选，默认0)

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge records retrieved successfully",
  "data": [
    {
      "id": 1,
      "userId": "12345",
      "question": "What is Python?",
      "description": "Programming question",
      "answer": "Python is a programming language...",
      "public": true,
      "modelName": "gpt-3.5-turbo",
      "toolId": 1,
      "params": "{}",
      "createTime": "2024-01-01T12:00:00",
      "updateTime": "2024-01-01T12:00:00"
    }
  ],
  "total": 1
}
```

---

### 5. 查询公开知识记录
**GET** `/query_public_knowledge`

查询所有公开知识记录，无需身份验证。

#### 查询参数
- `query` (string, 必填)
- `limit` (int, 可选，默认10，最大100)
- `offset` (int, 可选，默认0)

#### 响应示例
```json
{
  "success": true,
  "message": "Knowledge records retrieved successfully",
  "data": [
    {
      "id": 2,
      "userId": "67890",
      "question": "What is machine learning?",
      "description": "ML basics",
      "answer": "Machine learning is...",
      "public": true,
      "modelName": "gpt-4",
      "toolId": 2,
      "params": "{}",
      "createTime": "2024-01-02T12:00:00",
      "updateTime": "2024-01-02T12:00:00"
    }
  ],
  "total": 1
}
```

---

### 6. 复制知识记录
**POST** `/copy_knowledge`

复制指定知识记录到当前用户账户。

#### 请求参数
```json
{
  "userId": "string",         // 目标用户ID，必填，最大50字符
  "knowledgeId": 123          // 要复制的知识记录ID，必填
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

---

## 注意事项
- 创建和更新时自动生成向量嵌入
- 删除为软删除，状态标记
- 权限控制严格，用户只能操作自己的记录
- 支持模糊搜索和分页查询

---

## 示例代码
请参考 README.md 中的示例调用方式。