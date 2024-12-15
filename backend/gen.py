import firebase_admin
from firebase_admin import credentials, firestore
import datetime

def initialize_firestore():
    """
    初始化 Firestore 客戶端。
    """
    cred = credentials.Certificate("credential.json")  # 確保此路徑指向你的 Firebase 服務帳戶金鑰
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    return firestore.client()

def generate_sample_articles(db):
    """
    生成範例文章並插入 Firestore。
    """
    articles = [
        {
            "title": "最新美容趨勢分析",
            "content": "隨著科技的進步，美容行業不斷創新，最新的趨勢包括...",
            "author": "張小姐",
            "category": "NEWS",
            "published_at": datetime.datetime.now(),
            "image_url": "https://example.com/images/trend1.jpg"
        },
        {
            "title": "Dr.李告訴你：如何保持肌膚年輕",
            "content": "保持肌膚年輕的秘訣在於日常護理，包括...",
            "author": "Dr. 李",
            "category": "Dr.告訴你",
            "published_at": datetime.datetime.now(),
            "image_url": "https://example.com/images/skin_care.jpg"
        },
        {
            "title": "天然成分在美容產品中的應用",
            "content": "越來越多的美容產品開始使用天然成分，如...",
            "author": "王先生",
            "category": "NEWS",
            "published_at": datetime.datetime.now(),
            "image_url": "https://example.com/images/natural.jpg"
        },
        {
            "title": "Dr.陳分享：日常護膚的重要性",
            "content": "日常護膚不僅僅是為了美觀，更是健康的基礎...",
            "author": "Dr. 陳",
            "category": "Dr.告訴你",
            "published_at": datetime.datetime.now(),
            "image_url": "https://example.com/images/health_skin.jpg"
        }
    ]

    articles_ref = db.collection('articles')

    for article in articles:
        articles_ref.add(article)
        print(f"已新增文章：{article['title']}")

def main():
    db = initialize_firestore()
    generate_sample_articles(db)

if __name__ == "__main__":
    main()