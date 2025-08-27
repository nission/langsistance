import os
import json
import uuid
from openai import OpenAI
import numpy as np
from typing import Dict, List, Optional
from pydantic import BaseModel
from sklearn.metrics.pairwise import cosine_similarity

from sources.logger import Logger
import pymysql

from sources.utility import pretty_print

# 设置 OpenAI API 密钥
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    # base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com")  # 设置基础 URL
)

# 存储用户知识库 {user_id: [{"id": str, "question": str, "answer": str, "embedding": list, "params": dict}]}
user_knowledge_bases: Dict[str, List[Dict]] = {}

# 存储用户知识库的向量索引 {user_id: {"embeddings": list, "items": list}}
user_vector_indices: Dict[str, Dict] = {}

logger = Logger("knowledge.log")

class KnowledgeItem(BaseModel):
    user_id: str
    question: str
    answer: str
    params: Optional[Dict] = None


class UserQuestion(BaseModel):
    user_id: str
    question: str
    top_k: Optional[int] = 3  # 返回最相关的几个结果
    similarity_threshold: Optional[float] = 0.7  # 相似度阈值


class KnowledgeBaseResponse(BaseModel):
    success: bool
    message: str
    item_id: Optional[str] = None


def get_embedding(text: str) -> List[float]:
    """使用 OpenAI 获取文本的嵌入向量"""
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error in get_embedding: {str(e)}")
        raise e


def get_user_knowledge_base(user_id: str):
    """获取用户的个人知识库，如果不存在则创建空的知识库"""
    if user_id not in user_knowledge_bases:
        user_knowledge_bases[user_id] = []
        user_vector_indices[user_id] = {"embeddings": [], "items": []}
    return user_knowledge_bases[user_id]


def update_vector_index(user_id: str):
    """更新用户的向量索引"""
    knowledge_base = user_knowledge_bases.get(user_id, [])
    embeddings = []
    items = []

    for item in knowledge_base:
        embeddings.append(item["embedding"])
        items.append(item)

    user_vector_indices[user_id] = {
        "embeddings": np.array(embeddings) if embeddings else np.array([]),
        "items": items
    }


def search_knowledge_base(user_id: str, query_embedding: List[float], top_k: int = 3, threshold: float = 0.7):
    """在用户知识库中搜索最相关的内容"""
    if user_id not in user_vector_indices or len(user_vector_indices[user_id]["embeddings"]) == 0:
        return []

    # 计算余弦相似度
    similarities = cosine_similarity(
        [query_embedding],
        user_vector_indices[user_id]["embeddings"]
    )[0]

    # 获取最相似的结果
    results = []
    for i, similarity in enumerate(similarities):
        if similarity >= threshold:
            item = user_vector_indices[user_id]["items"][i].copy()
            item["similarity"] = float(similarity)
            results.append(item)

    # 按相似度排序并返回前top_k个结果
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:top_k]


