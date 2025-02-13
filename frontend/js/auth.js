import { API_BASE_URL } from './config.js';
import { updateHeader } from './misc.js';

// 使用 import 導入 Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendSignInLinkToEmail as firebaseSendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    sendEmailVerification,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js';

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

// 監聽驗證狀態變更
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const idToken = await user.getIdToken(true);
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('userId', user.uid);
            console.log('使用者已登入，ID Token 已更新');
        } catch (error) {
            console.error('更新 ID Token 時發生錯誤:', error);
        }
    } else {
        localStorage.removeItem('idToken');
        localStorage.removeItem('userId');
        console.log('使用者已登出');
    }
    // 更新 header
    updateHeader();
});

// 定義並導出 getCurrentUserId 函數
function getCurrentUserId() {
    return auth.currentUser?.uid || null;
}

// 電子郵件/密碼註冊
async function signup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 發送電子郵件驗證
        await sendEmailVerification(user);

        alert('註冊成功！請查收驗證電子郵件。');
        return true;
    } catch (error) {
        console.error('註冊時發生錯誤:', error);
        let errorMessage = '註冊時發生錯誤';

        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = '此電子郵件已被使用';
                break;
            case 'auth/invalid-email':
                errorMessage = '無效的電子郵件格式';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = '電子郵件/密碼登入未啟用';
                break;
            case 'auth/weak-password':
                errorMessage = '密碼強度不足';
                break;
        }

        alert(errorMessage);
        return false;
    }
}

// 電子郵件/密碼登入
async function login(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return true;
    } catch (error) {
        console.error('登入時發生錯誤:', error);
        let errorMessage = '登入時發生錯誤';

        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = '無效的電子郵件格式';
                break;
            case 'auth/user-disabled':
                errorMessage = '此帳號已被停用';
                break;
            case 'auth/user-not-found':
                errorMessage = '找不到此使用者';
                break;
            case 'auth/wrong-password':
                errorMessage = '密碼錯誤';
                break;
            case 'auth/invalid-login-credentials':
                errorMessage = '帳號或密碼錯誤';
                break;
        }

        alert(errorMessage);
        return false;
    }
}

// 發送一次性登入連結
async function sendSignInLinkToEmail(email) {
    const actionCodeSettings = {
        url: window.location.origin + '/login.html',
        handleCodeInApp: true
    };

    try {
        await firebaseSendSignInLinkToEmail(auth, email, actionCodeSettings);
        return true;
    } catch (error) {
        console.error('發送登入連結時發生錯誤:', error);
        let errorMessage = '發送登入連結時發生錯誤';
        switch (error.code) {
            case 'auth/missing-email':
                errorMessage = '請輸入電子郵件';
                break;
            case 'auth/invalid-email':
                errorMessage = '無效的電子郵件格式';
                break;
            case 'auth/user-not-found':
                errorMessage = '找不到此使用者';
                break;
        }
        throw new Error(errorMessage);
    }
}

// 處理一次性登入連結
async function handleSignInWithEmailLink() {
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
            email = window.prompt('請輸入您用於登入的電子郵件');
        }

        try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            // 登入成功後更新 header 並重定向到首頁
            updateHeader();
            window.location.href = 'index.html';
            return true;
        } catch (error) {
            console.error('使用電子郵件連結登入時發生錯誤:', error);
            let errorMessage = '登入時發生錯誤';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = '無效的電子郵件格式';
                    break;
                case 'auth/invalid-action-code':
                    errorMessage = '登入連結已失效或已被使用';
                    break;
                default:
                    errorMessage = '登入時發生錯誤，請稍後再試';
            }
            alert(errorMessage);
            window.location.href = 'login.html';
            return false;
        }
    }
    return false;
}

function logout() {
    signOut(auth).then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('登出時發生錯誤:', error);
    });
}

// 修改後的發送聊天請求函數
async function sendChatRequest(query, context = []) {
    const user = auth.currentUser;
    if (!user) {
        alert('請先登入。');
        window.location.href = 'login.html';
        return;
    }

    try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ query, context }),
        });

        const data = await response.json();

        if (response.status === 200) {
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

async function isLoggedIn() {
    // 等待 Firebase 初始化完成
    if (!auth.currentUser) {
        // 等待一小段時間確保 Firebase 完全初始化
        await new Promise(resolve => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                unsubscribe(); // 取消監聽
                resolve(user);
            });
        });
    }

    return !!auth.currentUser && !!localStorage.getItem('idToken');
}

// 在頁面載入時檢查是否有一次性登入連結
if (typeof window !== 'undefined') {
    handleSignInWithEmailLink().catch(console.error);
}

// 導出函數供其他模組使用
export {
    signup,
    login,
    logout,
    sendChatRequest,
    auth,
    isLoggedIn,
    getCurrentUserId,
    sendSignInLinkToEmail,
    handleSignInWithEmailLink
};