import { API_BASE_URL } from './config.js';
import { fetchArticles } from './misc.js';

let articles = [];
let popularTags = [];

// 初始化搜尋功能
async function initializeSearch() {
    const searchInput = document.getElementById('navSearchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    const popularTagsDiv = document.getElementById('popularTags');
    const autocompleteResultsDiv = document.getElementById('autocompleteResults');

    // 載入文章數據
    try {
        articles = await fetchArticles();
        generatePopularTags();
    } catch (error) {
        console.error('無法載入文章:', error);
    }

    // 顯示熱門標籤
    displayPopularTags();

    // 監聽搜尋輸入
    searchInput.addEventListener('input', debounce(handleSearchInput, 300));

    // 監聽點擊事件以關閉建議框
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });

    // 監聽搜尋框焦點
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim() || popularTags.length > 0) {
            suggestionsDiv.style.display = 'block';
        }
    });
}

// 生成熱門標籤
function generatePopularTags() {
    const tagCount = {};
    articles.forEach(article => {
        if (Array.isArray(article.tags)) {
            article.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        } else {
            console.warn(`文章 ID ${article.id} 沒有標籤或標籤格式錯誤。`);
        }
    });

    // 將標籤按頻率排序，取前五個作為熱門標籤
    popularTags = Object.keys(tagCount)
        .sort((a, b) => tagCount[b] - tagCount[a])
        .slice(0, 5);
}

// 顯示熱門標籤
function displayPopularTags() {
    const popularTagsDiv = document.getElementById('popularTags');
    if (!popularTagsDiv) {
        console.warn('找不到 ID 為 "popularTags" 的元素。請確認 HTML 中存在該元素。');
        return;
    }
    popularTagsDiv.innerHTML = popularTags
        .map(tag => `<span onclick="handleTagClick('${tag}')">${tag}</span>`)
        .join('');
}

// 處理搜尋輸入
function handleSearchInput(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    const suggestionsDiv = document.getElementById('searchSuggestions');
    const autocompleteResultsDiv = document.getElementById('autocompleteResults');

    if (searchTerm.length === 0) {
        autocompleteResultsDiv.innerHTML = '';
        suggestionsDiv.style.display = popularTags.length > 0 ? 'block' : 'none';
        return;
    }

    // 搜尋文章
    const matchingArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        (Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    ).slice(0, 5);

    // 顯示搜尋結果
    if (matchingArticles.length > 0) {
        autocompleteResultsDiv.innerHTML = matchingArticles
            .map(article => `
                <div class="result-item" onclick="window.location.href='article_detail.html?id=${article.id}'">
                    <div class="title">${highlightMatch(article.title, searchTerm)}</div>
                    <div class="preview">${getContentPreview(article.content, searchTerm)}</div>
                </div>
            `)
            .join('');
        suggestionsDiv.style.display = 'block';
    } else {
        autocompleteResultsDiv.innerHTML = '<div class="no-results">沒有找到相關文章</div>';
        suggestionsDiv.style.display = 'block';
    }
}

// 標籤點擊處理
window.handleTagClick = function (tag) {
    const searchInput = document.getElementById('navSearchInput');
    searchInput.value = tag;
    searchInput.dispatchEvent(new Event('input'));
};

// 高亮匹配文字
function highlightMatch(text, searchTerm) {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// 獲取內容預覽
function getContentPreview(content, searchTerm) {
    const maxLength = 50;
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return content.slice(0, maxLength) + '...';

    const start = Math.max(0, index - 20);
    const end = Math.min(content.length, index + 30);
    return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

// 防抖函數
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 初始化
document.addEventListener('DOMContentLoaded', initializeSearch); 