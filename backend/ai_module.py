import os
import json
from dotenv import load_dotenv
from google.cloud import bigquery
from vertexai.language_models import TextEmbeddingModel
import vertexai
from google.cloud import translate_v2 as translate
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from openai import OpenAI  # 新用法

# 初始化 Vertex AI
vertexai.init(project="eros-ai-446307", location="us-central1")

# 初始化翻譯客戶端
translate_client = translate.Client()

# 初始化 ThreadPoolExecutor
executor = ThreadPoolExecutor(max_workers=10)  # 根據需求調整 max_workers

# 初始化 Logger
logger = logging.getLogger('uvicorn.error')

# 建立 OpenAI 客戶端，使用 OpenRouter API
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv("OPENROUTER_API_KEY"),
)

# 定義額外請求標頭（可依需求設定）
EXTRA_HEADERS = {
    "HTTP-Referer": os.getenv("SITE_URL", "https://ausexticity.com"),  # 選填：您的網站 URL
    "X-Title": os.getenv("SITE_NAME", "Ausexticity")  # 選填：您的網站名稱
}

def load_query_embedding_sync(query, model_name="text-multilingual-embedding-002"):
    """
    使用 Vertex AI 嵌入模型將查詢轉換為向量（同步版本）。

    Args:
        query (str): 用戶的查詢。
        model_name (str): 嵌入模型名稱。

    Returns:
        list: 查詢的嵌入向量。
    """
    model = TextEmbeddingModel.from_pretrained(model_name)
    embeddings = model.get_embeddings([query])
    return embeddings[0].values

async def load_query_embedding_async(query, model_name="text-multilingual-embedding-002"):
    """
    使用 Vertex AI 嵌入模型將查詢轉換為向量（非同步版本）。

    Args:
        query (str): 用戶的查詢。
        model_name (str): 嵌入模型名稱。

    Returns:
        list: 查詢的嵌入向量。
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        load_query_embedding_sync,
        query,
        model_name
    )

def retrieve_similar_documents_sync(query_embedding, dataset_id, table_id, project_id, top_n=10):
    """
    同步使用 BigQuery 查找與查詢向量相似的文檔。

    Args:
        query_embedding (list): 查詢的嵌入向量。
        dataset_id (str): BigQuery 資料集 ID。
        table_id (str): BigQuery 資料表 ID。
        project_id (str): GCP 專案 ID。
        top_n (int): 返回的相似文檔數量。

    Returns:
        list: 相似文檔的列表。
    """
    client_bq = bigquery.Client(project=project_id)
    embedding_str = ", ".join(map(str, query_embedding))
    query = f"""
    WITH query AS (
      SELECT
        [{embedding_str}] AS embedding
    )
    SELECT
      t.id,
      t.title,
      t.url,
      t.content,
      t.embedding,
      (
        (SELECT SUM(q * d) 
         FROM UNNEST(qry.embedding) AS q WITH OFFSET i 
         JOIN UNNEST(t.embedding) AS d WITH OFFSET j 
         ON i = j)
        /
        (SQRT((SELECT SUM(POWER(q, 2)) FROM UNNEST(qry.embedding) AS q)) * 
         SQRT((SELECT SUM(POWER(d, 2)) FROM UNNEST(t.embedding) AS d)))
      ) AS cosine_similarity
    FROM
      `{project_id}.{dataset_id}.{table_id}` AS t,
      query AS qry
    ORDER BY
      cosine_similarity DESC
    LIMIT {top_n}
    """
    query_job = client_bq.query(query)
    results = query_job.result()
    documents = []
    for row in results:
        documents.append({
            "id": row.id,
            "title": row.title,
            "url": row.url,
            "content": row.content,
            "cosine_similarity": row.cosine_similarity
        })
    client_bq.close()
    return documents

async def retrieve_similar_documents_async(query_embedding, dataset_id, table_id, project_id, top_n=10):
    """
    非同步使用 ThreadPoolExecutor 執行同步 BigQuery 查詢，查找與查詢向量相似的文檔。

    Args:
        query_embedding (list): 查詢的嵌入向量。
        dataset_id (str): BigQuery 資料集 ID。
        table_id (str): BigQuery 資料表 ID。
        project_id (str): GCP 專案 ID。
        top_n (int): 返回的相似文檔數量。

    Returns:
        list: 相似文檔的列表。
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        retrieve_similar_documents_sync,
        query_embedding,
        dataset_id,
        table_id,
        project_id,
        top_n
    )

def translate_text_sync(text):
    """
    同步使用 Google Translate API 將文本翻譯為英文。

    Args:
        text (str): 原始文本（中文）。

    Returns:
        str: 翻譯後的英文文本。
    """
    try:
        result = translate_client.translate(text, target_language='en')
        return result['translatedText']
    except Exception as e:
        logger.error(f"翻譯失敗：{str(e)}")
        return ""

