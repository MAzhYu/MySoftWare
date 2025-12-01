<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
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
      
      <view class="tip-box">
        <text class="tip-text">⚠️ 未等到匹配者请勿点击准备，若误触，请退出重建房间</text>
      </view>
    </view>

    <view v-if="bothReady" class="countdown-box">
      <text class="countdown">PK 即将开始：{{ countdown }} 秒</text>
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
      bothReady: false,
      countdown: 3,
      timer: null,
      // #ifdef APP-PLUS
      socketTask: null,
      // #endif
    }
  },
  computed: {
    selfReady() {
      return this.selfIndex >= 0 && this.players[this.selfIndex]?.ready
    }
  },
  onLoad(option) {
    // ✅ 检查登录状态
    if (!this.checkLogin()) return
    
	this.user = uni.getStorageSync('user') || {}
    const data = JSON.parse(decodeURIComponent(option.data))
    this.roomData = data

    console.log('初始化Socket连接，BASE_URL:', BASE_URL)
    console.log('房间数据:', this.roomData)
    console.log('用户信息:', this.user)
    
    // #ifdef H5
    this.initSocketIO()
    // #endif
    
    // #ifdef APP-PLUS
    this.initUniWebSocket()
    // #endif
  },
  methods: {
    // #ifdef H5
    initSocketIO() {
      this.socket = io(BASE_URL, { transports: ['websocket'], reconnection: true })
      
      this.socket.on('connect', () => {
        console.log('Socket.IO连接成功，ID:', this.socket.id)
        this.onSocketConnect()
      })
      
      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO连接错误:', error)
        uni.showToast({ title: '连接失败', icon: 'none' })
      })
      
      this.socket.on('roomCreated', (res) => this.onRoomCreated(res))
      this.socket.on('playerJoined', (res) => this.onPlayerJoined(res))
      this.socket.on('playerReady', (res) => this.onPlayerReady(res))
      this.socket.on('startPK', () => this.startCountdown())
    },
    // #endif
    
    // #ifdef APP-PLUS
    initUniWebSocket() {
      const wsUrl = BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/socket.io/?EIO=4&transport=websocket'
      console.log('APP端WebSocket连接地址:', wsUrl)
      
      this.socketTask = uni.connectSocket({
        url: wsUrl,
        success: () => {
          console.log('WebSocket连接请求已发送')
        },
        fail: (err) => {
          console.error('WebSocket连接失败:', err)
          uni.showToast({ title: '连接失败', icon: 'none' })
        }
      })
      
      this.socketTask.onOpen(() => {
        console.log('WebSocket连接已打开')
        // Socket.IO 握手
        this.socketTask.send({
          data: '40',
          success: () => {
            console.log('发送握手消息成功')
            setTimeout(() => this.onSocketConnect(), 100)
          }
        })
      })
      
      this.socketTask.onMessage((res) => {
        console.log('收到WebSocket消息:', res.data)
        try {
          const data = res.data
          if (data.startsWith('42')) {
            // Socket.IO 事件消息格式: 42["eventName", {...data}]
            const jsonStr = data.substring(2)
            const [eventName, eventData] = JSON.parse(jsonStr)
            console.log('解析事件:', eventName, eventData)
            
            if (eventName === 'roomCreated') this.onRoomCreated(eventData)
            else if (eventName === 'playerJoined') this.onPlayerJoined(eventData)
            else if (eventName === 'playerReady') this.onPlayerReady(eventData)
            else if (eventName === 'startPK') this.startCountdown()
          }
        } catch (e) {
          console.error('解析消息失败:', e, res.data)
        }
      })
      
      this.socketTask.onError((err) => {
        console.error('WebSocket错误:', err)
        uni.showToast({ title: '连接错误', icon: 'none' })
      })
      
      this.socketTask.onClose(() => {
        console.log('WebSocket连接已关闭')
      })
    },
    
    emitSocketEvent(eventName, data) {
      // #ifdef H5
      if (this.socket) {
        this.socket.emit(eventName, data)
      }
      // #endif
      
      // #ifdef APP-PLUS
      if (this.socketTask) {
        const message = `42${JSON.stringify([eventName, data])}`
        console.log('发送事件:', eventName, '消息:', message)
        this.socketTask.send({ data: message })
      }
      // #endif
    },
    // #endif
    
    onSocketConnect() {
      console.log('处理Socket连接成功事件')
      if (this.roomData.mode === 'create') {
        const createData = {
          ...this.roomData,
          name: this.user?.name || '房主',
          avatar: this.user?.avatarUrl || '/static/icons/student.png'
        }
        console.log('发送createRoom事件，数据:', createData)
        this.emitSocketEvent('createRoom', createData)
      } else {
        const joinData = {
          name: this.user?.name || '挑战者',
          avatar: this.user?.avatarUrl || '/static/icons/robot.png'
        }
        console.log('发送joinRoom事件，房间号:', this.roomData.roomCode, '数据:', joinData)
        // #ifdef H5
        if (this.socket) {
          this.socket.emit('joinRoom', this.roomData.roomCode, joinData)
        }
        // #endif
        
        // #ifdef APP-PLUS
        if (this.socketTask) {
          const message = `42${JSON.stringify(['joinRoom', this.roomData.roomCode, joinData])}`
          console.log('发送joinRoom消息:', message)
          this.socketTask.send({ data: message })
        }
        // #endif
      }
    },

    // ✅ 接收房间创建成功事件
    onRoomCreated(res) {
      console.log('收到roomCreated事件:', res)
      this.roomData.roomCode = res.roomCode
      this.roomData.config = res.config
      this.players = res.players || []
      this.selfIndex = 0 // 房主是第一个玩家
      console.log('房间创建成功，玩家列表:', this.players)
      // 强制视图更新
      this.$forceUpdate()
    },
    
    // ✅ 接收玩家加入事件
    onPlayerJoined(res) {
      console.log('收到playerJoined事件:', res)
      if (res?.config) this.roomData.config = res.config
      this.players = res.players || []
      // 如果是加入者，自己是第二个玩家
      if (this.roomData.mode === 'join' && this.selfIndex === -1) {
        this.selfIndex = 1
      }
      console.log('玩家加入，当前玩家列表:', this.players, 'selfIndex:', this.selfIndex)
      // 强制视图更新
      this.$forceUpdate()
    },

    // ✅ 接收玩家准备状态更新
    onPlayerReady(res) {
      console.log('收到playerReady事件:', res)
      this.players = res.players || []
      this.checkBothReady()
      console.log('准备状态更新，玩家列表:', this.players)
      // 强制视图更新
      this.$forceUpdate()
    },
    
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
    
    sendReady() {
      console.log('点击准备按钮，selfIndex:', this.selfIndex, '玩家列表:', this.players)
      if (this.selfIndex >= 0 && this.players[this.selfIndex]) {
        this.players[this.selfIndex].ready = true
        console.log('更新本地准备状态:', this.players[this.selfIndex])
      }
      console.log('发送playerReady事件，房间号:', this.roomData.roomCode)
      this.emitSocketEvent('playerReady', this.roomData.roomCode)
      // 强制视图更新
      this.$forceUpdate()
    },
    checkBothReady() {
      const allReady = this.players.length === 2 && this.players.every(p => p.ready)
      if (allReady && !this.bothReady) {
        this.bothReady = true
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
      const pkData = {
        ...this.roomData,
        players: this.players,
        selfIndex: this.selfIndex
      }
      uni.redirectTo({
        url: `/pages/comp/comp?data=${encodeURIComponent(JSON.stringify(pkData))}`
      })
    },
    exitRoom() {
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
    // #ifdef H5
    if (this.socket) this.socket.disconnect()
    // #endif
    
    // #ifdef APP-PLUS
    if (this.socketTask) this.socketTask.close()
    // #endif
    
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

.tip-box {
  margin-top: 40rpx;
  padding: 20rpx;
  background-color: #fff3cd;
  border-radius: 12rpx;
  border: 2rpx solid #ffc107;
}

.tip-text {
  font-size: 24rpx;
  color: #856404;
  line-height: 1.5;
  text-align: center;
  display: block;
}

</style>
