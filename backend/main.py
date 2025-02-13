from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth, firestore, storage
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
import datetime
import os
from dotenv import load_dotenv
from google.cloud import bigquery, translate_v2 as translate
from ai_module import (
    load_query_embedding_async,
    retrieve_similar_documents_async,
    translate_text_async,
    is_sex_related,
    generate_response_stream,
    generate_direct_response_stream
)
import logging
import asyncio
from typing import Tuple, Optional, Union
from google.api_core.exceptions import NotFound  # 若有需要，可引入對應的例外
import urllib.parse
from urllib.parse import urlparse
from sse_starlette.sse import EventSourceResponse   # 引入 SSE 回應類別
import json

app = FastAPI()
logger = logging.getLogger('uvicorn.error')


# 設定 CORS 允許的來源
origins = [
    "http://127.0.0.1:5500",  # 前端開發伺服器
    "http://127.0.0.1:5173",  # 前端開發伺服器
    "http://localhost:5173",   # 新增：本地開發伺服器
    "http://localhost:5500",   # 新增：本地開發伺服器
    "https://ausexticity-frontend.onrender.com",  # 前端生產環境
    "https://www.ausexticity.com",
    "https://ausexticity.com",
    "https://ausexticity-web-api.onrender.com"  # API 服務器
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
firebase_admin.initialize_app(cred, {
    'storageBucket': 'eros-web-94e22.firebasestorage.app'  # 移除了 'gs://'
})

# 初始化 Firestore 客戶端
db = firestore.client()
users_collection = db.collection('users')
articles_collection = db.collection('articles')

bucket = storage.bucket()

# 載入環境變數
try:
    load_dotenv()
except Exception as e:
    print(f"無法載入環境變數: {e}")
    
MODEL = "openai/chatgpt-4o-latest"  # 這裡可以根據需求切換模型

# 定義驗證依賴項
security = HTTPBearer()

# 函式區

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        logger.info(f"驗證成功，使用者 UID: {decoded_token['uid']}")
        return decoded_token
    except auth.InvalidIdTokenError as e:
        logger.error(f"無效的驗證令牌: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的驗證令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError as e:
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
def get_articles(user_id: Optional[str] = None):
    try:
        if user_id:
            query = articles_collection.where('user_id', '==', user_id)
        else:
            query = articles_collection.stream()
        articles = []
        for doc in query:
            article = doc.to_dict()
            article['id'] = doc.id
            articles.append(article)
        return {"articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"獲取文章時出錯: {e}")


class ChatRequest(BaseModel):
    query: str
    context: list  # 新增 context 欄位
    model: str = MODEL  # 讓請求帶入要使用的模型
    web_search: bool = False  # 是否啟用網路搜尋功能
    rag: bool = False       # 是否啟用 RAG 資料庫查詢

@app.get("/api/chat")
async def chat(
    request: Request,
    query: str,  # 從 query parameters 獲取查詢字串
    user_id: str,  # 改為接收使用者 ID
    model: str = MODEL,
    web_search: bool = False,
    rag: bool = False,
    token: str = None,  # 從 query parameters 獲取 token
):
    """
    修改後的聊天端點，使用 SSE 流式回傳生成的回應內容。
    當啟用 RAG 時，後端會依序回傳當前處理狀態，包括：
    「判斷語句...」、「翻譯查詢...」、「查詢資料庫...」等進度訊息。
    """
    # 驗證 token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供驗證令牌",
        )
    
    try:
        decoded_token = auth.verify_id_token(token)
        logger.info(f"驗證成功，使用者 UID: {decoded_token['uid']}")
    except Exception as e:
        logger.error(f"驗證令牌失敗: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的驗證令牌",
        )
    
    # 檢查 token 中的 uid 是否與傳入的 user_id 相符
    if decoded_token["uid"] != user_id:
        logger.error(f"Token uid 與 user_id 不符: {decoded_token['uid']} != {user_id}")
        raise HTTPException(status_code=403, detail="Token uid 與 user_id 不符")
    
    # 根據 user_id 從 Firestore 取得該使用者最新的 5 筆聊天記錄作為上下文
    try:
        chat_history_doc = db.collection('chat_histories').document(user_id).get()
        if chat_history_doc.exists:
            data = chat_history_doc.to_dict()
            messages = data.get("messages", [])
            messages_sorted = sorted(messages, key=lambda m: m["timestamp"]) if messages else []
            user_context = messages_sorted[-5:]
        else:
            user_context = []
    except Exception as e:
        logger.error(f"取得聊天記錄失敗: {e}")
        user_context = []
    
    # 根據參數選擇不同的 SSE 回傳邏輯
    if web_search:
        logger.info("啟用網路搜尋功能，不受 RAG 參數影響。")
        async def web_search_event_generator():
            yield "data: 正在進行網路搜尋\n\n"
            async for event in generate_direct_response_stream(query, user_context, model, web_search=True):
                yield event
        stream_generator = web_search_event_generator()
    elif rag:
        async def rag_event_generator():
            # 回傳判斷語句狀態
            yield "data: 正在判斷語句\n\n"
            sex_related = is_sex_related(query, model)
            if sex_related:
                yield "data: 正在翻譯查詢\n\n"
                # 執行查詢翻譯
                translated_query = await translate_text_async(query)
                yield f"data: 查詢翻譯完成：{translated_query}\n\n"
                yield "data: 正在生成查詢嵌入\n\n"
                # 同時產生中文與英文查詢嵌入（非同步）
                query_embedding_cn_task = asyncio.create_task(load_query_embedding_async(query))
                query_embedding_en_task = asyncio.create_task(load_query_embedding_async(translated_query))
                query_embedding_cn, query_embedding_en = await asyncio.gather(query_embedding_cn_task, query_embedding_en_task)
                
                # 設定 RAG 檢索參數
                dataset_id = "Eros_AI_RAG"
                table_id = "combined_embeddings"
                project_id = "eros-ai-446307"
                
                yield "data: 正在查詢資料庫\n\n"
                similar_docs_cn_task = retrieve_similar_documents_async(
                    query_embedding_cn, dataset_id, table_id, project_id, top_n=2
                )
                similar_docs_en_task = retrieve_similar_documents_async(
                    query_embedding_en, dataset_id, table_id, project_id, top_n=3
                )
                similar_docs_cn, similar_docs_en = await asyncio.gather(similar_docs_cn_task, similar_docs_en_task)
                yield "data: 資料庫查詢完成，開始生成回答\n\n"
                # 將資料庫結果交由 generate_response_stream 產生最終回答
                async for event in generate_response_stream(
                    similar_docs_cn,
                    similar_docs_en,
                    query,
                    user_context,
                    model,
                    web_search=False
                ):
                    yield event
            else:
                yield "data: 問題非性相關，直接生成回答\n\n"
                async for event in generate_direct_response_stream(query, user_context, model):
                    yield event
                    
        stream_generator = rag_event_generator()
    else:
        logger.info("未啟用 RAG，直接生成回答。")
        stream_generator = generate_direct_response_stream(query, user_context, model)

    async def event_generator():
        async for event in stream_generator:
            if await request.is_disconnected():
                break
            yield event

    return EventSourceResponse(
        event_generator(),
        headers={
            'Access-Control-Allow-Origin': request.headers.get('origin', '*'),
            'Access-Control-Allow-Credentials': 'true',
            'Cache-Control': 'no-cache',
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive'
        }
    )

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

# 定義文章資料模型
class Article(BaseModel):
    title: str
    content: str
    tags: list[str]  # 將 category 改為 tags，並使用列表來儲存多個標籤
    image_url: str = None
    user_id: str = None
    category: str = None
    published_at: datetime.datetime = None
    

# 發布新文章的端點
@app.post("/api/articles", dependencies=[Depends(verify_token)], status_code=201)
def create_article(article: Article):
    try:
        article_dict = article.dict()
        article_dict['published_at'] = datetime.datetime.utcnow()
        doc_ref = articles_collection.add(article_dict)
        article_id = doc_ref[1].id
        return {"id": article_id, "message": "文章發布成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"發布文章時出錯: {e}")

# 編輯現有文章的端點
@app.put("/api/articles/{article_id}", dependencies=[Depends(verify_token)])
def update_article(article_id: str, article: Article):
    try:
        doc_ref = articles_collection.document(article_id)
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="找不到該文章")
        article_dict = article.dict(exclude_unset=True)
        article_dict['published_at'] = datetime.datetime.utcnow()
        doc_ref.update(article_dict)
        return {"message": "文章更新成功"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新文章時出錯: {e}")

@app.post("/api/upload_image")
async def upload_image(image: UploadFile = File(...), user: dict = Depends(verify_token)):
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="請上傳有效的圖片檔案。")
    
    try:
        # 生成唯一的檔案名稱
        file_extension = os.path.splitext(image.filename)[1]
        blob = bucket.blob(f"images/{user['uid']}/{datetime.datetime.utcnow().isoformat()}_{image.filename}")

        # 上傳圖片到 Firebase Storage
        blob.upload_from_file(image.file, content_type=image.content_type)
        # 設定公開讀取權限
        blob.make_public()

        return {"image_url": blob.public_url}
    except Exception as e:
        logger.error(f"上傳圖片時出錯: {str(e)}")
        raise HTTPException(status_code=500, detail="上傳圖片時發生錯誤。")

# 刪除文章 API
@app.delete("/api/articles/{article_id}")
def delete_article(article_id: str, user: dict = Depends(verify_token)):
    try:
        doc_ref = articles_collection.document(article_id)
        # 檢查文章是否存在
        doc_snapshot = doc_ref.get()
        if not doc_snapshot.exists:
            raise HTTPException(status_code=404, detail="找不到該文章")
        
        # 可選：若要確保使用者只能刪除自己的文章，可檢查文章的 user_id
        doc_data = doc_snapshot.to_dict()
        if "user_id" in doc_data and doc_data["user_id"] is not None:
            if doc_data["user_id"] != user.get("uid"):
                raise HTTPException(status_code=403, detail="您無權刪除此文章")
            
        # 刪除文章前先刪除圖片
        
        if "image_url" in doc_data and doc_data["image_url"] is not None:
            # 將圖片網址字串封裝成 DeleteImageRequest 物件，才能正確呼叫 delete_image API
            delete_image(DeleteImageRequest(image_url=doc_data["image_url"]), user)

        # 刪除文章
        
        doc_ref.delete()
        logger.info(f"使用者 {user['uid']} 刪除了文章 {article_id}")
        return {"message": "文章刪除成功"}

    except Exception as e:
        logger.error(f"刪除文章時出錯: {str(e)}")
        raise HTTPException(status_code=500, detail=f"刪除文章時出錯: {str(e)}")


# 刪除圖片 API

class DeleteImageRequest(BaseModel):
    image_url: str

@app.delete("/api/delete_image")
def delete_image(request: DeleteImageRequest, user: dict = Depends(verify_token)):
    image_url = request.image_url
    # 檢查圖片 URL 中是否包含該使用者的 UID，確保使用者只能刪除自己的圖片
    if user["uid"] not in image_url:
        logger.warning(f"使用者 {user['uid']} 嘗試刪除非本人圖片: {image_url}")
        raise HTTPException(status_code=403, detail="您無權刪除此圖片")
    
    # 根據上傳圖片時的邏輯，圖片的公開 URL 形態通常為：
    # https://storage.googleapis.com/{bucket.name}/<blob_path>
    bucket_url_prefix = f"https://storage.googleapis.com/{bucket.name}/"
    if not image_url.startswith(bucket_url_prefix):
        logger.error(f"圖片 URL 格式錯誤: {image_url}")
        raise HTTPException(status_code=400, detail="圖片 URL 格式錯誤")
    
    # 取得 blob 的相對路徑
    blob_name = image_url.replace(bucket_url_prefix, "")
    # percent decode
    blob_name = urllib.parse.unquote(blob_name) 
    # 刪除 blob
    try:
        blob = bucket.blob(blob_name)
        blob.delete()

        logger.info(f"使用者 {user['uid']} 成功刪除了圖片: {image_url}")
        return {"message": "圖片刪除成功"}
    except Exception as e:
        # 如果錯誤訊息中包含「No such object」，視為檔案不存在，進而忽略該錯誤
        if "No such object" in str(e):
            logger.warning(f"圖片不存在，無需刪除: {image_url}")
            return {"message": "圖片不存在，視為已刪除"}
        else:
            logger.error(f"刪除圖片時出錯: {str(e)}")
            raise HTTPException(status_code=500, detail=f"刪除圖片時出錯: {str(e)}")

# 新增使用者角色 API
class RoleRequest(BaseModel):
    role: str

@app.get("/api/user/role")
def get_user_role(user: dict = Depends(verify_token)):
    """
    取得當前使用者的角色
    """
    try:
        # 從 Firestore 取得使用者資料，文件 id 預設為 token 中的 uid
        user_doc = users_collection.document(user['uid']).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            return {"role": user_data.get("role", "")}
        else:
            raise HTTPException(status_code=404, detail="找不到使用者資料")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"取得使用者角色時出錯：{str(e)}")

@app.post("/api/user/role")
def set_user_role(request: RoleRequest, user: dict = Depends(verify_token)):
    """
    更新當前使用者的角色
    """
    try:
        # 更新使用者文件內的 role 欄位
        users_collection.document(user['uid']).update({"role": request.role})
        return {"message": "使用者角色更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新使用者角色時出錯：{str(e)}")


# 新增刪除聊天紀錄 API
@app.delete("/api/chat/history")
def delete_chat_history(user: dict = Depends(verify_token)):
    """
    刪除當前使用者的聊天紀錄
    """
    try:
        chat_history_ref = db.collection('chat_histories').document(user['uid'])
        chat_history_ref.delete()
        return {"message": "聊天紀錄刪除成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"刪除聊天紀錄時出錯：{str(e)}")


# 新增使用者頭像相關 API
class AvatarRequest(BaseModel):
    avatar: str  # 使用上傳圖片 /api/upload_image 回傳的圖片 URL

@app.get("/api/user/avatar")
def get_user_avatar(user: dict = Depends(verify_token)):
    """
    取得當前使用者的頭像 URL
    """
    try:
        user_doc = users_collection.document(user['uid']).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            return {"avatar": user_data.get("avatar", None)}
        else:
            raise HTTPException(status_code=404, detail="找不到使用者資料")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"取得頭像時出錯：{str(e)}")

@app.post("/api/user/avatar")
def set_user_avatar(request: AvatarRequest, user: dict = Depends(verify_token)):
    """
    更新當前使用者的頭像 URL
    注意：上傳圖片請使用已實作的 /api/upload_image，獲取圖片公開 URL 後，再透過此 API 更新頭像。
    """
    try:
        users_collection.document(user['uid']).update({"avatar": request.avatar})
        return {"message": "使用者頭像更新成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新頭像時出錯：{str(e)}")

@app.post("/api/user/create")
def create_user(user: dict = Depends(verify_token)):
    """
    創造用戶文件 API
    使用者經過驗證後，會以 user["uid"] 為文件 ID，
    並新增 avatar 與 role 預設欄位。
    """
    try:
        user_uid = user["uid"]
        user_doc_ref = users_collection.document(user_uid)
        
        # 若該使用者已存在則回傳錯誤訊息
        if user_doc_ref.get().exists:
            raise HTTPException(status_code=400, detail="用戶已存在")
        
        # 建立用戶文件，填入預設頭像與角色
        user_data = {
            "avatar": "/images/default-avatar.png",
            "role": "user"
        }
        user_doc_ref.set(user_data)
        logger.info(f"用戶 {user_uid} 創建成功。")
        return {"message": "用戶建立成功", "uid": user_uid}
    except Exception as e:
        logger.error(f"建立用戶時出錯: {e}")
        raise HTTPException(status_code=500, detail=f"建立用戶時出錯: {str(e)}")
