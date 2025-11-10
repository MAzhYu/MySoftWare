<template>
  <view class="container">
    <view class="greeting-section">
      <text class="greeting-text">{{ greetingMessage }}</text>
    </view>
    <!-- 顶部横向滚动年级栏 -->
    <scroll-view scroll-x show-scrollbar="false" class="grade-scroll">
      <view
        v-for="(grade, index) in grades"
        :key="index"
        :class="['grade-item', { active: currentGrade === grade }]"
        @click="selectGrade(grade, index)"
      >
        {{ grade }}
      </view>
    </scroll-view>

    <!-- 上次练习进度卡片 -->
    <view v-if="lastProgress" class="progress-card">
      <view class="progress-info">
        <text class="progress-title">上次练习：</text>
        <text class="progress-text">
          {{ lastProgress.grade }} · {{ lastProgress.module }} · {{ lastProgress.difficulty }}
        </text>
        <text class="progress-detail">
          题目数：{{ lastProgress.questionCount }} 
        </text>
      </view>
      <button class="continue-btn" @click="continuePractice">继续练习</button>
    </view>

    <!-- 模块区：水平滚动，只显示 4 个卡片（其余通过左右滑动查看） -->
    <view class="module-wrapper">
      <scroll-view class="module-scroll" scroll-x show-scrollbar="false">
        <view class="module-scroll-inner">
          <!-- 每个 page 宽度为容器宽度 (100%)，内部使用 2x2 网格 -->
          <view
            v-for="(page, pIndex) in modulePages"
            :key="'page_' + pIndex"
            class="module-page"
          >
            <view class="module-page-grid">
              <view
                v-for="(module, index) in page"
                :key="'m_' + pIndex + '_' + index"
                class="module-card-grid"
              >
                <view class="module-content">
                  <text class="module-title">{{ module.name }}</text>
                  <view class="difficulty">
                    <image
                      :src="getDifficultyIcon(module.difficulty)"
                      class="difficulty-icon"
                    />
                    <text class="module-subtitle">难度：{{ module.difficulty }}</text>
                  </view>
                  <button class="module-btn" @click="enterModule(module)">进入练习</button>
                </view>
              </view>
              <!-- 如果页内不足 4 个，用占位保持布局对齐 -->
              <view v-if="page.length < 4" class="module-card-grid placeholder" v-for="n in (4 - page.length)" :key="'ph_'+pIndex+'_'+n">
                <view class="module-content"></view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
	
    <view class="resource-section">
      <view class="resource-header">
        <image src="/static/icons/resource.png" class="resource-icon" />
        <text class="resource-title">推荐学习资源（{{ currentGrade }}）</text>
      </view>

      <scroll-view scroll-x show-scrollbar="false" class="resource-scroll">
        <view
          v-for="(item, index) in currentResources"
          :key="index"
          class="resource-card"
          @click="openResource(item.url)"
        >
          <image :src="item.image" class="resource-img" />
          <text class="resource-name">{{ item.name }}</text>
        </view>
      </scroll-view>
    </view>
	
  </view>
</template>

