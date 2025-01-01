import { API_BASE_URL } from './config.js';

// 使用 import 導入 Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import { getAuth, signInWithCustomToken, signOut } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyCUhBo3u0fY0yTFZomxyenFtuTAWSL8UKA",
    authDomain: "eros-web-94e22.firebaseapp.com",
    projectId: "eros-web-94e22",
    storageBucket: "eros-web-94e22.firebasestorage.app",
    messagingSenderId: "525089541232",
    appId: "1:525089541232:web:9fe593008caad85df138b5",
    measurementId: "G-B4N281YVGX"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function signup(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            }),
        });

        const data = await response.json();

        if (response.status === 200) {
            // 使用自訂令牌進行登入並獲取 ID Token
            await loginWithCustomToken(data.token);
            return true;
        } else {
            // 註冊失敗，顯示錯誤訊息
            alert(`註冊失敗: ${data.detail}`);
            return false;
        }
    } catch (error) {
        console.error('註冊時發生錯誤:', error);
        alert('註冊時發生錯誤，請稍後再試。');
        return false;
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password
            }),
        });

        const data = await response.json();

        if (response.status === 200) {
            // 使用自訂令牌進行登入並獲取 ID Token
            await loginWithCustomToken(data.token);
            return true;
        } else {
            // 登入失敗，顯示錯誤訊息
            alert(`登入失敗: ${data.detail}`);
            return false;
        }
    } catch (error) {
        console.error('登入時發生錯誤:', error);
        alert('登入時發生錯誤，請稍後再試。');
        return false;
    }
}

async function loginWithCustomToken(customToken) {
    try {
        // 使用自訂令牌登入
        const userCredential = await signInWithCustomToken(auth, customToken);
        const user = userCredential.user;

        // 獲取 ID Token
        const idToken = await user.getIdToken();

        // 將 ID Token 儲存到 localStorage
        localStorage.setItem('idToken', idToken);

        console.log('登入成功，ID Token:', idToken);
    } catch (error) {
        console.error('使用自訂令牌登入失敗:', error);
        throw error;
    }
}

function logout() {
    signOut(auth).then(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('idToken');
        // 可選：刷新頁面或跳轉到首頁
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('登出時發生錯誤:', error);
    });
}

// 發送聊天請求的函數
async function sendChatRequest(query) {
    const idToken = localStorage.getItem('idToken');

    if (!idToken) {
        alert('未找到有效的登入憑證，請先登入。');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ query }),
        });

        const data = await response.json();

        if (response.status === 200) {
            console.log('聊天回應:', data.response);
            return data.response;
        } else {
            alert(`聊天失敗: ${data.detail || '未知錯誤'}`);
            return null;
        }
    } catch (error) {
        console.error('發送聊天請求失敗:', error);
        alert('發送聊天請求時發生錯誤，請稍後再試。');
        return null;
    }
}

// 自動更新 ID Token（可選）
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const idToken = await user.getIdToken(true); // 強制刷新
            localStorage.setItem('idToken', idToken);
            console.log('ID Token 已更新');
        } catch (error) {
            console.error('更新 ID Token 時發生錯誤:', error);
        }
    } else {
        localStorage.removeItem('idToken');
    }
});

// 導出函數供其他模組使用
export { signup, login, logout, sendChatRequest, auth };