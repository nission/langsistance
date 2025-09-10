# Data Models API 文档

## 概述
数据模型定义了所有 API 接口的请求和响应数据结构。这些模型基于 Pydantic 构建，提供了类型验证和序列化功能。

---

## Knowledge Models（知识管理模型）

### KnowledgeCreateRequest
创建知识记录的请求模型。

```python
class KnowledgeCreateRequest(BaseModel):
    userId: str           # 用户ID，必填
    question: str         # 问题，必填
    description: str      # 描述，必填  
    answer: str          # 答案，必填
    public: bool         # 是否公开，必填
    modelName: str       # 模型名称，必填
    toolId: int          # 工具ID，必填
    params: str          # 参数，必填
```

#### 验证规则
- `userId`: 长度不超过 50 字符
- `question`: 长度不超过 100 字符
- `description`: 长度不超过 5000 字符
- `answer`: 长度不超过 5000 字符
- `modelName`: 长度不超过 200 字符
- `params`: 长度不超过 5000 字符

### KnowledgeCreateResponse
创建知识记录的响应模型。

```python
class KnowledgeCreateResponse(BaseModel):
    success: bool             # 操作是否成功
    message: str             # 响应消息
    id: Optional[int] = None # 创建的记录ID（可选）
```

### KnowledgeDeleteRequest
删除知识记录的请求模型。

```python
class KnowledgeDeleteRequest(BaseModel):
    userId: str          # 用户ID，必填
    knowledgeId: int     # 知识记录ID，必填
```

### KnowledgeDeleteResponse
删除知识记录的响应模型。

```python
class KnowledgeDeleteResponse(BaseModel):
    success: bool        # 操作是否成功
    message: str        # 响应消息
```

### KnowledgeUpdateRequest
更新知识记录的请求模型。

```python
class KnowledgeUpdateRequest(BaseModel):
    userId: str                      # 用户ID，必填
    knowledgeId: int                # 知识记录ID，必填
    question: Optional[str] = None   # 问题（可选）
    description: Optional[str] = None # 描述（可选）
    answer: Optional[str] = None     # 答案（可选）
    public: Optional[bool] = None    # 是否公开（可选）
    modelName: Optional[str] = None  # 模型名称（可选）
    toolId: Optional[int] = None     # 工具ID（可选）
    params: Optional[str] = None     # 参数（可选）
```

### KnowledgeUpdateResponse
更新知识记录的响应模型。

```python
class KnowledgeUpdateResponse(BaseModel):
    success: bool        # 操作是否成功
    message: str        # 响应消息
```

### KnowledgeQueryResponse
查询知识记录的响应模型。

```python
class KnowledgeQueryResponse(BaseModel):
    success: bool               # 操作是否成功
    message: str               # 响应消息
    data: List[KnowledgeItem]  # 知识记录列表
    total: int                 # 总记录数
```

### KnowledgeCopyRequest
复制知识记录的请求模型。

```python
class KnowledgeCopyRequest(BaseModel):
    userId: str          # 目标用户ID，必填
    knowledgeId: str     # 要复制的知识记录ID，必填
```

### KnowledgeCopyResponse
复制知识记录的响应模型。

```python
class KnowledgeCopyResponse(BaseModel):
    success: bool             # 操作是否成功
    message: str             # 响应消息
    id: Optional[int] = None # 新创建的记录ID（可选）
```

---

## Tool Models（工具管理模型）

### ToolAndKnowledgeCreateRequest
同时创建工具和知识记录的请求模型。

```python
class ToolAndKnowledgeCreateRequest(BaseModel):
    # Tool fields
    tool_userId: str         # 工具用户ID
    tool_title: str          # 工具标题
    tool_description: str    # 工具描述
    tool_url: str           # 工具URL
    tool_push: int          # 推送状态
    tool_public: bool       # 是否公开
    tool_timeout: int       # 超时时间
    tool_params: str        # 工具参数
    
    # Knowledge fields
    knowledge_userId: str         # 知识用户ID
    knowledge_question: str       # 知识问题
    knowledge_description: str    # 知识描述
    knowledge_answer: str         # 知识答案
    knowledge_public: bool        # 知识是否公开
    knowledge_embeddingId: int    # 嵌入ID
    knowledge_model_name: str     # 知识模型名称
    knowledge_params: str         # 知识参数
```

