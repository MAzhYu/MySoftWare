<template>
  <view class="exam-container">
    <!-- 顶部信息栏 -->
    <view class="exam-header">
      <text class="exam-grade">{{ grade }}</text>
      <text class="exam-module">{{ moduleName }}</text>
      <view class="difficulty">
        <image :src="getDifficultyIcon(difficulty)" class="difficulty-icon" />
        <text class="exam-difficulty">难度：{{ difficulty }}</text>
      </view>
    </view>

    <!-- 出题前设置界面 -->
    <view v-if="!started" class="config-panel">
      <view class="config-item">
        <text>题目数量：</text>
        <picker :range="questionOptions" @change="onQuestionChange">
          <view class="picker">{{ questionCount }} 题</view>
        </picker>
      </view>

      <view class="config-item">
        <text>答题时长：</text>
        <picker :range="timeOptions" @change="onTimeChange">
          <view class="picker">
            {{ timeLimit }} 分钟
            <text class="recommend-text">(推荐: {{ recommendedTime }} 分钟)</text>
          </view>
        </picker>
      </view>

      <view class="config-buttons">
        <button class="start-btn" @click="startExam">开始练习</button>
        <button class="back-btn" @click="goBack">返回主页</button>
      </view>
    </view>

    <!-- 出题区 -->
    <view v-else class="exam-content">
      <view class="timer">
        <text>剩余时间：{{ formattedTime }}</text>
      </view>

      <scroll-view scroll-y class="question-area">
        <view v-for="(q, index) in questions" :key="index" class="question-card">
          <text class="question-text">{{ index + 1 }}. {{ q.question }}</text>
          <input
            v-model="q.answer"
            type="text"
            class="answer-input"
            placeholder="请输入答案"
          />
        </view>
      </scroll-view>

      <view class="exam-footer">
        <button class="submit-btn" @click="submitAnswers">提交答案</button>
        <button class="back-btn" @click="goBack">返回主页</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      grade: '',
      moduleName: '',
      difficulty: '',
      questionCount: 5,
      timeLimit: 5,
      recommendedTime: 5,
      questionOptions: [5, 10, 15, 20],
      timeOptions: [1,2,3,4,5,6,7,8,9,10],
      questions: [],
      started: false,
      timer: null,
      remainingTime: 0
    }
  },
  onLoad(options) {
    this.grade = options.grade || '一年级'
    this.moduleName = options.module || '加减训练'
    this.difficulty = options.difficulty || '简单'
    this.updateRecommendedTime()
  },
  computed: {
    formattedTime() {
      const min = Math.floor(this.remainingTime / 60)
      const sec = this.remainingTime % 60
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    }
  },
  methods: {
    // ✅ 更新推荐时长
    updateRecommendedTime() {
      let base = 0
      switch (this.difficulty) {
        case '简单': base = 0.3; break
        case '中等': base = 0.5; break
        case '困难': base = 0.8; break
        default: base = 0.5
      }
      const recommended = Math.ceil(this.questionCount * base)
      this.recommendedTime = Math.min(recommended, 20)
      this.timeLimit = this.recommendedTime
    },

    // ✅ 选择题目数量
    onQuestionChange(e) {
      this.questionCount = this.questionOptions[e.detail.value]
      this.updateRecommendedTime()
    },

    // ✅ 选择时长
    onTimeChange(e) {
      this.timeLimit = this.timeOptions[e.detail.value]
    },

    // ✅ 开始出题
    startExam() {
      this.started = true
      this.generateQuestions()
      this.startTimer()
    },

    // ✅ 倒计时
    startTimer() {
      this.remainingTime = this.timeLimit * 60
      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--
        } else {
          clearInterval(this.timer)
          this.autoSubmit()
        }
      }, 1000)
    },

    // ✅ 时间到自动提交
    autoSubmit() {
      uni.showModal({
        title: '时间到',
        content: '时间已到，系统自动提交答案。',
        showCancel: false,
        success: () => this.submitAnswers()
      })
    },

    // ✅ 出题逻辑
    generateQuestions() {
      const level =
        this.difficulty === '简单'
          ? 10
          : this.difficulty === '中等'
          ? 50
          : 100
      if (this.moduleName.includes('加减')) {
        this.questions = this.createAddSubQuestions(level)
      } else if (this.moduleName.includes('乘除')) {
        this.questions = this.createMulDivQuestions(level)
      } else {
        this.questions = this.createAddSubQuestions(level)
      }
    },

    createAddSubQuestions(range) {
      return Array.from({ length: this.questionCount }, () => {
        const a = Math.floor(Math.random() * range)
        const b = Math.floor(Math.random() * range)
        const op = Math.random() > 0.5 ? '+' : '-'
        return { question: `${a} ${op} ${b} =`, answer: '' }
      })
    },

    createMulDivQuestions(range) {
      return Array.from({ length: this.questionCount }, () => {
        const a = Math.floor(Math.random() * range)
        const b = Math.floor(Math.random() * (range / 10)) + 1
        const op = Math.random() > 0.5 ? '×' : '÷'
        return { question: `${a} ${op} ${b} =`, answer: '' }
      })
    },

    // ✅ 提交答案
