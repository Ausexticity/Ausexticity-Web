// 初始化所需的 CSS 樣式
const initializeLoadingStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        dotlottie-player {
            z-index: 1200;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }

        dotlottie-player.show {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
};

// 初始化 loading 動畫元素
const initializeLoadingAnimation = () => {
    // 檢查是否已存在 loading 元素
    let loadingElement = document.querySelector('dotlottie-player');
    if (!loadingElement) {
        loadingElement = document.createElement('dotlottie-player');
        loadingElement.setAttribute('src', 'animation/loading.lottie');
        loadingElement.setAttribute('background', '#F1E3CB');
        loadingElement.setAttribute('speed', '1');
        loadingElement.setAttribute('loop', '');
        loadingElement.setAttribute('autoplay', '');
        document.body.insertBefore(loadingElement, document.body.firstChild);
    }
    return loadingElement;
};

// 載入必要的 script
const loadRequiredScripts = () => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs';
        script.type = 'module';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// 顯示 loading 動畫
const showLoading = () => {
    const loadingAnimation = document.querySelector('dotlottie-player');
    if (loadingAnimation) {
        loadingAnimation.style.display = 'block';
        setTimeout(() => {
            loadingAnimation.classList.add('show');
        }, 10);
    }
};

// 隱藏 loading 動畫
const hideLoading = () => {
    const loadingAnimation = document.querySelector('dotlottie-player');
    if (loadingAnimation) {
        loadingAnimation.classList.remove('show');
        setTimeout(() => {
            loadingAnimation.style.display = 'none';
        }, 300);
    }
};

// 初始化 loading 系統
const initializeLoading = async () => {
    try {
        await loadRequiredScripts();
        initializeLoadingStyles();
        const loadingElement = initializeLoadingAnimation();
        loadingElement.style.display = 'none';
        return true;
    } catch (error) {
        console.error('Loading animation initialization failed:', error);
        return false;
    }
};

export { initializeLoading, showLoading, hideLoading }; 