async def translate_text_async(text):
    """
    非同步使用 ThreadPoolExecutor 執行同步翻譯函式。

    Args:
        text (str): 原始文本（中文）。

    Returns:
        str: 翻譯後的英文文本。
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        translate_text_sync,
        text
    )

def generate_response(documents_cn, documents_en, user_query, additional_context, model, web_search: bool = False):
    """
    使用檢索到的中英文文檔與用戶查詢生成回答，採用串流式方式接收內容。

    Args:
        documents_cn (list): 中文檢索到的文檔列表。
        documents_en (list): 英文檢索到的文檔列表。
        user_query (str): 用戶的查詢。
        additional_context (list): 額外的上下文資訊。
        model (str): 使用的模型。
        web_search (bool): 是否啟用網路搜尋功能，預設為 False。

    Returns:
        str: 生成的回答（完整的文字內容）。
    """
    try:
        additional_context = [
            {'role': 'assistant' if msg['is_bot'] else 'user', 'content': msg['message']}
            for msg in additional_context
        ]
        combined_context = "\n\n".join([doc["content"] for doc in documents_cn + documents_en])
        prompt = f"""相關文章：
{combined_context}

使用生動有趣的方式介紹性知識，並且適時的使用表情符號增添趣味性🍑💦 因聊天介面已包含重要提醒: 1.需要注意衛生和安全 2.應該尊重雙方意願 3.保持開放溝通很重要，不需要在訊息中再次提醒

用戶問題：
{user_query}
"""
        params = {
            "extra_headers": EXTRA_HEADERS,
            "model": model,
            "max_tokens": 8192,
            "temperature": 0.8,
            "messages": additional_context + [
                {"role": "user", "content": prompt}
            ],
            "stream": True  # 啟用串流模式
        }
        if web_search:
            params["plugins"] = [{"id": "web"}]
        response = client.chat.completions.create(**params)
        full_response = ""
        for chunk in response:
            delta = chunk.choices[0].delta
            full_response += delta.get("content", "")
        return full_response
    except Exception as e:
        logger.error(f"生成回答時發生錯誤：{str(e)}")
        return ""

def is_sex_related(query: str, model) -> bool:
    """
    判斷問題是否與性相關，使用串流模式以取得回應後判斷。

    Args:
        query (str): 用戶的查詢。
        model (str): 使用的模型。

    Returns:
        bool: 如果問題與性相關，返回 True，否則返回 False。
    """
    prompt = f"問題：{query}\n回覆："
    try:
        response = client.chat.completions.create(
            extra_headers=EXTRA_HEADERS,
            model=model,
            max_tokens=3,
            temperature=0.4,
            messages=[
                {"role": "system", "content": "請判斷以下問題是否與性或性知識或身體有任何關聯。請僅回覆「是」或「否」。"},
                {"role": "user", "content": prompt}
            ],
            stream=True  # 串流模式
        )
        answer = ""
        for chunk in response:
            delta = chunk.choices[0].delta
            answer += delta.get("content", "")
        return answer.strip() == "是"
    except Exception as e:
        logger.error(f"判斷性相關性時出錯：{e}")
        return False 

def generate_direct_response(user_query: str, additional_context: list, model: str, web_search: bool = False) -> str:
    """
    生成直接回答，無需檢索相關文檔，採用串流模式接收回答。

    Args:
        user_query (str): 使用者的查詢。
        additional_context (list): 額外上下文。
        model (str): 使用的模型。
        web_search (bool): 是否啟用網路搜尋功能，預設為 False。

    Returns:
        str: 生成的回答。
    """
    additional_context = [
        {'role': 'assistant' if msg['is_bot'] else 'user', 'content': msg['message']}
        for msg in additional_context
    ]
    prompt = f"使用者問題：{user_query}\n請提供相應的回答。"
    try:
        params = {
            "extra_headers": EXTRA_HEADERS,
            "model": model,
            "max_tokens": 8192,
            "temperature": 0.6,
            "messages": [{"role": "system", "content": "你是一個飽學性知識的專家，負責與用戶真誠的聊天! 過程要保持熱情、友善且具有同理心💛"}] + additional_context + [
                {"role": "user", "content": prompt}
            ],
            "stream": True  # 啟用串流模式
        }
        if web_search:
            params["plugins"] = [{"id": "web"}]
        response = client.chat.completions.create(**params)
        full_response = ""
        for chunk in response:
            delta = chunk.choices[0].delta
            full_response += delta.get("content", "")
        return full_response
    except Exception as e:
        logger.error(f"生成回答時出錯：{e}")
        return "" 