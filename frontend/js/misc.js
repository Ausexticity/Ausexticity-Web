import { API_BASE_URL } from './config.js';
import { auth, isLoggedIn, logout } from './auth.js';

// 定義 LocalStorage 鍵名
const ARTICLES_KEY = 'articles';
const ARTICLES_TIMESTAMP_KEY = 'articles_timestamp';
const USER_AVATAR_KEY = 'user_avatar';
const USER_AVATAR_TIMESTAMP_KEY = 'user_avatar_timestamp';
const USER_ROLE_KEY = 'user_role';
const USER_ROLE_TIMESTAMP_KEY = 'user_role_timestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 小時
// 定義頭像和角色的快取時間（30分鐘）
const USER_INFO_CACHE_DURATION = 30 * 60 * 1000;

// 定義滾動條狀態的 LocalStorage 鍵名前綴
const SCROLL_STATE_PREFIX = 'scroll_state_';

async function updateHeader() {
    const userIsLoggedIn = await isLoggedIn();
    const loginLink = document.getElementById('login-link');
    const userIcon = document.getElementById('user-icon');
    const userMenu = document.getElementById('userMenu');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const logoutLink = document.getElementById('logoutLink');

    if (loginLink) loginLink.style.display = userIsLoggedIn ? 'none' : 'block';

    if (userIcon) {
        userIcon.style.display = userIsLoggedIn ? 'block' : 'none';

        if (userIsLoggedIn) {
            // 檢查頭像快取
            const now = Date.now();
            const cachedAvatar = localStorage.getItem(USER_AVATAR_KEY);
            const avatarTimestamp = localStorage.getItem(USER_AVATAR_TIMESTAMP_KEY);

            let userAvatar = null;
            if (cachedAvatar && avatarTimestamp && (now - avatarTimestamp < USER_INFO_CACHE_DURATION)) {
                userAvatar = cachedAvatar;
            } else {
                // 如果快取不存在或已過期，重新獲取頭像
                const avatarData = await getUserAvatar();
                userAvatar = avatarData.avatar;
                if (userAvatar) {
                    localStorage.setItem(USER_AVATAR_KEY, userAvatar);
                    localStorage.setItem(USER_AVATAR_TIMESTAMP_KEY, now.toString());
                }
            }

            // 更新頭像
            if (userAvatar) {
                userIcon.src = userAvatar;
            }

            // 移除舊的事件監聽器
            const oldUserIcon = userIcon.cloneNode(true);
            if (userIcon.parentNode) {
                userIcon.parentNode.replaceChild(oldUserIcon, userIcon);
            }

            // 檢查角色快取
            const cachedRole = localStorage.getItem(USER_ROLE_KEY);
            const roleTimestamp = localStorage.getItem(USER_ROLE_TIMESTAMP_KEY);

            let userRole = null;
            if (cachedRole && roleTimestamp && (now - roleTimestamp < USER_INFO_CACHE_DURATION)) {
                userRole = cachedRole;
            } else {
                // 如果快取不存在或已過期，重新獲取角色
                userRole = await getUserRole();
                if (userRole) {
                    localStorage.setItem(USER_ROLE_KEY, userRole);
                    localStorage.setItem(USER_ROLE_TIMESTAMP_KEY, now.toString());
                }
            }

            // 根據角色顯示管理員選項
            if (userRole === 'admin' && adminMenuItem) {
                adminMenuItem.style.display = 'block';
            }

            // 點擊頭像顯示/隱藏選單
            oldUserIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                if (userMenu) {
                    userMenu.classList.toggle('active');
                }
            });

            // 移除舊的登出事件監聽器並添加新的
            if (logoutLink) {
                const newLogoutLink = logoutLink.cloneNode(true);
                if (logoutLink.parentNode) {
                    logoutLink.parentNode.replaceChild(newLogoutLink, logoutLink);
                }

                newLogoutLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const shouldLogout = confirm('是否要登出？');
                    if (shouldLogout) {
                        // 清除快取
                        localStorage.removeItem(USER_AVATAR_KEY);
                        localStorage.removeItem(USER_AVATAR_TIMESTAMP_KEY);
                        localStorage.removeItem(USER_ROLE_KEY);
                        localStorage.removeItem(USER_ROLE_TIMESTAMP_KEY);
                        await logout();
                        window.location.reload();
                    }
                });
            }

            // 移除舊的文檔點擊事件監聽器
            const documentClickHandler = (e) => {
                if (userMenu && !userMenu.contains(e.target) && !oldUserIcon.contains(e.target)) {
                    userMenu.classList.remove('active');
                }
            };

            // 移除所有舊的事件監聽器
            document.removeEventListener('click', documentClickHandler);
            // 添加新的事件監聽器
            document.addEventListener('click', documentClickHandler);
        }
    }

    return userIsLoggedIn;
}

