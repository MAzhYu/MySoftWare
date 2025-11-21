<template>
  <view class="container">
    <view class="header">
      <image src="/static/icons/register.png" class="icon" />
      <text class="title">注册账户</text>
    </view>

    <view class="register-card">
      <input
        v-model="username"
        class="input-box"
        placeholder="请输入用户名"
        type="text"
      />
      <input
        v-model="email"
        class="input-box"
        placeholder="请输入邮箱"
        type="text"
      />
      <input
        v-model="password"
        class="input-box"
        placeholder="请输入密码（至少6位）"
        type="password"
      />

      <picker :range="roles" :value="roleIndex" @change="onRoleChange">
        <view class="picker-box">
          <text>角色：{{ roles[roleIndex] }}</text>
        </view>
      </picker>

      <button class="register-btn" @click="register">立即注册</button>

      <view class="footer">
        <text>已有账户？</text>
        <text class="link" @click="goLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { request, api } from '@/request.js'

export default {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      roles: ['student', 'parent', 'teacher'],
      roleIndex: 0
    }
  },
  methods: {
    onRoleChange(e) {
      this.roleIndex = e.detail.value
    },

    async register() {
      if (!this.username || !this.email || !this.password) {
        return uni.showToast({ title: '请填写完整信息', icon: 'none',image: "/static/icons/fail.png" })
      }

      if (this.password.length < 6) {
        return uni.showToast({ title: '密码至少6位', icon: 'none' ,image: "/static/icons/fail.png"})
      }

      uni.showLoading({ title: '注册中...', mask: true })

      try {
        const res = await request({
          url: api.register,
          method: 'POST',
          data: {
            username: this.username,
            email: this.email,
            password: this.password,
            role: this.roles[this.roleIndex]
          }
        })

        uni.hideLoading()
        if (res.success) {
          uni.showToast({ title: '注册成功', icon: 'success' ,image: "/static/icons/success.png"})
          uni.setStorageSync('token', res.token)
          setTimeout(() => {
            uni.switchTab({ url: '/pages/tabbar/me/me' })
          }, 800)
        } else {
          uni.showToast({ title: res.message || '注册失败', icon: 'none' ,image: "/static/icons/fail.png"})
        }
      } catch (err) {
        uni.hideLoading()
        uni.showToast({ title: '网络异常或邮箱已存在', icon: 'none',image: "/static/icons/fail.png" })
      }
    },
    goLogin() {
      uni.switchTab({ url: '/pages/tabbar/me/me' })
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
  padding: 40rpx;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}
.icon {
  width: 60rpx;
  height: 60rpx;
  margin-right: 20rpx;
}
.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #00496e;
}

.register-card {
  background-color: #fff;
  padding: 60rpx 40rpx;
  border-radius: 30rpx;
  box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.1);
}

.input-box {
  width: 94%;
  border: 1px solid #ccc;
  border-radius: 30rpx;
  padding: 20rpx;
  margin-bottom: 25rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
}

.picker-box {
  width: 94%;
  border: 1px solid #ccc;
  border-radius: 30rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  background-color: #f9f9f9;
  margin-bottom: 30rpx;
}

.register-btn {
  width: 100%;
  background-color: #20d0b0;
  color: white;
  font-size: 30rpx;
  border: none;
  border-radius: 30rpx;
  padding: 20rpx 0;
}

.footer {
  text-align: center;
  margin-top: 40rpx;
  font-size: 26rpx;
  color: #666;
}

.link {
  color: #20d0b0;
  margin-left: 10rpx;
}
</style>