def generate_answer_with_context(question: str, context: List[Dict]) -> str:
    """使用 OpenAI 生成基于上下文的答案"""
    if not context:
        return "抱歉，我在您的知识库中没有找到相关信息。"

    # 构建上下文提示
    context_text = "\n".join([f"问题: {item['question']}\n答案: {item['answer']}" for item in context])

    prompt = f"""
    基于以下上下文信息，请回答用户的问题。如果上下文中的信息不足以回答问题，请如实告知。

    上下文信息:
    {context_text}

    用户问题: {question}

    请基于上述上下文提供准确、简洁的回答:
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一个有帮助的助手，基于提供的上下文信息回答问题。"},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.3
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"生成答案时出错: {str(e)}"


async def add_knowledge_item(item: KnowledgeItem):
    """向用户知识库添加问答对"""
    try:
        # 获取或创建用户知识库
        knowledge_base = get_user_knowledge_base(item.user_id)

        # 生成嵌入向量
        embedding = get_embedding(item.question)

        # 创建知识项
        knowledge_item = {
            "id": str(uuid.uuid4()),
            "question": item.question,
            "answer": item.answer,
            "embedding": embedding,
            "params": item.params or {}
        }

        # 添加到知识库
        knowledge_base.append(knowledge_item)

        # 更新向量索引
        update_vector_index(item.user_id)

        return KnowledgeBaseResponse(
            success=True,
            message="知识项添加成功",
            item_id=knowledge_item["id"]
        )
    except Exception as e:
        return KnowledgeBaseResponse(
            success=False,
            message=f"添加知识项失败: {str(e)}"
        )


async def query_knowledge_base(query: UserQuestion):
    """查询用户知识库并返回答案"""
    try:
        # 获取查询的嵌入向量
        query_embedding = get_embedding(query.question)

        # 搜索知识库
        search_results = search_knowledge_base(
            query.user_id,
            query_embedding,
            query.top_k,
            query.similarity_threshold
        )

        # 生成答案
        if search_results:
            # 使用检索到的内容生成答案
            # answer = generate_answer_with_context(query.question, search_results)

            # return {
            #     "answer": answer,
            #     "sources": search_results,
            #     "user_id": query.user_id
            # }
            return search_results[0]
        else:
            # 如果没有找到相关内容，直接使用 OpenAI 生成答案
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "你是一个有帮助的助手。"},
                        {"role": "user", "content": query.question}
                    ],
                    max_tokens=300
                )
                answer = response.choices[0].message.content

                return {
                    "answer": f"{answer}\n\n(注意: 此回答未基于您的知识库，而是由AI直接生成)",
                    "sources": [],
                    "user_id": query.user_id
                }
            except Exception as e:
                return {
                    "answer": "抱歉，我无法回答这个问题，并且在您的知识库中也没有找到相关信息。",
                    "sources": [],
                    "user_id": query.user_id
                }

    except Exception as e:
        logger.error(f"Error in query_knowledge_base: {str(e)}")
        raise e


async def list_user_knowledge(user_id: str):
    """列出用户知识库中的所有问答对"""
    try:
        knowledge_base = get_user_knowledge_base(user_id)

        # 只返回基本信息，不返回嵌入向量
        items = [{
            "id": item["id"],
            "question": item["question"],
            "answer": item["answer"],
            "params": item["params"]
        } for item in knowledge_base]

        return {
            "user_id": user_id,
            "count": len(items),
            "items": items
        }
    except Exception as e:
        logger.error(f"Error in list_user_knowledge: {str(e)}")
        raise e


async def delete_knowledge_item(user_id: str, item_id: str):
    """从用户知识库中删除指定的问答对"""
    try:
        knowledge_base = get_user_knowledge_base(user_id)

        # 查找并删除项目
        initial_count = len(knowledge_base)
        user_knowledge_bases[user_id] = [item for item in knowledge_base if item["id"] != item_id]

        if len(user_knowledge_bases[user_id]) == initial_count:
            return {"success": False, "message": "未找到指定的知识项"}

        # 更新向量索引
        update_vector_index(user_id)

        return {"success": True, "message": "知识项删除成功"}
    except Exception as e:
        logger.error(f"Error in delete_knowledge_item: {str(e)}")
        raise e

def get_db_connection():
    """创建并返回数据库连接"""
    db_config = {
        'host': os.getenv('MYSQL_HOST', 'langsistance_db'),
        'port' : int(os.getenv('MYSQL_PORT', 3306)),
        'user': os.getenv('MYSQL_USER', 'langsistance_user'),
        'password': os.getenv('MYSQL_PASSWORD', ''),
        'database': os.getenv('MYSQL_DATABASE', 'langsistance_db'),
        'charset': 'utf8mb4'
    }
    return pymysql.connect(**db_config)

def get_user_knowledge(user_id: str) -> List[Dict]:
    """
    根据用户ID从数据库查询有效的知识记录

    Args:
        user_id (str): 用户ID

    Returns:
        List[Dict]: 用户的知识记录列表
    """
    # 这里需要实现数据库连接和查询逻辑
    # 参考api.py中的get_db_connection方法和查询逻辑

    try:
        connection = get_db_connection()

        try:
            with connection.cursor as cursor:
                # 查询用户有效的知识记录 (status=1表示有效)
                # 包括用户自己的知识和公开的知识
                query_sql = """
                            SELECT id, \
                                   user_id, \
                                   question, \
                                   description, \
                                   answer, public, model_name, tool_id, params, create_time, update_time
                            FROM knowledge
                            WHERE status = %s
                               OR userId = %s)
                            ORDER BY updated_at DESC \
                            """

                cursor.execute(query_sql, (1, user_id))
                results = cursor.fetchall()
                return results
        finally:
            connection.close()

    except Exception as e:
        pretty_print(f"Error querying user knowledge: {str(e)}", color="error")
        return []
