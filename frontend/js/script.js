$(function() {
	setScroll();
	setSlider();
	setCheckboxListToggle();
	removeUploadImg();
});

var windWidth = $(window).width();//抓螢幕的寬度

function readURL(input,id) {
	if (input.files && input.files[0]) {
		var reader = new FileReader();

		reader.onload = function (e) {
			$(id).attr('src', e.target.result)	
			$(id).parent().parent().removeClass('img-upload');
		};
		reader.readAsDataURL(input.files[0]);
		
	}
}
function removeUploadImg(){
	if($('.upload-list .sub-item .box .btn-close').length>0){
		$('.upload-list .sub-item .box .btn-close').click(function(){
			$(this).parent().parent().remove();
		});
	}
}
function setCheckboxListToggle(){
	if($('.checkbox-list .sub-item .checkbox-container').length>0){
		$('.checkbox-list .sub-item').each(function(){
			
			$(this).find('.checkbox-container').click(function(){
				$(this).toggleClass('active');
			});
		});
	}
}
function setScroll() {
	$(window).scroll(function() {
			var scrollVal = $(this).scrollTop();
			if (scrollVal > 100) {
					$('body').addClass('scroll');
			} else {
					$('body').removeClass('scroll');
			}
	});
}

function setSlider() {
	if($('.owl-home-banner').length>0){
		$('.owl-home-banner').owlCarousel({
			items:1,
			merge:true,
			loop:true,
			margin:0,
			dots:true
			
		})
	}
	if($('.owl-welcome-banner').length>0){
		$('.owl-welcome-banner').owlCarousel({
			items:1,
			merge:true,
			loop:true,
			margin:0,
			dots:true
			
		})
	}
	


}


