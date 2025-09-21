#!/usr/bin/env python3

from pydantic import BaseModel
from typing import List, Optional
from sources.schemas import QueryRequest, QueryResponse
from sources.knowledge.knowledge import KnowledgeItem, ToolItem

# Knowledge Models
class KnowledgeCreateRequest(BaseModel):
    userId: str
    question: str
    description: str
    answer: str
    public: bool
    modelName: str
    toolId: int
    params: str

class KnowledgeCreateResponse(BaseModel):
    success: bool
    message: str
    id: Optional[int] = None

class KnowledgeDeleteRequest(BaseModel):
    userId: str
    knowledgeId: int

class KnowledgeDeleteResponse(BaseModel):
    success: bool
    message: str

class KnowledgeUpdateRequest(BaseModel):
    userId: str
    knowledgeId: int
    question: Optional[str] = None
    description: Optional[str] = None
    answer: Optional[str] = None
    public: Optional[bool] = None
    modelName: Optional[str] = None
    toolId: Optional[int] = None
    params: Optional[str] = None

class KnowledgeUpdateResponse(BaseModel):
    success: bool
    message: str

class KnowledgeQueryResponse(BaseModel):
    success: bool
    message: str
    data: List[KnowledgeItem]
    total: int

class KnowledgeCopyRequest(BaseModel):
    userId: str
    knowledgeId: int

class KnowledgeCopyResponse(BaseModel):
    success: bool
    message: str
    id: Optional[int] = None

# Tool Models
class ToolAndKnowledgeCreateRequest(BaseModel):
    # Tool fields
    tool_userId: str
    tool_title: str
    tool_description: str
    tool_url: str
    tool_push: int
    tool_public: bool
    tool_timeout: int
    tool_params: str
    # Knowledge fields
    knowledge_userId: str
    knowledge_question: str
    knowledge_description: str
    knowledge_answer: str
    knowledge_public: bool
    knowledge_embeddingId: int
    knowledge_model_name: str
    knowledge_params: str

class ToolAndKnowledgeCreateResponse(BaseModel):
    success: bool
    message: str
    tool_id: Optional[int] = None
    knowledge_id: Optional[int] = None

class ToolUpdateRequest(BaseModel):
    userId: str
    toolId: int
    title: Optional[str] = None
    description: Optional[str] = None
    public: Optional[str] = None

class ToolUpdateResponse(BaseModel):
    success: bool
    message: str

class ToolDeleteRequest(BaseModel):
    userId: str
    toolId: int

class ToolDeleteResponse(BaseModel):
    success: bool
    message: str

class ToolQueryResponse(BaseModel):
    success: bool
    message: str
    data: List[ToolItem]
    total: int

# Query Models
class QuestionRequest(BaseModel):
    userId: str
    question: str
    top_k: Optional[int] = 3
    similarity_threshold: Optional[float] = 0.7

class KnowledgeToolResponse(BaseModel):
    success: bool
    message: str
    knowledge: Optional[KnowledgeItem] = None
    tool: Optional[ToolItem] = None
    similarity: Optional[float] = None

class ToolFetchRequest(BaseModel):
    query_id: str
    userId: str

class ToolFetchResponse(BaseModel):
    success: bool
    message: str
    tool: Optional[dict] = None

class ToolResponseRequest(BaseModel):
    query_id: str
    userId: str
    tool_response: dict

class ToolResponseResponse(BaseModel):
    success: bool
    message: str