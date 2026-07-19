<template>
  <view class="sms-login-page">
    <!-- 状态栏占位 -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- ========== 自定义导航栏 ========== -->
    <view class="custom-nav">
      <view class="nav-back" @tap="handleBack">
        <text class="nav-back-icon">&#x2190;</text>
      </view>
      <text class="nav-title">手机号登录</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- ========== 表单区域 ========== -->
    <view class="form-section">
      <!-- 手机号输入框 -->
      <view class="form-item">
        <text class="form-icon">&#x1F4F1;</text>
        <input
          class="form-input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          v-model="phone"
          :focus="false"
        />
      </view>

      <!-- 验证码输入框 -->
      <view class="form-item">
        <text class="form-icon">&#x1F512;</text>
        <input
          class="form-input code-input"
          type="number"
          maxlength="6"
          placeholder="请输入验证码"
          v-model="code"
          :focus="false"
        />
        <view
          class="sms-btn"
          :class="{ disabled: countdown > 0 }"
          @tap="handleSendCode"
        >
          <text>{{ countdown > 0 ? countdown + 's' : '获取验证码' }}</text>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button
        class="btn-login"
        :class="{ 'btn-disabled': loading }"
        :disabled="loading"
        @tap="handleLogin"
      >
        <text v-if="loading" class="login-loading-text">登录中...</text>
        <text v-else class="login-text">登录</text>
      </button>
    </view>

    <!-- ========== 底部区域 ========== -->
    <view class="bottom-section">
      <!-- 协议勾选 -->
      <view class="agreement-section">
        <view class="agreement-check" @tap="agreed = !agreed">
          <view class="checkbox" :class="{ checked: agreed }">
            <text v-if="agreed" class="checkmark">&#x2713;</text>
          </view>
        </view>
        <text class="agreement-text">已阅读并同意</text>
        <text class="agreement-link" @tap.stop="openAgreement('user')">《用户协议》</text>
        <text class="agreement-text">和</text>
        <text class="agreement-link" @tap.stop="openAgreement('privacy')">《隐私政策》</text>
      </view>

      <!-- 返回其他登录方式 -->
      <view class="back-login-link" @tap="handleBack">
        <text class="back-login-text">&#x2190; 返回其他登录方式</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { api } from '@/api/index'
import { useUserStore } from '@/store/user'

// --- 状态栏高度 ---
const statusBarHeight = ref(0)
try {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 0
} catch (_) {
  statusBarHeight.value = 44
}

// --- Store ---
const userStore = useUserStore()

// --- 响应式状态 ---
const phone = ref('')
const code = ref('')
const countdown = ref(0)
const agreed = ref(false)
const loading = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})

// --- 导航 ---
function handleBack() {
  uni.navigateBack()
}

// --- 发送验证码 ---
async function handleSendCode() {
  if (countdown.value > 0) return
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  try {
    await api.sendSmsCode(phone.value)
    uni.showToast({ title: '验证码已发送', icon: 'success' })
  } catch (_) {
    // 容错：测试环境下可能后端未启动，仍允许倒计时
  }
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }
  }, 1000)
}

// --- 登录 ---
async function handleLogin() {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!code.value || code.value.length < 4) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (!agreed.value) {
    uni.showToast({ title: '请先勾选用户协议', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const result = await api.loginByPhone({ phone: phone.value, code: code.value })
    userStore.setToken(result.token)
    if (result.user) {
      // 兼容两种后端响应结构：{ user: { phone } } 或 { user: { userInfo: { phone } } }
      const u = result.user
      const info = u.userInfo || u
      userStore.setUserInfo({
        id: String(u.id || info.userId || ''),
        nickname: info.nickname || u.nickname || '',
        phone: info.phone || u.phone || phone.value || '',
        avatar: info.avatar || u.avatar || '',
      })
    }
    uni.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (error: any) {
    uni.showToast({ title: error?.message || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// --- 协议 ---
function openAgreement(type: 'user' | 'privacy') {
  const url = type === 'user'
    ? '/pages/webview/index?url=https://example.com/agreement'
    : '/pages/webview/index?url=https://example.com/privacy'
  uni.navigateTo({ url })
}
</script>

<style scoped>
/* ==========================================
   页面整体
   ========================================== */
.sms-login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* ==========================================
   自定义导航栏
   ========================================== */
.custom-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #fff;
  position: relative;
}

.nav-back {
  width: 80rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.nav-back-icon {
  font-size: 40rpx;
  color: #333;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.nav-placeholder {
  width: 80rpx;
}

/* ==========================================
   表单区域
   ========================================== */
.form-section {
  padding: 80rpx 48rpx 0;
}

.form-item {
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #F0F0F0;
  padding: 28rpx 0;
  margin-bottom: 12rpx;
  transition: border-color 0.3s;
}

.form-item:focus-within {
  border-bottom-color: #07C160;
}

.form-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  font-size: 30rpx;
  color: #333;
  height: 56rpx;
}

.code-input {
  flex: 1;
}

.sms-btn {
  padding: 12rpx 24rpx;
  border: 2rpx solid #07C160;
  border-radius: 12rpx;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.sms-btn text {
  font-size: 24rpx;
  color: #07C160;
  white-space: nowrap;
}

.sms-btn.disabled {
  border-color: #ccc;
}

.sms-btn.disabled text {
  color: #999;
}

/* --- 登录按钮 --- */
.btn-login {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  margin-top: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 2rpx;
}

.btn-login::after {
  border: none;
}

.btn-login.btn-disabled {
  opacity: 0.7;
}

.login-loading-text {
  font-size: 30rpx;
  color: #fff;
}

.login-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 600;
}

/* ==========================================
   底部区域
   ========================================== */
.bottom-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 80rpx;
}

/* --- 协议勾选 --- */
.agreement-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 48rpx;
  margin-bottom: 32rpx;
}

.agreement-check {
  margin-right: 8rpx;
  padding: 8rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #07C160;
  border-color: #07C160;
}

.checkmark {
  font-size: 22rpx;
  color: #fff;
  font-weight: 700;
}

.agreement-text {
  font-size: 22rpx;
  color: #999;
  line-height: 1.6;
}

.agreement-link {
  font-size: 22rpx;
  color: #07C160;
  line-height: 1.6;
}

/* --- 返回其他登录方式 --- */
.back-login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
}

.back-login-text {
  font-size: 28rpx;
  color: #07C160;
}
</style>
