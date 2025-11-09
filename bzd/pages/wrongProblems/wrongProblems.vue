<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <image src="/static/icons/fail.png" class="header-icon" />
      <text class="title">我的错题集</text>
    </view>

    <!-- 筛选区 -->
    <view class="filter-bar">
      <picker :range="typeOptions" :value="typeIndex" @change="onTypeChange">
        <view class="filter-item">
          <text>题型：{{ typeOptions[typeIndex] }}</text>
        </view>
      </picker>
      
      <picker :range="difficultyOptions" :value="difficultyIndex" @change="onDifficultyChange">
        <view class="filter-item">
          <text>难度：{{ difficultyOptions[difficultyIndex] }}</text>
        </view>
      </picker>

      <view class="filter-item" @click="toggleMastered">
        <text>{{ showMastered ? '已掌握' : '未掌握' }}</text>
      </view>
    </view>

    <!-- 错题列表 -->
    <view v-if="wrongProblems.length > 0" class="list-wrapper">
      <scroll-view scroll-y class="problem-list">
        <view
          v-for="(problem, index) in wrongProblems"
          :key="problem.id"
          class="problem-card"
        >
          <view class="problem-header">
            <view class="problem-meta">
              <text class="problem-type">{{ getTypeLabel(problem.type) }}</text>
              <text class="problem-difficulty">{{ getDifficultyLabel(problem.difficulty) }}</text>
              <text class="wrong-count">错误 {{ problem.wrongCount }} 次</text>
            </view>
            <view class="problem-actions">
              <button v-if="!problem.isMastered" class="action-btn master" @click="markAsMastered(problem.id)">
                已掌握
              </button>
              <button class="action-btn delete" @click="deleteProblem(problem.id)">
                删除
              </button>
            </view>
          </view>

          <view class="problem-content">
            <text class="expression">{{ problem.expression }}</text>
          </view>

          <view class="answer-section">
            <view class="answer-row">
              <text class="label">正确答案：</text>
              <text class="correct-answer">{{ problem.correctAnswer }}</text>
            </view>
            <view class="answer-row">
              <text class="label">你的答案：</text>
              <text class="wrong-answer">{{ problem.userAnswer }}</text>
            </view>
          </view>

          <view class="problem-footer">
            <text class="date-text">最后练习：{{ formatDate(problem.lastAttemptDate) }}</text>
          </view>
        </view>
      </scroll-view>
      
      <!-- 底部操作栏（移动到页面底部固定显示） -->
      <!-- NOTE: footer moved outside list so it's always visible -->
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <image src="/static/icons/success.png" class="empty-icon" />
      <text class="empty-text">{{ showMastered ? '暂无已掌握的题目' : '太棒了！暂无错题' }}</text>
      <!-- 返回首页按钮放到固定底部 -->
    </view>

    <!-- 固定底部返回按钮：始终显示在页面底部 -->
    <view class="fixed-footer">
      <button class="back-btn" @click="goBack">返回首页</button>
    </view>
  </view>
</template>

<script>
import { request, api } from '@/request.js'

