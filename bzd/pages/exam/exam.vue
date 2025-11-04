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
    <view v-else-if="started && !showResult" class="exam-content">
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

    <!-- 批改结果展示区 -->
    <view v-else-if="showResult" class="result-container">
      <!-- 成绩总结 -->
      <view class="result-header">
        <image src="/static/icons/success.png" v-if="resultData.summary.accuracy >= 80" class="result-icon" />
        <image src="/static/icons/medium.png" v-else-if="resultData.summary.accuracy >= 60" class="result-icon" />
        <image src="/static/icons/fail.png" v-else class="result-icon" />
        
        <text class="result-title">批改完成</text>
        
        <view class="score-summary">
          <view class="score-item">
            <text class="score-label">正确率</text>
            <text class="score-value">{{ resultData.summary.accuracy }}%</text>
          </view>
          <view class="score-item">
            <text class="score-label">正确题数</text>
            <text class="score-value">{{ resultData.summary.correct }}/{{ resultData.summary.total }}</text>
          </view>
          <view class="score-item">
            <text class="score-label">用时</text>
            <text class="score-value">{{ Math.floor(resultData.summary.totalTime / 60) }}分{{ resultData.summary.totalTime % 60 }}秒</text>
          </view>
        </view>
      </view>

      <!-- 题目详情 -->
      <scroll-view scroll-y class="result-list">
        <view
          v-for="(detail, index) in resultData.details"
          :key="index"
          :class="['result-card', detail.isCorrect ? 'correct' : 'wrong']"
        >
          <view class="result-card-header">
            <text class="question-number">第 {{ index + 1 }} 题</text>
            <view class="result-badge">
              <image
                v-if="detail.isCorrect"
                src="/static/icons/success.png"
                class="badge-icon"
              />
              <image
                v-else
                src="/static/icons/fail.png"
                class="badge-icon"
              />
              <text :class="detail.isCorrect ? 'correct-text' : 'wrong-text'">
                {{ detail.isCorrect ? '✓ 正确' : '✗ 错误' }}
              </text>
            </view>
          </view>

          <view class="question-content">
            <text class="expression">{{ detail.expression }}</text>
          </view>

          <view class="answer-row">
            <text class="answer-label">你的答案：</text>
            <text :class="['answer-value', detail.isCorrect ? 'correct-answer' : 'wrong-answer']">
              {{ detail.userAnswer }}
            </text>
          </view>

          <view v-if="!detail.isCorrect" class="answer-row">
            <text class="answer-label">正确答案：</text>
            <text class="correct-answer">{{ detail.correctAnswer }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部操作按钮 -->
      <view class="result-footer">
        <button class="action-btn primary" @click="backToHome">返回首页</button>
        <button class="action-btn secondary" @click="viewWrongProblems">查看错题集</button>
      </view>
    </view>
  </view>
</template>

<script>
import { request, api } from '@/request.js'

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
      remainingTime: 0,
      showResult: false, // 是否显示批改结果
      resultData: null // 批改结果数据
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
    },
    // 难度映射：简单->easy, 中等->medium, 困难->hard
    difficultyMap() {
      const map = {
        '简单': 'easy',
        '中等': 'medium',
        '困难': 'hard'
      }
      return map[this.difficulty] || 'easy'
    },
    // 年级数字（从"一年级"提取1）
    gradeNumber() {
      const match = this.grade.match(/(\d+)/)
      return match ? parseInt(match[1]) : 1
    },
    // 模块名称到后端题型的映射
    problemType() {
      const moduleMap = {
        '加减训练': 'mixed',  // 加减混合
        '数字认读': 'comparison',  // 暂用比较题代替
        '图形认识': 'fill_blank',  // 暂用填空题代替
        '比多少': 'comparison',
        '进位加减': 'mixed',
        '乘法口诀': 'multiplication',
        '长度单位': 'fill_blank',
        '时间认读': 'fill_blank',
        '乘除混合': 'mixed',
        '余数除法': 'division',
        '简单应用题': 'mixed',
        '分数初步': 'fill_blank',
        '多位数运算': 'mixed',
        '时间计算': 'fill_blank',
        '图表统计': 'fill_blank',
        '图形面积': 'fill_blank',
        '分数运算': 'fill_blank',
        '小数运算': 'fill_blank',
        '比例与比': 'fill_blank',
        '百分数初步': 'fill_blank',
        '综合运算': 'mixed',
        '图形变换': 'fill_blank',
        '比例尺应用': 'fill_blank',
        '数据与概率': 'fill_blank'
      }
      return moduleMap[this.moduleName] || 'mixed'
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

    // ✅ 出题逻辑 - 调用后端 API
    async generateQuestions() {
      uni.showLoading({ title: '正在生成题目...', mask: true })
      
      try {
        const res = await request({
          url: `${api.problems}?type=${this.problemType}&difficulty=${this.difficultyMap}&count=${this.questionCount}&grade=${this.gradeNumber}`,
          method: 'GET',
          auth: true
        })
        
        if (res.success && res.data && res.data.length > 0) {
          // 转换后端返回的数据格式为前端需要的格式
          this.questions = res.data.map(p => ({
            id: p.id,
            question: p.expression + ' =',
            answer: '',
            correctAnswer: p.answer,
            type: p.type,
            difficulty: p.difficulty,
            expression: p.expression,
            options: p.options
          }))
          uni.hideLoading()
        } else {
          throw new Error('后端返回数据为空')
        }
      } catch (err) {
        console.error('获取题目失败:', err)
        uni.hideLoading()
        
        // 降级方案：使用本地出题
        uni.showModal({
          title: '提示',
          content: '网络异常，将使用本地出题模式',
          showCancel: false,
          success: () => {
            this.generateQuestionsLocal()
          }
        })
      }
    },

    // 本地出题（降级方案）
    generateQuestionsLocal() {
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

    // ✅ 提交答案 - 调用后端评分 API
    async submitAnswers() {
      clearInterval(this.timer)
      
      const empty = this.questions.some(q => !q.answer)
      if (empty) {
        uni.showToast({ title: '请填写所有答案', icon: 'none' })
        return
      }
      
      // 保存练习记录
      this.saveProgress(false)
      
      uni.showLoading({ title: '评分中...', mask: true })
      
      try {
        // 构造提交数据
        const problems = this.questions.map(q => ({
          id: q.id,
          expression: q.expression || q.question.replace(' =', ''),
          answer: q.correctAnswer,
          userAnswer: q.answer,
          type: q.type || 'mixed',
          difficulty: q.difficulty || this.difficultyMap,
          timeSpent: 0  // 可以后续优化为单题计时
        }))
        
        const totalTime = this.timeLimit * 60 - this.remainingTime
        
        const res = await request({
          url: api.problemsSubmit,
          method: 'POST',
          auth: true,
          data: {
            problems,
            totalTime,
            grade: this.gradeNumber,
            module: this.moduleName
          }
        })
        
        uni.hideLoading()
        
        if (res.success) {
          // 保存批改结果并显示
          this.resultData = res
          this.showResult = true
          
          // 更新题目列表，标记对错
          this.questions = this.questions.map((q, index) => ({
            ...q,
            isCorrect: res.details[index]?.isCorrect,
            correctAnswer: res.details[index]?.correctAnswer
          }))
        } else {
          throw new Error(res.message || '评分失败')
        }
      } catch (err) {
        console.error('提交答案失败:', err)
        uni.hideLoading()
        
        // 降级方案：本地简单评分
        uni.showModal({
          title: '提示',
          content: '网络异常，无法提交到服务器。是否返回首页？',
          success: (res) => {
            if (res.confirm) {
              uni.switchTab({ url: '/pages/tabbar/index/index' })
            }
          }
        })
      }
    },
    
    // 返回首页
    backToHome() {
      uni.switchTab({ url: '/pages/tabbar/index/index' })
    },
    
    // 查看错题集
    viewWrongProblems() {
      uni.navigateTo({ url: '/pages/wrongProblems/wrongProblems' })
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
/* 批改结果样式 */
.result-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f7f8fa;
}

.result-header {
  background: linear-gradient(135deg, #20d0b0 0%, #00496e 100%);
  padding: 40rpx 30rpx;
  color: white;
  text-align: center;
  border-bottom-left-radius: 30rpx;
  border-bottom-right-radius: 30rpx;
}

.result-icon {
  width: 100rpx;
  height: 100rpx;
  margin-bottom: 20rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 30rpx;
}

.score-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 20rpx;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 10rpx;
}

.score-value {
  font-size: 32rpx;
  font-weight: bold;
}

.result-list {
  flex: 1;
  padding: 20rpx;
}

.result-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 25rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
}

.result-card.correct {
  border-left: 6rpx solid #20d0b0;
}

.result-card.wrong {
  border-left: 6rpx solid #f56c6c;
}

.result-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1px solid #eee;
}

.question-number {
  font-size: 28rpx;
  font-weight: bold;
  color: #00496e;
}

.result-badge {
  display: flex;
  align-items: center;
}

.badge-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
}

.correct-text {
  color: #20d0b0;
  font-size: 28rpx;
  font-weight: bold;
}

.wrong-text {
  color: #f56c6c;
  font-size: 28rpx;
  font-weight: bold;
}

.question-content {
  margin-bottom: 15rpx;
}

.expression {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
}

.answer-row {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}

.answer-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.answer-value {
  font-size: 28rpx;
  font-weight: bold;
}

.correct-answer {
  color: #20d0b0;
}

.wrong-answer {
  color: #f56c6c;
  text-decoration: line-through;
}

.result-footer {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1px solid #eee;
}

.action-btn {
  width: 45%;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
}

.action-btn.primary {
  background-color: #20d0b0;
  color: #fff;
}

.action-btn.secondary {
  background-color: #00496e;
  color: #fff;
}
</style>
