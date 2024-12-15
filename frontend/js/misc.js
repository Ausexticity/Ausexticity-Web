const API_BASE_URL = 'https://eros-web-api.onrender.com'; // 根據你的後端服務調整此 URL

function updateHeader() {
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('login-link');
    const userIcon = document.getElementById('user-icon');

    if (token) {
        loginLink.style.display = 'none';
        userIcon.style.display = 'block';
    } else {
        loginLink.style.display = 'block';
        userIcon.style.display = 'none';
    }

    // 添加點擊事件
    if (token) {
        userIcon.addEventListener('click', () => {
            if (confirm('是否登出？')) {
                logout();
            }
        });
    }
}

// 獲取文章資料
async function fetchArticles() {
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
            return data.articles;
        } else {
            alert(`獲取文章失敗: ${data.detail}`);
            return [];
        }
    } catch (error) {
        console.error('獲取文章時發生錯誤:', error);
        alert('獲取文章時發生錯誤，請稍後再試。');
        return [];
    }
}

// 登出函式
function logout() {
    localStorage.removeItem('token');
    // 可選：刷新頁面或跳轉到首頁
    window.location.href = 'index.html';
}