export default {
  data() {
    return {
      wrongProblems: [],
      typeOptions: ['全部', '加法', '减法', '乘法', '除法', '混合运算', '比较', '填空'],
      typeValues: ['', 'addition', 'subtraction', 'multiplication', 'division', 'mixed', 'comparison', 'fill_blank'],
      typeIndex: 0,
      difficultyOptions: ['全部', '简单', '中等', '困难'],
      difficultyValues: ['', 'easy', 'medium', 'hard'],
      difficultyIndex: 0,
      showMastered: false
    }
  },
  onLoad() {
    this.loadWrongProblems()
  },
  methods: {
    async loadWrongProblems() {
      uni.showLoading({ title: '加载中...' })
      
      try {
        const params = {
          isMastered: this.showMastered
        }
        
        if (this.typeIndex > 0) {
          params.type = this.typeValues[this.typeIndex]
        }
        
        if (this.difficultyIndex > 0) {
          params.difficulty = this.difficultyValues[this.difficultyIndex]
        }
        
        const queryString = Object.keys(params)
          .map(key => `${key}=${params[key]}`)
          .join('&')
        
        const res = await request({
          url: `${api.wrongProblems}?${queryString}`,
          method: 'GET',
          auth: true
        })
        
        if (res.success) {
          this.wrongProblems = res.data
        }
      } catch (err) {
        console.error('加载错题失败:', err)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    
    onTypeChange(e) {
      this.typeIndex = e.detail.value
      this.loadWrongProblems()
    },
    
    onDifficultyChange(e) {
      this.difficultyIndex = e.detail.value
      this.loadWrongProblems()
    },
    
    toggleMastered() {
      this.showMastered = !this.showMastered
      this.loadWrongProblems()
    },
    
    async markAsMastered(id) {
      try {
        const res = await request({
          url: `${api.wrongProblems}/${id}/master`,
          method: 'PUT',
          auth: true
        })
        
        if (res.success) {
          uni.showToast({ title: '已标记为掌握', icon: 'success' })
          this.loadWrongProblems()
        }
      } catch (err) {
        console.error('标记失败:', err)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    
    async deleteProblem(id) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这道错题吗？',
        success: async (modalRes) => {
          if (modalRes.confirm) {
            try {
              const res = await request({
                url: `${api.wrongProblems}/${id}`,
                method: 'DELETE',
                auth: true
              })
              
              if (res.success) {
                uni.showToast({ title: '删除成功', icon: 'success' })
                this.loadWrongProblems()
              }
            } catch (err) {
              console.error('删除失败:', err)
              uni.showToast({ title: '删除失败', icon: 'none' })
            }
          }
        }
      })
    },
    
    getTypeLabel(type) {
      const map = {
        'addition': '加法',
        'subtraction': '减法',
        'multiplication': '乘法',
        'division': '除法',
        'mixed': '混合运算',
        'comparison': '比较',
        'fill_blank': '填空'
      }
      return map[type] || type
    },
    
    getDifficultyLabel(difficulty) {
      const map = {
        'easy': '简单',
        'medium': '中等',
        'hard': '困难'
      }
      return map[difficulty] || difficulty
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) return '今天'
      if (days === 1) return '昨天'
      if (days < 7) return `${days}天前`
      
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    
    goBack() {
      uni.switchTab({ url: '/pages/tabbar/index/index' })
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* 给底部固定按钮留出空间，避免内容被遮挡 */
  padding-bottom: 180rpx;
  background-color: #f7f8fa;
}

.header {
  display: flex;
  align-items: center;
  padding: 30rpx 40rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.header-icon {
  width: 50rpx;
  height: 50rpx;
  margin-right: 20rpx;
}

.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #00496e;
}

.filter-bar {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.filter-item {
  background-color: #f0f0f0;
  padding: 10rpx 25rpx;
  border-radius: 30rpx;
  font-size: 26rpx;
  color: #333;
}

.list-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

 .problem-list {
  flex: 1;
  padding: 20rpx;
  /* 底部留白，避免被固定按钮遮挡 */
  padding-bottom: 200rpx;
}

.problem-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
  border-left: 6rpx solid #f56c6c;
}

.problem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1px solid #eee;
}

.problem-meta {
  display: flex;
  gap: 10rpx;
}

.problem-type,
.problem-difficulty,
.wrong-count {
  font-size: 24rpx;
  padding: 5rpx 15rpx;
  border-radius: 20rpx;
  background-color: #f0f0f0;
  color: #666;
}

.problem-actions {
  display: flex;
  gap: 10rpx;
}

.action-btn {
  font-size: 22rpx;
  padding: 5rpx 15rpx;
  border-radius: 20rpx;
  border: none;
}

.action-btn.master {
  background-color: #20d0b0;
  color: #fff;
}

.action-btn.delete {
  background-color: #f56c6c;
  color: #fff;
}

.problem-content {
  margin-bottom: 15rpx;
}

.expression {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.answer-section {
  margin-top: 15rpx;
}

.answer-row {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
  margin-right: 10rpx;
}

.correct-answer {
  font-size: 28rpx;
  color: #20d0b0;
  font-weight: bold;
}

.wrong-answer {
  font-size: 28rpx;
  color: #f56c6c;
  font-weight: bold;
  text-decoration: line-through;
}

.problem-footer {
  margin-top: 15rpx;
  padding-top: 10rpx;
  border-top: 1px solid #eee;
}

.date-text {
  font-size: 22rpx;
  color: #999;
}

.bottom-bar {
  padding: 20rpx;
  background-color: #fff;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
}

.bottom-bar .back-btn {
  width: 80%;
  background-color: #20d0b0;
  color: #fff;
  border-radius: 30rpx;
  padding: 15rpx 60rpx;
  font-size: 28rpx;
  border: none;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  width: 150rpx;
  height: 150rpx;
  margin-bottom: 30rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.back-btn {
  background-color: #20d0b0;
  color: #fff;
  border-radius: 30rpx;
  padding: 15rpx 60rpx;
  font-size: 28rpx;
  border: none;
}

/* 固定底部样式 */
.fixed-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 0;
  background-color: #fff;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: center;
  z-index: 1000;
}
.fixed-footer .back-btn {
  width: 80%;
  border-radius: 30rpx;
  padding: 14rpx 60rpx;
  font-size: 28rpx;
}
</style>
