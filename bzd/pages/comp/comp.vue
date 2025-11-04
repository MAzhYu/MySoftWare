<template>
  <view class="container">
    <!-- 顶部信息栏 -->
    <view class="header">
      <text class="room">🏠 房间号：{{ roomData.roomCode }}</text>
      <text class="timer">⏱️ {{ timeLeft }}s</text>
    </view>

    <!-- 双方状态 -->
    <view class="players">
      <view class="player">
        <image src="/static/icons/student.png" class="avatar" />
        <text>{{ myScore }} 分</text>
      </view>
      <view class="player">
        <image src="/static/icons/robot.png" class="avatar" />
        <text>{{ otherScore }} 分</text>
      </view>
    </view>

    <!-- 题目显示 -->
    <view v-if="currentProblem" class="problem-box">
      <text class="problem">{{ currentProblem.question }}</text>
      <input
        type="number"
        class="answer-input"
        v-model="answer"
        :disabled="isOver"
        @confirm="submitAnswer"
        placeholder="输入答案回车"
      />
    </view>

    <!-- PK结果 -->
    <view v-if="isOver" class="result-box">
      <text class="result-title">{{ resultText }}</text>
      <button class="btn invite" @click="inviteRematch">邀请再战</button>
      <button class="btn restart" @click="restart">单人再来</button>
      <button class="btn exit" @click="exit">退出</button>
    </view>
  </view>
</template>

<script>
import io from 'socket.io-client'

export default {
  data() {
    return {
      socket: null,
      roomData: {},
      problems: [],
      index: 0,
      answer: '',
      myScore: 0,
      otherScore: 0,
      currentProblem: null,
      timeLeft: 30,
      timer: null,
      isOver: false,
	  countdown: 3,
      resultText: '',
	  rematchTimer: null
    }
  },

  onLoad(option) {
    const data = JSON.parse(decodeURIComponent(option.data))
    this.roomData = data

    // 连接 socket.io
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true
    })

    // 进入房间
    this.socket.emit('joinComp', this.roomData.roomCode)

    // 同步对方得分
    this.socket.on('updateScore', (score) => {
      this.otherScore = score
    })

    // 对局结束
    this.socket.on('endPK', (result) => {
      this.isOver = true
      this.resultText = result
      clearInterval(this.timer)
    })
	this.socket.on('receiveRematchInvite', () => {
      uni.showModal({
        title: '再战邀请',
        content: '对方邀请你再战！是否接受？',
        confirmText: '接受',
        cancelText: '拒绝',
        success: (res) => {
          if (res.confirm) {
            this.socket.emit('acceptRematch', this.roomData.roomCode)
          } else {
            this.socket.emit('declineRematch', this.roomData.roomCode)
          }
        }
      })
    })

    // ✅ 再战被接受，重新倒计时
    this.socket.on('rematchAccepted', () => {
      this.resultText = '🕒 再战即将开始...'
      this.startRematchCountdown()
    })

    // ✅ 对方拒绝再战
    this.socket.on('rematchDeclined', () => {
      uni.showToast({ title: '对方拒绝了再战', icon: 'none' })
    })


    // 初始化题目
    this.generateProblems()
    this.startPK()
  },

  methods: {
    generateProblems() {
      // 简单随机生成10道题
      for (let i = 0; i < 10; i++) {
        const a = Math.floor(Math.random() * 9) + 1
        const b = Math.floor(Math.random() * 9) + 1
        const op = ['+', '-', '×'][Math.floor(Math.random() * 3)]
        const question = `${a} ${op} ${b}`
        let answer
        if (op === '+') answer = a + b
        if (op === '-') answer = a - b
        if (op === '×') answer = a * b
        this.problems.push({ question, answer })
      }
      this.currentProblem = this.problems[0]
    },

    submitAnswer() {
      if (this.isOver) return
      const correct = parseInt(this.answer) === this.currentProblem.answer
      if (correct) {
        this.myScore++
        this.socket.emit('updateScore', {
          roomCode: this.roomData.roomCode,
          score: this.myScore
        })
      }

      this.answer = ''
      this.nextProblem()
    },

    nextProblem() {
      if (this.index < this.problems.length - 1) {
        this.index++
        this.currentProblem = this.problems[this.index]
      } else {
        this.endPK()
      }
    },

    startPK() {
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--
        } else {
          this.endPK()
        }
      }, 1000)
    },

    endPK() {
      this.isOver = true
      clearInterval(this.timer)
      let result = ''
      if (this.myScore > this.otherScore) result = '🏆 你赢了！'
      else if (this.myScore < this.otherScore) result = '😢 你输了'
      else result = '🤝 平局'
      this.resultText = result

      this.socket.emit('endPK', result)
    },
    inviteRematch() {
      this.socket.emit('inviteRematch', this.roomData.roomCode)
      uni.showToast({ title: '邀请已发送', icon: 'none' })
    },

    // ✅ 再战倒计时
    startRematchCountdown() {
      this.countdown = 3
      this.rematchTimer = setInterval(() => {
        if (this.countdown > 0) {
          this.resultText = `🕒 再战即将开始：${this.countdown}s`
          this.countdown--
        } else {
          clearInterval(this.rematchTimer)
          this.generateProblems()
          this.startPK()
        }
      }, 1000)
    },
    restart() {
      this.index = 0
      this.myScore = 0
      this.otherScore = 0
      this.isOver = false
      this.timeLeft = 30
      this.generateProblems()
      this.startPK()
    },

    exit() {
      this.socket.disconnect()
      uni.switchTab({ url: '/pages/tabbar/pk/pk' })
    }
  },

  onUnload() {
    clearInterval(this.timer)
    if (this.socket) this.socket.disconnect()
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx;
  background: linear-gradient(180deg, #f8fafa 0%, #eaf6f9 100%);
  min-height: 100vh;
}

.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 32rpx;
  color: #00496e;
  margin-bottom: 40rpx;
}

.players {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 60rpx;
}
.player {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
}
.problem-box {
  text-align: center;
}
.problem {
  font-size: 60rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}
.answer-input {
  width: 200rpx;
  height: 80rpx;
  border: 2rpx solid #20d0b0;
  border-radius: 12rpx;
  text-align: center;
  font-size: 40rpx;
}
.result-box {
  text-align: center;
  margin-top: 100rpx;
}
.result-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #00496e;
  margin-bottom: 40rpx;
}
.btn {
  width: 70%;
  margin-top: 20rpx;
  padding: 20rpx 0;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: bold;
}
.restart {
  background-color: #20d0b0;
  color: white;
}
.exit {
  background-color: #ccc;
  color: white;
}
.btn.invite {
  background-color: #ffa500;
  color: white;
}
</style>
