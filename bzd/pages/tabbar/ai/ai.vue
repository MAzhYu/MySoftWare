<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    <!-- 顶部标题 -->
    <view class="header">
      <image src="/static/icons/ai.png" class="ai-icon" />
      <text class="title">AI 学习助手</text>
    </view>

    <!-- 聊天记录 -->
    <scroll-view
      scroll-y
      class="chat-box"
      :scroll-into-view="scrollToId"
    >
      <view
        v-for="(msg, index) in messages"
        :key="index"
        :id="'msg' + index"
        :class="['message', msg.role]"
      >
        <image
          :src="msg.role === 'user' ? '/static/icons/student.png' : '/static/icons/robot.png'"
          class="avatar"
        />
        <view class="bubble">
          <!-- 用户消息：纯文本 -->
          <text v-if="msg.role === 'user'">{{ msg.text }}</text>
          <!-- AI 消息：Markdown 渲染为 rich-text -->
          <rich-text v-else :nodes="renderMarkdown(msg.text)"></rich-text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部区域（快捷操作 + 输入） -->
    <view class="bottom-box">
      <!-- 快捷功能区 -->
      <view class="quick-ask">
        <view class="quick-row">
          <button class="quick-btn" @click="handleAnalysis">1. 学情分析</button>
          <button class="quick-btn" @click="handleExplainWrong">2. 讲解错题</button>
          <button class="quick-btn" @click="handleSmartQuiz">3. 智能出题</button>
        </view>
      </view>
    
      <!-- 输入框 -->
      <view class="input-area">
        <input
          v-model="inputText"
          class="chat-input"
          placeholder="请输入问题，例如：帮我出10道三年级加减法题"
          confirm-type="send"
          @confirm="sendMessage"
        />
        <button class="send-btn" @click="sendMessage">发送</button>
      </view>
    </view>
  </view>
</template>

<script>
import { request, api } from '@/request.js'

