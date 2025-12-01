<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
    <view class="header">
      <text class="room">🏠 房间号：{{ roomData.roomCode }}</text>
      <text class="timer">⏱️ {{ timeLeft }}s</text>
    </view>

    <view class="players">
      <view class="player">
        <!-- <image :src="selfPlayer?.avatar || '/static/icons/student.png'" class="avatar" /> -->
        <text class="name">{{ selfPlayer?.name || '我' }}</text>
        <text>{{ myScore }} 分</text>
      </view>
      <view class="player">
        <!-- <image :src="otherPlayer?.avatar || '/static/icons/robot.png'" class="avatar" /> -->
        <text class="name">{{ otherPlayer?.name || '对手' }}</text>
        <text>?</text>
      </view>
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
// ✅ 使用条件编译：H5用socket.io，APP用uni原生WebSocket
// #ifdef H5
import io from 'socket.io-client'
// #endif

const BASE_URL = 'http://116.62.125.154:5000'

export default {
  data() {
    return {
      socket: null,
      roomData: {},
      players: [],
      selfIndex: -1,
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
      // #ifdef APP-PLUS
      socketTask: null,
      // #endif
    }
  },
  computed: {
    selfPlayer() {
      return this.selfIndex >= 0 ? this.players[this.selfIndex] : null
    },
    otherPlayer() {
      if (this.selfIndex < 0 || this.players.length < 2) return null
      return this.players[this.selfIndex === 0 ? 1 : 0]
    }
  },
  onLoad(option) {
    // ✅ 检查登录状态
    if (!this.checkLogin()) return
    
	this.user = uni.getStorageSync('user') || {}

    const data = JSON.parse(decodeURIComponent(option.data))
    this.roomData = data
    this.players = data.players || []
    this.selfIndex = data.selfIndex >= 0 ? data.selfIndex : -1
    
    console.log('PK页面初始化，selfIndex:', this.selfIndex, 'players:', this.players)
    
    // #ifdef H5
    this.initSocketIO()
    // #endif
    
    // #ifdef APP-PLUS
    this.initUniWebSocket()
    // #endif

    this.generateProblems()
    this.startPK()
  },
  methods: {
    // #ifdef H5
    initSocketIO() {
      this.socket = io(BASE_URL, { transports: ['websocket'], reconnection: true })

      this.socket.on('connect', () => { 
        this.selfId = this.socket.id
        console.log('PK Socket.IO连接成功，ID:', this.selfId)
        this.socket.emit('joinComp', this.roomData.roomCode)
      })

      this.socket.on('updateScore', data => {
        console.log('收到updateScore:', data)
        if (data.socketId !== this.selfId) {
          this.otherScore = data.score
        }
      })
      
      this.socket.on('finalResult', data => { 
        console.log('收到finalResult:', data)
        this.endPK(data)
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
    },
    // #endif
    
    // #ifdef APP-PLUS
    initUniWebSocket() {
      const wsUrl = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/socket.io/?EIO=4&transport=websocket'
      console.log('PK APP端WebSocket连接地址:', wsUrl)
      
      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('PK WebSocket连接请求已发送')
        }
      })
      
      this.socketTask.onOpen(() => {
        console.log('PK WebSocket连接已打开')
        this.socketTask.send({
          data: '40',
          success: () => {
            console.log('PK 发送握手消息成功')
            setTimeout(() => {
              this.socketTask.send({
                data: `42${JSON.stringify(['joinComp', this.roomData.roomCode])}`,
                success: () => {
                  console.log('PK 发送joinComp成功')
                }
              })
            }, 100)
          }
        })
      })
      
      this.socketTask.onMessage((res) => {
        console.log('PK 收到WebSocket消息:', res.data)
        try {
          const data = res.data
          
          // 获取 socket ID
          if (data.startsWith('40')) {
            const jsonStr = data.substring(2)
            const sessionData = JSON.parse(jsonStr)
            this.selfId = sessionData.sid
            console.log('PK 获取到socket ID:', this.selfId)
            return
          }
          
          if (data.startsWith('42')) {
            const jsonStr = data.substring(2)
            const [eventName, eventData] = JSON.parse(jsonStr)
            console.log('PK 解析事件:', eventName, eventData)
            
            if (eventName === 'updateScore') {
              console.log('PK 收到updateScore，selfId:', this.selfId, 'data:', eventData)
              if (eventData.socketId !== this.selfId) {
                this.otherScore = eventData.score
                console.log('PK 更新对方分数为:', eventData.score)
              }
            }
            else if (eventName === 'finalResult') {
              console.log('PK 收到finalResult:', eventData)
              this.endPK(eventData)
            }
            else if (eventName === 'receiveRematchInvite') {
              uni.showModal({
                title: '再战邀请',
                content: '对方邀请你再战！是否接受？',
                confirmText: '接受',
                cancelText: '拒绝',
                success: (res) => {
                  if (res.confirm) {
                    this.socketTask.send({ data: `42${JSON.stringify(['acceptRematch', this.roomData.roomCode])}` })
                  } else {
                    this.socketTask.send({ data: `42${JSON.stringify(['declineRematch', this.roomData.roomCode])}` })
                  }
                }
              })
            }
            else if (eventName === 'startRematch') {
              this.resultText = '🕒 再战即将开始...'
              this.startRematchCountdown()
            }
            else if (eventName === 'rematchDeclined') {
              uni.showToast({ title: '对方拒绝了再战', icon: 'none' })
            }
          }
        } catch (e) {
          console.error('PK 解析消息失败:', e, res.data)
        }
      })
      
      this.socketTask.onError((err) => {
        console.error('PK WebSocket错误:', err)
      })
      
      this.socketTask.onClose(() => {
        console.log('PK WebSocket连接已关闭')
      })
    },
    
    emitSocketEvent(eventName, data) {
      console.log('PK 发送事件:', eventName, data)
      // #ifdef H5
      if (this.socket) {
        this.socket.emit(eventName, data)
      }
      // #endif
      
      // #ifdef APP-PLUS
      if (this.socketTask) {
        const message = `42${JSON.stringify([eventName, data])}`
        console.log('PK 发送消息:', message)
        this.socketTask.send({ data: message })
      }
      // #endif
    },
    // #endif
    /** ✅ 检查登录状态 */
    checkLogin() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后参与PK',
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
    
    generateProblems() {
      const seed = this.roomData.config?.seed || this.roomData.seed || Date.now()
      const random = this.seededRandom(seed)
    
      const count = this.roomData.config?.questionCount || 10
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
        console.log('答对了，我的分数:', this.myScore, 'selfId:', this.selfId)
        this.emitSocketEvent('updateScore', { 
          roomCode: this.roomData.roomCode, 
          score: this.myScore,
          socketId: this.selfId
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
        clearInterval(this.timer)
        this.isOver = true
        this.resultText = '正在结算...'
        console.log('题目做完，发送playerFinished，我的分数:', this.myScore, 'selfId:', this.selfId)
        this.emitSocketEvent('playerFinished', { 
          roomCode: this.roomData.roomCode, 
          score: this.myScore,
          socketId: this.selfId
        })
      }
    },
    startPK() {
      this.timeLeft = this.roomData.config?.timeLimit || 15
    
      clearInterval(this.timer)
      this.isOver = false
      this.resultText = ''
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) this.timeLeft--
        else {
          clearInterval(this.timer)
          this.isOver = true
          this.resultText = '正在结算...'
          console.log('时间到，发送playerFinished，我的分数:', this.myScore, 'selfId:', this.selfId)
          this.emitSocketEvent('playerFinished', { 
            roomCode: this.roomData.roomCode, 
            score: this.myScore,
            socketId: this.selfId
          })
        }
      }, 1000)
    },
    endPK(data) {
      console.log('PK结束，结算数据:', data)
      clearInterval(this.timer)
      this.isOver = true
      this.myScore = data.myScore
      this.otherScore = data.otherScore
      this.resultText = data.result
      console.log('最终分数 - 我:', this.myScore, '对方:', this.otherScore)
    },
    inviteRematch() {
      this.emitSocketEvent('inviteRematch', this.roomData.roomCode)
      uni.showToast({ title: '邀请已发送', icon: 'none' })
    },
startRematchCountdown() {
  this.countdown = 3
  clearInterval(this.rematchTimer)
  this.rematchTimer = setInterval(() => {
    if (this.countdown > 0) {
      this.resultText = `🕒 再战即将开始：${this.countdown}s`
      this.countdown--
    } else {
      clearInterval(this.rematchTimer)
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
      // #ifdef H5
      if (this.socket) this.socket.disconnect()
      // #endif
      
      // #ifdef APP-PLUS
      if (this.socketTask) this.socketTask.close()
      // #endif
      
      uni.switchTab({ url: '/pages/tabbar/pk/pk' })
    }
  },
  onUnload() {
    clearInterval(this.timer)
    clearInterval(this.rematchTimer)
    
    // #ifdef H5
    if (this.socket) this.socket.disconnect()
    // #endif
    
    // #ifdef APP-PLUS
    if (this.socketTask) this.socketTask.close()
    // #endif
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
.players {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  margin-bottom: 40rpx;
}

.player-card, .player {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #20d0b0;
  object-fit: cover;
  box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.1);
}

.player-name, .name {
  font-size: 28rpx;
  color: #333;
  margin-top: 10rpx;
}

</style>

