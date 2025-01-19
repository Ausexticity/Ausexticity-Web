import { updateHeader, fetchArticles } from './misc.js';
import { API_BASE_URL } from './config.js';

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
		var reader = new FileReader();

		reader.onload = function (e) {
			$(id).attr('src', e.target.result);
			$(id).parent().css('display', 'block'); // 顯示圖片預覽
			$('#image-upload').css('display', 'block'); // 確保上傳按鈕可見
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
			// 如果文章有標籤，將標籤添加到 allTags 集合中 如果文章沒有標籤，則跳過

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
function addTag(tag) {
	if (!selectedTags.has(tag)) {
		selectedTags.add(tag);
		updateSelectedTags();
		document.getElementById('tags').value = '';
		document.getElementById('tagSuggestions').style.display = 'none';
	}
}

// 移除標籤
function removeTag(tag) {
	selectedTags.delete(tag);
	updateSelectedTags();
}

// 更新已選擇的標籤顯示
function updateSelectedTags() {
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
function updatePopularTags() {
	const popularTags = Array.from(allTags).slice(0, 8); // 顯示前8個標籤
	const container = document.getElementById('popularTags');
	container.innerHTML = popularTags
		.map(tag => `<div class="tag">${tag}</div>`)
		.join('');
}

// 其他原有的代碼...
// ... existing code ...

// 將需要在全域使用的函數掛載到 window 對象上
window.readURL = readURL;
window.removeImage = removeImage;
window.previewArticle = previewArticle;
window.removeTag = removeTag;
window.handleTagInput = handleTagInput;
window.handleTagKeydown = handleTagKeydown;

// 在文檔加載完成後初始化
document.addEventListener('DOMContentLoaded', () => {
	updateHeader();
	initializeTags();

	// 綁定刪除圖片按鈕的點擊事件
	$('#remove-image').click(function () {
		removeImage('#uploadImage');
	});

	// 綁定圖片上傳的變更事件
	$('#image-upload').change(function () {
		readURL(this, '#uploadImage');
	});
});

// 定義其他需要的函數，如 previewArticle
export function previewArticle() {
	const title = document.getElementById('title').value.trim();
	const content = document.getElementById('content').value.trim();
	const categories = getSelectedCategories();
	const imageUrl = document.getElementById('uploadImage').src;

	const previewWindow = window.open('', '_blank');
	previewWindow.document.write(`
		<html>
			<head>
				<title>${title}</title>
				<link rel="stylesheet" href="css/main.css">
			</head>
			<body>
				<h1>${title}</h1>
				<img src="${imageUrl}" alt="文章圖片" style="max-width:100%;">
				<div>${content.replace(/\n/g, '<br>')}</div>
				<div>類別: ${categories.join(', ')}</div>
			</body>
		</html>
	`);
	previewWindow.document.close();
}

export function getSelectedCategories() {
	const categories = [];
	if (document.getElementById('category_health').checked) categories.push('衛教知識');
	if (document.getElementById('category_fun').checked) categories.push('樂趣玩法');
	if (document.getElementById('category_experience').checked) categories.push('經驗分享');
	if (document.getElementById('category_other').checked) categories.push('其他');
	return categories;
}
// 如果有其他需要在 HTML 中調用的函數，依此類推