submitAnswers() {
  clearInterval(this.timer)
  // 保存练习记录
  this.saveProgress(false)

  const empty = this.questions.some(q => !q.answer)
  if (empty) {
    uni.showToast({ title: '请填写所有答案', icon: 'none' })
    return
  }
  uni.showModal({
    title: '提交成功',
    content: '系统将根据答案生成分析报告（待开发）',
    showCancel: false,
    success: (res) => {
      if (res.confirm) {
        // ✅ 点击确定后返回首页
        uni.switchTab({
          url: '/pages/tabbar/index/index'
        })
      }
    }
  })
},

goBack() {
  clearInterval(this.timer)
  // ✅ 离开前保存进度
  this.saveProgress(true)
  uni.switchTab({
    url: '/pages/tabbar/index/index'
  })
},

// ✅ 新增保存进度方法
saveProgress(isUnfinished) {
  const progress = {
    grade: this.grade,
    module: this.moduleName,
    difficulty: this.difficulty,
    questionCount: this.questionCount,
    timeLimit: this.timeLimit,
    remainingTime: this.remainingTime,
    unfinished: isUnfinished,
    timestamp: Date.now()
  }
  uni.setStorageSync('lastProgress', progress)
},


    // ✅ 难度图标
    getDifficultyIcon(level) {
      if (level === '简单') return '/static/icons/easy.png'
      if (level === '中等') return '/static/icons/medium.png'
      if (level === '困难') return '/static/icons/hard.png'
      return '/static/icons/medium.png'
    }
  }
}
</script>

<style scoped>
.exam-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f7f8fa;
}

/* 顶部栏 */
.exam-header {
  padding: 40rpx 30rpx 20rpx 30rpx;
  background-color: #20d0b0;
  color: white;
  border-bottom-left-radius: 30rpx;
  border-bottom-right-radius: 30rpx;
}
.exam-grade {
  font-size: 34rpx;
  font-weight: bold;
  margin-right: 20rpx;
}
.exam-module {
  font-size: 30rpx;
}
.difficulty {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}
.difficulty-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 10rpx;
}
.exam-difficulty {
  font-size: 28rpx;
}

/* 配置界面 */
.config-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.config-item {
  display: flex;
  align-items: center;
  margin: 20rpx 0;
  font-size: 30rpx;
  color: #00496e;
}
.picker {
  margin-left: 20rpx;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 10rpx 30rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
}
.recommend-text {
  font-size: 24rpx;
  color: #999;
  margin-left: 10rpx;
}

/* 按钮容器 */
.config-buttons {
  display: flex;
  justify-content: space-between;
  width: 70%;
  margin-top: 50rpx;
}
.start-btn,
.back-btn {
  width: 48%;
  height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
  transition: all 0.3s ease;
}
.start-btn {
  background-color: #20d0b0;
  color: #fff;
}
.start-btn:hover {
  background-color: #15a890;
}
.back-btn {
  background-color: #00496e;
  color: #fff;
}
.back-btn:hover {
  background-color: #003552;
}

/* 出题界面 */
.exam-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.timer {
  text-align: center;
  font-size: 30rpx;
  color: #00496e;
  padding: 10rpx;
}
.question-area {
  flex: 1;
  padding: 20rpx 30rpx;
}
.question-card {
  background-color: #fff;
  border-radius: 20rpx;
  margin-bottom: 25rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
}
.question-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}
.answer-input {
  width: 100%;
  height: 70rpx;
  border: 2rpx solid #20d0b0;
  border-radius: 15rpx;
  padding: 0 20rpx;
  font-size: 30rpx;
  color: #00496e;
}

/* 底部按钮 */
.exam-footer {
  display: flex;
  justify-content: space-around;
  padding: 20rpx 0;
  background-color: #fff;
  border-top: 1px solid #eee;
}
.submit-btn {
  background-color: #20d0b0;
  color: #fff;
  width: 40%;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
}
.back-btn {
  width: 40%;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  background-color: #00496e;
  color: #fff;
}
</style>
