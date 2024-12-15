from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
import datetime

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
