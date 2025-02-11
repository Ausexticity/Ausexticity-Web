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

// 檢查圖片比例
async function checkImageAspectRatio(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function () {
            const aspectRatio = this.width / this.height;
            resolve(aspectRatio >= 1.5 ? 'wide' : 'tall');
        };
        img.onerror = function () {
            resolve('wide'); // 預設使用寬版布局
        };
        img.src = imageUrl;
    });
}

// 生成漸層樣式
function generateGradientStyle(isWide = true) {
    const r = 149, g = 68, b = 39; // 使用預設顏色
    if (isWide) {
        return `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.95) 70%, rgba(${r}, ${g}, ${b}, 0) 100%)`;
    } else {
        return `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.95) 70%, rgba(${r - 20}, ${g - 20}, ${b - 20}, 0.95) 100%)`;
    }
}

// 生成圖片覆蓋層樣式
function generateOverlayStyle() {
    const r = 149, g = 68, b = 39; // 使用預設顏色
    return `linear-gradient(90deg, rgba(${r}, ${g}, ${b}, 0.3) 0%, rgba(${r}, ${g}, ${b}, 0) 100%)`;
}

function initializeBanner(articles) {
    const bannerSlider = document.getElementById('bannerSlider');
    const bannerControls = document.getElementById('bannerControls');
    const newsArticles = articles
        .filter(article => article.category === "新聞")
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
        .slice(0, 4); // 只顯示前4篇新聞

    if (!bannerSlider || !bannerControls) return;

    // 清空現有內容
    bannerSlider.innerHTML = '';
    bannerControls.innerHTML = '';

    // 創建輪播項目
    const createSlides = async () => {
        // 判斷是否為手機畫面（螢幕寬度小於或等於 576px）
        const isMobile = window.matchMedia("(max-width: 576px)").matches;
        const isMobile375 = window.matchMedia("(max-width: 375px)").matches;
        // 根據畫面尺寸設定截取長度，手機版比桌機截取更短
        const titleLimit = isMobile375 ? 10 : isMobile ? 15 : 20;
        const contentLimitWide = isMobile375 ? 50 : isMobile ? 70 : 100;
        const contentLimitTall = isMobile375 ? 70 : isMobile ? 90 : 150;

        for (let [index, article] of newsArticles.entries()) {
            const slide = document.createElement('div');
            slide.className = 'banner-slide';

            const imageUrl = article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png';
            // 如果在手機版，直接使用 wide 的版型
            const layoutType = isMobile ? 'wide' : await checkImageAspectRatio(imageUrl);

            // 根據圖片比例設置不同的布局
            if (layoutType === 'wide') {
                const gradientStyle = generateGradientStyle(true);
                slide.innerHTML = `
                    <div class="wide-layout">
                        <div class="background-image" style="background-image: url(${imageUrl});">
                            <div class="content-overlay" style="background: ${gradientStyle}">
                                <a href="article_detail.html?id=${article.id}">
                                    <h1>${truncateTitle(article.title, titleLimit)}</h1>
                                    <p>${article.content ? truncateTitle(article.content, contentLimitWide) : '內文內文內文內文 內文內文內文'}</p>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const gradientStyle = generateGradientStyle(false);
                const overlayStyle = generateOverlayStyle();
                slide.innerHTML = `
                    <div class="tall-layout">
                        <div class="content-side" style="background: ${gradientStyle}">
                            <a href="article_detail.html?id=${article.id}">
                                <h1>${truncateTitle(article.title, titleLimit)}</h1>
                                <p>${article.content ? truncateTitle(article.content, contentLimitTall) : '內文內文內文內文 內文內文內文'}</p>
                            </a>
                        </div>
                        <div class="image-side" style="background-image: url(${imageUrl});">
                            <div class="image-overlay" style="background: ${overlayStyle}"></div>
                        </div>
                    </div>
                `;
            }

            bannerSlider.appendChild(slide);

            // 創建控制點
            const dot = document.createElement('div');
            dot.className = 'banner-dot' + (index === 0 ? ' active' : '');
            dot.onclick = () => window.goToSlide(index);
            bannerControls.appendChild(dot);
        }
    };

    createSlides();
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