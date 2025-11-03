<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <image src="/static/icons/ai.png" class="ai-icon" />
      <text class="title">AI 学习助手</text>
    </view>

    <!-- 聊天记录 -->
    <scroll-view scroll-y class="chat-box" :scroll-into-view="scrollToId">
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
          <text>{{ msg.text }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 快捷建议 -->
    <view class="quick-ask">
      <button v-for="(q, i) in quickQuestions" :key="i" @click="sendQuick(q)">
        {{ q }}
      </button>
    </view>

    <!-- 输入区 -->
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
</template>

<script>
import { request } from '@/request.js'

export default {
  data() {
    return {
      messages: [
        {
          role: 'ai',
          text: '你好！我是你的数学学习助手 🤖，可以帮你出题、讲解错题或推荐学习计划。'
        }
      ],
      inputText: '',
      scrollToId: '',
      quickQuestions: ['帮我出10道题', '讲解我错的题', '推荐学习计划']
    }
  },
  methods: {
    async sendMessage() {
      if (!this.inputText.trim()) return

      const userMsg = { role: 'user', text: this.inputText }
      this.messages.push(userMsg)
      this.inputText = ''

      // 滚动到最新
      this.$nextTick(() => {
        this.scrollToId = 'msg' + (this.messages.length - 1)
      })

      // 模拟AI回复（你后续可以接入后端接口）
      this.messages.push({
        role: 'ai',
        text: '正在思考中，请稍等……'
      })

      // 调用后端接口（可替换为真实AI接口）
      try {
        // 示例：请求你的后端 AI 接口（需要在 oral-calculation-backend 实现 /api/ai/ask）
        const res = await request({
          url: 'http://localhost:5000/api/ai/ask',
          method: 'POST',
          data: { prompt: userMsg.text },
          auth: true
        })

        // 更新AI回复
        this.messages.splice(this.messages.length - 1, 1, {
          role: 'ai',
          text: res.reply || '（AI助手）暂时无法回答这个问题，请稍后重试。'
        })
      } catch (err) {
        this.messages.splice(this.messages.length - 1, 1, {
          role: 'ai',
          text: '出错啦 😥 网络异常或AI服务暂不可用。'
        })
      }

      // 滚动到最新
      this.$nextTick(() => {
        this.scrollToId = 'msg' + (this.messages.length - 1)
      })
    },

    sendQuick(text) {
      this.inputText = text
      this.sendMessage()
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

/* 快捷提问区 */
.quick-ask {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: scroll;
  background-color: #fff;
  padding: 20rpx 10rpx;
}
.quick-ask button {
  flex-shrink: 0;
  margin: 0 10rpx;
  background-color: #e6f9f5;
  color: #00496e;
  border-radius: 30rpx;
  padding: 10rpx 25rpx;
  font-size: 26rpx;
  border: none;
}

/* 底部输入区 */
.input-area {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 10rpx 20rpx;
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
