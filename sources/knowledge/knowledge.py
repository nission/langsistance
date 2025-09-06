import os
import json
import uuid
from openai import OpenAI
import numpy as np
from typing import Dict, List, Optional, Tuple
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


class UserQuestion(BaseModel):
    user_id: str
    question: str
    top_k: Optional[int] = 3  # 返回最相关的几个结果
    similarity_threshold: Optional[float] = 0.7  # 相似度阈值


class KnowledgeBaseResponse(BaseModel):
    success: bool
    message: str
    item_id: Optional[str] = None



class KnowledgeItem(BaseModel):
    id: int
    user_id: str
    question: str
    description: Optional[str] = None
    answer: str
    public: Optional[bool]
    model_name: Optional[str]
    tool_id: Optional[int]
    params: Optional[str] = None
    create_time: Optional[str] = None
    update_time: Optional[str] = None


class ToolItem(BaseModel):
    id: int
    user_id: str
    title: str
    description: str
    url: Optional[str]
    status: Optional[bool]
    timeout: Optional[int]
    params: Optional[str] = None


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

def get_user_vector_indices(user_id: str, embeddings_list: List, knowledge_items: List[Dict]):
    user_vector_indices[user_id] = {
        "embeddings": np.array(embeddings_list) if embeddings_list else np.array([]),
        "items": knowledge_items
    }
    return user_vector_indices


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


def search_knowledge_base(user_id: str, query_embedding: List[float], top_k: int = 3, threshold: float = 0.9):
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
                            ORDER BY update_time DESC \
                            """

                cursor.execute(query_sql, (1, user_id))
                results = cursor.fetchall()
                return results
        finally:
            connection.close()

    except Exception as e:
        pretty_print(f"Error querying user knowledge: {str(e)}", color="error")
        return []



def get_knowledge_tool(user_id: str, question: str, top_k: int = 3, similarity_threshold: float = 0.7) -> Tuple[
    Optional[KnowledgeItem], Optional[ToolItem]]:
    """
    根据用户问题查找最相关的知识及其对应的工具

    Args:
        user_id: 用户ID
        question: 用户问题
        top_k: 返回最相关的几个结果
        similarity_threshold: 相似度阈值

    Returns:
        Tuple[KnowledgeToolItem, ToolItem, float]: 知识项、工具项和相似度
    """
    try:
        # 1. 计算问题的embedding
        query_embedding = get_embedding(question)
        logger.info(f"Generated embedding for question: {question}")

        # 2. 从MySQL查询该用户的所有有效知识记录
        knowledge_results = get_user_knowledge(user_id)

        if not knowledge_results:
            logger.info(f"No knowledge records found for user: {user_id}")
            return None, None, None

        logger.info(f"Found {len(knowledge_results)} knowledge records for user: {user_id}")

        # 3. 从Redis查询所有知识记录的embedding
        from sources.utility import get_redis_connection
        redis_conn = get_redis_connection()
        knowledge_embeddings = {}

        for knowledge in knowledge_results:
            knowledge_id = knowledge['id']
            redis_key = f"knowledge_embedding_{knowledge_id}"
            embedding_str = redis_conn.get(redis_key)

            if embedding_str:
                # 将字符串转换回embedding列表
                embedding = eval(embedding_str)  # 注意：在生产环境中应使用更安全的方法如json.loads
                knowledge_embeddings[knowledge_id] = embedding
                logger.info(f"Retrieved embedding for knowledge ID: {knowledge_id}")
            else:
                logger.warning(f"No embedding found in Redis for knowledge ID: {knowledge_id}")

        # 4. 构建用于相似度计算的数据结构
        if not knowledge_embeddings:
            logger.warning("No embeddings found for any knowledge records")
            return None, None, None

        # 构建向量索引数据结构
        embeddings_list = []
        knowledge_items = []

        for knowledge in knowledge_results:
            knowledge_id = knowledge['id']
            if knowledge_id in knowledge_embeddings:
                embeddings_list.append(knowledge_embeddings[knowledge_id])
                knowledge_items.append(knowledge)

        if not embeddings_list:
            logger.warning("No valid embeddings available for similarity calculation")
            return None, None, None

        # 构建临时的向量索引用于搜索
        temp_user_vector_indices = get_user_vector_indices("temp", embeddings_list, knowledge_items)

        # 5. 使用search_knowledge_base方法找出最接近的知识
        search_results = search_knowledge_base(
            "temp",  # 使用临时用户ID
            query_embedding,
            top_k,
            similarity_threshold
        )

        # 清理临时向量索引
        if "temp" in temp_user_vector_indices:
            del temp_user_vector_indices["temp"]

        if not search_results:
            logger.info("No matching knowledge found above similarity threshold")
            return None, None, None

        # 获取最相似的知识记录
        best_knowledge = search_results[0]

        # 6. 根据知识记录中的tool_id查询对应的工具信息
        tool_info = None
        if best_knowledge.get('tool_id'):
            try:
                connection = get_db_connection()
                try:
                    with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                        # 查询工具信息
                        tool_query_sql = """
                                         SELECT id, \
                                                userId, \
                                                title, \
                                                description, \
                                                url, \
                                                status, \
                                                timeout, \
                                                params
                                         FROM tools
                                         WHERE id = %s \
                                           AND status = %s
                                         """
                        cursor.execute(tool_query_sql, (best_knowledge['tool_id'], 1))
                        tool_result = cursor.fetchone()

                        if tool_result:
                            tool_info = ToolItem(
                                id=tool_result['id'],
                                user_id=tool_result['userId'],
                                title=tool_result['title'],
                                description=tool_result['description'],
                                url=tool_result['url'],
                                status=tool_result['status'],
                                timeout=tool_result['timeout'],
                                params=tool_result['params']
                            )
                            logger.info(f"Retrieved tool info for tool ID: {best_knowledge['tool_id']}")
                        else:
                            logger.warning(f"No tool found for tool ID: {best_knowledge['tool_id']}")
                finally:
                    connection.close()
            except Exception as e:
                logger.error(f"Error retrieving tool info: {str(e)}")

        # 构建返回的知识记录对象
        knowledge_item = KnowledgeItem(
            id=best_knowledge['id'],
            user_id=best_knowledge['user_id'],
            question=best_knowledge['question'],
            description=best_knowledge['description'],
            answer=best_knowledge['answer'],
            public=best_knowledge['public'],
            model_name=best_knowledge['model_name'] or "",
            tool_id=best_knowledge['tool_id'] or 0,
            params=best_knowledge['params'] or "",
        )

        return knowledge_item, tool_info

    except Exception as e:
        logger.error(f"Error in find_knowledge_tool: {str(e)}")
        return None, None, None
