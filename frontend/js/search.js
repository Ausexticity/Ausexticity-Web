import { API_BASE_URL } from './config.js';
import { fetchArticles, formatPublishedDate, updateHeader } from './misc.js';

// 搜尋功能實現
document.addEventListener('DOMContentLoaded', () => {

    // searchResult
    const searchResults = document.querySelector('.search-result-lists');
    const searchHeading = document.querySelector('#search-heading');
    // 更新頁面頭部的登入狀態
    updateHeader();

    // 根據 URL 參數 q 執行搜尋，若無 query 則顯示全部文章
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const userId = urlParams.get('userId');
    const edit = urlParams.get('edit');

    if (userId) {
        searchHeading.innerHTML = '我的文章';
        displayUserArticles(userId);
    } else if (query) {
        performSearch(query);
    } else {
        displayAllArticles();
    }

    // 暴露 performSearch 供外部（如 nav-search.js）調用
    window.performSearch = performSearch;

    async function displayUserArticles(userId) {
        try {
            const articles = await fetchArticles();
            const userArticles = articles.filter(article => article.user_id === userId);

            displayResults(userArticles, '');
        } catch (error) {
            console.error('載入用戶文章失敗:', error);
            showErrorMessage('載入文章失敗，請稍後再試。');
        }
    }

    // 執行搜尋
    async function performSearch(keyword) {
        if (!keyword) {
            alert('請輸入搜尋關鍵字');
            return;
        }

        const articles = await fetchArticles();
        const results = articles.filter(article => {
            const matchTitle = article.title.toLowerCase().includes(keyword);
            const matchContent = article.content.toLowerCase().includes(keyword);
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
            itemDiv.style.cursor = 'pointer';

            // 建立圖片區塊 (box)
            const boxDiv = document.createElement('div');
            boxDiv.className = 'box';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'img';
            const imageUrl = article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png';
            imgDiv.style.backgroundImage = `url(${imageUrl})`;
            boxDiv.appendChild(imgDiv);
            itemDiv.appendChild(boxDiv);

            // 建立內容區塊
            const contentDiv = document.createElement('div');
            contentDiv.className = 'content';

            const titleElement = document.createElement('h3');
            titleElement.className = 'title';
            titleElement.innerHTML = keyword ? highlightKeyword(article.title, keyword) : article.title;

            const previewElement = document.createElement('p');
            previewElement.className = 'preview';
            let previewText = article.preview || article.content || '';
            if (previewText.length > 100) {
                previewText = previewText.substring(0, 100) + '...';
            }
            previewElement.innerHTML = keyword ? highlightKeyword(previewText, keyword) : previewText;

            const metaDiv = document.createElement('div');
            metaDiv.className = 'meta';

            const dateSpan = document.createElement('span');
            dateSpan.className = 'date';
            dateSpan.textContent = new Date(article.published_at).toLocaleDateString();
            metaDiv.appendChild(dateSpan);

            // 如果存在 tags，則加入標籤
            if (article.tags && Array.isArray(article.tags) && article.tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'tags';
                article.tags.forEach(tag => {
                    const tagSpan = document.createElement('span');
                    tagSpan.className = 'tag';
                    tagSpan.textContent = tag;
                    tagsDiv.appendChild(tagSpan);
                });
                metaDiv.appendChild(tagsDiv);
            }

            contentDiv.appendChild(titleElement);
            contentDiv.appendChild(previewElement);
            contentDiv.appendChild(metaDiv);
            itemDiv.appendChild(contentDiv);

            // 點擊整個文章項目跳轉到文章詳情
            itemDiv.addEventListener('click', () => {
                if (edit) {
                    window.location.href = `post.html?id=${article.id}`;
                } else {
                    window.location.href = `article_detail.html?id=${article.id}`;
                }
            });

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