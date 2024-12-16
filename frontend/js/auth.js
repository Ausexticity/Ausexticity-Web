import { API_BASE_URL } from './config.js';

// 使用 import 導入 Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';

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
            // 註冊成功，儲存 token
            localStorage.setItem('token', data.token);
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
            // 登入成功，儲存 token
            localStorage.setItem('token', data.token);
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

function logout() {
    localStorage.removeItem('token');
    // 可選：刷新頁面或跳轉到首頁
    window.location.href = 'index.html';
}

// 導出函數供其他模組使用
export { signup, login, logout, auth };