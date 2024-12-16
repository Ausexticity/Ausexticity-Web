import { API_BASE_URL } from './config.js';
import { fetchArticles, formatPublishedDate, updateHeader } from './misc.js';

// 搜尋功能實現
document.addEventListener('DOMContentLoaded', () => {

    // 先宣告並獲取所有需要的 DOM 元素
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const searchTitle = document.getElementById('searchTitle');
    const searchContent = document.getElementById('searchContent');

    // 檢查 URL 參數
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q');
    const sort = urlParams.get('sort');

    // 檢查 localStorage 中的待處理搜尋
    const pendingSearch = localStorage.getItem('pendingSearch');

    if (searchTerm || pendingSearch) {
        const termToUse = searchTerm || pendingSearch;

        if (searchInput && searchButton) {
            searchInput.value = termToUse;

            // 清除待處理的搜尋
            localStorage.removeItem('pendingSearch');

            // 延遲執行搜尋，確保頁面和相關 JS 都已載入
            setTimeout(() => {
                searchButton.click();
            }, 300);
        }
    }

    // 如果是從"更多"連結過來的（sort=latest）
    if (sort === 'latest') {
        // 清空搜尋框
        if (searchInput) {
            searchInput.value = '';
        }
        // 確保兩個複選框都被勾選
        if (searchTitle && searchContent) {
            searchTitle.checked = true;
            searchContent.checked = true;
        }
        // 立即顯示所有文章
        displayAllArticles();
    }

    // 更新頁面頭部的登入狀態
    updateHeader();

    // 綁定搜尋按鈕點擊事件
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    // 綁定輸入框的 Enter 鍵事件
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // 執行搜尋
    async function performSearch() {
        const keyword = searchInput.value.trim().toLowerCase();
        if (!keyword) {
            alert('請輸入搜尋關鍵字');
            return;
        }

        if (!searchTitle.checked && !searchContent.checked) {
            alert('請至少選擇一個搜尋範圍');
            return;
        }

        const articles = await fetchArticles();
        const results = articles.filter(article => {
            const matchTitle = searchTitle.checked && article.title.toLowerCase().includes(keyword);
            const matchContent = searchContent.checked && article.content.toLowerCase().includes(keyword);
            return matchTitle || matchContent;
        });

        displayResults(results, keyword);
    }

    // 顯示所有文章的函數
    async function displayAllArticles() {
        try {
            const articles = await fetchArticles();
            // 根據發布時間排序（從新到舊）
            const sortedArticles = articles.sort((a, b) => {
                return new Date(b.published_at) - new Date(a.published_at);
            });
            displayResults(sortedArticles, '');
        } catch (error) {
            console.error('獲取文章失敗:', error);
        }
    }

    // 顯示搜尋結果
    function displayResults(results, keyword) {
        searchResults.innerHTML = '';

        if (results.length === 0) {
            const noResultDiv = document.createElement('div');
            noResultDiv.style.textAlign = 'center';
            noResultDiv.style.padding = '20px';
            noResultDiv.style.color = '#686868';
            noResultDiv.innerHTML = keyword
                ? `找不到符合 "${keyword}" 的搜尋結果`
                : '目前沒有任何文章';
            searchResults.appendChild(noResultDiv);
            return;
        }

        results.forEach(article => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';

            const boxDiv = document.createElement('div');
            boxDiv.className = 'box';
            boxDiv.style.position = 'relative';
            boxDiv.style.overflow = 'hidden';

            // 創建圖片區域
            const imgDiv = document.createElement('div');
            imgDiv.className = 'img';
            imgDiv.style.backgroundImage = `url(${article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png'})`;
            imgDiv.style.backgroundPosition = 'center';
            imgDiv.style.backgroundRepeat = 'no-repeat';
            imgDiv.style.backgroundSize = 'cover';
            const img = document.createElement('img');
            img.src = article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png';
            img.alt = article.title;
            img.style.width = '100%';
            imgDiv.appendChild(img);
            boxDiv.appendChild(imgDiv);

            // 創建資訊區域
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info';
            infoDiv.style.position = 'absolute';
            infoDiv.style.left = '0';
            infoDiv.style.bottom = '0';
            infoDiv.style.width = 'calc(100% - 20px)';
            infoDiv.style.padding = '10px';
            infoDiv.style.background = 'rgba(255, 255, 255, 0.9)';

            const title = document.createElement('h3');
            title.innerHTML = keyword
                ? highlightKeyword(article.title, keyword)
                : article.title;
            title.style.fontSize = '16px';
            title.style.fontWeight = '700';
            title.style.color = '#000';
            title.style.margin = '0';

            const date = document.createElement('p');
            date.textContent = formatPublishedDate(article.published_at);
            date.style.fontSize = '14px';
            date.style.color = 'rgba(0, 0, 0, 0.8)';
            date.style.margin = '5px 0 0 0';

            infoDiv.appendChild(title);
            infoDiv.appendChild(date);
            boxDiv.appendChild(infoDiv);

            // 添加點擊事件
            boxDiv.addEventListener('click', () => {
                window.location.href = `article_detail.html?id=${article.id}`;
            });
            boxDiv.style.cursor = 'pointer';

            itemDiv.appendChild(boxDiv);
            searchResults.appendChild(itemDiv);
        });
    }

    // 關鍵字高亮顯示
    function highlightKeyword(text, keyword) {
        if (!keyword) return text;
        const regex = new RegExp(keyword, 'gi');
        return text.replace(regex, match => `<span style="background-color: rgba(224, 102, 9, 0.2);">${match}</span>`);
    }
}); 