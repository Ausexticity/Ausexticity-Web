import { logout, isLoggedIn } from './auth.js';
import { updateHeader } from './misc.js';

// 模擬資料
const mockUsers = [
    {
        id: '7p8z0EXG9NTmHIQ4czdQ9Jr8MJA2',
        email: 'ausexticity@gmail.com',
        name: 'Ausexticity',
        role: 'user'
    },
    {
        id: '3Kjiqug5jwSlaZZR1NDnLjLGzLf1',
        email: 'f74104765@gs.ncku.edu.tw',
        name: 'NCC',
        role: 'admin'
    },
    {
        id: 'dummyUser1',
        email: 'test1@example.com',
        name: '測試用戶1',
        role: 'user'
    },
    {
        id: 'dummyUser2',
        email: 'test2@example.com',
        name: '測試用戶2',
        role: 'user'
    },
    {
        id: 'dummyUser3',
        email: 'admin@example.com',
        name: '測試管理員',
        role: 'admin'
    }
];

// 模擬聊天記錄資料
const mockChatHistory = [
    {
        timestamp: new Date('2024-01-20T10:30:00'),
        userMessage: '你好，請問有什麼可以幫助你的嗎？',
        aiResponse: '你好！我是AI助手，很高興為您服務。'
    },
    {
        timestamp: new Date('2024-01-20T10:31:00'),
        userMessage: '我想了解更多關於這個網站的功能',
        aiResponse: '這是一個文章分享平台，您可以在這裡閱讀、發布和分享文章。'
    },
    {
        timestamp: new Date('2024-01-20T10:32:00'),
        userMessage: '如何發布新文章？',
        aiResponse: '您可以點擊右上角的「發布文章」按鈕，填寫標題、內容和標籤後即可發布。'
    }
];

// 更新用戶表格
function updateUsersTable() {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';

    mockUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.email}</td>
            <td>${user.name || '-'}</td>
            <td>
                <select class="role-select" data-user-id="${user.id}">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>user</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>admin</option>
                </select>
            </td>
            <td>
                <button class="chat-history-btn" data-user-id="${user.id}">查看記錄</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // 添加角色選擇事件監聽器
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const userId = e.target.dataset.userId;
            const newRole = e.target.value;
            alert(`已將用戶 ${userId} 的角色更新為 ${newRole}`);
        });
    });

    // 添加聊天記錄按鈕事件監聽器
    document.querySelectorAll('.chat-history-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const userId = e.target.dataset.userId;
            showChatHistory(userId);
        });
    });
}

// 顯示聊天記錄
function showChatHistory(userId) {
    const modal = document.getElementById('chat-history-modal');
    const content = document.getElementById('chat-history-content');
    content.innerHTML = '';

    mockChatHistory.forEach(chat => {
        const chatDiv = document.createElement('div');
        chatDiv.className = 'chat-entry';
        chatDiv.innerHTML = `
            <div class="timestamp">${chat.timestamp.toLocaleString()}</div>
            <div class="message user-message">
                <p>${chat.userMessage}</p>
            </div>
            <div class="message ai-message">
                <p>${chat.aiResponse}</p>
            </div>
        `;
        content.appendChild(chatDiv);
    });

    modal.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', async () => {
    updateHeader();
    updateUsersTable();

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
});

// 導航到新增文章
function navigateToPost() {
    window.location.href = 'post.html';
}

// 導航到編輯文章
function navigateToEdit() {
    window.location.href = 'search.html?edit=true';
}

export { navigateToPost, navigateToEdit };