// 追蹤進行中的文章請求
let currentArticlesPromise = null;

// 獲取文章資料，使用 LocalStorage 進行快取
async function fetchArticles(force = false) {
    // 如果已經有請求在進行中，直接返回該 Promise
    if (currentArticlesPromise) {
        return currentArticlesPromise;
    }

    const cachedArticles = localStorage.getItem(ARTICLES_KEY);
    const cachedTimestamp = localStorage.getItem(ARTICLES_TIMESTAMP_KEY);
    const now = Date.now();

    // 如果不強制且快取存在且未過期，使用快取
    if (!force && cachedArticles && cachedTimestamp && (now - cachedTimestamp < CACHE_DURATION)) {
        console.log('使用快取的文章資料');
        return JSON.parse(cachedArticles);
    }

    // 建立新的請求 Promise
    currentArticlesPromise = (async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/articles`, {
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
        } finally {
            // 請求完成後重置 Promise
            currentArticlesPromise = null;
        }
    })();

    return currentArticlesPromise;
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

// 移除 Markdown 語法
function removeMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗體 **text**
        .replace(/\*(.*?)\*/g, '$1')     // 移除斜體 *text*
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除連結 [text](url)
        .replace(/#{1,6}\s/g, '')        // 移除標題 # text
        .replace(/`{1,3}.*?`{1,3}/g, '') // 移除程式碼區塊 ```code``` 或 `code`
        .replace(/^\s*[-*+]\s/gm, '')    // 移除清單符號
        .replace(/^\s*\d+\.\s/gm, '')    // 移除數字清單
        .replace(/\n/g, ' ')             // 將換行符替換為空格
        .replace(/\s+/g, ' ')            // 將多個空格替換為單個空格
        .trim();
}

// 類別定義：用於限制標題長度，並移除 Markdown 語法
function truncateTitle(text, maxLength = 20) {
    const cleanText = removeMarkdown(text);
    return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
}

/**
 * 儲存頁面的滾動條位置
 */
function saveScrollPosition() {
    const currentPath = window.location.pathname;
    const scrollPosition = window.scrollY;
    localStorage.setItem(SCROLL_STATE_PREFIX + currentPath, scrollPosition.toString());
}

/**
 * 恢復頁面的滾動條位置
 * @param {boolean} waitForDynamicContent - 是否等待動態內容載入
 */
function restoreScrollPosition(waitForDynamicContent = false) {
    const currentPath = window.location.pathname;
    const savedPosition = localStorage.getItem(SCROLL_STATE_PREFIX + currentPath);

    if (savedPosition !== null) {
        if (waitForDynamicContent) {
            // 使用 MutationObserver 監聽內容變化
            const observer = new MutationObserver((mutations, obs) => {
                const targetElement = document.querySelector('.search-result-lists, .article-content');
                if (targetElement && targetElement.children.length > 0) {
                    // 當內容載入完成後，設置滾動位置
                    setTimeout(() => {
                        window.scrollTo({
                            top: parseInt(savedPosition),
                            behavior: 'instant'
                        });
                    }, 100);
                    obs.disconnect(); // 停止觀察
                }
            });

            // 開始觀察文檔變化
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // 設置超時，避免無限等待
            setTimeout(() => {
                observer.disconnect();
            }, 5000); // 5 秒後停止觀察
        } else {
            // 對於靜態內容，直接設置滾動位置
            setTimeout(() => {
                window.scrollTo({
                    top: parseInt(savedPosition),
                    behavior: 'instant'
                });
            }, 100);
        }
    }
}

// 監聽滾動事件，使用節流函數來優化性能
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(saveScrollPosition, 100);
});

// 在頁面卸載前保存最後的滾動位置
window.addEventListener('beforeunload', () => {
    saveScrollPosition();
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    scheduleArticleUpdate();
    // 根據頁面路徑決定是否等待動態內容
    const currentPath = window.location.pathname;
    const waitForDynamic = currentPath.includes('search.html') ||
        currentPath.includes('article_detail.html') ||
        currentPath.includes('admin.html');
    restoreScrollPosition(waitForDynamic);
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
        const response = await fetch(`${API_BASE_URL}/upload_image`, {
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
 * 驗證 Firebase Storage URL 並取得 blob 名稱
 * @param {string} url - Firebase Storage URL
 * @returns {string|null} blob 名稱，如果 URL 無效則返回 null
 */
function getBlobName(url) {
    try {
        const parsedUrl = new URL(url);

        // 驗證是否為 Firebase Storage 的合法網址
        if (parsedUrl.hostname !== 'storage.googleapis.com') {
            console.error('非法的 Storage 網域');
            return null;
        }

        // 解析路徑取得 bucket 名稱和檔案路徑
        const pathParts = parsedUrl.pathname.split('/').filter(part => part);
        if (pathParts.length < 2) {
            console.error('無效的 Storage URL 格式');
            return null;
        }

        // 驗證 bucket 名稱
        const bucketName = pathParts[0];
        if (bucketName !== 'eros-web-94e22.firebasestorage.app') {
            console.error('Storage bucket 不符合');
            return null;
        }

        // 取得檔案路徑 (去除 bucket 名稱後的部分)
        return pathParts.slice(1).join('/');
    } catch (error) {
        console.error('URL 解析錯誤:', error);
        return null;
    }
}

/**
 * 刪除圖片
 * @param {string} imageUrl - 要刪除的圖片 URL
 * @returns {Promise<boolean>} 刪除成功返回 true，失敗返回 false
 */
export async function deleteImage(imageUrl) {
    // 先驗證 URL 格式
    if (!getBlobName(imageUrl)) {
        console.error('無效的 Storage URL，跳過刪除操作');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/delete_image`, {
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
            console.error(`刪除圖片時發生錯誤: ${errorData.detail}`);
            return false;
        }
    } catch (error) {
        console.error('刪除圖片時發生錯誤:', error);
        return false;
    }
}

