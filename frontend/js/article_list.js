import { fetchArticles } from './misc.js';
import { updateHeader } from './misc.js';
import { formatPublishedDate } from './misc.js';

document.addEventListener('DOMContentLoaded', async () => {
    // updateHeader();
    await loadUserArticles();

    // 綁定搜尋按鈕點擊事件
    const searchButton = document.querySelector('.search-div button');
    const searchInput = document.querySelector('.search-div input');
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
});

// 加載用戶的文章
export async function loadUserArticles() {
    try {
        const articles = await fetchArticles();

        // 假設你有用戶ID，可以根據用戶ID篩選文章
        const userId = getCurrentUserId(); // 你需要實現這個函數以獲取當前用戶ID
        console.log(articles);
        const userArticles = articles.filter(article => article.user_id === userId);

        displayArticles(userArticles);
    } catch (error) {
        console.error('載入用戶文章失敗:', error);
        showErrorMessage('載入文章失敗，請稍後再試。');
    }
}

// 顯示文章列表
export function displayArticles(articles) {
    const searchResultLists = document.querySelector('.search-result-lists');
    searchResultLists.innerHTML = '';

    if (articles.length === 0) {
        searchResultLists.innerHTML = '<div style="text-align: center; color: #686868; padding: 20px;">沒有您的文章。</div>';
        return;
    }

    articles.forEach(article => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';

        const boxDiv = document.createElement('div');
        boxDiv.className = 'box';

        const link = document.createElement('a');
        link.href = `post.html?id=${article.id}`;

        const imgDiv = document.createElement('div');
        imgDiv.className = 'img';
        imgDiv.style.backgroundImage = `url(${article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png'})`;

        const img = document.createElement('img');
        img.src = article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png';
        img.alt = article.title;
        img.style.width = '100%';
        imgDiv.appendChild(img);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'info';

        const title = document.createElement('h3');
        title.textContent = article.title;

        const date = document.createElement('p');
        date.textContent = formatPublishedDate(article.published_at);

        const tags = document.createElement('p');
        tags.textContent = `標籤: ${article.tags.join(', ')}`;

        infoDiv.appendChild(title);
        infoDiv.appendChild(date);
        infoDiv.appendChild(tags);

        link.appendChild(imgDiv);
        link.appendChild(infoDiv);
        boxDiv.appendChild(link);
        itemDiv.appendChild(boxDiv);
        searchResultLists.appendChild(itemDiv);
    });
}

// 搜尋功能
export async function performSearch() {
    const keyword = document.querySelector('.search-div input').value.trim().toLowerCase();
    if (!keyword) {
        alert('請輸入搜尋關鍵字');
        return;
    }

    try {
        const articles = await fetchArticles();
        const userId = getCurrentUserId();
        const userArticles = articles.filter(article => article.user_id === userId);

        const results = userArticles.filter(article =>
            article.title.toLowerCase().includes(keyword) ||
            article.content.toLowerCase().includes(keyword)
        );

        displayArticles(results);
    } catch (error) {
        console.error('搜尋文章失敗:', error);
        showErrorMessage('搜尋文章失敗，請稍後再試。');
    }
}

// 顯示錯誤訊息
export function showErrorMessage(message) {
    const searchResultLists = document.querySelector('.search-result-lists');
    searchResultLists.innerHTML = `<div style="text-align: center; color: red;">${message}</div>`;
}

// 假設的獲取當前用戶ID的函數
export function getCurrentUserId() {
    // 根據你的應用程序邏輯，返回當前用戶的ID
    // 例如，從localStorage中獲取
    return localStorage.getItem('userId');
} 