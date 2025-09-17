# 工具管理 API 文档

## 概述
工具管理 API 提供工具及相关知识的管理功能，包括创建、更新、删除、查询工具记录，以及工具请求和响应处理。

## 基础路径
```
/
```

## API 接口列表

### 1. 创建工具和知识记录
**POST** `/create_tool_and_knowledge`

在一个事务中同时创建工具和对应的知识记录。

#### 请求参数
```json
{
  "tool_userId": "string",              // 工具用户ID，必填，最大50字符
  "tool_title": "string",               // 工具标题，必填，最大100字符
  "tool_description": "string",         // 工具描述，必填，最大5000字符
  "tool_url": "string",                 // 工具URL，必填，最大1000字符
  "tool_push": 1,                       // 推送状态，数字
  "tool_public": true,                  // 是否公开，布尔值
  "tool_timeout": 30,                   // 超时时间，秒
  "tool_params": "{}",                  // 工具参数，字符串，最大5000字符

  "knowledge_userId": "string",         // 知识用户ID，必填，最大50字符
  "knowledge_question": "string",       // 知识问题，必填，最大100字符
  "knowledge_description": "string",    // 知识描述，必填，最大5000字符
  "knowledge_answer": "string",         // 知识答案，必填，最大5000字符
  "knowledge_public": true,              // 是否公开，布尔值
  "knowledge_embeddingId": 0,            // 嵌入ID，数字
  "knowledge_model_name": "string",      // 知识模型名称，最大200字符
  "knowledge_params": "{}"                // 知识参数，字符串，最大5000字符
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

#### 事务处理说明
- 如果工具创建失败，知识记录不会创建
- 如果知识记录创建失败，工具创建会回滚
- 确保数据一致性

---

### 2. 更新工具记录
**POST** `/update_tool`

更新工具的部分字段（仅限标题、描述和公开状态）。

#### 请求参数
```json
{
  "userId": "string",           // 用户ID，必填，最大50字符
  "toolId": 123,               // 工具ID，必填
  "title": "string",           // 标题，选填，1-100字符
  "description": "string",     // 描述，选填，1-5000字符
  "public": true               // 是否公开，选填，布尔值
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
- 仅允许工具创建者更新
- 只允许更新指定字段

---

### 3. 删除工具记录
**POST** `/delete_tool`

软删除工具记录（修改状态字段）。

#### 请求参数
```json
{
  "userId": "string",           // 用户ID，必填，最大50字符
  "toolId": 123                // 工具ID，必填
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
- 状态字段设为已删除
- 仅允许创建者删除

---

### 4. 查询工具记录
**GET** `/query_tools`

根据用户ID和关键词查询工具记录。

#### 查询参数
- `userId` (string，必填，最大50字符)
- `query` (string，选填，默认空)
- `limit` (int，选填，默认10，最大100)
- `offset` (int，选填，默认0)

#### 响应示例
```json
{
  "success": true,
  "message": "Tool records retrieved successfully",
  "data": [
    {
      "id": 1,
      "userId": "12345",
      "title": "Calculator Tool",
      "description": "A simple calculator",
      "url": "https://example.com",
      "push": 0,
      "public": true,
      "status": 1,
      "timeout": 30,
      "params": "{}",
      "createTime": "2024-01-01T12:00:00",
      "updateTime": "2024-01-01T12:00:00"
    }
  ],
  "total": 1
}
```

---

### 5. 查询公开工具记录
**GET** `/query_public_tools`

查询所有公开工具记录，无需身份验证。

#### 查询参数
- `query` (string，选填，默认空)
- `limit` (int，选填，默认10，最大100)
- `offset` (int，选填，默认0)

#### 响应示例
```json
{
  "success": true,
  "message": "Tool records retrieved successfully",
  "data": [
    {
      "id": 2,
      "userId": "67890",
      "title": "Weather API",
      "description": "Weather information",
      "url": "https://weather.com",
      "push": 1,
      "public": true,
      "status": 1,
      "timeout": 60,
      "params": "{\"api_key\": \"required\"}",
      "createTime": "2024-01-02T12:00:00",
      "updateTime": "2024-01-02T12:00:00"
    }
  ],
  "total": 1
}
```

---

### 6. 获取工具请求
**POST** `/get_tool_request`

从 Redis 获取指定查询ID和用户的工具请求数据。

#### 请求参数
```json
{
  "query_id": "string",         // 查询ID，必填
  "userId": "string"            // 用户ID，必填，最大50字符
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
    "url": "https://example.com",
    "params": "{\"operation\": \"add\"}"
  }
}
```

---

### 7. 保存工具响应
**POST** `/save_tool_response`

保存工具执行响应到 Redis。

#### 请求参数
```json
{
  "query_id": "string",         // 查询ID，必填
  "userId": "string",           // 用户ID，必填，最大50字符
  "tool_response": {}           // 工具响应数据，必填，任意 JSON 对象
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "Tool response saved successfully"
}
```

---

## 注意事项
- 创建工具和知识记录使用事务，确保一致性
- 软删除实现数据保护
- 权限控制严格，用户只能操作自己的工具
- 支持模糊搜索和分页查询
- 工具请求和响应通过 Redis 缓存

---

## 示例代码
请参考 README.md 中的示例调用方式。