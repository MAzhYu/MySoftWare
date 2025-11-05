<template>
  <view class="container">
    <!-- 顶部标题 -->
    <view class="header">
      <image :src="user?.avatarUrl || defaultAvatar" class="avatar" />
      <text class="title">我的账户</text>
    </view>

    <!-- 未登录状态 -->
    <view v-if="!user" class="login-card">
      <text class="login-title">🦌马神口算</text>

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
      <view class="register-tip">
        <text>还没有账号？</text>
        <text class="link" @click="goRegister">立即注册</text>
      </view>
    </view>

    <!-- 已登录状态 -->
    <view v-else class="profile-card">
      <view class="user-info">
        <image :src="user?.avatarUrl || defaultAvatar" class="profile-avatar" />
        <view class="info-text">
          <text class="name">{{ user.username }}</text>
          <text class="email">{{ user.email }}</text>
          <text class="role">角色：{{ roleName(user.role) }}</text>
        </view>
      </view>
      <view class="grade-picker">
        <text class="picker-label">当前年级：</text>
        <picker :range="grades" :value="gradeIndex" @change="onGradeChange">
          <view class="picker-box">
            {{ grades[gradeIndex] || '未设置' }}
          </view>
        </picker>
      </view>
      <view class="progress">
        <text class="section-title">学习进度</text>
        <view class="progress-item">
          <view class="progress-row">
            <text class="progress-label">练习总数：</text>
            <text class="progress-value">{{ user.learningProgress?.totalExercises || 0 }} 题</text>
          </view>
          <view class="progress-row">
            <text class="progress-label">正确题数：</text>
            <text class="progress-value">{{ user.learningProgress?.correctAnswers || 0 }} 题</text>
          </view>
          <view class="progress-row">
            <text class="progress-label">正确率：</text>
            <text class="progress-value highlight">{{ user.learningProgress?.averageAccuracy || 0 }}%</text>
          </view>
          <view class="progress-row">
            <text class="progress-label">练习时长：</text>
            <text class="progress-value">{{ formatPracticeTime(user.totalPracticeTime) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 错题集入口 -->
      <view class="menu-section">
        <view class="menu-item" @click="goToWrongProblems">
          <view class="menu-left">
            <image src="/static/icons/fail.png" class="menu-icon" />
            <text class="menu-text">我的错题集</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>
      
	  <button class="edit-btn" @click="openEditModal">修改信息</button>
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>
	
	<view v-if="showEditModal" class="modal-mask" @click="closeModal">
      <view class="modal" @click.stop>
        <text class="modal-title">修改个人信息</text>

        <input
          v-model="editData.username"
          class="modal-input"
          placeholder="修改姓名"
        />
        <input
          v-model="editData.email"
          class="modal-input"
          placeholder="修改邮箱"
        />

        <picker :range="grades" :value="editGradeIndex" @change="onEditGradeChange">
          <view class="modal-picker">
            年级：{{ grades[editGradeIndex] || '未设置' }}
          </view>
        </picker>

        <view class="avatar-upload">
          <text class="avatar-label">头像：</text>
          <image :src="user?.avatarUrl || defaultAvatar" class="modal-avatar" @click="chooseAvatar" />
          <button class="upload-btn" @click="chooseAvatar">上传头像</button>
        </view>

        <view class="modal-actions">
          <button class="cancel-btn" @click="closeModal">取消</button>
          <button class="confirm-btn" @click="submitEdit">保存</button>
        </view>
      </view>
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
  user: null,
  defaultAvatar: 'https://javaweb-learn-heliuyue.oss-cn-beijing.aliyuncs.com/Default_Image.png',
      grades: ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'],
      gradeIndex: 0,
	  showEditModal: false,
      editData: { username: '', email: '', grade: '' },
      editGradeIndex: 0
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
          uni.setStorageSync('user', res.user)
        
          // ✅ 立即更新当前页面显示
          this.user = res.user
        
          uni.showToast({ title: '登录成功', image: "/static/icons/success.png" })
      } catch (err) {
        uni.showToast({ title: '登录失败，请检查账号或网络', icon: 'none',image: "/static/icons/fail.png" })
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
		uni.setStorageSync('user', res.user)
      } catch (err) {
        this.user = null
      }
    },
	async onGradeChange(e) {
	      this.gradeIndex = e.detail.value
	      const newGrade = this.grades[this.gradeIndex]
	      if (!this.user) return
	
	      // 更新前端显示
	      this.user.learningProgress.grade = newGrade
	
	      try {
	        uni.showLoading({ title: '保存中...' })
	        const res = await request({
	          url: api.profile,
	          method: 'PUT',
	          auth: true,
	          data: {
	            learningProgress: this.user.learningProgress
	          }
	        })
	        if (res.success) {
	          uni.showToast({ title: '年级已更新', image: "/static/icons/success.png" })
	        } else {
	          uni.showToast({ title: '保存失败', icon: 'none' })
	        }
	      } catch (err) {
			  console.error('请求出错:', err)
	        uni.showToast({ title: '请求出错', icon: 'none' ,image: "/static/icons/fail.png"})
	      } finally {
	        uni.hideLoading()
	      }
	    },
    openEditModal() {
      this.editData.username = this.user.username
      this.editData.email = this.user.email
      this.editGradeIndex = this.grades.indexOf(this.user.learningProgress?.grade || '') || 0
      this.showEditModal = true
    },
    closeModal() {
      this.showEditModal = false
    },
    onEditGradeChange(e) {
      this.editGradeIndex = e.detail.value
    },

    // 选择并上传头像
    async chooseAvatar() {
      try {
        const picked = await new Promise((resolve) => {
          uni.chooseImage({ count: 1, sizeType: ['compressed'], sourceType: ['album','camera'], success: resolve, fail: () => resolve(null) })
        })
        if (!picked || !picked.tempFilePaths || !picked.tempFilePaths[0]) return
        const filePath = picked.tempFilePaths[0]

        uni.showLoading({ title: '上传中...' })
        const token = uni.getStorageSync('token')
        const uploadRes = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: api.avatarUpload,
            filePath,
            name: 'file',
            header: { 'Authorization': `Bearer ${token}` },
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          })
        })

        let data
        try { data = JSON.parse(uploadRes.data) } catch { data = uploadRes.data }
        if (data && data.success && data.url) {
          if (!this.user) this.user = {}
          this.user.avatarUrl = data.url
		   uni.setStorageSync('user', this.user)
          uni.showToast({ title: '头像已更新', icon: 'none' })
        } else {
          uni.showToast({ title: '上传失败', icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },

    // 提交修改
    async submitEdit() {
      uni.showLoading({ title: '保存中...' })
      try {
        const res = await request({
          url: api.profile,
          method: 'PUT',
          auth: true,
          data: {
            username: this.editData.username,
            email: this.editData.email,
            learningProgress: {
              grade: this.grades[this.editGradeIndex]
            }
          }
        })
        if (res.success) {
          uni.showToast({ title: '修改成功', image: '/static/icons/success.png' })
          this.showEditModal = false
          await this.loadUser()
        } else {
          uni.showToast({ title: '修改失败', icon: 'none' })
        }
      } catch (err) {
        console.error(err)
        uni.showToast({ title: '请求出错', icon: 'none', image: '/static/icons/fail.png' })
      } finally {
        uni.hideLoading()
      }
    },
    logout() {
      uni.removeStorageSync('token')
      this.user = null
      uni.showToast({ title: '已退出登录' ,image: "/static/icons/success.png"})
    },
    goRegister() {
      // ✅ 跳转到注册页面
      uni.navigateTo({
        url: '/pages/register/register'
      })
    },
    goToWrongProblems() {
      uni.navigateTo({
        url: '/pages/wrongProblems/wrongProblems'
      })
    },
    formatPracticeTime(seconds) {
      if (!seconds) return '0分钟'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      }
      return `${minutes}分钟`
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
  border-radius: 50%;
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
  display: block;
  font-size: 32rpx;
  color: #00496e;
  margin-bottom: 40rpx;
  padding-bottom: 30rpx;
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
.grade-picker {
  margin-top: 40rpx;
  display: flex;
  align-items: center;
}
.picker-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #00496e;
  margin-right: 20rpx;
}
.picker-box {
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 20rpx;
  padding: 16rpx 20rpx;
  background-color: #f9f9f9;
  color: #333;
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
  padding: 25rpx;
  font-size: 26rpx;
  color: #333;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1px solid #e8eaed;
}

.progress-row:last-child {
  border-bottom: none;
}

.progress-label {
  font-size: 28rpx;
  color: #666;
}

.progress-value {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.progress-value.highlight {
  color: #20d0b0;
  font-size: 32rpx;
}

/* 菜单区域 */
.menu-section {
  margin-top: 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 25rpx;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 20rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}

.menu-arrow {
  font-size: 40rpx;
  color: #999;
}

/* 退出按钮 */
.logout-btn {
  margin-top: 50rpx;
  width: 100%;
  background-color: #999;
  color: white;
  font-size: 30rpx;
  border: none;
  border-radius: 30rpx;
  padding: 20rpx 0;
}
.register-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30rpx;
  font-size: 26rpx;
  color: #666;
}
.link {
  color: #20d0b0;
  margin-left: 10rpx;
}
.edit-btn {
  margin-top: 40rpx;
  width: 100%;
  background-color: #00496e;
  color: white;
  font-size: 30rpx;
  border: none;
  border-radius: 30rpx;
  padding: 20rpx 0;
}

/* 模态框样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: white;
  width: 80%;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.2);
}
.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #00496e;
  text-align: center;
  margin-bottom: 30rpx;
}
.modal-input {
  border: 1px solid #ccc;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 25rpx;
  font-size: 28rpx;
  background-color: #f9f9f9;
}
.modal-picker {
  text-align: center;
  font-size: 28rpx;
  background: #f9f9f9;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 25rpx;
}
.avatar-upload { display: flex; align-items: center; justify-content: flex-start; margin: 10rpx 0 30rpx; }
.avatar-label { font-size: 28rpx; color: #00496e; margin-right: 16rpx; }
.modal-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; margin-right: 16rpx; border: 2rpx solid #eee; }
.upload-btn { background-color: #00496e; color: #fff; border: none; padding: 10rpx 20rpx; border-radius: 20rpx; }
.modal-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 30rpx;
}
.cancel-btn {
  background-color: #ccc;
  color: #fff;
  border-radius: 20rpx;
  padding: 15rpx 40rpx;
}
.confirm-btn {
  background-color: #20d0b0;
  color: #fff;
  border-radius: 20rpx;
  padding: 15rpx 40rpx;
}
</style>