export default {
  data() {
    return {
      messages: [
        {
          role: 'ai',
          text: '你好！我是马神 🦌，你的数学学习助手 🤖，可以帮你出题、讲解错题或推荐学习计划。'
        }
      ],
      inputText: '',
      scrollToId: '',
      quickQuestions: []
    }
  },
  onShow() {
    // ✅ 检查登录状态
    this.checkLogin()
  },
  methods: {
    /** ✅ 检查登录状态 */
    checkLogin() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后使用AI助手',
          showCancel: false,
          success: () => {
            uni.switchTab({
              url: '/pages/tabbar/me/me'
            })
          }
        })
        return false
      }
      return true
    },
    
    // 将 Markdown 字符串渲染为 HTML（再交给 rich-text）
    renderMarkdown(md) {
      const esc = (s) => String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (!md) return ''
      let text = String(md)

      // 代码块 ```...```
      text = text.replace(/```([\s\S]*?)```/g, (m, p1) => `
<pre><code>${esc(p1)}</code></pre>
`)

      // 行内代码 `...`
      text = text.replace(/`([^`]+)`/g, (m, p1) => `<code>${esc(p1)}</code>`)

      // 标题 # ## ###
      text = text.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
                 .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
                 .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')

      // 粗体/斜体 **text**, *text*
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                 .replace(/\*([^*]+)\*/g, '<em>$1</em>')

      // 无序列表（简单处理连续以 - 或 * 开头的多行）
      text = text.replace(/(^|\n)(?:[-*]\s+.+)(?:\n[-*]\s+.+)+/g, (block) => {
        const items = block.trim().split(/\n/).map(line => line.replace(/^[-*]\s+/, ''))
        return '\n<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>'
      })

      // 有序列表（1. 2. ...）
      text = text.replace(/(^|\n)(?:\d+\.\s+.+)(?:\n\d+\.\s+.+)+/g, (block) => {
        const items = block.trim().split(/\n/).map(line => line.replace(/^\d+\.\s+/, ''))
        return '\n<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>'
      })

      // 引用 >
      text = text.replace(/^(>\s+.*)$/gm, (m, p1) => `<blockquote>${p1.replace(/^>\s+/, '')}</blockquote>`) 

      // 将剩余的空行转换为段落/换行（简单化处理）
      // 先把双换行作为段落
      text = text.replace(/\n\n+/g, '</p><p>')
      // 单行换行转 <br/>
      text = text.replace(/\n/g, '<br/>')
      // 包裹为段落
      text = `<p>${text}</p>`

      return text
    },
    // 1) 学情分析：发送学习进度 + 未掌握错题给 AI 分析
    async handleAnalysis() {
      try {
        // 占位消息
        this.messages.push({ role: 'user', text: '学情分析' })
        this.messages.push({ role: 'ai', text: '正在汇总你的学习情况并分析，请稍等……' })

        // 拉取学习进度与错题（未掌握）
        const [meRes, wrongRes] = await Promise.all([
          request({ url: api.me, method: 'GET', auth: true }),
          request({ url: `${api.wrongProblems}?isMastered=false&limit=50`, method: 'GET', auth: true })
        ])

        const lp = meRes?.user?.learningProgress || {}
        const wrongList = Array.isArray(wrongRes?.data) ? wrongRes.data : []

        // 构造消息
  const system = '你是一位小学数学老师，请用温暖、关怀、鼓励的口吻，用简洁的中文做学情分析。请使用 Markdown 分点输出，面向小学生和家长都能看懂：1) 学情总结 2) 主要薄弱点（按类型/难度）3) 3-5条针对性建议（简短）4) 一周练习计划（每天1-2句话建议）。'
        const content = {
          learningProgress: lp,
          wrongProblems: wrongList.map(w => ({
            expression: w.expression,
            type: w.type,
            difficulty: w.difficulty,
            correctAnswer: w.correctAnswer,
            userAnswer: w.userAnswer,
            grade: w.grade,
            wrongCount: w.wrongCount,
            lastAttemptDate: w.lastAttemptDate
          }))
        }

        const res = await request({
          url: api.aiChat,
          method: 'POST',
          auth: true,
          data: {
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: `以下是学习数据（JSON）：\n${JSON.stringify(content, null, 2)}\n请按照上面的要求输出，注意：语气友好、鼓励；条目清晰；尽量给出可执行的小建议。` }
            ],
            temperature: 0.3,
            maxTokens: 800
          }
        })

        const replyText = res?.data?.content || '（AI助手）暂时无法完成学情分析，请稍后重试。'
        this.messages.splice(this.messages.length - 1, 1, { role: 'ai', text: replyText })
      } catch (err) {
        this.messages.splice(this.messages.length - 1, 1, { role: 'ai', text: '出错啦 😥 无法获取学情分析。' })
      } finally {
        this.$nextTick(() => { this.scrollToId = 'msg' + (this.messages.length - 1) })
      }
    },

    // 2) 讲解错题：选择错题并调用后端 /api/ai/explain
    async handleExplainWrong() {
      try {
        const [meRes, wrongRes] = await Promise.all([
          request({ url: api.me, method: 'GET', auth: true }),
          request({ url: `${api.wrongProblems}?isMastered=false&limit=50`, method: 'GET', auth: true })
        ])
        const wrongList = Array.isArray(wrongRes?.data) ? wrongRes.data : []
        if (!wrongList.length) {
          return uni.showToast({ title: '暂无未掌握错题', icon: 'none' })
        }

        // 让用户选择一道错题
        const itemList = wrongList.slice(0, 10).map(w => w.expression)
        const action = await new Promise((resolve) => {
          uni.showActionSheet({ itemList, success: resolve, fail: () => resolve(null) })
        })
        if (!action || action.cancel) return
        const idx = action.tapIndex
        const chosen = wrongList[idx]

        // 生成年级数字
        const gradeStr = meRes?.user?.learningProgress?.grade || '一年级'
        const gradeNum = this.gradeToNumber(gradeStr)

        // 占位消息
        this.messages.push({ role: 'user', text: `讲解错题：${chosen.expression}` })
        this.messages.push({ role: 'ai', text: '正在为你讲解这道题，请稍等……' })

        // 调用讲解接口
        const res = await request({
          url: api.aiExplain,
          method: 'POST',
          auth: true,
          data: {
            expression: chosen.expression,
            correctAnswer: chosen.correctAnswer,
            userAnswer: chosen.userAnswer,
            grade: gradeNum,
            language: 'zh'
          }
        })

        const replyText = res?.explanation || '（AI助手）暂时无法讲解该题，请稍后重试。'
        this.messages.splice(this.messages.length - 1, 1, { role: 'ai', text: replyText })
      } catch (err) {
        this.messages.splice(this.messages.length - 1, 1, { role: 'ai', text: '出错啦 😥 无法讲解错题。' })
      } finally {
        this.$nextTick(() => { this.scrollToId = 'msg' + (this.messages.length - 1) })
      }
    },

  // 3) 智能出题：基于薄弱点生成 3 道日常情景题（含讲解与答案）
    async handleSmartQuiz() {
      try {
        this.messages.push({ role: 'user', text: '智能出题（基于我的薄弱点）' })
        this.messages.push({ role: 'ai', text: '正在分析薄弱点并生成试题，请稍等……' })

        const [meRes, wrongRes] = await Promise.all([
          request({ url: api.me, method: 'GET', auth: true }),
          request({ url: `${api.wrongProblems}?isMastered=false&limit=50`, method: 'GET', auth: true })
        ])
        const lp = meRes?.user?.learningProgress || {}
        const wrongList = Array.isArray(wrongRes?.data) ? wrongRes.data : []

  const system = '你是一位小学数学老师。请根据学生的薄弱点，结合小学生日常生活情景（如买文具、分苹果、乘公交、分糖果等），生成3道有趣的口算题，并在每道题之后给出简短清晰的讲解和标准答案。确保不超纲、数字适中、语气友好。用中文 Markdown 输出。'
        const payload = {
          learningProgress: lp,
          wrongProblems: wrongList.map(w => ({ expression: w.expression, type: w.type, difficulty: w.difficulty }))
        }

        const res = await request({
          url: api.aiChat,
          method: 'POST',
          auth: true,
          data: {
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: `学生数据（JSON）：\n${JSON.stringify(payload, null, 2)}\n请输出共3道题，严格按如下结构（每题一个情景）：\n\n1. **情景**：一句话描述（贴近日常，例如在文具店买铅笔）\n   **题目**：口算表达式或情景题问题本身（尽量口语化）\n   **思路讲解**：2-4句讲解（必要时给简单对齐/进位提示，不展开长过程）\n   **答案**：明确写出\n\n2. **情景**：...\n   **题目**：...\n   **思路讲解**：...\n   **答案**：...\n\n3. **情景**：...\n   **题目**：...\n   **思路讲解**：...\n   **答案**：...` }
            ],
            temperature: 0.4,
            maxTokens: 900
          }
        })

        const replyText = res?.data?.content || '（AI助手）暂时无法生成题目，请稍后重试。'
        this.messages.splice(this.messages.length - 1, 1, { role: 'ai', text: replyText })
      } catch (err) {
        this.messages.splice(this.messages.length - 1, 1, { role: 'ai', text: '出错啦 😥 无法生成智能出题。' })
      } finally {
        this.$nextTick(() => { this.scrollToId = 'msg' + (this.messages.length - 1) })
      }
    },

    gradeToNumber(gradeStr) {
      if (typeof gradeStr !== 'string') return 1
      const m = gradeStr.match(/(\d+)/)
      return m ? parseInt(m[1]) : 1
    },

    async sendMessage() {
      if (!this.inputText.trim()) return
      const userMsg = { role: 'user', text: this.inputText }
      this.messages.push(userMsg)
      this.inputText = ''

      this.$nextTick(() => {
        this.scrollToId = 'msg' + (this.messages.length - 1)
      })

      this.messages.push({ role: 'ai', text: '正在思考中，请稍等……' })

      try {
        const res = await request({
          url: api.aiChat,
          method: 'POST',
          data: {
            messages: [
              {
                role: 'system',
                content: '你是一位小学数学老师，与小学生对话时请使用温暖、关怀、鼓励性的中文语气，表达清晰简洁，必要时给一个很小的例子帮助孩子理解。所有回答使用 Markdown 表达，避免生硬的专业术语。'
              },
              { role: 'user', content: userMsg.text }
            ],
            temperature: 0.5,
            maxTokens: 600
          },
          auth: true
        })
        const replyText = res?.data?.content || res?.explanation || '（AI助手）暂时无法回答这个问题，请稍后重试。'
        this.messages.splice(this.messages.length - 1, 1, {
          role: 'ai',
          text: replyText
        })
      } catch (err) {
        this.messages.splice(this.messages.length - 1, 1, {
          role: 'ai',
          text: '出错啦 😥 网络异常或AI服务暂不可用。'
        })
      }

      this.$nextTick(() => {
        this.scrollToId = 'msg' + (this.messages.length - 1)
      })
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
  position: relative;
}

/* 顶部标题 */
.header {
  display: flex;
  align-items: center;
  padding: 25rpx 40rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}
.ai-icon {
  width: 50rpx;
  height: 50rpx;
  margin-right: 20rpx;
}
.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #00496e;
}

/* 聊天内容区 */
.chat-box {
  flex: 1;
  padding: 30rpx;
  background-color: #f1f2f6;
  overflow-y: auto;
  box-sizing: border-box;
  /* 留出底部空间防止被输入区遮住 */
  margin-bottom: 260rpx;
}
.message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 25rpx;
}
.message.user {
  flex-direction: row-reverse;
}
.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin: 0 15rpx;
}
.bubble {
  max-width: 70%;
  padding: 20rpx 25rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  line-height: 1.5;
  word-wrap: break-word;
}
.message.user .bubble {
  background-color: #20d0b0;
  color: #fff;
  border-bottom-right-radius: 0;
}
.message.ai .bubble {
  background-color: #fff;
  color: #333;
  border-bottom-left-radius: 0;
}

/* 底部整体区域（固定） */
/* 底部整体区域（固定） */
.bottom-box {
  position: fixed;
  bottom: var(--window-bottom);
  left: 0;
  width: 100%;
  background-color: #fff;
  box-shadow: 0 -4rpx 8rpx rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

/* 横向滚动快捷提问区 */
.quick-ask {
  width: 100%;
  overflow-x: scroll;
  white-space: nowrap;
  background-color: #fff;
  padding: 15rpx 10rpx;
  border-top: 1px solid #eee;
}
.quick-row {
  display: flex;
  flex-direction: row;
}
.quick-btn {
  flex-shrink: 0;
  margin: 0 10rpx;
  background-color: #e6f9f5;
  color: #00496e;
  border-radius: 30rpx;
  padding: 10rpx 25rpx;
  font-size: 26rpx;
  border: none;
  white-space: nowrap; /* 避免按钮文字换行 */
}

/* 输入框 */
.input-area {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 10rpx 20rpx 20rpx;
}
.chat-input {
  flex: 1;
  height: 70rpx;
  border: 1px solid #ccc;
  border-radius: 35rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
}
.send-btn {
  background-color: #20d0b0;
  color: #fff;
  border: none;
  border-radius: 30rpx;
  padding: 0 35rpx;
  height: 70rpx;
  font-size: 28rpx;
  margin-left: 15rpx;
}

</style>
