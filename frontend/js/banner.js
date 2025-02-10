import { truncateTitle } from './misc.js';

let currentSlide = 0;
let slideInterval;
const slideDelay = 5000; // 5秒切換一次

// 將這些函數設置為全局函數
window.prevSlide = function () {
    const slides = document.querySelectorAll('.banner-slide');
    if (!slides.length) return;

    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlide();
    resetSlideShow();
}

window.nextSlide = function () {
    const slides = document.querySelectorAll('.banner-slide');
    if (!slides.length) return;

    currentSlide = (currentSlide + 1) % slides.length;
    updateSlide();
    resetSlideShow();
}

window.goToSlide = function (index) {
    const slides = document.querySelectorAll('.banner-slide');
    if (!slides.length || index < 0 || index >= slides.length) return;

    currentSlide = index;
    updateSlide();
    resetSlideShow();
}

function initializeBanner(articles) {
    const bannerSlider = document.getElementById('bannerSlider');
    const bannerControls = document.getElementById('bannerControls');

    // 過濾新聞類別的文章，並按發布時間排序，取前4篇
    const newsArticles = articles
        .filter(article => article.category === "新聞")
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
        .slice(0, 4);

    // 創建輪播項目
    newsArticles.forEach((article, index) => {
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        slide.innerHTML = `
            <div class="two-cols">
                <div class="col01">
                    <a href="article_detail.html?id=${article.id}">
                        <div class="img" style="background-image: url(${article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png'});">
                        </div>
                    </a>
                </div>
                <div class="col02">
                    <a href="article_detail.html?id=${article.id}">
                        <h1>${truncateTitle(article.title, 8)}</h1>
                        <p>${article.content ? truncateTitle(article.content, 100) : '內文內文內文內文 內文內文內文'}</p>
                    </a>
                </div>
            </div>
        `;
        bannerSlider.appendChild(slide);

        // 創建控制點
        const dot = document.createElement('div');
        dot.className = 'banner-dot' + (index === 0 ? ' active' : '');
        dot.onclick = () => window.goToSlide(index);
        bannerControls.appendChild(dot);
    });

    // 開始自動輪播
    startSlideShow();
}

function updateSlide() {
    const slider = document.getElementById('bannerSlider');
    const dots = document.querySelectorAll('.banner-dot');
    const slides = document.querySelectorAll('.banner-slide');

    if (!slider || !dots.length || !slides.length) return;

    // 更新輪播位置
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;

    // 更新控制點狀態
    dots.forEach((dot, index) => {
        dot.className = 'banner-dot' + (index === currentSlide ? ' active' : '');
    });
}

function startSlideShow() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(window.nextSlide, slideDelay);
}

function resetSlideShow() {
    startSlideShow();
}

// 當滑鼠懸停在輪播上時暫停自動播放
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.querySelector('.home-banner');
    if (!banner) return;

    banner.addEventListener('mouseenter', () => {
        if (slideInterval) clearInterval(slideInterval);
    });

    banner.addEventListener('mouseleave', startSlideShow);
});

export { initializeBanner }; 