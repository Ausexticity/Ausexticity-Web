# Ausexticity

## 專案簡介
Ausexticity 是一個現代化的文章分享與知識交流平台，採用 FastAPI 作為後端框架，純 HTML/CSS/JavaScript 作為前端技術。專案特色是簡潔的設計風格、高效的性能表現，以及良好的使用者體驗。

## 技術棧

### 後端技術
- FastAPI (Python Web 框架)
- Firebase Admin SDK
  - Firestore (資料庫)
  - Storage (圖片儲存)
  - Authentication (身份驗證)
- Google Cloud Platform
  - BigQuery
  - Vertex AI
  - Translation API
- Anthropic Claude API (AI 對話)
- Uvicorn (ASGI 伺服器)
- Python 3.8+

### 前端技術
- HTML5
- CSS3 (純 CSS，無框架)
- JavaScript (原生 JS)
- 響應式設計
- 模組化 CSS 架構

### 資料庫與儲存
- Firestore (NoSQL 資料庫)
- Firebase Storage (圖片儲存)

### 部署環境
- 後端：Render
- 前端：Render / Firebase Hosting
- 域名：ausexticity.com

## 主要功能

### 1. 文章系統
- 文章發布與編輯
- 支援圖片上傳與預覽
- 多標籤分類系統
- 文章搜尋功能

### 2. 用戶系統
- 會員註冊/登入
- JWT 身份驗證
- 個人文章管理

### 3. AI 對話功能
- 基於 Claude 3.5 的智慧對話
- 多語言支援（中英文）
- 上下文理解
- 知識庫檢索

### 4. 特色功能
- 拖放式圖片上傳
- 即時標籤建議
- 熱門標籤顯示
- 響應式設計

## 安裝說明

### 後端設置
1. 安裝 Python 依賴：
```bash
cd backend
pip install -r requirements.txt
```

2. 設置環境變數：
```bash
cp .env.example .env
# 編輯 .env 文件，填入必要的 API 金鑰和設定
```

3. 運行開發伺服器：
```bash
uvicorn main:app --reload
```

### 前端設置
1. 使用任何 HTTP 伺服器啟動前端檔案，例如：
```bash
# 使用 Python 的簡易 HTTP 伺服器
python -m http.server 5500
```

2. 或使用 VS Code 的 Live Server 擴充功能

## 專案結構
```
Ausexticity/
├── backend/
│   ├── main.py              # FastAPI 主程式
│   ├── ai_module.py         # AI 相關功能
│   ├── requirements.txt     # Python 依賴
│   └── credential.json      # Firebase 憑證
├── frontend/
│   ├── css/
│   │   └── main.css        # 主要樣式檔
│   ├── js/
│   │   ├── post.js         # 文章發布相關
│   │   ├── editor.js       # 編輯器功能
│   │   └── misc.js         # 其他功能
│   ├── images/             # 靜態圖片資源
│   └── *.html             # HTML 頁面
└── README.md
```

## API 文檔
主要 API 端點：
- POST /login - 用戶登入
- POST /signup - 用戶註冊
- GET /articles - 獲取文章列表
- POST /articles - 發布新文章
- PUT /articles/{id} - 更新文章
- POST /upload_image - 上傳圖片
- POST /chat - AI 對話
- GET /chat/history - 獲取對話歷史

## 設計規範

### 配色方案
- 主要色：#152F2B (深綠色)
- 次要色：#E0D5C1 (米色)
- 強調色：#954527 (磚紅色)
- 背景色：#F1E3CB (淺米色)

### 字體
- 主要字體：Noto Sans TC
- 特殊字體：Alatsi, DM Mono

### 響應式設計
- 桌面版：> 992px
- 平板：768px - 992px
- 手機：< 768px

## 開發團隊
- 前端開發：[開發者名稱]
- 後端開發：[開發者名稱]
- UI/UX 設計：[設計師名稱]

## 授權
本專案採用 MIT 授權條款


<!-- 
TODO:
detail 頁面的 RWD
Navbar 小此吋螢幕
 -->