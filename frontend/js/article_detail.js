import { fetchArticles, formatPublishedDate, truncateTitle } from './misc.js';

// 配置 marked.js
marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-',
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartypants: false,
    xhtml: false
});

// 渲染文章內容（含圖片、日期、標題、標籤、Markdown 內容）
function renderArticle(article) {
    // 透過 marked.js 解析 Markdown 內容
    const contentHtml = marked.parse(article.content);

    const articleHtml = `
        <div class="item">
            <div class="col01">
                <img src="${article.image_url || 'images/default_detail_img.png'}" alt="文章圖片">
            </div>
            <div class="col02">
                <h5 class="article-date">${formatPublishedDate(article.published_at)}</h5>
                <h2 class="article-title">${article.title}</h2>
                <div class="tags">
                    ${article.tags ? article.tags.map(tag =>
        `<span class="tag" onclick="window.location.href='search.html?q=${encodeURIComponent(tag)}'">${tag}</span>`
    ).join('') : ''}
                </div>
                <div class="article-content markdown-body">
                    ${contentHtml}
                </div>
            </div>
        </div>
    `;

    // 將組合好的 HTML 插入到文章內容容器中
    document.getElementById('article-content').innerHTML = articleHtml;

    // 初始化程式碼高亮（針對預先由 marked.js 生成的程式碼區塊）
    document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightBlock(block);
    });
}

// 異步載入文章詳情
async function loadArticleDetail() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');

        if (!articleId) {
            console.error('沒有提供文章 ID');
            showErrorMessage('沒有提供文章 ID');
            return;
        }

        // 載入所有文章資料
        const articles = await fetchArticles();
        const articleIndex = articles.findIndex(a => a.id === articleId);

        if (articleIndex === -1) {
            console.error('找不到對應的文章');
            showErrorMessage('找不到對應的文章');
            return;
        }

        const article = articles[articleIndex];
        // 透過 renderArticle() 渲染文章內容
        renderArticle(article);

        // 設定 BACK 與 NEXT 按鈕
        const backButton = document.getElementById('back-button');
        const nextButton = document.getElementById('next-button');

        if (articleIndex > 0) {
            const prevArticle = articles[articleIndex - 1];
            backButton.href = `article_detail.html?id=${prevArticle.id}`;
            backButton.innerHTML = `<i class="fa-solid fa-arrow-left"></i> ${truncateTitle(prevArticle.title)}`;
            backButton.setAttribute('aria-label', `返回上一篇文章：${prevArticle.title}`);
        } else {
            backButton.style.display = 'none';
        }

        if (articleIndex < articles.length - 1) {
            const nextArticle = articles[articleIndex + 1];
            nextButton.href = `article_detail.html?id=${nextArticle.id}`;
            nextButton.innerHTML = `${truncateTitle(nextArticle.title)} <i class="fa-solid fa-arrow-right"></i>`;
            nextButton.setAttribute('aria-label', `前往下一篇文章：${nextArticle.title}`);
        } else {
            nextButton.style.display = 'none';
        }

    } catch (error) {
        console.error('載入文章詳情失敗:', error);
        showErrorMessage('載入文章詳情失敗，請稍後再試。');
    }
}

// 顯示錯誤訊息
function showErrorMessage(message) {
    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = `
        <div class="error-message" style="color: red; text-align: center;">
            <p>${message}</p>
        </div>
    `;
    const backButton = document.getElementById('back-button');
    if (backButton) backButton.style.display = 'none';
    const nextButton = document.getElementById('next-button');
    if (nextButton) nextButton.style.display = 'none';
}

// 初始化 - 等 DOM 載入完成後進行文章載入
document.addEventListener('DOMContentLoaded', () => {
    loadArticleDetail();
}); 