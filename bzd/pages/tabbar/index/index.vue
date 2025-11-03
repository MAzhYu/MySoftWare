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

    <!-- 模块区，带横向滑动动画 -->
    <view class="module-wrapper">
      <view
        class="module-container"
        :class="slideDirection"
        @animationend="slideDirection = ''"
      >
        <view
          v-for="(module, index) in currentModules"
          :key="index"
          class="module-card"
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
      </view>
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
        一年级: [
          { name: '加减训练', difficulty: '简单' },
          { name: '数字认读', difficulty: '简单' },
          { name: '图形认识', difficulty: '中等' },
          { name: '比多少', difficulty: '中等' }
        ],
        二年级: [
          { name: '进位加减', difficulty: '中等' },
          { name: '乘法口诀', difficulty: '中等' },
          { name: '长度单位', difficulty: '简单' },
          { name: '时间认读', difficulty: '中等' }
        ],
        三年级: [
          { name: '乘除混合', difficulty: '中等' },
          { name: '余数除法', difficulty: '中等' },
          { name: '简单应用题', difficulty: '困难' },
          { name: '分数初步', difficulty: '中等' }
        ],
        四年级: [
          { name: '多位数运算', difficulty: '中等' },
          { name: '时间计算', difficulty: '中等' },
          { name: '图表统计', difficulty: '中等' },
          { name: '图形面积', difficulty: '困难' }
        ],
        五年级: [
          { name: '分数运算', difficulty: '困难' },
          { name: '小数运算', difficulty: '中等' },
          { name: '比例与比', difficulty: '中等' },
          { name: '百分数初步', difficulty: '困难' }
        ],
        六年级: [
          { name: '综合运算', difficulty: '中等' },
          { name: '图形变换', difficulty: '困难' },
          { name: '比例尺应用', difficulty: '中等' },
          { name: '数据与概率', difficulty: '困难' }
        ],
      },
      allResources: {
        一年级: [
          {
            name: '认识数字和加减法',
            url: 'https://www.bilibili.com/video/BV1mk4y1C7xE',
            image: '/static/resources/grade1-1.jpg'
          },
          {
            name: '有趣的图形世界',
            url: 'https://www.bilibili.com/video/BV1yE411q7kS',
            image: '/static/resources/grade1-2.jpg'
          }
        ],
        二年级: [
          {
            name: '乘法口诀歌教学',
            url: 'https://www.bilibili.com/video/BV1rE411Q7rY',
            image: '/static/resources/grade2-1.jpg'
          },
          {
            name: '生活中的长度单位',
            url: 'https://www.bilibili.com/video/BV1oA411Y7Qk',
            image: '/static/resources/grade2-2.jpg'
          }
        ],
        三年级: [
          {
            name: '分数入门动画讲解',
            url: 'https://www.bilibili.com/video/BV1cT4y1M7Rc',
            image: '/static/resources/grade3-1.jpg'
          },
          {
            name: '有趣的除法世界',
            url: 'https://www.bilibili.com/video/BV1Qp4y1B7C2',
            image: '/static/resources/grade3-2.jpg'
          }
        ],
        四年级: [
          {
            name: '图形面积计算技巧',
            url: 'https://www.bilibili.com/video/BV1oV4y1y7Hh',
            image: '/static/resources/grade4-1.jpg'
          },
          {
            name: '统计图表入门',
            url: 'https://www.bilibili.com/video/BV1tA411x7aR',
            image: '/static/resources/grade4-2.jpg'
          }
        ],
        五年级: [
          {
            name: '分数运算强化课',
            url: 'https://www.bilibili.com/video/BV1dG4y1z7fA',
            image: '/static/resources/grade5-1.jpg'
          },
          {
            name: '小数与百分数的联系',
            url: 'https://www.bilibili.com/video/BV1YF4y1h7jV',
            image: '/static/resources/grade5-2.jpg'
          }
        ],
        六年级: [
          {
            name: '图形变换与比例尺',
            url: 'https://www.bilibili.com/video/BV1ah4y1K7Dc',
            image: '/static/resources/grade6-1.jpg'
          },
          {
            name: '概率初探',
            url: 'https://www.bilibili.com/video/BV1Ex4y1K7NM',
            image: '/static/resources/grade6-2.jpg'
          }
        ]
      }
    }
  },
  computed: {
    currentModules() {
      return this.modules[this.currentGrade] || []
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
.module-card {
  width: 43%;
  aspect-ratio: 1 / 1;
  background-color: #fff;
  border-left: 10rpx solid #20d0b0;
  border-top-right-radius: 20rpx;
  border-bottom-right-radius: 20rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
  margin: 20rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
  cursor: pointer;
}
.module-card:hover {
  border-left: 10rpx solid #00496e;
  transform: scale(1.05);
  transition: all 0.3s ease;
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
