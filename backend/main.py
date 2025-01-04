from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
import datetime
import os
from dotenv import load_dotenv
from google.cloud import bigquery, translate_v2 as translate
from vertexai.language_models import TextEmbeddingModel
import anthropic
from ai_module import (
    load_query_embedding_async,
    retrieve_similar_documents_async,
    translate_text_async,
    generate_response,
    is_sex_related,
    generate_direct_response
)
import logging
import asyncio
from typing import Tuple

app = FastAPI()
logger = logging.getLogger('uvicorn.error')


# 設定 CORS 允許的來源
origins = [
    "http://127.0.0.1:5500",  # 前端開發伺服器
    "https://eros-frontend.onrender.com",  # 前端生產環境
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Firebase Admin SDK
cred = credentials.Certificate("credential.json")
firebase_admin.initialize_app(cred)

# 初始化 Firestore 客戶端
db = firestore.client()
users_collection = db.collection('users')
articles_collection = db.collection('articles')

# 載入環境變數
try:
    load_dotenv()
except Exception as e:
    print(f"無法載入環境變數: {e}")
    
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

# 初始化 Anthropic client
claude_client = anthropic.Anthropic(
    api_key=ANTHROPIC_API_KEY,
)
MODEL = "claude-3-5-sonnet-20241022"

# 定義驗證依賴項
security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        logger.info(f"驗證成功，使用者 UID: {decoded_token['uid']}")
        return decoded_token
    except firebase_admin._auth_utils.InvalidIdTokenError as e:
        logger.error(f"無效的驗證令牌: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的驗證令牌，可能是裝置時間不正確",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_admin._auth_utils.ExpiredIdTokenError as e:
        logger.error(f"驗證令牌已過期: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="驗證令牌已過期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"無法驗證驗證令牌: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無法驗證驗證令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(request: LoginRequest):
    username = request.username
    password = request.password

    # 從 Firestore 中查詢使用者
    user_doc = users_collection.document(username).get()
    
    if user_doc.exists:
        user_data = user_doc.to_dict()
        stored_password_hash = user_data.get('password').encode('utf-8')
        
        # 驗證密碼
        if bcrypt.checkpw(password.encode('utf-8'), stored_password_hash):
            try:
                # 生成自訂的 Firebase 令牌
                custom_token = auth.create_custom_token(username)
                return {"token": custom_token.decode('utf-8')}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"生成令牌時出錯: {str(e)}")
        else:
            raise HTTPException(status_code=401, detail="無效的密碼")
    else:
        raise HTTPException(status_code=401, detail="無效的使用者名稱")

class SignupRequest(BaseModel):
    username: str
    password: str

@app.post("/api/signup")
def signup(request: SignupRequest):
    username = request.username
    password = request.password

    # 檢查使用者是否已存在
    user_doc = users_collection.document(username).get()
    if user_doc.exists:
        raise HTTPException(status_code=400, detail="使用者名稱已存在")

    # 生成密碼哈希
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # 在 Firestore 中創建新使用者
    users_collection.document(username).set({
        'username': username,
        'password': hashed_password.decode('utf-8')  # 儲存為字串
    })

    try:
        # 生成自訂的 Firebase 令牌
        custom_token = auth.create_custom_token(username)
        return {"token": custom_token.decode('utf-8')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成令牌時出錯:{e}")

@app.get("/api/articles")
def get_articles():
    try:
        articles = []
        docs = articles_collection.stream()
        for doc in docs:
            article = doc.to_dict()
            article['id'] = doc.id
            # 將 Firestore 的 Timestamp 轉換為字符串格式
            if isinstance(article.get('published_at'), datetime.datetime):
                article['published_at'] = article['published_at'].isoformat()
            articles.append(article)
        return {"articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取文章時出錯:{e}")

@app.get("/api/hello")
def read_root():
    return {"message": "Hello, Eros"}

class ChatRequest(BaseModel):
    query: str
    context: list  # 新增 context 欄位

@app.post("/api/chat")
async def chat(request: ChatRequest, user: dict = Depends(verify_token)):
    user_query = request.query
    user_context = request.context  # 獲取上下文資料
    
    
    # 1. 判斷問題是否與性相關
    sex_related = is_sex_related(user_query, claude_client, MODEL)
    # sex_related = True
    
    if sex_related:
        logger.info("問題與性相關，執行向量檢索。")
        
        

        # 同時執行翻譯與加載查詢嵌入
        translated_query_task = asyncio.create_task(translate_text_async(user_query))
        query_embedding_cn_task = asyncio.create_task(load_query_embedding_async(user_query))

        # 等待翻譯完成，以獲取英文查詢
        translated_query = await translated_query_task

        # 使用翻譯後的英文查詢啟動英文嵌入的非同步任務
        query_embedding_en_task = asyncio.create_task(load_query_embedding_async(translated_query))

        # 同時等待中文和英文的嵌入完成
        query_embedding_cn, query_embedding_en = await asyncio.gather(
            query_embedding_cn_task,
            query_embedding_en_task
        )

        logger.info(f"翻譯後的英文查詢：{translated_query}")
        logger.info("="*50)

        # 定義檢索參數
        dataset_id = "Eros_AI_RAG"
        table_id = "combined_embeddings"
        project_id = "eros-ai-446307"

        # 同時發起中文與英文的檢索請求（非同步）
        similar_docs_cn_task = retrieve_similar_documents_async(
            query_embedding_cn, dataset_id, table_id, project_id, top_n=2
        )
        similar_docs_en_task = retrieve_similar_documents_async(
            query_embedding_en, dataset_id, table_id, project_id, top_n=3
        )

        similar_docs_cn, similar_docs_en = await asyncio.gather(
            similar_docs_cn_task, similar_docs_en_task
        )
        
        logger.info(f"已找到相似文獻")
        # logger.info(f"中文相似文獻：{similar_docs_cn}")
        # logger.info(f"英文相似文獻：{similar_docs_en}") 
        logger.info("="*50)

        # 生成回答，整合中英文文獻與額外上下文
        answer = generate_response(
            similar_docs_cn,
            similar_docs_en,
            user_query,            # 使用合併後的查詢
            user_context,        # 傳遞額外的上下文資訊
            claude_client,
            MODEL
        )

        logger.info(f"生成的回答：{answer}")
        logger.info("="*50)
    else:
        logger.info("問題非性相關，直接生成回答。")
        answer = generate_direct_response(user_query, user_context, claude_client, MODEL)

    return {"response": answer}

# 新增聊天記錄模型
class ChatMessage(BaseModel):
    message: str
    is_bot: bool
    timestamp: datetime.datetime

@app.post("/api/chat/history")
def save_chat_history(message: ChatMessage, user: dict = Depends(verify_token)):
    try:
        logger.info(f"保存聊天記錄，使用者 UID: {user['uid']}")

        # 確保 timestamp 是 datetime 對象
        if isinstance(message.timestamp, str):
            message.timestamp = datetime.datetime.fromisoformat(message.timestamp)
        
        # 將訊息轉換為資料字典
        message_data = {
            'message': message.message,
            'is_bot': message.is_bot,
            'timestamp': message.timestamp
        }

        # 儲存到 Firestore，使用 merge=True 以合併資料
        chat_history_ref = db.collection('chat_histories').document(user['uid'])
        chat_history_ref.set({
            'messages': firestore.ArrayUnion([message_data])
        }, merge=True)
        
        logger.info(f"成功保存訊息！")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"儲存聊天記錄時出錯：{str(e)}")
        raise HTTPException(status_code=500, detail=f"儲存聊天記錄時出錯：{str(e)}")

@app.get("/api/chat/history")
def get_chat_history(user: dict = Depends(verify_token)):
    try:
        chat_history_ref = db.collection('chat_histories').document(user['uid'])
        doc = chat_history_ref.get()
        
        if not doc.exists:
            return {"messages": []}
            
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取聊天記錄時出錯：{str(e)}")
