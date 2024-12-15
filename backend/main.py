from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 設定 CORS 允許的來源
origins = [
    "http://localhost",
    "http://localhost:8000",
    # 添加您的前端網址，例如:
    "https://your-frontend-domain.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化 Firebase Admin SDK
cred = credentials.Certificate("path/to/your/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

# 初始化 Firestore 客戶端
db = firestore.client()
users_collection = db.collection('users')

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
        if user_data.get('password') == password:
            try:
                # 生成自訂的 Firebase 令牌
                custom_token = auth.create_custom_token(username.encode('utf-8'))
                return {"token": custom_token.decode('utf-8')}
            except Exception as e:
                raise HTTPException(status_code=500, detail="生成令牌時出錯")
        else:
            raise HTTPException(status_code=401, detail="無效的密碼")
    else:
        raise HTTPException(status_code=401, detail="無效的使用者名稱")

@app.post("/api/signup")
def signup(request: LoginRequest):
    username = request.username
    password = request.password

    # 檢查使用者是否已存在
    user_doc = users_collection.document(username).get()
    if user_doc.exists:
        raise HTTPException(status_code=400, detail="使用者名稱已存在")

    # 在 Firestore 中創建新使用者
    users_collection.document(username).set({
        'username': username,
        'password': password  # 注意：在實際應用中，請使用加密方式存儲密碼
    })

    try:
        # 生成自訂的 Firebase 令牌
        custom_token = auth.create_custom_token(username.encode('utf-8'))
        return {"token": custom_token.decode('utf-8')}
    except Exception as e:
        raise HTTPException(status_code=500, detail="生成令牌時出錯")

@app.get("/api/hello")
def read_root():
    return {"message": "Hello, World!"}
