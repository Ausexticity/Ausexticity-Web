import { logout, isLoggedIn, getCurrentUserId } from './auth.js';
import { updateHeader } from './misc.js';

// 等待一小段時間確保 Firebase 完全初始化
async function checkAuth() {
    if (!await isLoggedIn()) {
        alert('您尚未登入，請先登入。');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) return;

    updateHeader();

    const postButton = document.getElementById('btn-navigate-post');
    const editButton = document.getElementById('btn-navigate-edit');
    const logoutLink = document.getElementById('logout-link');

    if (postButton) {
        postButton.addEventListener('click', navigateToPost);
    }

    if (editButton) {
        editButton.addEventListener('click', navigateToEdit);
    }

    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault(); // 防止默認行為
            logout();
        });
    }
});

// 導航到新增文章
function navigateToPost() {
    window.location.href = 'post.html';
}

// 導航到編輯文章
function navigateToEdit() {
    window.location.href = 'search.html?edit=true&userId=' + getCurrentUserId(); // 假設 article_list.html 用於編輯文章
}

export { navigateToPost, navigateToEdit }; 