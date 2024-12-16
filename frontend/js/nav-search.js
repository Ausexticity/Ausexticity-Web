import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {


    const navSearchInput = document.getElementById('navSearchInput');
    if (!navSearchInput) return;

    // 處理搜尋輸入
    function handleSearch() {
        const searchTerm = navSearchInput.value.trim();
        if (searchTerm) {
            // 將搜尋詞存入 localStorage
            localStorage.setItem('pendingSearch', searchTerm);
            // 跳轉到搜尋頁面
            window.location.href = `search.html?q=${encodeURIComponent(searchTerm)}`;
        }
    }

    // 綁定 Enter 鍵事件
    navSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 綁定搜尋按鈕點擊事件
    const searchButton = navSearchInput.parentElement.querySelector('.search-button');
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            window.location.href = 'search.html';
        });
    }

}); 