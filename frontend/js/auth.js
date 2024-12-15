document.getElementById('sign-in-btn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // 發送登入請求到後端
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.detail || '登入失敗');
            return;
        }

        const data = await response.json();
        const token = data.token;

        // 初始化 Firebase
        const firebaseConfig = {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        firebase.initializeApp(firebaseConfig);
        const authFirebase = firebase.auth();

        // 使用 Firebase Authentication 登入
        authFirebase.signInWithCustomToken(token)
            .then((userCredential) => {
                // 登入成功後的處理
                const user = userCredential.user;
                alert('登入成功！');
                // 可以重定向到其他頁面
                window.location.href = 'index.html';
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(`登入失敗：${errorMessage}`);
            });
    } catch (error) {
        console.error('錯誤:', error);
        alert('登入時發生錯誤');
    }
}); 