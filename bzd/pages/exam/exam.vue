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

          <!-- 比大小题：提供 > / < / = 选项，不用填空 -->
          <view v-if="q.type === 'comparison'" class="option-group">
            <view
              v-for="opt in (q.options || ['>','<','='])"
              :key="opt"
              :class="['option-item', q.answer === opt ? 'selected' : '']"
              @click="q.answer = opt"
            >
              {{ opt }}
            </view>
          </view>
          <!-- 带余数的除法：显示 商 和 余 两个输入框 -->
          <view v-else-if="(q.type && q.type.indexOf('division_with_remainder') !== -1) || q.remainder !== undefined || q.correctRemainder !== undefined" class="division-remainder">
            <view class="division-inputs">
              <input v-model="q.answerQuotient" type="number" class="answer-input" placeholder="商" />
              <text style="margin:0 10rpx; font-size:28rpx; align-self:center">余</text>
              <input v-model="q.answerRemainder" type="number" class="answer-input" placeholder="余数" />
            </view>
          </view>

          <!-- 其他题型：保留输入框 -->
          <input
            v-else
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
              {{ formatUserAnswer(detail, index) }}
            </text>
          </view>

          <view v-if="!detail.isCorrect" class="answer-row">
            <text class="answer-label">正确答案：</text>
            <text class="correct-answer">{{ formatCorrectAnswer(detail, index) }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 底部操作按钮 -->
      <view class="result-footer">
        <button class="action-btn export" @click="exportTxt">导出TXT</button>
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
        // 一、二年级新增题型（与后端 ProblemService 对应）
  '10以内加法': 'addition_10',
  '10以内减法': 'subtraction_10',
  '20以内加法（带进位）': 'addition_20_carry',
  '20以内减法（带借位）': 'subtraction_20_borrow',
  '100以内加减混合': 'mixed_100_add_sub',
  '100以内加减法混合运算': 'mixed_100_add_sub', // 题型文本别名
  '元角分换算': 'money_conversion',
  '元角分的换算': 'money_conversion',

  '9x9 乘法口诀': 'multiplication_9x9',
  '9以内乘法口诀': 'multiplication_9x9',
  '9x9 除法': 'division_9x9',
  '9以内除法': 'division_9x9',
  '乘法与加法混合': 'mixed_mul_add',
  '9以内乘法与加法混合': 'mixed_mul_add',
  '连续乘法（3项）': 'mixed_consecutive_mul',
  '10以内整数连续乘法': 'mixed_consecutive_mul',
  '带余数除法': 'division_with_remainder',
  '除数9以内带余数除法': 'division_with_remainder',
  '时间换算': 'time_conversion',

  // 三年级（13-20）
  '三位数加减法': 'add_sub_3digit',
  '两位数乘法': 'multiplication_2digit',
  '长方形、正方形周长的计算': 'perimeter_calc',
  '长方形、正方形面积的计算': 'area_calc',
  '百以内的加减乘除法大小比较': 'comparison_100',
  '重量单位换算': 'weight_conversion',
  '时间计算': 'time_duration',
  '余数除法（大数）': 'division_with_remainder_large',

  // 四年级（21-28）
  '小数的加法和减法': 'decimal_add_sub',
  '小数的保留': 'decimal_rounding',
  '两位数的四则运算': 'mixed_ops_2digit',
  '千以内含括号的四则运算': 'mixed_ops_parenthesis',
  '巧用交换律与结合律': 'associative_law',
  '巧用乘法分配律': 'distributive_law',
  '比较千以内的算式大小比较': 'advanced_comparison',
  '近似数认识': 'number_rounding_unit',

        // 其他旧模块映射（保留）
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

        // 兼容多种后端返回格式：
        // 1) { success: true, data: [...] }
        // 2) [...]  （直接数组）
        // 3) { count: n, data: [...] }
        let problems = []
        try {
          if (Array.isArray(res)) {
            problems = res
          } else if (res && Array.isArray(res.data)) {
            problems = res.data
          } else if (res && Array.isArray(res.problems)) {
            problems = res.problems
          } else if (res && res.count && Array.isArray(res.data)) {
            problems = res.data
          }
        } catch (e) {
          console.warn('解析后端出题响应时出现异常', e, res)
        }

          if (problems && problems.length > 0) {
          this.questions = problems.map(p => {
            // Normalize certain variant types to unified keys for UI
            let normalizedType = p.type || p.problemType || 'mixed'
            const ntStr = String(normalizedType)
            if (ntStr.indexOf('division_with_remainder') !== -1) {
              normalizedType = 'division_with_remainder'
            } else if (ntStr.indexOf('comparison') !== -1) {
              // comparison_100, advanced_comparison -> comparison (render as choices >,<,=)
              normalizedType = 'comparison'
            }

            return {
              id: p.id,
              question: normalizedType === 'comparison' ? p.expression : (p.expression ? p.expression + ' =' : (p.question || '')),
              answer: '',
              // 带余数题目把 remainder 一并保存
              correctRemainder: p.remainder !== undefined ? p.remainder : undefined,
              // 注意：answer 可能为 0，不能用 `||` 否则会被误判为 undefined
              correctAnswer: (p.answer !== undefined && p.answer !== null)
                ? p.answer
                : (p.correctAnswer !== undefined && p.correctAnswer !== null)
                  ? p.correctAnswer
                  : p.answerValue,
              remainder: p.remainder !== undefined ? p.remainder : undefined,
              type: normalizedType,
              difficulty: p.difficulty || this.difficultyMap,
              expression: p.expression || p.expr || '',
              options: p.options,
              // 初始化双输入字段（带余数）
              answerQuotient: '',
              answerRemainder: ''
            }
          })
          uni.hideLoading()
        } else {
          // 如果后端返回了错误信息，记录在控制台并抛错以进入本地模式
          console.warn('后端出题返回非预期格式或空数据：', res)
          throw new Error('后端返回数据为空或格式不支持')
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
      // 针对新增的一二年级题型做本地降级生成
      if (this.moduleName === '10以内加法') {
        this.questions = Array.from({ length: this.questionCount }, () => {
          const a = Math.floor(Math.random() * 11)
          const b = Math.floor(Math.random() * (11 - a))
          return { question: `${a} + ${b} =`, answer: '' }
        })
      } else if (this.moduleName === '10以内减法') {
        this.questions = Array.from({ length: this.questionCount }, () => {
          const a = Math.floor(Math.random() * 11)
          const b = Math.floor(Math.random() * (a + 1))
          return { question: `${a} - ${b} =`, answer: '' }
        })
      } else if (
        this.moduleName === '20以内加法（带进位）' ||
        this.moduleName === '20以内减法（带借位）' ||
        this.moduleName === '100以内加减混合' ||
        this.moduleName === '100以内加减法混合运算'
      ) {
        // 使用通用加减生成，范围调整
        const range = this.moduleName.includes('100') ? 100 : 20
        this.questions = Array.from({ length: this.questionCount }, () => {
          const a = Math.floor(Math.random() * (range - 1)) + 1
          const b = Math.floor(Math.random() * (range - 1)) + 1
          const op = Math.random() > 0.5 ? '+' : '-'
          return { question: `${a} ${op} ${b} =`, answer: '' }
        })
      } else if (
        this.moduleName === '元角分换算' ||
        this.moduleName === '元角分的换算' ||
        this.moduleName === '时间换算'
      ) {
        // 简单单位换算题本地生成
        this.questions = Array.from({ length: this.questionCount }, () => {
          if (this.moduleName === '元角分换算') {
            const j = Math.floor(Math.random() * 9) + 1
            const f = Math.floor(Math.random() * 9) + 1
            return { question: `${j}角${f}分 = ? 分`, answer: '' }
          } else {
            const m = Math.floor(Math.random() * 9) + 1
            const s = Math.floor(Math.random() * 59) + 1
            return { question: `${m}分${s}秒 = ? 秒`, answer: '' }
          }
        })
  } else if (this.moduleName === '9x9 乘法口诀' || this.moduleName === '9以内乘法口诀') {
        this.questions = Array.from({ length: this.questionCount }, () => {
          const a = Math.floor(Math.random() * 9) + 1
          const b = Math.floor(Math.random() * 9) + 1
          return { question: `${a} × ${b} =`, answer: '' }
        })
      } else if (
        this.moduleName === '9x9 除法' ||
        this.moduleName === '9以内除法' ||
        this.moduleName === '带余数除法' ||
        this.moduleName === '除数9以内带余数除法'
      ) {
        this.questions = Array.from({ length: this.questionCount }, () => {
          const b = Math.floor(Math.random() * 9) + 1
          const q = Math.floor(Math.random() * 9) + 1
          const a = b * q + Math.floor(Math.random() * b)
          return { question: `${a} ÷ ${b} =`, answer: '' }
        })
      } else if (
        this.moduleName === '乘法与加法混合' ||
        this.moduleName === '9以内乘法与加法混合' ||
        this.moduleName === '连续乘法（3项）' ||
        this.moduleName === '10以内整数连续乘法'
      ) {
        this.questions = Array.from({ length: this.questionCount }, () => {
          if (this.moduleName === '连续乘法（3项）') {
            const a = Math.floor(Math.random() * 9) + 1
            const b = Math.floor(Math.random() * 9) + 1
            const c = Math.floor(Math.random() * 9) + 1
            return { question: `${a} × ${b} × ${c} =`, answer: '' }
          }
          const a = Math.floor(Math.random() * 9) + 1
          const b = Math.floor(Math.random() * 9) + 1
          const c = Math.floor(Math.random() * 20) + 1
          if (Math.random() > 0.5) return { question: `${a} × ${b} + ${c} =`, answer: '' }
          return { question: `${a} + ${b} × ${c} =`, answer: '' }
        })
      } else {
        // 兼容旧模块
        if (this.moduleName.includes('加减')) {
          this.questions = this.createAddSubQuestions(level)
        } else if (this.moduleName.includes('乘除')) {
          this.questions = this.createMulDivQuestions(level)
        } else {
          this.questions = this.createAddSubQuestions(level)
        }
      }
        // 新增：三年级和四年级本地降级生成覆盖（13-28）
        // 三位数加减法
        if (this.moduleName === '三位数加减法') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const op = Math.random() > 0.5 ? '+' : '-'
            let a = Math.floor(Math.random() * 900) + 100
            let b = Math.floor(Math.random() * 900) + 100
            if (op === '-' && b > a) [a, b] = [b, a]
            return { question: `${a} ${op} ${b} =`, answer: '' }
          })
        }

        // 两位数乘法
        if (this.moduleName === '两位数乘法') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 90) + 10
            const b = Math.floor(Math.random() * 90) + 10
            return { question: `${a} × ${b} =`, answer: '' }
          })
        }

        // 周长与面积
        if (this.moduleName === '长方形、正方形周长的计算') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            if (Math.random() > 0.5) {
              const l = Math.floor(Math.random() * 50) + 1
              const w = Math.floor(Math.random() * 50) + 1
              return { question: `长方形长${l}cm, 宽${w}cm, 周长是? cm`, answer: '' }
            } else {
              const s = Math.floor(Math.random() * 50) + 1
              return { question: `正方形边长${s}cm, 周长是? cm`, answer: '' }
            }
          })
        }

        if (this.moduleName === '长方形、正方形面积的计算') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            if (Math.random() > 0.5) {
              const l = Math.floor(Math.random() * 50) + 1
              const w = Math.floor(Math.random() * 50) + 1
              return { question: `长方形长${l}cm, 宽${w}cm, 面积是? cm²`, answer: '' }
            } else {
              const s = Math.floor(Math.random() * 50) + 1
              return { question: `正方形边长${s}cm, 面积是? cm²`, answer: '' }
            }
          })
        }

        // 百以内比较
        if (this.moduleName === '百以内的加减乘除法大小比较') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 99) + 1
            const b = Math.floor(Math.random() * 99) + 1
            const ops = ['+', '-', '×', '÷']
            const op = ops[Math.floor(Math.random() * ops.length)]
            let leftExpr = `${a} ${op} ${b}`
            if (op === '÷') {
              const divisor = Math.floor(Math.random() * 9) + 1
              const q = Math.floor(Math.random() * 9) + 1
              const dividend = divisor * q
              leftExpr = `${dividend} ÷ ${divisor}`
            }
            const right = Math.floor(Math.random() * 200) + 1
            // compute correct comparator
            let leftVal = 0
            try {
              leftVal = new Function(`return ${leftExpr.replace(/×/g, '*').replace(/÷/g, '/')}`)()
            } catch (e) {
              leftVal = 0
            }
            const comp = leftVal > right ? '>' : (leftVal < right ? '<' : '=')
            return { question: `${leftExpr} ? ${right}`, answer: '', type: 'comparison', options: ['>', '<', '='], correctAnswer: comp }
          })
        }

        // 重量单位换算
        if (this.moduleName === '重量单位换算') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const t = Math.floor(Math.random() * 99) + 1
            return { question: `${t}吨 = ? 千克`, answer: '' }
          })
        }

        // 时间计算
        if (this.moduleName === '时间计算') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            // pick a start time and a positive duration (no overflow to previous day)
            const h1 = Math.floor(Math.random() * 23) // 0-22
            const m1 = Math.floor(Math.random() * 60)
            // duration between 1 minute and up to remaining minutes in day (but keep reasonable)
            const addMinutes = Math.floor(Math.random() * 8) * 15 + (Math.floor(Math.random() * 4)) + 1 // small increments
            let total1 = h1 * 60 + m1
            let total2 = total1 + addMinutes
            if (total2 >= 24 * 60) total2 = (total1 + (addMinutes % (24 * 60))) % (24 * 60)
            const h2 = Math.floor(total2 / 60)
            const m2 = total2 % 60
            const t1 = `${String(h1).padStart(2,'0')}:${String(m1).padStart(2,'0')}`
            const t2 = `${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}`
            return { question: `${t1}到${t2}是 ? 分钟`, answer: '' }
          })
        }

        // 余数除法（大数） - 生成被除数1000以内，除数100以内
        if (this.moduleName === '余数除法' || this.moduleName === '余数除法（大数）') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const b = Math.floor(Math.random() * 99) + 1
            const q = Math.floor(Math.random() * 20) + 1
            const a = b * q + Math.floor(Math.random() * b) // ensure remainder < b
            const correctQuotient = Math.floor(a / b)
            const correctRemainder = a % b
            return {
              question: `${a} ÷ ${b} =`,
              answer: '',
              type: 'division_with_remainder',
              correctAnswer: correctQuotient,
              remainder: correctRemainder,
              answerQuotient: '',
              answerRemainder: ''
            }
          })
        }

        // 小数加减
        if (this.moduleName === '小数的加法和减法') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = (Math.floor(Math.random() * 1000) / 100).toFixed(2)
            const b = (Math.floor(Math.random() * 1000) / 100).toFixed(2)
            return { question: `${a} ${Math.random()>0.5?'+':'-'} ${b} =`, answer: '' }
          })
        }

        // 小数保留
        if (this.moduleName === '小数的保留') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const num = (Math.random() * 100).toFixed(3)
            const d = Math.random() > 0.5 ? 1 : 2
            return { question: `${num} (保留${d}位小数)`, answer: '' }
          })
        }

        // 两位数四则运算 & 带括号四则
        if (this.moduleName === '两位数的四则运算' || this.moduleName === '千以内含括号的四则运算') {
          this.questions = Array.from({ length: this.questionCount }, () => {
            const a = Math.floor(Math.random() * 90) + 10
            const b = Math.floor(Math.random() * 90) + 10
            const c = Math.floor(Math.random() * 90) + 10
            if (this.moduleName === '千以内含括号的四则运算') {
              return { question: `${a} × (${b} - ${Math.floor(Math.random()*b)}) =`, answer: '' }
            }
            const op1 = Math.random()>0.5? '×' : '÷'
            const op2 = Math.random()>0.5? '+' : '-'
            if (op1 === '÷') {
              const divisor = Math.floor(Math.random() * 9) + 1
              const q = Math.floor(Math.random() * 9) + 1
              const dividend = divisor * q
              return { question: `${dividend} ÷ ${divisor} ${op2} ${c} =`, answer: '' }
            }
            return { question: `${a} ${op1} ${b} ${op2} ${c} =`, answer: '' }
          })
        }

        // 交换律/结合律/分配律/比较千以内/近似数认识 - 简单生成占位题
        if (this.moduleName === '巧用交换律与结合律' || this.moduleName === '巧用乘法分配律' || this.moduleName === '比较千以内的算式大小比较' || this.moduleName === '近似数认识') {
          this.questions = Array.from({ length: this.questionCount }, () => ({ question: '请写出计算结果', answer: '' }))
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
      
      // 校验所有题目的答案是否已填写：针对带余数的除法检查两个输入框
      const empty = this.questions.some(q => {
        if (q.type === 'division_with_remainder') {
          return !(q.answerQuotient !== undefined && q.answerQuotient !== '' && q.answerRemainder !== undefined && q.answerRemainder !== '')
        }
        if (q.type === 'comparison') {
          return !(q.answer !== undefined && q.answer !== '')
        }
        return !(q.answer !== undefined && q.answer !== '')
      })
      if (empty) {
        uni.showToast({ title: '请填写所有答案', icon: 'none' })
        return
      }
      
      // 保存练习记录
      this.saveProgress(false)
      
      uni.showLoading({ title: '评分中...', mask: true })
      
      try {
        // 构造提交数据
        const problems = this.questions.map(q => {
          if (q.type === 'division_with_remainder') {
            return {
              id: q.id,
              expression: q.expression || q.question.replace(' =', ''),
              answer: q.correctAnswer, // 商
              remainder: q.remainder || q.correctRemainder || undefined,
              userAnswer: {
                quotient: Number(q.answerQuotient),
                remainder: Number(q.answerRemainder)
              },
              type: q.type || 'division_with_remainder',
              difficulty: q.difficulty || this.difficultyMap,
              timeSpent: 0
            }
          }

          return {
            id: q.id,
            expression: q.expression || q.question.replace(' =', ''),
            answer: q.correctAnswer,
            userAnswer: q.answer,
            type: q.type || 'mixed',
            difficulty: q.difficulty || this.difficultyMap,
            timeSpent: 0  // 可以后续优化为单题计时
          }
        })
        
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

        // 兼容多种后端返回结构：{ success, summary, details } 或直接 { summary, details }
        const ok = (res && res.success) || (res && res.summary && Array.isArray(res.details))

        if (ok) {
          this.resultData = res
          this.showResult = true

          const details = res.details || []
          this.questions = this.questions.map((q, index) => ({
            ...q,
            isCorrect: details[index]?.isCorrect,
            correctAnswer: details[index]?.correctAnswer,
            // 如果后端返回 remainder，则保存到本地题目信息
            correctRemainder: details[index]?.remainder ?? details[index]?.correctRemainder ?? q.correctRemainder ?? q.remainder
          }))
        } else {
          console.warn('提交评分时后端返回非预期格式或错误：', res)
          throw new Error((res && res.message) || '评分失败')
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
    // ✅ 导出本次题目与批改结果为 TXT
    exportTxt() {
      if (!this.showResult || !this.resultData) {
        return uni.showToast({ title: '请先完成并批改试卷', icon: 'none' })
      }

      const summary = this.resultData.summary || {}
      const details = this.resultData.details || []
      const pad = (n) => (n < 10 ? '0' + n : '' + n)
      const now = new Date()
      const filename = `口算练习_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`

      const lines = []
      lines.push('【口算练习导出】')
      lines.push(`时间：${now.toLocaleString()}`)
      lines.push(`年级：${this.grade}  模块：${this.moduleName}  难度：${this.difficulty}`)
      lines.push(`总题数：${summary.total}  正确：${summary.correct}  正确率：${summary.accuracy}%`)
      const usedMin = Math.floor((summary.totalTime || 0) / 60)
      const usedSec = (summary.totalTime || 0) % 60
      lines.push(`用时：${usedMin}分${usedSec}秒`)
      lines.push('')
      lines.push('—— 题目详情 ——')

      details.forEach((d, i) => {
        const idx = i + 1
        const expr = d.expression || this.questions[i]?.expression || this.questions[i]?.question?.replace(' =','') || ''
        const ua = this.formatUserAnswer(d, i)
        const ca = this.formatCorrectAnswer(d, i)
        const correctMark = d.isCorrect ? '正确' : '错误'
        lines.push(`${idx}. ${expr}`)
        lines.push(`   你的答案：${ua}    结果：${correctMark}`)
        if (!d.isCorrect) {
          lines.push(`   正确答案：${ca}`)
        }
      })

      const content = lines.join('\n')

      // 各端保存
      // #ifdef H5
      try {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        uni.showToast({ title: '下载已开始' })
      } catch (e) {
        uni.showModal({ title: '导出失败', content: '浏览器不支持自动下载，请手动复制内容', showCancel: false })
      }
      // #endif

      // #ifdef APP-PLUS
      try {
        plus.io.requestFileSystem(plus.io.PRIVATE_DOC, (fs) => {
          fs.root.getDirectory('exports', { create: true }, (dir) => {
            dir.getFile(filename, { create: true }, (file) => {
              file.createWriter((writer) => {
                writer.onwrite = () => {
                  uni.showToast({ title: '已保存到本地文件', icon: 'none' })
                }
                writer.seek(0)
                writer.write(content)
              }, (err) => {
                uni.showToast({ title: '写入失败', icon: 'none' })
              })
            })
          })
        }, () => uni.showToast({ title: '无法访问存储', icon: 'none' }))
      } catch (e) {
        uni.showToast({ title: '导出失败', icon: 'none' })
      }
      // #endif

      // #ifdef MP-WEIXIN
      try {
        const fsm = wx.getFileSystemManager()
        const filePath = `${wx.env.USER_DATA_PATH}/${filename}`
        fsm.writeFile({
          filePath,
          data: content,
          encoding: 'utf8',
          success: () => {
            wx.showToast({ title: '已保存到本地', icon: 'none' })
          },
          fail: () => {
            wx.showModal({ title: '导出失败', content: '请检查存储权限', showCancel: false })
          }
        })
      } catch (e) {
        uni.showToast({ title: '导出失败', icon: 'none' })
      }
      // #endif

      // 其它平台降级：复制内容
      // #ifndef H5 || APP-PLUS || MP-WEIXIN
      uni.setClipboardData({ data: content, success: () => uni.showToast({ title: '内容已复制' }) })
      // #endif
    },

    getDifficultyIcon(level) {
      if (level === '简单') return '/static/icons/easy.png'
      if (level === '中等') return '/static/icons/medium.png'
      if (level === '困难') return '/static/icons/hard.png'
      return '/static/icons/medium.png'
    }
    ,
    // 格式化用户答案显示（处理带余数除法的对象格式）
    formatUserAnswer(detail, index) {
      try {
        const qType = detail.type || this.questions[index]?.type
        const ua = detail.userAnswer ?? this.questions[index]?.userAnswer ?? this.questions[index]?.answer
        if (qType === 'division_with_remainder' || this.questions[index]?.type === 'division_with_remainder') {
          if (!ua) return ''
          if (typeof ua === 'object') {
            const qu = ua.quotient ?? ua.q ?? ua.quot
            const rem = ua.remainder ?? ua.r ?? ua.rem
            return `${qu} 余 ${rem}`
          }
          // 如果是字符串，尝试抽数字
          const nums = String(ua).match(/-?\d+/g)
          if (nums && nums.length >= 1) {
            const qu = nums[0]
            const rem = nums[1] ?? ''
            return rem !== '' ? `${qu} 余 ${rem}` : `${qu}`
          }
          return String(ua)
        }
        // 非余数除法，直接返回
        return typeof ua === 'object' ? JSON.stringify(ua) : String(ua)
      } catch (e) {
        console.warn('formatUserAnswer error', e, detail)
        return detail.userAnswer ?? ''
      }
    },

    // 格式化正确答案显示（处理带余数除法的 remainder）
    formatCorrectAnswer(detail, index) {
      try {
        const qType = detail.type || this.questions[index]?.type
        const ca = detail.correctAnswer ?? this.questions[index]?.correctAnswer
        const rem = detail.remainder ?? detail.correctRemainder ?? this.questions[index]?.correctRemainder ?? this.questions[index]?.remainder
        if (qType === 'division_with_remainder' || this.questions[index]?.type === 'division_with_remainder') {
          if (rem !== undefined && rem !== null && rem !== '') return `${ca} 余 ${rem}`
          // 如果没有 remainder，仍返回商
          return String(ca)
        }
        return String(ca)
      } catch (e) {
        console.warn('formatCorrectAnswer error', e, detail)
        return detail.correctAnswer ?? ''
      }
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

/* 比大小题的选项样式 */
.option-group {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 10rpx;
}
.option-item {
  min-width: 120rpx;
  text-align: center;
  padding: 16rpx 24rpx;
  border: 2rpx solid #20d0b0;
  border-radius: 12rpx;
  color: #00496e;
  background-color: #fff;
}
.option-item.selected {
  background-color: #20d0b0;
  color: #fff;
  border-color: #20d0b0;
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
  flex-wrap: wrap;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1px solid #eee;
}

.action-btn {
  width: 30%;
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

.action-btn.export {
  background-color: #ffa500;
  color: #fff;
}
</style>
