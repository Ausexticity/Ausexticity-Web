import { logout, isLoggedIn } from './auth.js';
import { updateHeader } from './misc.js';
import { API_BASE_URL } from './config.js';
import { initializeLoading, showLoading, hideLoading } from './loading.js';

// 設定 marked 選項，確保安全性和樣式
marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-',
    pedantic: false,
    gfm: true,
    breaks: true,
    sanitize: false,
    smartypants: false,
    xhtml: false
});

// 取得所有使用者資料的 API
async function getAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '獲取使用者資料失敗');
        }

        const data = await response.json();
        return data.users;
    } catch (error) {
        console.error('獲取使用者資料時發生錯誤:', error);
        throw error;
    }
}

// 取得所有聊天記錄的 API
async function getAllChatHistories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/chat_histories`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '獲取聊天記錄失敗');
        }

        const data = await response.json();
        return data.chat_histories;
    } catch (error) {
        console.error('獲取聊天記錄時發生錯誤:', error);
        throw error;
    }
}

// 更新使用者角色的 API
async function updateUserRole(userId, newRole) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '更新使用者角色失敗');
        }

        const data = await response.json();
        return data.message;
    } catch (error) {
        console.error('更新使用者角色時發生錯誤:', error);
        throw error;
    }
}

// 更新用戶表格
async function updateUsersTable() {
    try {
        const users = await getAllUsers();
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.uid}</td>
                <td>${user.email || '-'}</td>
                <td>${user.displayName || '-'}</td>
                <td>
                    <select class="role-select" data-user-id="${user.uid}">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>user</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
                    </select>
                </td>
                <td>
                    <button class="chat-history-btn" data-user-id="${user.uid}">查看記錄</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // 添加角色選擇事件監聽器
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                try {
                    const userId = e.target.dataset.userId;
                    const newRole = e.target.value;
                    const message = await updateUserRole(userId, newRole);
                    alert(message);
                } catch (error) {
                    alert(error.message);
                    // 重新載入表格以還原變更
                    await updateUsersTable();
                }
            });
        });

        // 添加聊天記錄按鈕事件監聽器
        document.querySelectorAll('.chat-history-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                showChatHistory(userId);
            });
        });
    } catch (error) {
        alert('載入使用者資料時發生錯誤：' + error.message);
    }
}

// 顯示聊天記錄
async function showChatHistory(userId) {
    try {
        const modal = document.getElementById('chat-history-modal');
        const content = document.getElementById('chat-history-content');
        content.innerHTML = '<div class="loading-spinner"></div>';
        modal.style.display = 'block';

        const chatHistories = await getAllChatHistories();
        const userChatHistory = chatHistories.find(history => history.user_id === userId);

        if (!userChatHistory || !userChatHistory.messages || userChatHistory.messages.length === 0) {
            content.innerHTML = '<div class="no-chat">此使用者尚無聊天記錄</div>';
            return;
        }

        content.innerHTML = '';
        const batchSize = 10; // 每批渲染的訊息數量
        const messages = userChatHistory.messages;
        const totalBatches = Math.ceil(messages.length / batchSize);

        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, messages.length);
            const batch = messages.slice(start, end);

            await new Promise(resolve => {
                setTimeout(() => {
                    batch.forEach(chat => {
                        const chatDiv = document.createElement('div');
                        chatDiv.className = 'chat-entry';

                        // 使用 marked 渲染 Markdown
                        const formattedMessage = marked.parse(chat.message);

                        chatDiv.innerHTML = `
                            <div class="timestamp">${new Date(chat.timestamp).toLocaleString()}</div>
                            <div class="message ${chat.is_bot ? 'ai-message' : 'user-message'}">
                                <div class="markdown-content">${formattedMessage}</div>
                            </div>
                        `;
                        content.appendChild(chatDiv);
                    });

                    // 初始化當前批次的程式碼高亮
                    document.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightBlock(block);
                    });

                    // 滾動到最新訊息
                    content.scrollTop = content.scrollHeight;

                    resolve();
                }, 200); // 每批次間隔 200ms
            });
        }
    } catch (error) {
        alert('載入聊天記錄時發生錯誤：' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeLoading(); // 初始化載入動畫
        showLoading(); // 顯示載入動畫

        await updateHeader();
        await updateUsersTable();

        const postButton = document.getElementById('btn-navigate-post');
        const editButton = document.getElementById('btn-navigate-edit');
        const logoutLink = document.getElementById('logout-link');
        const modal = document.getElementById('chat-history-modal');
        const closeBtn = document.querySelector('.close');

        if (postButton) {
            postButton.addEventListener('click', navigateToPost);
        }

        if (editButton) {
            editButton.addEventListener('click', navigateToEdit);
        }

        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }

        // 關閉模態框
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        // 點擊模態框外部關閉
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('初始化頁面時發生錯誤:', error);
        alert('載入頁面時發生錯誤，請重新整理頁面。');
    } finally {
        hideLoading(); // 隱藏載入動畫
    }
});

// 導航到新增文章
function navigateToPost() {
    window.location.href = 'post.html';
}

// 導航到編輯文章
function navigateToEdit() {
    window.location.href = 'search.html?edit=true';
}

export {
    navigateToPost,
    navigateToEdit,
    getAllUsers,
    getAllChatHistories,
    updateUserRole
};  