#### 验证规则
- `tool_userId`: 长度不超过 50 字符
- `tool_title`: 长度不超过 100 字符
- `tool_description`: 长度不超过 5000 字符
- `tool_url`: 长度不超过 1000 字符
- `tool_params`: 长度不超过 5000 字符
- `knowledge_userId`: 长度不超过 50 字符
- `knowledge_question`: 长度不超过 100 字符
- `knowledge_description`: 长度不超过 5000 字符
- `knowledge_answer`: 长度不超过 5000 字符
- `knowledge_model_name`: 长度不超过 200 字符
- `knowledge_params`: 长度不超过 5000 字符

### ToolAndKnowledgeCreateResponse
同时创建工具和知识记录的响应模型。

```python
class ToolAndKnowledgeCreateResponse(BaseModel):
    success: bool                    # 操作是否成功
    message: str                    # 响应消息
    tool_id: Optional[int] = None   # 创建的工具ID（可选）
    knowledge_id: Optional[int] = None # 创建的知识ID（可选）
```

### ToolUpdateRequest
更新工具的请求模型。

```python
class ToolUpdateRequest(BaseModel):
    userId: str                      # 用户ID，必填
    toolId: int                     # 工具ID，必填
    title: Optional[str] = None      # 标题（可选）
    description: Optional[str] = None # 描述（可选）
    public: Optional[str] = None     # 是否公开（可选）
```

### ToolUpdateResponse
更新工具的响应模型。

```python
class ToolUpdateResponse(BaseModel):
    success: bool        # 操作是否成功
    message: str        # 响应消息
```

### ToolDeleteRequest
删除工具的请求模型。

```python
class ToolDeleteRequest(BaseModel):
    userId: str         # 用户ID，必填
    toolId: int        # 工具ID，必填
```

### ToolDeleteResponse
删除工具的响应模型。

```python
class ToolDeleteResponse(BaseModel):
    success: bool       # 操作是否成功
    message: str       # 响应消息
```

### ToolQueryResponse
查询工具的响应模型。

```python
class ToolQueryResponse(BaseModel):
    success: bool           # 操作是否成功
    message: str           # 响应消息
    data: List[ToolItem]   # 工具记录列表
    total: int             # 总记录数
```

---

## Query Models（查询处理模型）

### QuestionRequest
问题查询的请求模型。

```python
class QuestionRequest(BaseModel):
    userId: str                          # 用户ID，必填
    question: str                        # 问题内容，必填
    top_k: Optional[int] = 3            # 返回前K个结果，默认3
    similarity_threshold: Optional[float] = 0.7  # 相似度阈值，默认0.7
```

### KnowledgeToolResponse
知识工具查询的响应模型。

```python
class KnowledgeToolResponse(BaseModel):
    success: bool                           # 操作是否成功
    message: str                           # 响应消息
    knowledge: Optional[KnowledgeItem] = None # 知识项（可选）
    tool: Optional[ToolItem] = None        # 工具项（可选）
    similarity: Optional[float] = None     # 相似度分数（可选）
```

### ToolFetchRequest
获取工具的请求模型。

```python
class ToolFetchRequest(BaseModel):
    query_id: str       # 查询ID，必填
    userId: str        # 用户ID，必填
```

### ToolFetchResponse
获取工具的响应模型。

```python
class ToolFetchResponse(BaseModel):
    success: bool                   # 操作是否成功
    message: str                   # 响应消息
    tool: Optional[dict] = None    # 工具数据（可选）
```

### ToolResponseRequest
保存工具响应的请求模型。

```python
class ToolResponseRequest(BaseModel):
    query_id: str           # 查询ID，必填
    userId: str            # 用户ID，必填
    tool_response: dict    # 工具响应数据，必填
```

### ToolResponseResponse
保存工具响应的响应模型。

```python
class ToolResponseResponse(BaseModel):
    success: bool          # 操作是否成功
    message: str          # 响应消息
```

---

## Core Data Models（核心数据模型）

### KnowledgeItem
知识项的数据模型（从 sources.knowledge.knowledge 导入）。

```python
class KnowledgeItem(BaseModel):
    id: int                          # 知识ID
    user_id: str                     # 用户ID
    question: str                    # 问题
    description: str                 # 描述
    answer: str                      # 答案
    public: bool                     # 是否公开
    model_name: str                  # 模型名称
    tool_id: int                     # 工具ID
    params: str                      # 参数
    create_time: Optional[str] = None # 创建时间（可选）
    update_time: Optional[str] = None # 更新时间（可选）
```

