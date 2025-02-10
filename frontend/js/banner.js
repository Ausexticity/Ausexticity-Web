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

// 檢查圖片的長寬比並返回適當的布局類別
async function checkImageAspectRatio(imageUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const aspectRatio = this.width / this.height;
            // 如果寬度大於高度（寬的圖片）
            if (aspectRatio > 1.2) {
                resolve('wide');
            } 
            // 如果高度大於寬度（長的圖片）
            else if (aspectRatio < 0.8) {
                resolve('tall');
            }
            // 接近正方形的圖片
            else {
                resolve('square');
            }
        };
        img.onerror = function() {
            // 如果圖片載入失敗，預設使用寬的布局
            resolve('wide');
        };
        img.src = imageUrl;
    });
}

// 分析圖片並獲取主要顏色
async function getImageDominantColor(imageElement) {
    try {
        const colorThief = new ColorThief();
        const color = colorThief.getColor(imageElement);
        return color;
    } catch (error) {
        console.error('無法分析圖片顏色:', error);
        return [149, 68, 39]; // 預設顏色
    }
}

// 將 RGB 顏色轉換為帶透明度的 rgba 格式
function rgbaFromRgb(r, g, b, alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 生成漸層樣式
function generateGradientStyle(color, isWide = true) {
    const [r, g, b] = color;
    if (isWide) {
        return `linear-gradient(90deg, ${rgbaFromRgb(r, g, b, 0.95)} 70%, ${rgbaFromRgb(r, g, b, 0)} 100%)`;
    } else {
        return `linear-gradient(90deg, ${rgbaFromRgb(r, g, b, 0.95)} 70%, ${rgbaFromRgb(r - 20, g - 20, b - 20, 0.95)} 100%)`;
    }
}

// 生成圖片覆蓋層樣式
function generateOverlayStyle(color) {
    const [r, g, b] = color;
    return `linear-gradient(90deg, ${rgbaFromRgb(r, g, b, 0.3)} 0%, ${rgbaFromRgb(r, g, b, 0)} 100%)`;
}

function initializeBanner(articles) {
    const bannerSlider = document.getElementById('bannerSlider');
    const bannerControls = document.getElementById('bannerControls');
    const newsArticles =articles
    .filter(article => article.category === "新聞")
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 4); // 只顯示前4篇新聞
    
    if (!bannerSlider || !bannerControls) return;

    // 清空現有內容
    bannerSlider.innerHTML = '';
    bannerControls.innerHTML = '';
    
    // 創建輪播項目
    const createSlides = async () => {
        for (let [index, article] of newsArticles.entries()) {
            const slide = document.createElement('div');
            slide.className = 'banner-slide';
            
            const imageUrl = article.image_url || 'images/pexels-aryane-vilarim-2869078-1.png';
            const layoutType = await checkImageAspectRatio(imageUrl);
            
            // 創建臨時圖片元素用於分析顏色
            const tempImg = document.createElement('img');
            tempImg.style.display = 'none';
            tempImg.crossOrigin = 'anonymous';  // 添加 crossOrigin 屬性
            
            // 修改 Firebase Storage URL
            if (imageUrl.includes('firebasestorage.googleapis.com')) {
                tempImg.src = `${imageUrl}?alt=media`;
            } else {
                tempImg.src = imageUrl;
            }
            
            document.body.appendChild(tempImg);
            
            // 等待圖片載入完成
            const dominantColor = await new Promise((resolve) => {
                tempImg.onload = async () => {
                    try {
                        const color = await getImageDominantColor(tempImg);
                        resolve(color);
                    } catch (error) {
                        console.error('無法分析圖片顏色:', error);
                        resolve([149, 68, 39]); // 預設顏色
                    }
                };
                tempImg.onerror = () => {
                    console.error('圖片載入失敗');
                    resolve([149, 68, 39]); // 預設顏色
                };
            });
            
            // 移除臨時圖片
            document.body.removeChild(tempImg);
            
            // 根據圖片比例設置不同的布局
            if (layoutType === 'wide') {
                const gradientStyle = generateGradientStyle(dominantColor, true);
                slide.innerHTML = `
                    <div class="wide-layout">
                        <div class="background-image" style="background-image: url(${imageUrl});">
                            <div class="content-overlay" style="background: ${gradientStyle}">
                                <a href="article_detail.html?id=${article.id}">
                                    <h1>${truncateTitle(article.title, 20)}</h1>
                                    <p>${article.content ? truncateTitle(article.content, 100) : '內文內文內文內文 內文內文內文'}</p>
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                const gradientStyle = generateGradientStyle(dominantColor, false);
                const overlayStyle = generateOverlayStyle(dominantColor);
                slide.innerHTML = `
                    <div class="tall-layout">
                        <div class="content-side" style="background: ${gradientStyle}">
                            <a href="article_detail.html?id=${article.id}">
                                <h1>${truncateTitle(article.title, 20)}</h1>
                                <p>${article.content ? truncateTitle(article.content, 150) : '內文內文內文內文 內文內文內文'}</p>
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