import { API_BASE_URL } from './config.js';
import { auth, isLoggedIn, updateUsername, resetPassword } from './auth.js';
import { compressImage, deleteImage, clearChatHistory, getUserAvatar, updateUserAvatar } from './misc.js';
import { initializeLoading, showLoading, hideLoading } from './loading.js';

// 等待 DOM 載入完成
document.addEventListener('DOMContentLoaded', async () => {
    await initializeLoading();
    showLoading();

    // 檢查用戶是否已登入
    const userLoggedIn = await isLoggedIn();
    if (!userLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // 初始化頁面
    await initializePage();
    hideLoading();

    // 綁定登出按鈕事件
    document.getElementById('logout-link').addEventListener('click', handleLogout);
});

// 初始化頁面
async function initializePage() {
    try {
        // 載入用戶頭像
        await loadUserAvatar();
        // 載入用戶名稱
        await loadUsername();
        // 綁定所有事件監聽器
        bindEventListeners();
    } catch (error) {
        console.error('初始化頁面時發生錯誤:', error);
        alert('載入設定時發生錯誤，請稍後再試。');
    }
}

// 載入用戶頭像
async function loadUserAvatar() {
    try {
        const data = await getUserAvatar();
        if (data.avatar) {
            document.getElementById('current-avatar').src = data.avatar;
        }
    } catch (error) {
        console.error('載入頭像時發生錯誤:', error);
    }
}


// 載入用戶名稱
async function loadUsername() {
    try {
        const user = auth.currentUser;
        if (user) {
            document.getElementById('username').value = user.displayName || '';
        }
    } catch (error) {
        console.error('載入用戶名稱時發生錯誤:', error);
    }
}

// 綁定事件監聽器
function bindEventListeners() {
    // 頭像上傳相關
    const avatarUpload = document.getElementById('avatar-upload');
    const btnUploadAvatar = document.getElementById('btn-upload-avatar');

    btnUploadAvatar.addEventListener('click', () => {
        avatarUpload.click();
    });

    avatarUpload.addEventListener('change', handleAvatarUpload);

    // 用戶名稱更新
    document.getElementById('btn-update-username').addEventListener('click', handleUsernameUpdate);

    // 密碼重設
    document.getElementById('btn-reset-password').addEventListener('click', handlePasswordReset);

    // 清除聊天紀錄
    document.getElementById('btn-clear-chat').addEventListener('click', handleClearChatHistory);
}


// 處理頭像上傳
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('請上傳圖片檔案');
        return;
    }

    try {
        showLoading();

        // 保存舊的頭像URL
        const oldAvatarUrl = document.getElementById('current-avatar').src;
        const isDefaultAvatar = oldAvatarUrl.includes('default-avatar.png');

        // 壓縮圖片
        const compressedFile = await compressImage(file, {
            quality: 0.7,
            maxWidth: 256,
            maxHeight: 256
        });

        const formData = new FormData();
        formData.append('image', compressedFile);

        const idToken = await auth.currentUser.getIdToken();
        const uploadResponse = await fetch(`${API_BASE_URL}/upload_image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`
            },
            body: formData
        });

        if (!uploadResponse.ok) throw new Error('上傳圖片失敗');

        const { image_url } = await uploadResponse.json();

        if (await updateUserAvatar(image_url)) {
            // 更新頭像顯示
            document.getElementById('current-avatar').src = image_url;

            // 如果不是預設頭像，則刪除舊的頭像
            if (!isDefaultAvatar) {
                try {
                    await deleteImage(oldAvatarUrl);
                } catch (deleteError) {
                    console.error('刪除舊頭像時發生錯誤:', deleteError);
                    // 不中斷流程，因為新頭像已經更新成功
                }
            }
            alert('頭像更新成功！');
        } else {
            alert('頭像更新失敗，請稍後再試。');
        }
    } catch (error) {
        console.error('上傳頭像時發生錯誤:', error);
        alert('上傳頭像失敗，請稍後再試。');
    } finally {
        hideLoading();
    }
}

// 處理用戶名稱更新
async function handleUsernameUpdate() {
    const newUsername = document.getElementById('username').value.trim();
    if (!newUsername) {
        alert('請輸入新的用戶名稱');
        return;
    }

    try {
        showLoading();
        await updateUsername(newUsername);
        alert('用戶名稱更新成功！');
    } catch (error) {
        console.error('更新用戶名稱時發生錯誤:', error);
        alert('更新用戶名稱失敗，請稍後再試。');
    } finally {
        hideLoading();
    }
}

// 處理密碼重設
async function handlePasswordReset() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('請填寫所有密碼欄位');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('新密碼與確認密碼不符');
        return;
    }

    try {
        showLoading();
        await resetPassword(currentPassword, newPassword);
        alert('密碼更新成功！');
        // 清空密碼輸入框
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
    } catch (error) {
        console.error('重設密碼時發生錯誤:', error);
        if (error.code === 'auth/invalid-login-credentials') {
            alert('當前密碼不正確，請重新輸入。');
        } else {
            alert('重設密碼失敗，請稍後再試。');
        }
    } finally {
        hideLoading();
    }
}

// 處理清除聊天紀錄
async function handleClearChatHistory() {
    if (!confirm('確定要清除所有聊天紀錄嗎？此操作無法復原。')) {
        return;
    }

    try {
        showLoading();
        await clearChatHistory();
        alert('聊天紀錄已清除！');
    } catch (error) {
        console.error('清除聊天紀錄時發生錯誤:', error);
        alert('清除聊天紀錄失敗，請稍後再試。');
    } finally {
        hideLoading();
    }
}

// 處理登出
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('登出時發生錯誤:', error);
        alert('登出失敗，請稍後再試。');
    }
} 