### ToolItem
工具项的数据模型（从 sources.knowledge.knowledge 导入）。

```python
class ToolItem(BaseModel):
    id: int                          # 工具ID
    user_id: str                     # 用户ID
    title: str                       # 标题
    description: str                 # 描述
    url: str                        # URL
    push: int                       # 推送状态
    public: bool                    # 是否公开
    status: int                     # 状态
    timeout: int                    # 超时时间
    params: str                     # 参数
    create_time: Optional[str] = None # 创建时间（可选）
    update_time: Optional[str] = None # 更新时间（可选）
```

### QueryRequest
查询请求模型（从 sources.schemas 导入）。

```python
class QueryRequest(BaseModel):
    query: str         # 查询内容，必填
    query_id: str      # 查询ID，必填
```

### QueryResponse
查询响应模型（从 sources.schemas 导入）。

```python
class QueryResponse(BaseModel):
    done: str          # 是否完成 ("true"/"false")
    answer: str        # 答案内容
    reasoning: str     # 推理过程
    agent_name: str    # 代理名称
    success: str       # 是否成功 ("true"/"false")
    blocks: dict       # 结构化结果块
    status: str        # 处理状态
    uid: str          # 唯一标识符
```

---

## 使用示例

### Python 中使用模型
```python
from api_routes.models import KnowledgeCreateRequest, KnowledgeCreateResponse

# 创建请求数据
request_data = KnowledgeCreateRequest(
    userId="12345",
    question="什么是Python？",
    description="关于Python编程语言的问题",
    answer="Python是一种高级编程语言...",
    public=True,
    modelName="gpt-3.5-turbo",
    toolId=1,
    params="{}"
)

# 验证数据
try:
    validated_data = request_data.dict()
    print("数据验证通过")
except ValidationError as e:
    print(f"数据验证失败: {e}")
```

### TypeScript 接口定义
基于这些模型，可以生成对应的 TypeScript 接口：

```typescript
interface KnowledgeCreateRequest {
  userId: string;
  question: string;
  description: string;
  answer: string;
  public: boolean;
  modelName: string;
  toolId: number;
  params: string;
}

interface KnowledgeCreateResponse {
  success: boolean;
  message: string;
  id?: number;
}

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

---

## 模型继承关系

```
BaseModel (Pydantic)
├── KnowledgeCreateRequest
├── KnowledgeCreateResponse
├── KnowledgeDeleteRequest
├── KnowledgeDeleteResponse
├── KnowledgeUpdateRequest
├── KnowledgeUpdateResponse
├── KnowledgeQueryResponse
├── KnowledgeCopyRequest
├── KnowledgeCopyResponse
├── ToolAndKnowledgeCreateRequest
├── ToolAndKnowledgeCreateResponse
├── ToolUpdateRequest
├── ToolUpdateResponse
├── ToolDeleteRequest
├── ToolDeleteResponse
├── ToolQueryResponse
├── QuestionRequest
├── KnowledgeToolResponse
├── ToolFetchRequest
├── ToolFetchResponse
├── ToolResponseRequest
└── ToolResponseResponse
```

---

## 验证规则总结

| 字段类型 | 最大长度 | 必填 | 特殊规则 |
|---------|---------|-----|---------|
| userId | 50字符 | 是 | - |
| question | 100字符 | 是 | - |
| description | 5000字符 | 是 | - |
| answer | 5000字符 | 是 | - |
| modelName | 200字符 | 否 | - |
| params | 5000字符 | 否 | - |
| tool_url | 1000字符 | 是 | 必须是有效URL |
| tool_title | 100字符 | 是 | - |
| top_k | - | 否 | 正整数，默认3 |
| similarity_threshold | - | 否 | 0-1之间的浮点数，默认0.7 |

---

## 注意事项

1. **类型安全**: 所有模型都提供了严格的类型验证
2. **可选字段**: 使用 `Optional[type] = None` 定义可选字段
3. **默认值**: 某些字段提供了合理的默认值
4. **字符串长度**: 大部分字符串字段都有长度限制
5. **数据序列化**: 模型支持 JSON 序列化和反序列化
6. **继承关系**: 所有模型都继承自 Pydantic 的 BaseModel
7. **导入依赖**: 核心数据模型从其他模块导入，避免循环依赖