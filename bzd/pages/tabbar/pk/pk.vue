<template>
  <view class="container">
    <!-- 状态栏占位 -->
    <view class="status-bar"></view>
<!--    <text class="title">🔥口算 PK 对战🔥</text> -->
    <view v-if="step === 1" class="background-wrapper">
      <image src="/static/1.jpg" class="bg-left" mode="aspectFill" />
      <image src="/static/2.jpg" class="bg-right" mode="aspectFill" />
    </view>
    <!-- 模式选择 -->
    <view v-if="step === 1" class="mode-select">
      <button class="create-btn" @click="chooseCreate">创建房间</button>
      <button class="join-btn" @click="chooseJoin">加入房间</button>
    </view>

    <!-- 创建房间设置 -->
    <view v-if="step === 2" class="create-room-card">
      <text class="subtitle">设置对战参数</text>

      <view class="form-item">
        <text class="label">题目数量：</text>
        <picker :range="questionCounts" :value="countIndex" @change="onCountChange">
          <view class="picker-box">{{ questionCounts[countIndex] }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">题目类型：</text>
        <picker :range="types" :value="typeIndex" @change="onTypeChange">
          <view class="picker-box">{{ types[typeIndex] }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">时间限制(秒)：</text>
        <picker :range="timeLimits" :value="timeIndex" @change="onTimeChange">
          <view class="picker-box">{{ timeLimits[timeIndex] }}</view>
        </picker>
      </view>

      <button class="confirm-btn" @click="createRoom">创建房间</button>
      <button class="back-btn" @click="reset">返回</button>
    </view>

    <!-- 加入房间 -->
    <view v-if="step === 3" class="join-room-card">
      <text class="subtitle">加入房间</text>
      <input
        v-model="roomCode"
        placeholder="请输入房间代码"
        class="input-box"
      />
      <button class="confirm-btn" @click="joinRoom">加入</button>
      <button class="back-btn" @click="reset">返回</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      step: 1, // 当前阶段：1选择模式，2创建房间，3加入房间
      questionCounts: [5, 10, 20, 30],
      types: ['混合运算','加减法','乘除法'],
      timeLimits: [15,30, 60, 90, 120],

      countIndex: 1,
      typeIndex: 0,
      timeIndex: 1,
      roomCode: ''
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
          content: '请先登录后使用PK功能',
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
    
    chooseCreate() {
      this.step = 2
    },
    chooseJoin() {
      this.step = 3
    },
    reset() {
      this.step = 1
      this.roomCode = ''
    },

    onCountChange(e) {
      this.countIndex = e.detail.value
    },
    onTypeChange(e) {
      this.typeIndex = e.detail.value
    },
    onTimeChange(e) {
      this.timeIndex = e.detail.value
    },

    createRoom() {
      // 生成6位数字房间号
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const params = {
        mode: 'create',
        roomCode: code,
        questionCount: this.questionCounts[this.countIndex],
        type: this.types[this.typeIndex],
        timeLimit: this.timeLimits[this.timeIndex],
		seed: Math.floor(Math.random() * 1000000)
      }
      uni.navigateTo({
        url: `/pages/room/room?data=${encodeURIComponent(JSON.stringify(params))}`
      })
    },

    joinRoom() {
      if (!this.roomCode) {
        return uni.showToast({ title: '请输入房间号', icon: 'none' })
      }
      const params = {
        mode: 'join',
        roomCode: this.roomCode
      }
      uni.navigateTo({
        url: `/pages/room/room?data=${encodeURIComponent(JSON.stringify(params))}`
      })
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f7f8fa;
  min-height: 100vh;
  padding: 60rpx 40rpx;

}
.title {
  font-size: 38rpx;
  font-weight: bold;
  color: #00496e;
  margin-bottom: 50rpx;
}

.mode-select {
  position: absolute;
  bottom: 60rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 60rpx;
  z-index: 2;
}

/* 左下右下按钮样式 */
.create-btn, .join-btn {
  width: 260rpx;
  padding: 25rpx 0;
  border-radius: 30rpx;
  color: white;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
}
.create-btn { background-color: #20d0b0; }
.join-btn { background-color: #00496e; }

.create-room-card, .join-room-card {
  background-color: #fff;
  width: 100%;
  border-radius: 30rpx;
  padding: 50rpx 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}
.subtitle {
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #00496e;
  margin-bottom: 40rpx;
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}
.label {
  font-size: 30rpx;
  color: #333;
}
.picker-box {
  border: 1px solid #ccc;
  border-radius: 20rpx;
  padding: 16rpx 30rpx;
  background-color: #f9f9f9;
  color: #333;
  font-size: 28rpx;
  min-width: 160rpx;
  text-align: center;
}

.input-box {
  width: 94%;
  border: 1px solid #ccc;
  border-radius: 30rpx;
  padding: 20rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
  margin-bottom: 30rpx;
}

.confirm-btn, .back-btn {
  width: 100%;
  padding: 20rpx 0;
  border-radius: 30rpx;
  font-size: 30rpx;
  font-weight: 500;
  margin-top: 20rpx;
}
.confirm-btn { background-color: #20d0b0; color: white; }
.back-btn { background-color: #ccc; color: white; }
.background-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  z-index: 0;
}

.bg-left,
.bg-right {
  width: 50%;
  height: 100%;
  object-fit: cover;
}
</style>
