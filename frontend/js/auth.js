const firebaseConfig = {
    apiKey: "AIzaSyCUhBo3u0fY0yTFZomxyenFtuTAWSL8UKA",
    authDomain: "eros-web-94e22.firebaseapp.com",
    projectId: "eros-web-94e22",
    storageBucket: "eros-web-94e22.firebasestorage.app",
    messagingSenderId: "525089541232",
    appId: "1:525089541232:web:9fe593008caad85df138b5",
    measurementId: "G-B4N281YVGX"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const authFirebase = firebase.auth();

// 定義 API 的基礎 URL
const API_BASE_URL = 'http://localhost:8000';

// 登入函式
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '登入失敗');
        }

        const data = await response.json();
        const token = data.token;

        await authFirebase.signInWithCustomToken(token);
        alert('登入成功！');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('錯誤:', error);
        alert(error.message || '登入時發生錯誤');
    }
}

// 註冊函式
async function signup(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '註冊失敗');
        }

        const data = await response.json();
        const token = data.token;

        await authFirebase.signInWithCustomToken(token);
        alert('註冊並登入成功！');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('錯誤:', error);
        alert(error.message || '註冊時發生錯誤');
    }
} 