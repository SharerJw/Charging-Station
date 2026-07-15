<template>
  <view class="login-page">
    <view class="login-header">
      <text class="login-logo">🔧</text>
      <text class="login-title">EV充电运维平台</text>
      <text class="login-subtitle">运维工程师登录</text>
    </view>

    <view class="login-form">
      <view class="form-item">
        <text class="form-icon">👤</text>
        <input
          class="form-input"
          v-model="username"
          placeholder="请输入用户名"
          type="text"
        />
      </view>
      <view class="form-item">
        <text class="form-icon">🔒</text>
        <input
          class="form-input"
          v-model="password"
          placeholder="请输入密码"
          :password="true"
          type="text"
        />
      </view>
      <view class="login-btn" @tap="handleLogin">
        <text class="login-btn-text">{{ loading ? '登录中...' : '登录' }}</text>
      </view>
      <view class="login-hint">
        <text class="hint-text">测试账号: ops1 / ops123</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/api/index'

const username = ref('ops1')
const password = ref('ops123')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const res = await api.login({ username: username.value, password: password.value })
    if (res && (res as any).token) {
      uni.setStorageSync('ops_token', (res as any).token)
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/index/index' })
      }, 500)
    }
  } catch (e) {
    console.error('登录失败:', e)
    uni.showToast({ title: '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1677FF 0%, #0958D9 40%, #F0F2F5 40%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120px;
}

.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.login-logo {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.login-title {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  display: block;
}

.login-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
  display: block;
}

.login-form {
  width: 85%;
  max-width: 360px;
  background: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-item {
  display: flex;
  align-items: center;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.form-icon {
  font-size: 18px;
  margin-right: 12px;
}

.form-input {
  flex: 1;
  font-size: 16px;
  color: #333;
  border: none;
  outline: none;
}

.login-btn {
  background: #1677FF;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
  cursor: pointer;
  margin-top: 8px;
}

.login-btn:hover {
  background: #0958D9;
}

.login-btn-text {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.login-hint {
  text-align: center;
  margin-top: 16px;
}

.hint-text {
  font-size: 12px;
  color: #999;
}
</style>
