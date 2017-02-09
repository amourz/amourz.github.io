var host = 'https://www.wondfun.com/api/';
apptpl = '/www/tpl/';
var app = {
	getPageID: function(i) {
		var key = 'pageid';
		var num = app.store.get(key);
		num = num ? num : 0;
		if (i == 0) {
			num = 0;
		} else if (i < 0) {
			num--;
		} else {
			num++;
		}

		app.store.set(key, num, 1000000);
		return num;
	},

	back: function() {
		    var ws=null;
            ws=plus.webview.currentWebview();
            var wo=ws.opener();
            plus.webview.close(wo);
            plus.webview.close(ws);
	},

	initWindow: function(name, url) {
		var WV = plus.webview.getWebviewById(name + 'WV');
		if (!WV) {
			WV = plus.webview.create(url, name + 'WV');
		}
		WV.hide();
		return WV;
	},

	/*
	 * 登录页面
	 */
	loginPage: function() {
		var url = apptpl + 'login.html';
		var WV = app.initWindow('login', url);

		setTimeout(function() {
			//app.loading();
			WV.show('slide-in-bottom');
			//mui.fire(WV, 'loaded');
		}, 300);
	},
	
	
	toast: function(msg, time) {
		if (time != 'long') {
			time = 'short';
		}
		plus.nativeUI.toast(msg, {
			duration: time,
			verticalAlign: "center"
		});
	},
	'ajax': {
		'post': function(url, data, obj, loading) {
			var loading = loading == 0 ? false : true;
			if (loading) {
				app.loading();
			}

			mui.ajax({
				type: 'POST',
				url: url,
				data: data,
				dataType: 'json',
				timeout: 60 * 1000,
				success: obj,
				complete: function() {
					app.loaded();
				},
				error: function(e, type) {
					//alert(JSON.stringify(type));
					plus.nativeUI.toast("数据加载失败，请检查网络重试!");
					if (document.querySelector('#pageLoading')) {
						document.querySelector('#pageLoading').innerHTML = "<h5 onclick='window.location.reload();'><i class='mui-icon mui-icon-refresh'></i>请重试</h5>";
					}
				}
			})
		},
		'get': function(url, data, obj, loading) {
			var loading = loading == 1 ? true : false;
			if (loading) {
				app.loading();
			}

			mui.ajax({
				type: 'get',
				url: url,
				data: data,
				dataType: 'json',
				timeout: 60 * 1000,
				success: obj,
				complete: function() {
					app.loaded();
				},
				error: function(e, type) {
					app.debug(e);
					plus.nativeUI.toast("数据加载失败，请返回重试!");
					if (document.querySelector('#pageLoading')) {
						document.querySelector('#pageLoading').innerHTML = "<h5 onclick='window.location.reload();'><i class='mui-icon mui-icon-refresh'></i>请重试</h5>";
					}
				}
			});
		}
	},
	
	cache: function(key, val) {
		if (key == 'clear') {
			window.localStorage.clear();
		} else if (val === null) {
			window.localStorage.removeItem(key);
		} else if (val) {
			window.localStorage.setItem(key, val);

		} else {
			return window.localStorage.getItem(key);
		}
	},
	store: {
		set: function(key, val, exp) {
			var obj = plus.storage;
			obj = window.localStorage;
			var nowtime = new Date().getTime() / 1000;

			exp = exp ? exp : 3600 * 1; //默认有效期*小时
			val = JSON.stringify({
				val: val,
				exp: exp,
				time: nowtime
			});
			obj.setItem(key, val);
		},

		get: function(key, timeout) {
			var obj = plus.storage;
			obj = window.localStorage;
			var info = obj.getItem(key);
			var nowtime = new Date().getTime() / 1000;
			var network = plus.networkinfo.getCurrentType();
			if (!info) {
				return null;
			}
			info = JSON.parse(info);

			//timeout==0且网络可用且过期则返回并删除
			if (network > 1 && timeout == 0 && (nowtime - info.time > info.exp)) {
				app.store.delete(key);
				return info.val
			}
			//没网络或者 timeout=0不判断过期时间
			if (network <= 1 || timeout == 0) {
				return info.val
			}
			if (nowtime - info.time > info.exp) {
				app.store.delete(key);
				return null;
			}

			return info.val;
		},
		delete: function(key) {
			var obj = plus.storage;
			obj = window.localStorage;
			obj.removeItem(key);
			app.store.set(key, null, 0);
		},
		clear: function(key) {
			var obj = plus.storage;
			obj = window.localStorage;
			obj.clear();
		}
	},
	

	isLogin: function() {
		var uid = plus.storage.getItem('adminid');
		var utoken = plus.storage.getItem('utoken');

		//验证登录是否有效
		if (uid || utoken) {
			var url = host + 'login.php';
			ajax.post(url, {
				uid: uid,
				utoken: utoken
			}, function(rs) {
				if (!rs.status) {
					plus.storage.removeItem('adminid');
					plus.storage.removeItem('utoken');
					plus.nativeUI.toast('账号过期，请重新登录');

					plus.runtime.restart();
					return false;
				}
			});
		} else {
			plus.runtime.restart();
			return false;
		}
	},
	alert: function(msg) {
		plus.nativeUI.alert(msg);
	},
	/**
	 * 显示加载框
	 */
	loading: function() {
		plus.nativeUI.showWaiting('', {
			padlock: true
		});
	},
	/**
	 * 关闭加载框
	 */
	loaded: function() {
		plus.nativeUI.closeWaiting();
	},
	'pageLoading': function(obj) {

		setTimeout(function() {
			if (document.querySelector(obj).innerHTML.length < 5) {
				document.querySelector(obj).innerHTML = '<p style="text-align:center;padding:5px;" id="pageLoading" ><img src="../img/loading.gif" /></p>';
			}
		}, 100);
	},
	'isJson': function(obj) {
		var isjson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
		return isjson;
	},
	/**
	 * 用户信息
	 */
	user: {
		'uid': function() {
			return window.localStorage.getItem('uid');
		},
		'utoken': function() {
			return window.localStorage.getItem('utoken');
		},
		'logout': function(obj) {
			var uid = app.user.uid();
			var url = host + '?m=user&a=logout';

			app.user.deleteCache(uid); //清空缓存 

			window.localStorage.clear();
			window.sessionStorage.clear();

			clientInfo = plus.push.getClientInfo();
			app.ajax.post(url, {
				uid: uid,
				push_clientid: clientInfo.clientid,
				utoken: app.user.utoken()
			}, obj);
		},
		login: function(uid, utoken) {
			window.localStorage.setItem('uid', uid);
			window.localStorage.setItem('utoken', utoken);
			return true;
		},
		username: function() {
			var key = 'user@info_' + app.user.uid();
			var userInfo = app.store.get(key);
			if (userInfo) {
				return userInfo.username;
			} else {
				return '';
			}
		},
		'getInfo': function(uid, obj) {
			var key = 'user@info_' + uid;
			info = app.store.get(key);
			if (info) {
				if (info.lock == 1) {
					app.user.logout();
				}
				obj(info);
				return info;
			}
			var url = host + '?m=user&a=userInfo';
			app.ajax.get(url, {
				uid: uid,
				utoken: app.user.utoken()
			}, function(rs) {
				if (rs.status) {
					info = rs.data;
					if (info.lock == 1) {
						app.user.logout();
					}
					app.store.set(key, info, 3600 * 3);
					obj(info);
					return info;
				}
			});
		},
		'deleteCache': function(uid) {
			var uid = uid ? uid : this.uid();
			var key = 'user@info_' + uid;
			window.localStorage.removeItem(key);
		}
	},
	'get': function(name) {
		var uri = window.location.search.replace('?', '');
		var data = uri.split('&');
		var arr = new Array();
		if (data) {
			for (var i in data) {
				var tmp = data[i].split('=');
				if (tmp[0]) {
					arr[tmp[0]] = tmp[1];
				}
			}
		}
		return arr[name];
	},
	debug: function(data) {
		if (typeof(data) == "object") {
			console.log(JSON.stringify(data));
		} else {
			console.log(data);
		}

	},
	'loadLazyImg': function(num) {
		em = document.querySelectorAll('.lazy[data-src]');
		num = num ? num : 6;
		len = em.length < num ? em.length : num;
		for (var i = 0; i < len; i++) {
			obj = em[i];
			src = obj.getAttribute('data-src');
			if (src) {
				app.getImg(src, obj);
				obj.removeAttribute('data-src');
			}
		}
		setTimeout(function() {
			if (em.length > num) {
				app.loadLazyImg();
			}
		}, 10);

	},
	getImg: function(src, obj) {
		var imagename = md5(src);
		var localpath = '_downloads/image/' + imagename + '.jpg';
		var absolutepath = plus.io.convertLocalFileSystemURL(localpath); // 平台绝对路径
		obj.src = 'http://appapi.fengqiaoju.com/images/1px.png';
		//图片存在,直接显示
		plus.io.resolveLocalFileSystemURL(localpath, function(entry) {
			obj.src = absolutepath;
		}, function(e) {
			obj.src = src;
			app.downImg(src);
		});
	},
	downImg: function(src) {
		var imagename = md5(src);
		var localpath = '_downloads/image/' + imagename + '.jpg';
		var absolutepath = plus.io.convertLocalFileSystemURL(localpath); // 平台绝对路径

		//图片存在,直接显示
		plus.io.resolveLocalFileSystemURL(localpath, function(entry) {

		}, function(e) {
			//图片不存在,下载 
			task = plus.downloader.createDownload(src, {
				filename: localpath // filename:下载任务在本地保存的文件路径
			}, function(d, status) {
				if (status == 200) {

				} else {
					//下载失败,需删除本地临时文件,否则下次进来时会检查到图片已存在
					console.log("下载失败=" + absolutepath);
					task.abort(); //文档描述:取消下载,删除临时文件;(但经测试临时文件没有删除,故使用delFile()方法删除);
					if (absolutepath) {
						plus.io.resolveLocalFileSystemURL(absolutepath, function(entry) {
							entry.remove();
						});
					}
				}
			});
			task.start();
		});
		return absolutepath;
	},
	
	clearWV: function() {
		//回收垃圾webview
		var wvs = plus.webview.all();
		for (var i = 0; i < wvs.length; i++) {
			var wvid = wvs[i].id;
			re = /^[1-9]+Body|WV$/;
			if (re.test(wvid)) {
				plus.webview.close(wvs[i]);
			}
		}
		app.getPageID(0);
	}
}