import { API_BASE_URL } from './config.js';
import { logout } from './auth.js';

// 定義 LocalStorage 鍵名
const ARTICLES_KEY = 'articles';
const ARTICLES_TIMESTAMP_KEY = 'articles_timestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時

function updateHeader() {
    const token = localStorage.getItem('idToken');
    const loginLink = document.getElementById('login-link');
    const userIcon = document.getElementById('user-icon');

    if (token) {
        loginLink.style.display = 'none';
        userIcon.style.display = 'block';

        // 先移除所有已存在的點擊事件
        const oldUserIcon = userIcon.cloneNode(true);
        userIcon.parentNode.replaceChild(oldUserIcon, userIcon);

        // 添加新的點擊事件
        oldUserIcon.addEventListener('click', () => {
            if (confirm('是否登出？')) {
                logout();
            }
        });
    } else {
        loginLink.style.display = 'block';
        userIcon.style.display = 'none';
    }
}

// 獲取文章資料，使用 LocalStorage 進行快取
async function fetchArticles() {
    const cachedArticles = localStorage.getItem(ARTICLES_KEY);
    const cachedTimestamp = localStorage.getItem(ARTICLES_TIMESTAMP_KEY);
    const now = Date.now();

    if (cachedArticles && cachedTimestamp && (now - cachedTimestamp < CACHE_DURATION)) {
        console.log('使用快取的文章資料');
        return JSON.parse(cachedArticles);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/articles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${localStorage.getItem('token')}` // 如需授權，視後端需求而定
            },
        });

        const data = await response.json();

        if (response.status === 200) {
            localStorage.setItem(ARTICLES_KEY, JSON.stringify(data.articles));
            localStorage.setItem(ARTICLES_TIMESTAMP_KEY, now);
            console.log('從 API 獲取並快取文章資料');
            return data.articles;
        } else {
            alert(`獲取文章失敗: ${data.detail}`);
            return cachedArticles ? JSON.parse(cachedArticles) : [];
        }
    } catch (error) {
        console.error('獲取文章時發生錯誤:', error);
        alert('獲取文章時發生錯誤，請稍後再試。');
        return cachedArticles ? JSON.parse(cachedArticles) : [];
    }
}


// 格式化發佈日期的函式
function formatPublishedDate(publishedAt) {
    const date = new Date(publishedAt);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        // timeZoneName: 'short' // 可選：顯示時區名稱
    };
    return date.toLocaleString('zh-TW', options);
}

// 定期檢查更新
function scheduleArticleUpdate() {
    // 每隔 CACHE_DURATION 時間重新獲取並更新快取
    setInterval(async () => {
        console.log('檢查及更新文章資料');
        await fetchArticles();
        // 可以在此處觸發頁面更新或通知用戶
    }, CACHE_DURATION);
}

// 類別定義：用於限制標題長度
function truncateTitle(title, maxLength = 20) {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
    scheduleArticleUpdate();
});
export { updateHeader, fetchArticles, formatPublishedDate, truncateTitle };
