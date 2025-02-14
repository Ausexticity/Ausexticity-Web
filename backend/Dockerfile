# 使用 Python 3.9 作為基礎映像
FROM python:3.9-slim

# 設定工作目錄
WORKDIR /app

# 複製依賴文件
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式代碼
COPY . .

# 設定環境變數
ENV PORT=8080
ENV HOST=0.0.0.0

# 暴露端口
EXPOSE 8080

# 啟動命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"] 