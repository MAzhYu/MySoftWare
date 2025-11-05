<template>
  <view class="container">
    <view class="room-info">
      <text class="room-title">🏠 房间号：{{ roomData.roomCode }}</text>

    </view>

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


      <button class="ready-btn" :disabled="selfReady" @click="sendReady">
        {{ selfReady ? '已准备' : '点击准备' }}
      </button>
      <button class="back-btn" @click="exitRoom">退出房间</button>
    </view>

    <view v-if="bothReady" class="countdown-box">
      <text class="countdown">PK 即将开始：{{ countdown }} 秒</text>
    </view>
  </view>
</template>

<script>
import io from 'socket.io-client'
const BASE_URL = 'http://10.12.55.50:5000'

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
	this.user = uni.getStorageSync('user') || {}
    const data = JSON.parse(decodeURIComponent(option.data))
    this.roomData = data

    this.socket = io(BASE_URL, { transports: ['websocket'], reconnection: true })

    this.socket.on('connect', () => {
      if (this.roomData.mode === 'create') {
        this.socket.emit('createRoom', {
          ...this.roomData,
          name: this.user?.name || '房主',
          avatar: this.user?.avatarUrl || '/static/icons/student.png'
        })
      } else {
        this.socket.emit('joinRoom', this.roomData.roomCode, {
          name: this.user?.name || '挑战者',
          avatar: this.user?.avatarUrl || '/static/icons/robot.png'
        })
      }

    })


    // ✅ 接收加入房间事件（带上 config）
    this.socket.on('roomCreated', (res) => {
      this.roomData.roomCode = res.roomCode
      this.roomData.config = res.config
      this.players = res.players || []   
    })
    
    this.socket.on('playerJoined', (res) => {
      if (res?.config) this.roomData.config = res.config
      this.players = res.players || []   
      this.updateReadyStatus()
    })


    this.socket.on('otherReady', () => {
      this.otherReady = true
      this.updateReadyStatus()
    })

    this.socket.on('startPK', () => this.startCountdown())
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
        if (this.countdown > 1) this.countdown--
        else {
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
      this.socket.disconnect()
      uni.switchTab({ url: '/pages/tabbar/pk/pk' })
    }
  },
  onUnload() {
    if (this.socket) this.socket.disconnect()
    clearInterval(this.timer)
  }
}
</script>

<style scoped>
.container { display:flex; flex-direction:column; align-items:center; padding:60rpx 40rpx; background-color:#f7f8fa; min-height:100vh; }
.room-info { text-align:center; margin-bottom:40rpx; }
.room-title { font-size:36rpx; font-weight:bold; color:#00496e; }
.role-label { font-size:28rpx; color:#888; }
.waiting-box { text-align:center; width:100%; }
.waiting-text { font-size:32rpx; color:#00496e; margin-bottom:40rpx; }
.players { display:flex; justify-content:space-around; margin-bottom:60rpx; }
.player-card { display:flex; flex-direction:column; align-items:center; }
.avatar { width:120rpx; height:120rpx; border-radius:60rpx; background-color:#eee; }
.player-name { margin-top:10rpx; font-size:28rpx; color:#333; }
.ready-status { font-size:26rpx; margin-top:6rpx; }
.ready { color:#20d0b0; } .not-ready { color:#999; }
.ready-btn, .back-btn { width:80%; padding:24rpx 0; border-radius:30rpx; font-size:30rpx; font-weight:600; margin-top:20rpx; }
.ready-btn { background-color:#20d0b0; color:#fff; }
.back-btn { background-color:#ccc; color:white; }
.countdown-box { margin-top:200rpx; }
.countdown { font-size:40rpx; font-weight:bold; color:#00496e; }
.config-box {
  border: 2rpx solid #20d0b0;
  border-radius: 20rpx;
  padding: 20rpx;
  margin: 20rpx 0 40rpx;
  background-color: #f9fffd;
  color: #00496e;
}
.config-title {
  font-weight: bold;
  font-size: 30rpx;
  margin-bottom: 10rpx;
  display: block;
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
