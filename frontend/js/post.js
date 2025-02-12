import { updateHeader, fetchArticles } from './misc.js';
import { API_BASE_URL } from './config.js';
import { initializeLoading, showLoading, hideLoading } from './loading.js';

var windWidth = $(window).width();//抓螢幕的寬度

let selectedTags = new Set();
let allTags = new Set();

// 獲取所有已選擇的標籤
export function getSelectedTags() {
	return Array.from(selectedTags);
}

// 讀取圖片並顯示預覽
export function readURL(input, id) {
	if (input.files && input.files[0]) {
		console.log('讀取圖片: ', input.files[0]);
		showLoading();
		var reader = new FileReader();

		reader.onload = function (e) {
			$(id).attr('src', e.target.result);
			$(id).parent().css('display', 'block'); // 顯示圖片預覽
			$('#image-upload').css('display', 'block'); // 確保上傳按鈕可見
			hideLoading();
		};
		reader.readAsDataURL(input.files[0]);
	}
}

// 移除上傳的圖片
export function removeImage(id) {
	$(id).attr('src', 'images/default_detail_img.png').parent().css('display', 'none'); // 隱藏圖片預覽並重設為預設圖片
	$('#image-upload').val(''); // 清空文件輸入
}

// 切換勾選框列表
export function setCheckboxListToggle() {
	if ($('.checkbox-list .sub-item .checkbox-container').length > 0) {
		$('.checkbox-list .sub-item').each(function () {

			$(this).find('.checkbox-container').click(function () {
				$(this).toggleClass('active');
			});
		});
	}
}

// 設定滾動效果
export function setScroll() {
	$(window).scroll(function () {
		var scrollVal = $(this).scrollTop();
		if (scrollVal > 100) {
			$('body').addClass('scroll');
		} else {
			$('body').removeClass('scroll');
		}
	});
}

// 初始化標籤功能
async function initializeTags() {
	try {
		const articles = await fetchArticles();

		// 收集所有已使用的標籤
		articles.forEach(article => {
			if (article.tags && Array.isArray(article.tags)) {
				article.tags.forEach(tag => allTags.add(tag));
			}
		});

		// 顯示熱門標籤
		updatePopularTags();

		// 設置標籤輸入事件監聽
		const tagInput = document.getElementById('tags');
		tagInput.addEventListener('input', handleTagInput);
		tagInput.addEventListener('keydown', handleTagKeydown);

		// 點擊建議標籤事件
		document.getElementById('tagSuggestions').addEventListener('click', (e) => {
			if (e.target.classList.contains('suggestion')) {
				addTag(e.target.textContent);
			}
		});

		// 點擊熱門標籤事件
		document.getElementById('popularTags').addEventListener('click', (e) => {
			if (e.target.classList.contains('tag')) {
				addTag(e.target.textContent);
			}
		});

		// 初始化圖片URL輸入處理
		const imageUrlInput = document.getElementById('image-url');
		if (imageUrlInput) {
			// 移除原有的套用按鈕
			document.getElementById('apply-url')?.remove();

			// 添加 input 事件監聽器，實現即時預覽
			imageUrlInput.addEventListener('input', debounce(function (e) {
				const url = e.target.value.trim();
				if (url) {
					applyImageUrl(url);
				} else {
					// 如果輸入框為空，重置圖片預覽
					$('#uploadImage').attr('src', 'images/default_detail_img.png').parent().css('display', 'none');
				}
			}, 500)); // 500ms 的防抖延遲
		}
	} catch (error) {
		console.error('初始化標籤時發生錯誤:', error);
	}
}

// 處理標籤輸入
function handleTagInput(e) {
	const input = e.target;
	const value = input.value.trim();
	const suggestionsDiv = document.getElementById('tagSuggestions');

	if (value) {
		// 過濾並顯示建議標籤
		const suggestions = Array.from(allTags)
			.filter(tag => tag.toLowerCase().includes(value.toLowerCase()) && !selectedTags.has(tag))
			.slice(0, 5);

		if (suggestions.length > 0) {
			suggestionsDiv.innerHTML = suggestions
				.map(tag => `<div class="suggestion">${tag}</div>`)
				.join('');
			suggestionsDiv.style.display = 'block';
		} else {
			suggestionsDiv.style.display = 'none';
		}
	} else {
		suggestionsDiv.style.display = 'none';
	}
}

// 處理標籤輸入時的按鍵事件
function handleTagKeydown(e) {
	if (e.key === 'Enter' && e.target.value.trim()) {
		e.preventDefault();
		addTag(e.target.value.trim());
	}
}

// 添加標籤
export function addTag(tag) {
	if (!selectedTags.has(tag)) {
		selectedTags.add(tag);
		updateSelectedTags();
		document.getElementById('tags').value = '';
		document.getElementById('tagSuggestions').style.display = 'none';
	}
}

// 移除標籤
export function removeTag(tag) {
	selectedTags.delete(tag);
	updateSelectedTags();
}

// 更新已選擇的標籤顯示
export function updateSelectedTags() {
	const container = document.querySelector('.selected-tags');
	container.innerHTML = Array.from(selectedTags)
		.map(tag => `
			<div class="tag">
				${tag}
				<span class="remove" onclick="removeTag('${tag}')">&times;</span>
			</div>
		`)
		.join('');
}

// 更新熱門標籤顯示
export function updatePopularTags() {
	const popularTags = Array.from(allTags).slice(0, 8); // 顯示前8個標籤
	const container = document.getElementById('popularTags');
	container.innerHTML = popularTags
		.map(tag => `<div class="tag">${tag}</div>`)
		.join('');
}

// 處理圖片網址
export function applyImageUrl(url) {
	if (url) {
		$('#uploadImage').attr('src', url)
			.on('load', function () {
				$(this).parent().css('display', 'block');
				$('#image-upload').css('display', 'block');
				$('#image-url').val(url);
			})
			.on('error', function () {
				alert('圖片載入失敗，請檢查網址是否正確');
			});
	}
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

// 將需要在全域使用的函數掛載到 window 對象上
window.readURL = readURL;
window.removeImage = removeImage;
window.removeTag = removeTag;
window.handleTagInput = handleTagInput;
window.handleTagKeydown = handleTagKeydown;
window.applyImageUrl = applyImageUrl;

// 在文檔加載完成後初始化
document.addEventListener('DOMContentLoaded', async () => {
	await initializeLoading();
	updateHeader();
	await initializeTags();

	// 綁定刪除圖片按鈕的點擊事件
	$('#remove-image').click(function () {
		removeImage('#uploadImage');
		$('#image-url').val(''); // 清空網址輸入框
	});

	// 綁定圖片上傳的變更事件
	$('#image-upload').change(function () {
		readURL(this, '#uploadImage');
		$('#image-url').val(''); // 清空網址輸入框
	});
});