/**
 * 刪除文章 
 * @param {string} articleId - 要刪除的文章 ID
 * @app.delete("/articles/{article_id}")
def delete_article(article_id: str, user: dict = Depends(verify_token)):    
 * 
 */
export async function deleteArticle(articleId) {
    try {
        const response = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
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

/**
 * 更新用戶頭像
 * @param {string} imageUrl - 新的頭像 URL
 * @returns {Promise<boolean>} 更新成功返回 true，失敗返回 false
 */
export async function updateUserAvatar(imageUrl) {
    try {
        const user = auth.currentUser;
        if (!user) return false;

        const idToken = await user.getIdToken();
        const avatarResponse = await fetch(`${API_BASE_URL}/user/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ avatar: imageUrl })
        });

        if (!avatarResponse.ok) throw new Error('更新頭像失敗');
        return true;
    } catch (error) {
        console.error('更新用戶頭像時發生錯誤:', error);
        throw error;
    }
}


// 載入用戶頭像
async function loadUserAvatar() {
    try {
        const data = await getUserAvatar();

        if (data.avatar) {
            const userIconElements = document.querySelectorAll('.user-icon');
            userIconElements.forEach(element => {
                element.src = data.avatar;
            });
        }
    } catch (error) {
        console.error('載入頭像時發生錯誤:', error);
    }
}

async function getUserAvatar() {
    try {
        const user = auth.currentUser;
        if (!user) return { avatar: null };

        const idToken = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/user/avatar`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

        if (!response.ok) throw new Error('獲取頭像失敗');
        return await response.json();
    } catch (error) {
        console.error('獲取頭像時發生錯誤:', error);
        return { avatar: null };
    }
}
/**
 * 清除聊天紀錄
 * @returns {Promise<boolean>} 清除成功返回 true，失敗返回 false
 */
async function clearChatHistory() {
    try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/chat/history`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });

        if (!response.ok) throw new Error('清除聊天紀錄失敗');
        return true;
    } catch (error) {
        console.error('清除聊天紀錄時發生錯誤:', error);
        throw error;
    }
}

// 取得用戶 role 
async function getUserRole() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/role`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            }
        });
        if (!response.ok) throw new Error('獲取用戶角色失敗');
        const data = await response.json();
        return data.role;
    } catch (error) {
        console.error('檢查管理員權限時發生錯誤:', error);
        return 'user'; // 預設返回一般用戶角色
    }
}

// 更新用戶 role 
async function updateUserRole(role = 'user') {
    try {
        const response = await fetch(`${API_BASE_URL}/user/role`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            },
            body: JSON.stringify({ role: role })
        });

        if (!response.ok) throw new Error('更新用戶 role 失敗');
        return true;
    } catch (error) {
        console.error('更新用戶 role 時發生錯誤:', error);
        throw error;
    }
}

// 創造用戶
async function createUser() {
    try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(`${API_BASE_URL}/user/create`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('創造用戶時發生錯誤:', error);
        throw error;
    }
}

export { updateHeader, fetchArticles, formatPublishedDate, truncateTitle, removeMarkdown, loadUserAvatar, getUserAvatar, getUserRole, updateUserRole, createUser, clearChatHistory };
