<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 初始化时检查登录状态
			this.checkLoginStatus()
			// 获取并设置状态栏高度
			this.setStatusBarHeight()
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			checkLoginStatus() {
				// 检查是否有 token
				const token = uni.getStorageSync('token')
				if (!token) {
					console.log('未登录，将在页面跳转时拦截')
				}
			},
			setStatusBarHeight() {
				// 获取系统信息
				uni.getSystemInfo({
					success: (res) => {
						const statusBarHeight = res.statusBarHeight || 25
						// 将状态栏高度存储到全局变量中
						getApp().globalData = getApp().globalData || {}
						getApp().globalData.statusBarHeight = statusBarHeight
						console.log('状态栏高度:', statusBarHeight + 'px')
						
						// 在App端设置CSS变量
						// #ifdef APP-PLUS
						try {
							const pages = getCurrentPages()
							if (pages.length > 0) {
								const page = pages[pages.length - 1]
								page.$el.style.setProperty('--status-bar-height', statusBarHeight + 'px')
							}
						} catch (e) {
							console.log('设置状态栏高度失败:', e)
						}
						// #endif
					}
				})
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
	body{
		background-color: #f8f8f8;
	}
	
	/* 状态栏占位 - 全局样式 */
	/* iOS一般为44px(20pt+24pt导航栏), Android一般为25px-30px */
	/* 使用rpx单位以适配不同屏幕 */
	.status-bar {
		height: 44px; /* 默认高度，适配大多数设备 */
		width: 100%;
		background-color: transparent;
	}
	
	/* 针对不同平台的适配 */
	/* #ifdef APP-PLUS */
	.status-bar {
		height: var(--status-bar-height);
	}
	/* #endif */
</style>
