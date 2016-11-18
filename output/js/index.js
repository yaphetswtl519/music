//数据接口地址
var dataUrl = '/data/data.json';

//音频管理对象
var audioManager;

//作用域
var $scope = $(document.body);

var $loadingLayer = $('.loading-layer');

//定义audio管理对象
var AudioManager = function(datalist) {
	this.datalist = datalist;

	this.index = 0;

	this.len = datalist.length;

	this.audio = new Audio();

	this.audio.preload = 'auto';
	this.duration = datalist[0].duration;
	this.setAudio();
	this.bindAudioEvent();
	this.autoplay = true;
}

AudioManager.prototype = {
	playNext: function() {
		this.index++;
		if(this.index === this.len) {
			this.index = 0;
		}
		this.setAudio();
	},
	playPrev: function() {	
		this.index--;
		if(this.index === -1) {
			this.index = this.len - 1;
		}
		this.setAudio();
	},
	playIndex: function(index) {
		this.index = index;
		this.setAudio();
	},
	setAudio: function() {
		//获取当前歌曲信息
		var data = this.datalist[this.index];
		this.duration = data.duration;
		this.audio.src = data.audio;

		//触发changeAudio事件
		$scope.trigger('changeAudio');
	},
	bindAudioEvent: function() {
		var _self = this;
		//ended 歌曲播放完毕后直接播放下一首
		$(this.audio).on('ended', function() {
			_self.playNext();
		})
		$(this.audio).on('loadedmetadata', function() {
			// console.log('hi')
			if(_self.autoplay) {
				this.play();
			}
			$loadingLayer.hide();
		})
	},
	play: function() {
		this.autoplay = true;
		this.audio.play();
	},
	pause: function() {
		this.autoplay = false;
		this.audio.pause();
	},
	//获取当前歌曲信息
	getCurInfo: function() {
		return this.datalist[this.index];
	},
	//获取当前播放百分比
	getPlayRatio: function() {
		return this.audio.currentTime / this.duration;
	},
	//获取当前播放时间
	getCurTime: function(ratio) {
		var curTime = this.audio.currentTime;

		if(ratio) {
			curTime = ratio * this.duration;
		}

		return Math.round(curTime);
	},
	jumpToPlay: function(ratio) {
		var time = ratio * this.duration;
		this.autoplay = true;
		this.audio.currentTime = time;
		this.audio.play();
	}

}

var controlManager = (function() {
	var $platBtn = $('.play-btn'),
		$nextBtn = $('.next-btn'),
		$prevBtn = $('.prev-btn'),
		$songImg = $('.song-img img'),
		$songInfo = $('.song-info'),
		infoTmpl = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<h1 class="song-name">'+
((__t=( obj.song ))==null?'':__t)+
'</h1>\n<h3 class="singer-name">'+
((__t=( obj.singer ))==null?'':__t)+
'</h3>\n<h3 class="album-name">专辑：'+
((__t=( obj.album ))==null?'':__t)+
'</h3>\n<h3 class="rhythm">编曲：'+
((__t=( obj.rhythm ))==null?'':__t)+
'</h3>\n<h3 class="lyric">歌词：'+
((__t=( obj.lyric ))==null?'':__t)+
'</h3>';
}
return __p;
},
		$timeCur = $('.cur-time'),
		$timeDuration = $('.all-time'),
		$likeBtn = $('.like-btn'),
		likeList = [false, false, false, false, false],
		frameId;


	//绑定事件
	function addClickEvent() {
		$platBtn.on('click', function() {
			if($(this).hasClass('playing')) {
				//暂停
				audioManager.pause();
				cancelAnimationFrame(frameId);
			} else {
				//播放
				audioManager.play();
				setProcess();
			}
			$(this).toggleClass('playing');
		})
		$nextBtn.on('click', function() {
			audioManager.playNext();
		})
		$prevBtn.on('click', function() {
			audioManager.playPrev();
		})
		$likeBtn.on('click', function() {
			var index = audioManager.index;
			if(likeList[index]) {
				return;
			} else {
				$(this).addClass('disabled');
				likeList[index] = true; 
			}
		})
	} 

	//格式化时间
	function formatTime(during) {
		var minute = Math.floor(during / 60),
			second = during - minute * 60;

			if(minute < 10) {
				minute = '0' + minute;
			}

			if(second < 10) {
				second = '0' + second;
			}

			return minute + ':' + second;
	}

	//渲染页面
	function renderInfo() {
		var curData = audioManager.getCurInfo(),
			setImage = function(src) {
				var img = new Image();

				$(img).on('load', function() {
					$songImg.attr('src', src);
					blurImg(this, $('.content-wrap'));
				})

				img.src = src;
			}
		//设置歌曲信息
		$songInfo.html(infoTmpl(curData));
		//设置图片和模糊背景
		setImage(curData.image);
		//设置当前歌曲时间
		$timeDuration.text(formatTime(audioManager.duration)); 
		//渲染like按钮
		if(likeList[audioManager.index]) {
			$likeBtn.addClass('disabled');
		} else {
			$likeBtn.removeClass('disabled');
		}
	}

	//设置拖拽事件
	function addProcessEvent() {
		var $slidePoint = $('.slide-point'),
			$proTop = $('.pro-top'),
			offsetX = $('.pro-wrap').offset().left,
			width = $('.pro-wrap').width();

		$slidePoint.on('touchstart', function() {
			cancelAnimationFrame(frameId);
		}).on('touchmove', function(e) {
			var x = e.changedTouches[0].clientX - offsetX,
				ratio = x / width,
				translatePercent = (ratio - 1) * 100,
				time = formatTime(audioManager.getCurTime(ratio));

			if(ratio < 0 || ratio > 1) {
				return;
			}

			//渲染当前时间
			$timeCur.text(time);
			//设置进度条位置偏移
			$proTop.css({
				transform: 'translateX(' + translatePercent + '%)',
				'-webkit-transform': 'translateX(' + translatePercent + '%)'
			})

			return false; 
		}).on('touchend', function(e) {
			var ratio = (e.changedTouches[0].clientX - offsetX) / width;
			audioManager.jumpToPlay(ratio);
			$platBtn.addClass('playing');
			setProcess();
		})
	}

	//设置播放进度条
	function setProcess() {
		cancelAnimationFrame(frameId);
		var $proTop = $('.pro-top'),
			frame = function() {
				//获得当前播放百分比
				var playRatio = audioManager.getPlayRatio(),
					translatePercent = (playRatio - 1) * 100,
					time = formatTime(audioManager.getCurTime());

				//渲染当前播放时间	
				$timeCur.text(time);
				//渲染进度条
				if(translatePercent <= 1) {
					$proTop.css({
						transform: 'translateX(' + translatePercent + '%)',
						'-webkit-transform': 'translateX(' + translatePercent + '%)'
					});
					frameId = requestAnimationFrame(frame);
					// console.log(translatePercent)
				} else {
					$proTop.css({
						transform: 'translateX(0)',
						'-webkit-transform': 'translateX(0)'
					});
					cancelAnimationFrame(frameId);
				}
				
			}
		frame();
	}


	//controlManager 初始函数
	var init = function() {
		renderInfo();
		addClickEvent();
		addProcessEvent();

		$scope.on('changeAudio', function() {
			renderInfo(); 
		})
	}
 
	return {
		init: init
	}
})();


var success = function(d) {
	// alert('success');
	audioManager = new AudioManager(d);
	controlManager.init();
}

function getData(url, cb) {
	$.ajax({
		url: url,
		type: 'GET',
		success: cb,
		error: function() {
			alert('deal wrong');
		}
	})
}

getData(dataUrl, success);