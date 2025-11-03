<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <image src="/static/icons/user.png" class="avatar" />
      <text class="title">我的账户</text>
    </view>

    <!-- 未登录状态 -->
    <view v-if="!user" class="login-card">
      <text class="login-title">请登录以同步学习进度</text>

      <input
        v-model="email"
        class="input-box"
        placeholder="请输入邮箱"
        type="text"
      />
      <input
        v-model="password"
        class="input-box"
        placeholder="请输入密码"
        type="password"
      />

      <button class="login-btn" @click="login">登录</button>
      <text class="register-tip">没有账号？请联系老师或家长注册</text>
    </view>

    <!-- 已登录状态 -->
    <view v-else class="profile-card">
      <view class="user-info">
        <image src="/static/icons/avatar.png" class="profile-avatar" />
        <view class="info-text">
          <text class="name">{{ user.username }}</text>
          <text class="email">{{ user.email }}</text>
          <text class="role">角色：{{ roleName(user.role) }}</text>
        </view>
      </view>

      <view class="progress">
        <text class="section-title">学习进度</text>
        <view class="progress-item">
          <text>年级：{{ user.learningProgress?.grade || '未设置' }}</text>
          <text>正确率：{{ user.learningProgress?.averageAccuracy || 0 }}%</text>
          <text>练习总数：{{ user.learningProgress?.totalExercises || 0 }}</text>
        </view>
      </view>

      <button class="logout-btn" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { request, api } from '@/request.js'

export default {
  data() {
    return {
      email: '',
      password: '',
      user: null
    }
  },
  onShow() {
    this.loadUser()
  },
  methods: {
    async login() {
      if (!this.email || !this.password) {
        return uni.showToast({ title: '请输入账号和密码', icon: 'none' })
      }

      uni.showLoading({ title: '登录中...' })
      try {
        const res = await request({
          url: api.login,
          method: 'POST',
          data: { email: this.email, password: this.password }
        })
        uni.setStorageSync('token', res.token)
        uni.showToast({ title: '登录成功' })
        await this.loadUser()
      } catch (err) {
        uni.showToast({ title: '登录失败，请检查账号或网络', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },

    async loadUser() {
      const token = uni.getStorageSync('token')
      if (!token) {
        this.user = null
        return
      }

      try {
        const res = await request({
          url: api.me,
          method: 'GET',
          auth: true
        })
        this.user = res.user
      } catch (err) {
        this.user = null
      }
    },

    logout() {
      uni.removeStorageSync('token')
      this.user = null
      uni.showToast({ title: '已退出登录' })
    },

    roleName(role) {
      switch (role) {
        case 'student':
          return '学生'
        case 'parent':
          return '家长'
        case 'teacher':
          return '老师'
        case 'admin':
          return '管理员'
        default:
          return '用户'
      }
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 60rpx;
}

/* 顶部标题区 */
.header {
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}
.avatar {
  width: 60rpx;
  height: 60rpx;
  margin-right: 20rpx;
}
.title {
  font-size: 34rpx;
  font-weight: bold;
  color: #00496e;
}

/* 登录区域 */
.login-card {
  background-color: #fff;
  margin: 60rpx 40rpx;
  padding: 60rpx 40rpx;
  border-radius: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  text-align: center;
}
.login-title {
  font-size: 32rpx;
  color: #00496e;
  margin-bottom: 30rpx;
}
.input-box {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 30rpx;
  padding: 20rpx;
  margin-bottom: 25rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
}
.login-btn {
  width: 100%;
  background-color: #20d0b0;
  color: white;
  font-size: 30rpx;
  border: none;
  border-radius: 30rpx;
  padding: 20rpx 0;
  margin-top: 10rpx;
}
.register-tip {
  display: block;
  margin-top: 30rpx;
  font-size: 24rpx;
  color: #999;
}

/* 用户信息卡片 */
.profile-card {
  background-color: #fff;
  margin: 40rpx 30rpx;
  padding: 50rpx 30rpx;
  border-radius: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}
.user-info {
  display: flex;
  align-items: center;
}
.profile-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 25rpx;
}
.info-text {
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 34rpx;
  color: #00496e;
  font-weight: bold;
}
.email {
  font-size: 26rpx;
  color: #555;
  margin-top: 5rpx;
}
.role {
  font-size: 26rpx;
  color: #20d0b0;
  margin-top: 5rpx;
}

/* 进度卡片 */
.progress {
  margin-top: 40rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #00496e;
  margin-bottom: 20rpx;
}
.progress-item {
  background-color: #f6f8f9;
  border-radius: 20rpx;
  padding: 20rpx;
  font-size: 26rpx;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

/* 退出按钮 */
.logout-btn {
  margin-top: 50rpx;
  width: 100%;
  background-color: #f56c6c;
  color: white;
  font-size: 30rpx;
  border: none;
  border-radius: 30rpx;
  padding: 20rpx 0;
}
</style>
