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
    load_query_embedding,
    retrieve_similar_documents,
    translate_text,
    generate_response
)

app = FastAPI()

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
        return decoded_token
    except firebase_admin._auth_utils.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的驗證令牌",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_admin._auth_utils.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="驗證令牌已過期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
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

@app.post("/api/chat")
def chat(request: ChatRequest, user: dict = Depends(verify_token)):
    user_query = request.query

    # 使用 ai_module 的功能
    translated_query = translate_text(user_query)
    print("\n翻譯後的英文查詢：")
    print(translated_query)
    print("\n" + "="*50 + "\n")

    # 加載中文查詢嵌入
    query_embedding_cn = load_query_embedding(user_query)

    # 加載英文查詢嵌入
    query_embedding_en = load_query_embedding(translated_query)

    # 檢索相似中文文檔
    dataset_id = "Eros_AI_RAG"
    table_id = "combined_embeddings"
    project_id = "eros-ai-446307"
    similar_docs_cn = retrieve_similar_documents(
        query_embedding_cn, dataset_id, table_id, project_id, top_n=2
    )

    # 檢索相似英文文檔
    similar_docs_en = retrieve_similar_documents(
        query_embedding_en, dataset_id, table_id, project_id, top_n=3
    )

    print(similar_docs_cn)
    print(similar_docs_en)

    # 生成回答，整合中英文文獻
    answer = generate_response(
        similar_docs_cn,
        similar_docs_en,
        user_query,
        claude_client,
        MODEL
    )

    print("生成的回答：")
    print(answer) 
    print("\n" + "="*50 + "\n")

    return {"response": answer}