<script>
export default {
  data() {
    return {
      grades: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
      currentGrade: '一年级',
      lastIndex: 0,
      slideDirection: '',
      lastProgress: null, // ✅ 上次练习数据
      modules: {
        // 一二年级题型已替换为用户提供的清单（与后端 ProblemService 对应）
        一年级: [
          { name: '10以内加法', difficulty: '简单' },
          { name: '10以内减法', difficulty: '简单' },
          { name: '20以内加法（带进位）', difficulty: '中等' },
          { name: '20以内减法（带借位）', difficulty: '中等' },
          { name: '100以内加减法混合运算', difficulty: '困难' },
          { name: '元角分换算', difficulty: '中等' }
        ],
        二年级: [
          { name: '9以内乘法口诀', difficulty: '简单' },
          { name: '9以内除法', difficulty: '简单' },
          { name: '9以内乘法与加法混合', difficulty: '中等' },
          { name: '10以内整数连续乘法', difficulty: '中等' },
          { name: '除数9以内带余数除法', difficulty: '中等' },
          { name: '时间换算', difficulty: '中等' }
        ],
        三年级: [
          { name: '三位数加减法', difficulty: '简单' },
          { name: '两位数乘法', difficulty: '中等' },
          { name: '长方形、正方形周长的计算', difficulty: '简单' },
          { name: '长方形、正方形面积的计算', difficulty: '中等' },
          { name: '百以内的加减乘除法大小比较', difficulty: '困难' },
          { name: '重量单位换算', difficulty: '简单' },
          { name: '时间计算', difficulty: '困难' },
          { name: '余数除法（大数）', difficulty: '困难' }
        ],
        四年级: [
          { name: '小数的加法和减法', difficulty: '简单' },
          { name: '小数的保留', difficulty: '简单' },
          { name: '两位数的四则运算', difficulty: '中等' },
          { name: '千以内含括号的四则运算', difficulty: '中等' },
          { name: '巧用交换律与结合律', difficulty: '困难' },
          { name: '巧用乘法分配律', difficulty: '困难' },
          { name: '比较千以内的算式大小比较', difficulty: '困难' },
          { name: '近似数认识', difficulty: '中等' }
        ],
        五年级: [
          { name: '10以内小数乘法', difficulty: '中等' },
          { name: '10以内小数除法', difficulty: '中等' },
          { name: '小数除法(商保留一位小数)', difficulty: '中等' },
          { name: '平行四边形面积计算', difficulty: '简单' },
          { name: '三角形面积的计算', difficulty: '简单' },
          { name: '梯形面积的计算', difficulty: '中等' },
          { name: '圆面积的计算', difficulty: '中等' },
          { name: '简单方程练习', difficulty: '中等' }
        ],
        六年级: [
          { name: '圆柱的体积计算', difficulty: '中等' },
          { name: '球体积计算', difficulty: '中等' },
          { name: '带分数的加减法', difficulty: '中等' },
          { name: '带分数的乘法', difficulty: '中等' }
        ],
      },
      allResources: {
        一年级: [
          {
            name: '认识数字和加减法',
            url: 'https://www.bilibili.com/video/BV1tQy1BnEax',
            image: '/static/james.png'
          },
          {
            name: '有趣的图形世界',
            url: 'https://www.bilibili.com/video/BV1ew4m197ZP',
            image: '/static/curry.png'
          }
        ],
        二年级: [
          {
            name: '乘法口诀歌教学',
            url: 'https://www.bilibili.com/video/BV14i421a7o3',
            image: '/static/lvbu.jpg'
          },
          {
            name: '生活中的长度单位',
            url: 'https://www.bilibili.com/video/BV1rL411b7RY',
            image: '/static/dongzhuo.jpg'
          }
        ],
        三年级: [
          {
            name: '分数入门动画讲解',
            url: 'https://www.bilibili.com/video/BV1ZX4y1K7b6',
            image: '/static/3.jpg'
          },
          {
            name: '有趣的除法世界',
            url: 'https://www.bilibili.com/video/BV1iKu9znE8i',
            image: '/static/4.jpg'
          }
        ],
        四年级: [
          {
            name: '图形面积计算技巧',
            url: 'https://www.bilibili.com/video/BV17D4y1D7ot',
            image: '/static/james.png'
          },
          {
            name: '统计图表入门',
            url: 'https://www.bilibili.com/video/BV1Sr4y1F7vW',
            image: '/static/curry.png'
          }
        ],
        五年级: [
          {
            name: '分数运算强化课',
            url: 'https://www.bilibili.com/video/BV1FxYTzsEtw',
            image: '/static/lvbu.jpg'
          },
          {
            name: '小数与百分数的联系',
            url: 'https://www.bilibili.com/video/BV1Pf4y1x7Fx',
            image: '/static/dongzhuo.jpg'
          }
        ],
        六年级: [
          {
            name: '图形变换与比例尺',
            url: 'https://www.bilibili.com/video/BV15V4y1H7Jg',
            image: '/static/3.jpg'
          },
          {
            name: '概率初探',
            url: 'https://www.bilibili.com/video/BV1oi4y1s7Tc',
            image: '/static/4.jpg'
          }
        ]
      }
    }
  },
  computed: {
    currentModules() {
      return this.modules[this.currentGrade] || []
    },
    // 将模块按每页 4 个分组，便于水平分页（每页 2x2 网格）
    modulePages() {
      const pages = [];
      const items = this.currentModules;
      for (let i = 0; i < items.length; i += 4) {
        pages.push(items.slice(i, i + 4));
      }
      // 保证至少有一页
      if (pages.length === 0) pages.push([]);
      return pages;
    },
    currentResources() {
      return this.allResources[this.currentGrade] || []
    }
  },
  onShow() {
    // 每次返回首页时刷新上次记录
    const record = uni.getStorageSync('lastProgress')
    this.lastProgress = record ? record : null
	
    const hour = new Date().getHours()
    if (hour < 12) this.greetingMessage = '🌞 早上好，欢迎回来！'
    else if (hour < 18) this.greetingMessage = '🌤 下午好，继续加油学习！'
    else this.greetingMessage = '🌙 晚上好，今天也要坚持一下哦～'
  },
  methods: {
    /** ✅ 切换年级 */
    selectGrade(grade, index) {
      this.slideDirection = index > this.lastIndex ? 'slide-left' : 'slide-right'
      this.lastIndex = index
      this.currentGrade = grade
    },

    /** ✅ 进入模块（统一跳转exam.vue） */
    enterModule(module) {
      const grade = this.currentGrade
      const name = module.name
      const difficulty = module.difficulty
      uni.navigateTo({
        url: `/pages/exam/exam?grade=${encodeURIComponent(grade)}&module=${encodeURIComponent(name)}&difficulty=${encodeURIComponent(difficulty)}`
      })
    },

    /** ✅ 继续练习 */
    continuePractice() {
      if (!this.lastProgress) return
      const p = this.lastProgress
      uni.navigateTo({
        url: `/pages/exam/exam?grade=${encodeURIComponent(p.grade)}&module=${encodeURIComponent(p.module)}&difficulty=${encodeURIComponent(p.difficulty)}`
      })
    },

    /** ✅ 难度图标选择 */
    getDifficultyIcon(level) {
      if (level === '简单') return '/static/icons/easy.png'
      if (level === '中等') return '/static/icons/medium.png'
      if (level === '困难') return '/static/icons/hard.png'
      return '/static/icons/medium.png'
    },
    openResource(url) {
      window.open(url, '_blank')
      plus.runtime.openURL(url)
     
      wx.showModal({
        title: '提示',
        content: '即将打开外部页面，是否继续？',
        success: (res) => {
          if (res.confirm) {
            wx.openEmbeddedMiniProgram({
              appId: 'wx0e6ed4f51db9e0d3', // B站小程序ID
              path: 'pages/video/video',
              success: () => console.log('跳转成功'),
              fail: () => wx.showToast({ title: '无法打开外部链接', icon: 'none' })
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f7f8fa;
}
.greeting-section {
  padding: 30rpx 40rpx 10rpx;
}
.greeting-text {
  font-size: 34rpx;
  font-weight: bold;
  color: #00496e;
}
/* 顶部年级栏 */
.grade-scroll {
  display: flex;
  white-space: nowrap;
  background-color: #fff;
  padding: 15rpx 25rpx;
  border-bottom: 1px solid #eee;
}
.grade-scroll::-webkit-scrollbar {
  display: none;
}
.grade-item {
  display: inline-block;
  padding: 20rpx 40rpx;
  margin: 15rpx 10rpx;
  border-radius: 30rpx;
  color: #00496e;
  font-size: 30rpx;
  transition: all 0.3s;
}
.grade-item.active {
  background-color: #20d0b0;
  color: white;
  font-weight: bold;
}

/* 上次练习卡片 */
.progress-card {
  background-color: #ffffff;
  border-left: 10rpx solid #20d0b0;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
  margin: 30rpx 20rpx;
  margin-bottom: 0rpx;
  padding: 25rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.progress-card:hover{
  border-left: 10rpx solid #00496e;
  transition: all 0.3s ease;
}
.progress-info {
  display: flex;
  flex-direction: column;
}
.progress-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #00496e;
}
.progress-text {
  font-size: 28rpx;
  color: #333;
  margin-top: 5rpx;
}
.progress-detail {
  font-size: 24rpx;
  color: #666;
  margin-top: 5rpx;
}
.continue-btn {
  background-color: #20d0b0;
  color: #00496e;
  border: none;
  border-radius: 30rpx;
  padding: 10rpx 30rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
}
.continue-btn:hover {
  background-color: #00496e;
  color: white;
}

/* 模块动画容器 */
.module-wrapper {
  overflow: hidden;
  flex: 1;
}
.module-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding: 40rpx 20rpx;
  animation-duration: 0.35s;
  animation-timing-function: ease;
}
@keyframes slideInLeft {
  from {
    transform: translateX(100%);
    opacity: 0.3;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slideInRight {
  from {
    transform: translateX(-100%);
    opacity: 0.3;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
.slide-left {
  animation-name: slideInLeft;
}
.slide-right {
  animation-name: slideInRight;
}

/* 模块卡片 */
.module-card-horizontal {
  width: 25%;
  min-width: 25%;
  aspect-ratio: 1 / 1;
  background-color: #fff;
  border-left: 10rpx solid #20d0b0;
  border-top-right-radius: 20rpx;
  border-bottom-right-radius: 20rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
  margin: 0rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
  cursor: pointer;
  box-sizing: border-box;
}
.module-card-horizontal:hover {
  border-left: 10rpx solid #00496e;
  transform: scale(1.03);
  transition: all 0.25s ease;
}

/* 模块内容 */
.module-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 20rpx 30rpx;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  justify-content: center;
}
.module-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #00496e;
  margin-bottom: 10rpx;
}
.difficulty {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.difficulty-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 10rpx;
}
.module-subtitle {
  font-size: 26rpx;
  color: #666;
}
.module-btn {
  align-self: flex-start;
  background-color: #20d0b0;
  color: #00496e;
  border: none;
  border-radius: 30rpx;
  padding: 5rpx 40rpx;
  font-size: 30rpx;
  transition: all 0.3s ease;
}
.module-btn:hover {
  background-color: #00496e;
  color: #eee;
}
.resource-section {
  background-color: #fff;
  padding: 30rpx 20rpx 60rpx;
  border-top: 1px solid #eee;
}
.resource-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}
.resource-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 12rpx;
}
.resource-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #00496e;
}
.resource-scroll {
  display: flex;
  white-space: nowrap;
}
.resource-card {
  display: inline-block;
  width: 240rpx;
  height: 220rpx;
  margin-right: 20rpx;
  background-color: #f8f9fb;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  text-align: center;
}
.module-scroll {
  width: 100%;
  background-color: transparent;
}
.module-scroll-inner {
  display: flex;
  align-items: stretch;
  padding: 10rpx 0;
}
.module-scroll::-webkit-scrollbar {
  display: none;
}
.module-page {
  width: 100%;
  flex: 0 0 100%;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  padding: 20rpx 10rpx;
}
.module-page-grid {
  width: 92%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20rpx 20rpx;
}
.module-card-grid {
  width: 48%;
  min-width: 48%;
  aspect-ratio: 1 / 1;
  background-color: #fff;
  border-left: 10rpx solid #20d0b0;
  border-top-right-radius: 20rpx;
  border-bottom-right-radius: 20rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s;
  cursor: pointer;
  box-sizing: border-box;
}
.module-card-grid:hover {
  border-left: 10rpx solid #00496e;
  transform: scale(1.03);
}
.module-card-grid.placeholder {
  background: transparent;
  box-shadow: none;
  border-left: none;
}
.resource-img {
  width: 100%;
  height: 150rpx;
  object-fit: cover;
}
.resource-name {
  display: block;
  font-size: 26rpx;
  color: #333;
  padding: 10rpx 0;
}
</style>
