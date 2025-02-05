import { API_BASE_URL } from './config.js';
import { logout, getCurrentUserId } from './auth.js';

// 定義 LocalStorage 鍵名
const ARTICLES_KEY = 'articles';
const ARTICLES_TIMESTAMP_KEY = 'articles_timestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時

function updateHeader() {
    const token = localStorage.getItem('idToken');
    const loginLink = document.getElementById('login-link');
    const userIcon = document.getElementById('user-icon');

    if (loginLink && userIcon) {
        if (token) {
            loginLink.style.display = 'none';
            userIcon.style.display = 'block';

            // 先移除所有已存在的點擊事件
            const oldUserIcon = userIcon.cloneNode(true);
            userIcon.parentNode.replaceChild(oldUserIcon, userIcon);

            // 添加新的點擊事件，導向管理頁面
            oldUserIcon.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        } else {
            loginLink.style.display = 'block';
            userIcon.style.display = 'none';
        }
    }
}

// 獲取文章資料，使用 LocalStorage 進行快取
async function fetchArticles(force = false) {
    const cachedArticles = localStorage.getItem(ARTICLES_KEY);
    const cachedTimestamp = localStorage.getItem(ARTICLES_TIMESTAMP_KEY);
    const now = Date.now();

    // 如果不強制且快取存在且未過期，使用快取
    if (!force && cachedArticles && cachedTimestamp && (now - cachedTimestamp < CACHE_DURATION)) {
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

/**
 * 上傳圖片到後端並返回圖片的 URL
 * @returns {Promise<string|null>} 圖片的 URL 或 null
 */
export async function uploadImage(file) {
    if (!file) {
        alert('請選擇一張圖片進行上傳。');
        return null;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload_image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
            },
            body: formData
        });

        if (response.status === 200) {
            const data = await response.json();
            return data.image_url;
        } else {
            const errorData = await response.json();
            alert(`圖片上傳失敗: ${errorData.detail}`);
            return null;
        }
    } catch (error) {
        console.error('圖片上傳時發生錯誤:', error);
        alert('圖片上傳時發生錯誤，請稍後再試。');
        return null;
    }
}

/**
 * 刪除圖片
 * @param {string} imageUrl - 要刪除的圖片 URL
 * 
 * @app.delete("/api/delete_image")
def delete_image(request: DeleteImageRequest, user: dict = Depends(verify_token)):
 */
export async function deleteImage(imageUrl) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/delete_image`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            },
            body: JSON.stringify({ image_url: imageUrl })
        });

        if (response.status === 200) {
            return true;
        } else {
            const errorData = await response.json();
            alert(`刪除圖片時發生錯誤: ${errorData.detail}`);
            return null;
        }
    } catch (error) {
        console.error('刪除圖片時發生錯誤:', error);
        alert('刪除圖片時發生錯誤，請稍後再試。');
        return null;
    }
}

/**
 * 刪除文章 
 * @param {string} articleId - 要刪除的文章 ID
 * @app.delete("/api/articles/{article_id}")
def delete_article(article_id: str, user: dict = Depends(verify_token)):    
 * 
 */
export async function deleteArticle(articleId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/articles/${articleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            }
        });

        if (response.status === 200) {
            return true;
        } else {
            const errorData = await response.json();
            alert(`刪除文章時發生錯誤: ${errorData.detail}`);
            return null;
        }
    } catch (error) {
        console.error('刪除文章時發生錯誤:', error);
        alert('刪除文章時發生錯誤，請稍後再試。');
        return null;
    }
}

/**
 * 壓縮圖片 (前端)
 * @param {File} file - 原始圖片檔案
 * @param {Object} options - 壓縮選項，例如 quality、maxWidth、maxHeight
 * @returns {Promise<File>} 返回壓縮後的圖片檔案
 */
export async function compressImage(file, options = {}) {
    return new Promise((resolve, reject) => {
        const quality = options.quality || 0.7;        // 壓縮品質 (介於 0 與 1 之間)
        const maxWidth = options.maxWidth || 1024;       // 最大寬度
        const maxHeight = options.maxHeight || 1024;     // 最大高度

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // 計算縮放比例，維持原圖比例
                if (width > maxWidth || height > maxHeight) {
                    const scale = Math.min(maxWidth / width, maxHeight / height);
                    width = width * scale;
                    height = height * scale;
                }

                // 建立 canvas 並將圖片繪製至 canvas 上
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // 使用 toBlob 轉換 canvas，並以 JPEG 格式、指定品質輸出
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: blob.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('圖片壓縮失敗'));
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
}

export { updateHeader, fetchArticles, formatPublishedDate, truncateTitle };
