import { API_BASE_URL } from './config.js';
import { isLoggedIn, getCurrentUserId } from './auth.js';
import { uploadImage, deleteImage, compressImage } from './misc.js';
import { formatPublishedDate, fetchArticles } from './misc.js';
import { readURL, getSelectedTags, addTag } from './post.js';
import { showLoading, hideLoading } from './loading.js';

class Editor {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return;
        }

        // 初始化編輯器相關的事件監聽器
        this.setupEventListeners();

        this.initialized = true;
    }
}

// 獲取 URL 中的 id 參數以判斷是否為編輯模式
const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');
const editMode = !!articleId;

// 儲存原始的圖片網址
let originalImageUrl = '';

// 設定頁面標題和表單標題
document.addEventListener('DOMContentLoaded', async () => {
    if (editMode) {
        document.getElementById('page-title').innerText = '編輯文章 - Ausexticity';
        document.getElementById('form-heading').innerText = '編輯文章';
        await fetchArticleDetails(articleId);
    } else {
        document.getElementById('page-title').innerText = '發文 - Ausexticity';
        document.getElementById('form-heading').innerText = '發文';
    }

    const submitButton = document.getElementById('submit-button');
    if (editMode) {
        submitButton.innerText = '更新文章';
        submitButton.onclick = updateArticle;
    } else {
        submitButton.innerText = '提交';
        submitButton.onclick = submitArticle;
    }

    // 檢查登入狀態
    if (!await isLoggedIn()) {
        alert('請先登入。');
        window.location.href = 'login.html';
        return;
    }

    // 初始化編輯器
    const editor = new Editor();
    await editor.initialize();
});

// 獲取文章詳細資料以進行編輯
export async function fetchArticleDetails(id) {
    if (!await isLoggedIn()) {
        alert('您尚未登入，請先登入。');
        window.location.href = 'login.html';
        return;
    }

    showLoading();
    try {
        const articles = await fetchArticles(true);
        const userArticles = articles.filter(article => article.id === id);

        if (userArticles.length === 0) {
            alert('找不到指定的文章。');
            window.location.href = 'search.html?edit=true';
            return;
        }
        populateForm(userArticles[0]);
    } finally {
        hideLoading();
    }
}

// 填充表單資料
export function populateForm(article) {
    document.getElementById('title').value = article.title;
    document.getElementById('content').value = article.content;

    // 設定類別，如果沒有類別則預設為一般文章
    const categorySelect = document.getElementById('category');
    if (article.category) {
        categorySelect.value = article.category;
    } else {
        categorySelect.value = '一般文章';
    }

    // 設定標籤
    if (article.tags) {
        article.tags.forEach(tag => addTag(tag));
    }

    // 設定圖片預覽
    if (article.image_url) {
        $('#uploadImage').attr('src', article.image_url).parent().css('display', 'block'); // 顯示現有圖片
        $('#image-upload').parent().css('display', 'block'); // 顯示上傳按鈕
        $('#image-upload').val(''); // 清空文件輸入
        $('#image-url').val(article.image_url); // 設定圖片網址
        originalImageUrl = article.image_url; // 儲存原始圖片網址
    } else {
        $('#uploadImage').attr('src', 'images/default_detail_img.png').parent().css('display', 'none'); // 隱藏圖片預覽
        $('#image-upload').parent().css('display', 'block'); // 顯示上傳按鈕
        $('#image-url').val(''); // 清空圖片網址
        originalImageUrl = ''; // 無原始圖片
    }
}

// 發布新文章
export async function submitArticle() {
    if (!await isLoggedIn()) {
        alert('您尚未登入，請先登入。');
        window.location.href = 'login.html';
        return;
    }

    showLoading();
    try {
        const title = document.getElementById('title').value.trim();
        const content = document.getElementById('content').value.trim();
        const tags = getSelectedTags();
        const category = document.getElementById('category').value;
        const imageInput = document.getElementById('image-upload');
        const imageUrlInput = document.getElementById('image-url');
        let imageUrl = '';

        // 檢查是否有圖片網址
        if (imageUrlInput.value.trim()) {
            imageUrl = imageUrlInput.value.trim();
        }
        // 若沒有圖片網址但有選取圖片，則進行壓縮後上傳
        else if (imageInput.files && imageInput.files[0]) {
            const compressedFile = await compressImage(imageInput.files[0]);
            imageUrl = await uploadImage(compressedFile);
        }

        const userId = getCurrentUserId(); // 獲取當前用戶ID

        if (!title || !content) {
            alert('請填寫所有必填欄位');
            hideLoading();
            return;
        }

        const article = {
            title,
            content,
            tags,
            image_url: imageUrl,
            user_id: userId,
            category
        };

        const response = await fetch(`${API_BASE_URL}/api/articles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            },
            body: JSON.stringify(article)
        });

        if (response.status === 201) {
            alert('文章發布成功');
            const data = await response.json();
            const newArticleId = data.id;
            await fetchArticles(true);
            window.location.href = `article_detail.html?id=${newArticleId}`;
        } else {
            const data = await response.json();
            alert(`發布失敗: ${data.detail}`);
            hideLoading();
        }
    } catch (error) {
        console.error('錯誤:', error);
        alert('發布文章時發生錯誤');
        hideLoading();
    }
}

// 更新現有文章
export async function updateArticle() {
    if (!await isLoggedIn()) {
        alert('您尚未登入，請先登入。');
        window.location.href = 'login.html';
        return;
    }

    showLoading();
    try {
        const title = document.getElementById('title').value.trim();
        const content = document.getElementById('content').value.trim();
        const tags = getSelectedTags();
        const category = document.getElementById('category').value;
        const imageInput = document.getElementById('image-upload');
        const imageUrlInput = document.getElementById('image-url');
        let imageUrl = originalImageUrl; // 預設使用原始圖片網址

        // 檢查是否有新的圖片網址，如果有則使用新的圖片網址
        if (imageUrlInput.value.trim()) {
            imageUrl = imageUrlInput.value.trim();
        }
        // 若沒有新的圖片網址但有選取新圖片，則進行壓縮後上傳
        else if (imageInput.files && imageInput.files[0]) {
            const compressedFile = await compressImage(imageInput.files[0]);
            const uploadedImageUrl = await uploadImage(compressedFile);
            if (uploadedImageUrl) {
                imageUrl = uploadedImageUrl;
            } else {
                alert('圖片上傳失敗，請稍後再試。');
                return;
            }
        }

        const userId = getCurrentUserId(); // 獲取當前用戶ID

        if (!title || !content) {
            alert('請填寫所有必填欄位');
            hideLoading();
            return;
        }

        const article = {
            title,
            content,
            tags,
            image_url: imageUrl,
            user_id: userId,
            category
        };

        const response = await fetch(`${API_BASE_URL}/api/articles/${articleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('idToken')}`
            },
            body: JSON.stringify(article)
        });

        if (response.status === 200) {
            // 若更換圖片（不論是使用 URL 或上傳新檔案），且原本有圖片，則刪除舊圖片
            if (originalImageUrl && originalImageUrl !== imageUrl) {
                await deleteImage(originalImageUrl);
            }
            alert('文章更新成功');
            await fetchArticles(true);
            window.location.href = `article_detail.html?id=${articleId}`;
        } else {
            const data = await response.json();
            alert(`更新失敗: ${data.detail}`);
            hideLoading();
        }
    } catch (error) {
        console.error('錯誤:', error);
        alert('更新文章時發生錯誤');
        hideLoading();
    }
}
