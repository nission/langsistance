# 知识库接口文档

本文档描述了知识库相关的API接口，包括创建、删除、修改和查询知识记录的功能。

## 接口列表

1. [创建知识记录](#创建知识记录) - POST /knowledge
2. [删除知识记录](#删除知识记录) - DELETE /knowledge
3. [修改知识记录](#修改知识记录) - PUT /knowledge
4. [查询知识记录](#查询知识记录) - GET /knowledge

## 创建知识记录

### 接口地址
POST /knowledge

### 功能描述
创建一个新的知识记录。

### 请求参数 (KnowledgeCreateRequest)
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | string | 是 | 用户ID，最大50字符 |
| question | string | 是 | 问题，最大100字符 |
| description | string | 是 | 描述，最大5000字符 |
| answer | string | 是 | 答案，最大5000字符 |
| public | boolean | 是 | 是否公开 |
| embeddingId | integer | 是 | 嵌入ID |
| model_name | string | 是 | 模型名称，最大200字符 |
| tool_id | integer | 是 | 工具ID |
| params | string | 是 | 参数，最大5000字符 |

### 响应参数 (KnowledgeCreateResponse)
| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| id | integer | 创建的记录ID（可选） |

### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record created successfully",
  "id": 123
}
```

## 删除知识记录

### 接口地址
DELETE /knowledge

### 功能描述
删除一个知识记录（逻辑删除，将状态设置为2）。

### 请求参数 (KnowledgeDeleteRequest)
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | string | 是 | 用户ID，最大50字符 |
| knowledgeId | integer | 是 | 知识记录ID |

### 响应参数 (KnowledgeDeleteResponse)
| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |

### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record deleted successfully"
}
```

## 修改知识记录

### 接口地址
PUT /knowledge

### 功能描述
修改一个知识记录的信息。

### 请求参数 (KnowledgeUpdateRequest)
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | string | 是 | 用户ID，最大50字符 |
| knowledgeId | integer | 是 | 知识记录ID |
| question | string | 否 | 问题，最大100字符 |
| description | string | 否 | 描述，最大5000字符 |
| answer | string | 否 | 答案，最大5000字符 |
| public | boolean | 否 | 是否公开 |
| model_name | string | 否 | 模型名称，最大200字符 |
| tool_id | integer | 否 | 工具ID |
| params | string | 否 | 参数，最大5000字符 |

### 响应参数 (KnowledgeUpdateResponse)
| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |

### 响应示例
```json
{
  "success": true,
  "message": "Knowledge record updated successfully"
}
```

## 查询知识记录

### 接口地址
GET /knowledge

### 功能描述
根据用户ID和查询关键词搜索知识记录。

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | string | 是 | 用户ID，最大50字符 |
| query | string | 是 | 查询关键词 |
| limit | integer | 否 | 返回记录数限制，默认10，最大100 |
| offset | integer | 否 | 偏移量，默认0 |

### 响应参数 (KnowledgeQueryResponse)
| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 是否成功 |
| message | string | 响应消息 |
| data | array | 知识记录列表 |
| total | integer | 总记录数 |

### data项结构 (KnowledgeItem)
| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | integer | 记录ID |
| userId | string | 用户ID |
| question | string | 问题 |
| description | string | 描述 |
| answer | string | 答案 |
| public | boolean | 是否公开 |
| model_name | string | 模型名称 |
| tool_id | integer | 工具ID |
| params | string | 参数 |
| created_at | string | 创建时间（可选） |
| updated_at | string | 更新时间（可选） |

### 响应示例
```json
{
  "success": true,
  "message": "Knowledge records retrieved successfully",
  "data": [
    {
      "id": 123,
      "userId": "user123",
      "question": "什么是人工智能？",
      "description": "人工智能的定义和概念",
      "answer": "人工智能是计算机科学的一个分支...",
      "public": true,
      "model_name": "deepseek-r1",
      "tool_id": 1,
      "params": "{\"temperature\": 0.7}",
      "created_at": "2023-01-01T00:00:00",
      "updated_at": "2023-01-01T00:00:00"
    }
  ],
  "total": 1
}