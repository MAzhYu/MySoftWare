<template>
  <view class="container">
    <view class="header">
      <text class="room">🏠 房间号：{{ roomData.roomCode }}</text>
      <text class="timer">⏱️ {{ timeLeft }}s</text>
    </view>

    <view class="players">
      <view class="player"><image src="/static/icons/student.png" class="avatar" /><text>{{ myScore }} 分</text></view>
      <view class="player"><image src="/static/icons/robot.png" class="avatar" /><text>{{ otherScore }} 分</text></view>
    </view>

    <view v-if="currentProblem && !isOver" class="problem-box">
      <text class="problem">{{ currentProblem.question }}</text>
      <input type="number" class="answer-input" v-model="answer" @confirm="submitAnswer" placeholder="输入答案回车" />
    </view>

    <view v-if="isOver" class="result-box">
      <text class="result-title">{{ resultText }}</text>
      <text class="score-line">我方：{{ myScore }} | 对方：{{ otherScore }}</text>
      <button class="btn invite" @click="inviteRematch">邀请再战</button>
      <button class="btn exit" @click="exit">退出</button>
    </view>
  </view>
</template>

<script>
import io from 'socket.io-client'
const BASE_URL = 'http://192.168.110.168:5000'

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
      timeLeft: 15,
      timer: null,
      isOver: false,
      countdown: 3,
      resultText: '',
      rematchTimer: null,
      selfId: '',
      receivedFinal: false
    }
  },
  onLoad(option) {
    const data = JSON.parse(decodeURIComponent(option.data))
    this.roomData = data
    this.socket = io(BASE_URL, { transports: ['websocket'], reconnection: true })

    this.socket.on('connect', () => { this.selfId = this.socket.id })

    this.socket.emit('joinComp', this.roomData.roomCode)

    this.socket.on('updateScore', score => { this.otherScore = score })
    this.socket.on('finalResult', data => { this.receivedFinal = true; this.endPK(data) })

    this.socket.on('finalResultBroadcast', data => {
      if (this.receivedFinal) return
      const players = data.players || []
      const me = players.find(p => p.socketId === this.selfId)
      const other = players.find(p => p.socketId !== this.selfId)
      const my = me ? me.score : 0
      const ot = other ? other.score : 0
      let result = '🤝 Draw!'
      if (my > ot) result = '🎉 You win!'
      else if (my < ot) result = '😢 You lose!'
      this.endPK({ myScore: my, otherScore: ot, result })
    })

    this.socket.on('receiveRematchInvite', () => {
      uni.showModal({
        title: '再战邀请',
        content: '对方邀请你再战！是否接受？',
        confirmText: '接受',
        cancelText: '拒绝',
        success: (res) => {
          if (res.confirm) this.socket.emit('acceptRematch', this.roomData.roomCode)
          else this.socket.emit('declineRematch', this.roomData.roomCode)
        }
      })
    })

    this.socket.on('startRematch', () => {
      this.resultText = '🕒 再战即将开始...'
      this.startRematchCountdown()
    })

    this.socket.on('rematchDeclined', () => {
      uni.showToast({ title: '对方拒绝了再战', icon: 'none' })
    })

    this.generateProblems()
    this.startPK()
  },
  methods: {
    generateProblems() {
      // ✅ 用相同的随机种子，保证两端一致
	  const seed = this.roomData.config?.seed || this.roomData.seed || 12345
      const random = this.seededRandom(seed)
    
      const count = this.roomData.questionCount || 10
      const problems = []
    
      for (let i = 0; i < count; i++) {
        const a = Math.floor(random() * 9) + 1
        const b = Math.floor(random() * 9) + 1
        const ops = ['+', '-', '×']
        const op = ops[Math.floor(random() * 3)]
        const question = `${a} ${op} ${b}`
        let answer = op === '+' ? a + b : op === '-' ? a - b : a * b
        problems.push({ question, answer })
      }
    
      this.problems = problems
      this.index = 0
      this.currentProblem = this.problems[0]
      this.isOver = false
    },
	seededRandom(seed) {
	  let s = seed
	  return function () {
	    s = Math.sin(s) * 10000
	    return s - Math.floor(s)
	  }
	},
    submitAnswer() {
      if (this.isOver) return
      const correct = parseInt(this.answer) === this.currentProblem.answer
      if (correct) {
        this.myScore++
        this.socket.emit('updateScore', { roomCode: this.roomData.roomCode, score: this.myScore })
      }
      this.answer = ''
      this.nextProblem()
    },
    nextProblem() {
      if (this.index < this.problems.length - 1) {
        this.index++
        this.currentProblem = this.problems[this.index]
      } else {
        clearInterval(this.timer)
        this.isOver = true
        this.resultText = '正在结算...'
        this.socket.emit('playerFinished', { roomCode: this.roomData.roomCode, score: this.myScore })
      }
    },
    startPK() {
      this.timeLeft = this.roomData.timeLimit || 15

      clearInterval(this.timer)
      this.isOver = false
      this.resultText = ''
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) this.timeLeft--
        else {
          clearInterval(this.timer)
          this.isOver = true
          this.resultText = '正在结算...'
          this.socket.emit('playerFinished', { roomCode: this.roomData.roomCode, score: this.myScore })
        }
      }, 1000)
    },
    endPK(data) {
      clearInterval(this.timer)
      this.isOver = true
      this.myScore = data.myScore
      this.otherScore = data.otherScore
      this.resultText = data.result
    },
    inviteRematch() {
      this.socket.emit('inviteRematch', this.roomData.roomCode)
      uni.showToast({ title: '邀请已发送', icon: 'none' })
    },
startRematchCountdown() {
  this.receivedFinal = false
  this.countdown = 3
  clearInterval(this.rematchTimer)
  this.rematchTimer = setInterval(() => {
    if (this.countdown > 0) {
      this.resultText = `🕒 再战即将开始：${this.countdown}s`
      this.countdown--
    } else {
      clearInterval(this.rematchTimer)
      // ✅ 彻底重置所有状态
      this.resetGame()
      this.resultText = ''
      this.startPK()
    }
  }, 1000)
},
    resetGame() {
      this.myScore = 0
      this.otherScore = 0
      this.isOver = false
      this.answer = ''
      this.generateProblems()
    },
    exit() {
      if (this.socket) this.socket.disconnect()
      uni.switchTab({ url: '/pages/tabbar/pk/pk' })
    }
  },
  onUnload() {
    clearInterval(this.timer)
    clearInterval(this.rematchTimer)
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
  margin-bottom: 20rpx;
}
.score-line {
  font-size: 32rpx;
  color: #555;
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
.exit {
  background-color: #ccc;
  color: white;
}
.btn.invite {
  background-color: #ffa500;
  color: white;
}
</style>

