import { API_BASE_URL } from './config.js';
import { fetchArticles } from './misc.js';

let articles = [];
let popularTags = [];
let searchContainer = document.querySelector('.search-container');
let searchInput = document.querySelector('#navSearchInput');
let isSearchExpanded = false;
let suggestionsHideTimeout;

// 初始化搜尋功能
async function initializeSearch() {
    const searchInput = document.getElementById('navSearchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    const navSearchButton = document.getElementById('navSearchButton');
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

    // 處理搜尋導向函數
    function handleSearch(e) {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }

    // 監聽按下 Enter 鍵
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    });

    // 監聽搜尋按鈕點擊事件
    navSearchButton.addEventListener('click', function (e) {
        if (window.innerWidth <= 576) {
            toggleSearch(e);
        } else {
            handleSearch(e);
        }
    });

    // 監聽搜尋框焦點
    searchInput.addEventListener('focus', () => {
        if (suggestionsDiv) {
            suggestionsDiv.style.display = 'block';
            suggestionsDiv.classList.add('visible');
            // 如果沒有輸入內容，只顯示熱門標籤
            if (!searchInput.value.trim()) {
                if (autocompleteResultsDiv) {
                    autocompleteResultsDiv.innerHTML = '';
                }
            }
        }
    });

    // 監聽搜尋框失去焦點
    searchInput.addEventListener('blur', (e) => {
        // 若新的聚焦目標屬於推薦框或熱門標籤，就不要隱藏
        if (suggestionsDiv && e.relatedTarget &&
            (suggestionsDiv.contains(e.relatedTarget) || (popularTagsDiv && popularTagsDiv.contains(e.relatedTarget)))) {
            return;
        }
        suggestionsHideTimeout = setTimeout(() => {
            suggestionsDiv.style.display = 'none';
            suggestionsDiv.classList.remove('visible');
        }, 200);
    });

    // 監聽搜尋框點擊事件
    searchInput.addEventListener('click', (e) => {
        // 清除隱藏建議框的計時器，避免因失焦而隱藏建議框
        clearTimeout(suggestionsHideTimeout);
    });

    // 監聽搜尋結果點擊事件
    autocompleteResultsDiv.addEventListener('click', (e) => {
        // 清除隱藏建議框的計時器，避免因失焦而隱藏建議框
        clearTimeout(suggestionsHideTimeout);
    });

    // 監聽熱門標籤點擊事件
    popularTagsDiv.addEventListener('click', (e) => {
        // 清除隱藏建議框的計時器，避免因失焦而隱藏建議框
        clearTimeout(suggestionsHideTimeout);
    });

    // 處理搜尋框的展開收合
    function toggleSearch(e) {
        e && e.preventDefault();
        if (window.innerWidth <= 576) {
            if (!isSearchExpanded) {
                // 在手機上，將 "expanded" 類別加到搜尋容器上，使其展開
                searchContainer.classList.add('expanded');
                setTimeout(() => {
                    searchInput.focus();
                }, 100);
            } else {
                // 已展開時，根據事件來源判斷動作
                // 使用 closest 檢查 e.target 是否在搜尋按鈕內（考量到可能點擊到內部元素）
                const triggeredBySearchButton = e && e.target && ((e.target.id === 'navSearchButton') || (e.target.closest && e.target.closest('#navSearchButton')));
                if (triggeredBySearchButton) {
                    // 如果點擊來源為搜尋按鈕，且輸入框有內容，就送出搜尋
                    const query = searchInput.value.trim();
                    if (query) {
                        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
                        return;
                    }
                }
                // 其他情況視為取消搜尋：僅移除展開狀態並清空輸入
                searchContainer.classList.remove('expanded');
                searchInput.value = '';
                const suggestionsDiv = document.getElementById('searchSuggestions');
                if (suggestionsDiv) {
                    suggestionsDiv.classList.remove('visible');
                }
            }
            isSearchExpanded = !isSearchExpanded;
        }
    }

    // 監聽文檔點擊事件
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 576) {
            const suggestionsDiv = document.getElementById('searchSuggestions');
            if (isSearchExpanded &&
                !searchContainer.contains(e.target) &&
                (!suggestionsDiv || !suggestionsDiv.contains(e.target))) {
                toggleSearch(e);
            }
        }
    });

    // 監聽 ESC 鍵事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isSearchExpanded) {
            toggleSearch(e);
        }
    });

    // 監聽視窗大小變化事件
    window.addEventListener('resize', () => {
        if (window.innerWidth > 576) {
            searchContainer.classList.remove('expanded');
            const suggestionsDiv = document.getElementById('searchSuggestions');
            if (suggestionsDiv) {
                suggestionsDiv.classList.remove('visible');
            }
            isSearchExpanded = false;
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
        // 加入 tabindex="0" 讓熱門標籤可聚焦
        .map(tag => `<span tabindex="0" onclick="handleTagClick('${tag}')">${tag}</span>`)
        .join('');
}

// 處理搜尋輸入
function handleSearchInput(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    const suggestionsDiv = document.getElementById('searchSuggestions');
    const autocompleteResultsDiv = document.getElementById('autocompleteResults');

    if (!suggestionsDiv || !autocompleteResultsDiv) return;

    if (searchTerm.length === 0) {
        autocompleteResultsDiv.innerHTML = '';
        return;
    }

    // 搜尋文章
    const matchingArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm) ||
        (Array.isArray(article.tags) && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    ).slice(0, 5);

    // 顯示搜尋結果，修改後使結果項目變成可聚焦 (加入 tabindex="0")
    if (matchingArticles.length > 0) {
        autocompleteResultsDiv.innerHTML = matchingArticles
            .map(article => `
                <div class="result-item" tabindex="0" onclick="window.location.href='article_detail.html?id=${article.id}'">
                    <div class="title">${highlightMatch(article.title, searchTerm)}</div>
                    <div class="preview">${getContentPreview(article.content, searchTerm)}</div>
                </div>
            `)
            .join('');
    } else {
        autocompleteResultsDiv.innerHTML = '<div class="no-results">沒有找到相關文章</div>';
    }
}

// 標籤點擊處理
window.handleTagClick = function (tag) {
    // 清除隱藏建議框的計時器，避免因失焦而隱藏建議框
    clearTimeout(suggestionsHideTimeout);
    const searchInput = document.getElementById('navSearchInput');
    searchInput.value = tag;
    searchInput.focus();
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

// 新增功能: 當點擊搜尋按鈕時，切換搜尋框的展開狀態，並使其佔滿整個 header 的寬度
(function () {
    var searchButton = document.querySelector('.nav-search-btn');
    var searchInput = document.querySelector('.nav-search-input');
    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function (e) {
            e.preventDefault();
            // 切換 expanded 類別
            searchInput.classList.toggle('expanded');
            if (searchInput.classList.contains('expanded')) {
                searchInput.focus();
            }
        });
    }
})();

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    initializeSearch();
});