<template>
  <view class="container">
    <!-- 房间信息 -->
    <view class="room-info">
      <text class="room-title">🏠 房间号：{{ roomData.roomCode }}</text>
      <text class="role-label">身份：{{ roomData.mode === 'create' ? '房主' : '加入者' }}</text>
    </view>

    <!-- 等待阶段 -->
    <view v-if="!bothReady" class="waiting-box">
      <text class="waiting-text" v-if="!selfReady">请点击准备</text>
      <text class="waiting-text" v-else>已准备，等待对方...</text>

      <view class="players">
        <view class="player-card" v-for="(p, i) in players" :key="i">
          <image :src="p.avatar" class="avatar" />
          <text class="player-name">{{ p.name }}</text>
          <text :class="['ready-status', p.ready ? 'ready' : 'not-ready']">
            {{ p.ready ? '✅ 已准备' : '⏳ 未准备' }}
          </text>
        </view>
      </view>

      <button
        class="ready-btn"
        :disabled="selfReady"
        @click="sendReady"
      >
        {{ selfReady ? '已准备' : '点击准备' }}
      </button>

      <button class="back-btn" @click="exitRoom">退出房间</button>
    </view>

    <!-- 倒计时 -->
    <view v-if="bothReady" class="countdown-box">
      <text class="countdown">PK 即将开始：{{ countdown }} 秒</text>
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
      players: [],
      selfReady: false,
      otherReady: false,
      bothReady: false,
      countdown: 3,
      timer: null
    }
  },
  onLoad(option) {
    const data = JSON.parse(decodeURIComponent(option.data))
    this.roomData = data

    // 连接 socket.io 后端
    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true
    })

    // ✅ 监听连接成功
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id)
      if (this.roomData.mode === 'create') {
        this.socket.emit('createRoom', this.roomData)
      } else {
        this.socket.emit('joinRoom', this.roomData.roomCode)
      }
    })

    // ✅ 房间创建成功
    this.socket.on('roomCreated', (res) => {
      this.roomData.roomCode = res.roomCode
      this.players = [
        { name: '我（房主）', avatar: '/static/icons/student.png', ready: false },
        { name: '等待加入...', avatar: '/static/icons/robot.png', ready: false }
      ]
    })

    // ✅ 有玩家加入房间
    this.socket.on('playerJoined', () => {
      if (this.roomData.mode === 'create') {
        this.players[1].name = '对手'
        this.players[1].avatar = '/static/icons/robot.png'
      } else {
        this.players = [
          { name: '房主', avatar: '/static/icons/robot.png', ready: false },
          { name: '我（加入者）', avatar: '/static/icons/student.png', ready: false }
        ]
      }
    })

    // ✅ 对方点击准备
    this.socket.on('otherReady', () => {
      this.otherReady = true
      this.updateReadyStatus()
    })

    // ✅ 双方都准备好
    this.socket.on('startPK', () => {
      this.startCountdown()
    })
  },
  methods: {
    sendReady() {
      this.selfReady = true
      this.updateReadyStatus()
      this.socket.emit('playerReady', this.roomData.roomCode)
    },

    updateReadyStatus() {
      if (this.roomData.mode === 'create') {
        this.players[0].ready = this.selfReady
        this.players[1].ready = this.otherReady
      } else {
        this.players[0].ready = this.otherReady
        this.players[1].ready = this.selfReady
      }
    },

    startCountdown() {
      this.bothReady = true
      this.timer = setInterval(() => {
        if (this.countdown > 1) {
          this.countdown--
        } else {
          clearInterval(this.timer)
          this.gotoPK()
        }
      }, 1000)
    },

    gotoPK() {
      uni.redirectTo({
        url: `/pages/comp/comp?data=${encodeURIComponent(JSON.stringify(this.roomData))}`
      })
    },

    exitRoom() {
      uni.showToast({ title: '已退出房间', icon: 'none' })
      this.socket.disconnect()
      setTimeout(() => uni.navigateBack(), 600)
      uni.switchTab({
        url: `/pages/tabbar/pk/pk`
      })
    }
  },
  onUnload() {
    if (this.socket) this.socket.disconnect()
    clearInterval(this.timer)
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  background-color: #f7f8fa;
  min-height: 100vh;
}

.room-info {
  text-align: center;
  margin-bottom: 40rpx;
}
.room-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #00496e;
}
.role-label {
  font-size: 28rpx;
  color: #888;
}

.waiting-box {
  text-align: center;
  width: 100%;
}
.waiting-text {
  font-size: 32rpx;
  color: #00496e;
  margin-bottom: 40rpx;
}

.players {
  display: flex;
  justify-content: space-around;
  margin-bottom: 60rpx;
}
.player-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #eee;
}
.player-name {
  margin-top: 10rpx;
  font-size: 28rpx;
  color: #333;
}
.ready-status {
  font-size: 26rpx;
  margin-top: 6rpx;
}
.ready { color: #20d0b0; }
.not-ready { color: #999; }

.ready-btn, .back-btn {
  width: 80%;
  padding: 24rpx 0;
  border-radius: 30rpx;
  font-size: 30rpx;
  font-weight: 600;
  margin-top: 20rpx;
}
.ready-btn {
  background-color: #20d0b0;
  color: #fff;
}
.back-btn {
  background-color: #ccc;
  color: white;
}

.countdown-box {
  margin-top: 200rpx;
}
.countdown {
  font-size: 40rpx;
  font-weight: bold;
  color: #00496e;
}
</style> 