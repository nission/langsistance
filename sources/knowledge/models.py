#!/usr/bin/env python3

from typing import List, Optional
from pydantic import BaseModel


class KnowledgeCreateRequest(BaseModel):
    userId: str
    question: str
    description: str
    answer: str
    public: bool
    embeddingId: int
    model_name: str
    tool_id: int
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
    model_name: Optional[str] = None
    tool_id: Optional[int] = None
    params: Optional[str] = None


class KnowledgeUpdateResponse(BaseModel):
    success: bool
    message: str


class KnowledgeItem(BaseModel):
    id: int
    userId: str
    question: str
    description: str
    answer: str
    public: bool
    model_name: str
    tool_id: int
    params: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class KnowledgeQueryResponse(BaseModel):
    success: bool
    message: str
    data: List[KnowledgeItem]
    total: int


# ToolAndKnowledge 相关模型类
class ToolAndKnowledgeCreateRequest(BaseModel):
    # Tool 相关字段
    tool_userId: str
    tool_title: str
    tool_description: str
    tool_url: str
    tool_push: int = 0
    tool_public: bool = False
    tool_timeout: int = 30
    tool_params: str = ""
    
    # Knowledge 相关字段
    knowledge_userId: str
    knowledge_question: str
    knowledge_description: str
    knowledge_answer: str
    knowledge_public: bool = False
    knowledge_embeddingId: int = 0
    knowledge_model_name: str = ""
    knowledge_params: str = ""


class ToolAndKnowledgeCreateResponse(BaseModel):
    success: bool
    message: str
    tool_id: Optional[int] = None
    knowledge_id: Optional[int] = None