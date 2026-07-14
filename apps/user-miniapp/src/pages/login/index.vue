<template>
  <view class="login-page">
    <view class="login-header">
      <text class="logo">⚡</text>
      <text class="title">EV充电平台</text>
      <text class="subtitle">绿色出行，智慧充电</text>
    </view>

    <view class="login-form">
      <view class="form-item">
        <text class="form-icon">👤</text>
        <input class="form-input" placeholder="请输入手机号" v-model="phone" type="number" maxlength="11" />
      </view>
      <view class="form-item">
        <text class="form-icon">🔒</text>
        <input class="form-input" placeholder="请输入验证码" v-model="code" type="number" maxlength="6" />
        <text class="code-btn" :class="{ disabled: countdown > 0 }" @tap="sendCode">
          {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
        </text>
      </view>

      <button class="login-btn" @tap="handleLogin">登录</button>

      <view class="agreement">
        <checkbox :checked="agreed" @tap="agreed = !agreed" style="transform: scale(0.7)" />
        <text class="agreement-text">登录即表示同意</text>
        <text class="agreement-link">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const phone = ref('')
const code = ref('')
const agreed = ref(false)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function sendCode() {
  if (countdown.value > 0) return
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
  uni.showToast({ title: '验证码已发送', icon: 'success' })
}

function handleLogin() {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!code.value || code.value.length < 4) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (!agreed.value) {
    uni.showToast({ title: '请同意用户协议', icon: 'none' })
    return
  }
  // Mock login
  uni.setStorageSync('token', 'mock_token_' + Date.now())
  uni.showToast({ title: '登录成功', icon: 'success' })
  setTimeout(() => {
    uni.switchTab({ url: '/pages/index/index' })
  }, 1000)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #07C160 0%, #06AD56 40%, #F6F7FB 40%);
  padding: 0 48rpx;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
  padding-bottom: 80rpx;
}

.logo { font-size: 96rpx; }
.title { font-size: 40rpx; font-weight: bold; color: #fff; margin-top: 16rpx; }
.subtitle { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.login-form {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.1);
}

.form-item {
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
  padding: 24rpx 0;
  margin-bottom: 16rpx;
}

.form-icon { font-size: 36rpx; margin-right: 16rpx; }
.form-input { flex: 1; font-size: 28rpx; }

.code-btn {
  font-size: 24rpx;
  color: #07C160;
  padding: 8rpx 16rpx;
  border: 1rpx solid #07C160;
  border-radius: 8rpx;
}

.code-btn.disabled { color: #999; border-color: #ccc; }

.login-btn {
  margin-top: 48rpx;
  background: #07C160;
  color: #fff;
  font-size: 32rpx;
  border-radius: 48rpx;
  height: 88rpx;
  line-height: 88rpx;
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32rpx;
}

.agreement-text { font-size: 22rpx; color: #999; }
.agreement-link { font-size: 22rpx; color: #07C160; }
</style>
