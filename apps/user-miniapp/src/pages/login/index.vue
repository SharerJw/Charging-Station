<template>
  <view class="login-page">
    <!-- 状态栏占位 -->
    <view :style="{ height: statusBarHeight + 'px' }"></view>

    <!-- ========== 品牌展示区 (上方40%) ========== -->
    <view class="brand-section">
      <!-- 背景微动效粒子 -->
      <view class="particle particle-1"></view>
      <view class="particle particle-2"></view>
      <view class="particle particle-3"></view>
      <view class="particle particle-4"></view>
      <view class="particle particle-5"></view>

      <view class="brand-content">
        <!-- Logo + 充电插头图标 -->
        <view class="logo-wrapper">
          <view class="logo-circle">
            <text class="logo-icon">&#x26A1;</text>
          </view>
        </view>
        <text class="brand-name">EV 充电平台</text>
        <text class="brand-slogan">随时随地，满电出发 &#x26A1;</text>
      </view>
    </view>

    <!-- ========== 登录弹窗区 (下方60%，白色圆角顶部) ========== -->
    <view class="login-panel">
      <view class="panel-inner">
        <text class="panel-title">登录后享受完整充电服务</text>

        <!-- 支持 getPhoneNumber：手机号快捷登录为主CTA -->
        <template v-if="supportsGetPhoneNumber">
          <!-- 主CTA：手机号快捷登录（绿色渐变） -->
          <button
            class="btn-primary"
            :class="{ 'btn-shake': shakePhone }"
            open-type="getPhoneNumber"
            @getphonenumber="handleGetPhoneNumber"
            @tap="onPhoneQuickTap"
          >
            <text class="btn-icon-phone">&#x260E;</text>
            <text>手机号快捷登录</text>
          </button>

          <!-- 次要：微信一键登录（白色描边） -->
          <button
            class="btn-secondary"
            :class="{ 'btn-shake': shakeWechat }"
            @tap="handleWechatLogin"
          >
            <text class="btn-icon-wechat">&#x1F4F1;</text>
            <text>微信登录</text>
          </button>
        </template>

        <!-- 不支持 getPhoneNumber：微信一键登录为主CTA -->
        <template v-else>
          <!-- 主CTA：微信一键登录（绿色渐变） -->
          <button
            class="btn-primary"
            :class="{ 'btn-shake': shakeWechat }"
            @tap="handleWechatLogin"
          >
            <text class="btn-icon-wechat">&#x1F4F1;</text>
            <text>微信登录</text>
          </button>
        </template>

        <!-- 文字链接：手机号+验证码登录（跳转子页面） -->
        <view class="traditional-login-link" @tap="goToSmsLogin">
          <text class="link-text">手机号登录</text>
          <text class="link-arrow">&#x2192;</text>
        </view>

        <!-- 底部协议勾选 -->
        <view class="agreement-section">
          <view class="agreement-check" @tap="agreed = !agreed">
            <view class="checkbox" :class="{ checked: agreed }">
              <text v-if="agreed" class="checkmark">&#x2713;</text>
            </view>
          </view>
          <text class="agreement-text">我已阅读并同意</text>
          <text class="agreement-link" @tap.stop="openAgreement('user')">《用户协议》</text>
          <text class="agreement-text">和</text>
          <text class="agreement-link" @tap.stop="openAgreement('privacy')">《隐私政策》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/api/index'
import { useUserStore } from '@/store/user'

// --- 状态栏高度（适配自定义导航栏）---
const statusBarHeight = ref(0)
try {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 0
} catch (_) {
  statusBarHeight.value = 44
}

// --- Store ---
const userStore = useUserStore()

// --- 检测是否支持 getPhoneNumber（微信手机号快速验证）---
const supportsGetPhoneNumber = ref(false)
try {
  // #ifdef MP-WEIXIN
  const sysInfo = uni.getSystemInfoSync()
  const SDKVersion = sysInfo.SDKVersion || '0.0.0'
  const parts = SDKVersion.split('.').map(Number)
  supportsGetPhoneNumber.value = parts[0] > 2 || (parts[0] === 2 && parts[1] > 21) || (parts[0] === 2 && parts[1] === 21 && parts[2] >= 2)
  // #endif
  // #ifdef H5
  supportsGetPhoneNumber.value = true  // H5 模式下显示手机号快捷登录按钮（点击后走传统登录）
  // #endif
} catch (_) {
  supportsGetPhoneNumber.value = false
}

// --- 响应式状态 ---
const agreed = ref(false)
const shakeWechat = ref(false)
const shakePhone = ref(false)

// --- 辅助函数 ---
/** 未勾选协议时触发按钮抖动 */
function triggerShake(type: 'wechat' | 'phone') {
  const target = type === 'wechat' ? shakeWechat : shakePhone
  target.value = true
  setTimeout(() => { target.value = false }, 600)
}

/** 统一登录成功处理 */
function onLoginSuccess(result: { token: string; user?: any; isNewUser?: boolean }) {
  userStore.setToken(result.token)
  if (result.user) {
    // 兼容两种后端响应结构：{ user: { phone } } 或 { user: { userInfo: { phone } } }
    const u = result.user
    const info = u.userInfo || u
    userStore.setUserInfo({
      id: String(u.id || info.userId || ''),
      nickname: info.nickname || u.nickname || '',
      phone: info.phone || u.phone || '',
      avatar: info.avatar || u.avatar || '',
    })
  }
  uni.showToast({
    title: '登录成功 🎉',
    icon: 'success',
    duration: 1500,
  })
  if (result.isNewUser) {
    setTimeout(() => {
      uni.showToast({
        title: '欢迎新用户！已为您送上新人礼包',
        icon: 'none',
        duration: 2500,
      })
    }, 1600)
  }
  setTimeout(() => {
    uni.switchTab({ url: '/pages/index/index' })
  }, result.isNewUser ? 4200 : 1500)
}

// --- 登录方式1: 微信一键登录 ---
async function handleWechatLogin() {
  if (!agreed.value) {
    triggerShake('wechat')
    return
  }
  // #ifdef MP-WEIXIN
  try {
    uni.showLoading({ title: '登录中...' })
    const loginRes: any = await new Promise((resolve, reject) => {
      wx.login({ success: resolve, fail: reject })
    })
    const result = await api.loginByWechat({ code: loginRes.code })
    uni.hideLoading()
    onLoginSuccess(result)
  } catch (e: any) {
    uni.hideLoading()
    uni.showToast({ title: e?.message || '微信登录失败', icon: 'none' })
  }
  // #endif
  // #ifdef H5
  // H5 模式下微信登录不可用，引导使用手机号登录
  uni.showToast({ title: 'H5 模式请使用手机号登录', icon: 'none' })
  // #endif
}

// --- 登录方式2: 手机号快捷登录 ---
/** H5 模式下点击手机号快捷登录（open-type 不生效时的兜底） */
function onPhoneQuickTap() {
  // #ifdef H5
  if (!agreed.value) {
    triggerShake('phone')
    return
  }
  uni.navigateTo({ url: '/pages/login-sms/index' })
  // #endif
}

async function handleGetPhoneNumber(e: any) {
  if (!agreed.value) {
    triggerShake('phone')
    return
  }
  // #ifdef MP-WEIXIN
  if (e.detail?.errMsg && !e.detail.errMsg.includes('ok')) {
    return
  }
  const phoneCode = e.detail?.code
  if (!phoneCode) {
    uni.showToast({ title: '获取手机号失败，请重试', icon: 'none' })
    return
  }
  try {
    uni.showLoading({ title: '登录中...' })
    const result = await api.getPhoneNumber(phoneCode)
    uni.hideLoading()
    onLoginSuccess(result)
  } catch (err: any) {
    uni.hideLoading()
    uni.showToast({ title: err?.message || '手机号登录失败', icon: 'none' })
  }
  // #endif
  // #ifdef H5
  // H5 模式下跳转到手机号+验证码登录页
  uni.navigateTo({ url: '/pages/login-sms/index' })
  // #endif
}

// --- 登录方式3: 跳转传统手机号+验证码页面 ---
function goToSmsLogin() {
  uni.navigateTo({ url: '/pages/login-sms/index' })
}

/** 打开协议页面 */
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
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #07C160;
  overflow: hidden;
}

/* ==========================================
   品牌展示区 (上方 40%)
   ========================================== */
.brand-section {
  position: relative;
  flex: 0 0 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #07C160 0%, #06AD56 60%, #059A4C 100%);
  overflow: hidden;
}

/* 背景微动效粒子 */
.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  animation: floatUp 6s ease-in-out infinite;
}

.particle-1 {
  width: 120rpx; height: 120rpx;
  left: 10%; top: 60%;
  animation-delay: 0s;
  animation-duration: 7s;
}

.particle-2 {
  width: 80rpx; height: 80rpx;
  right: 15%; top: 30%;
  animation-delay: 1.5s;
  animation-duration: 5s;
}

.particle-3 {
  width: 60rpx; height: 60rpx;
  left: 60%; top: 70%;
  animation-delay: 3s;
  animation-duration: 8s;
}

.particle-4 {
  width: 100rpx; height: 100rpx;
  right: 30%; top: 55%;
  animation-delay: 2s;
  animation-duration: 6s;
}

.particle-5 {
  width: 40rpx; height: 40rpx;
  left: 30%; top: 40%;
  animation-delay: 4s;
  animation-duration: 9s;
}

@keyframes floatUp {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.06;
  }
  50% {
    transform: translateY(-80rpx) scale(1.2);
    opacity: 0.15;
  }
}

/* 品牌内容 */
.brand-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}

.logo-wrapper {
  margin-bottom: 24rpx;
}

.logo-circle {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
}

.logo-icon {
  font-size: 72rpx;
  color: #fff;
}

.brand-name {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 4rpx;
  margin-bottom: 12rpx;
}

.brand-slogan {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 2rpx;
}

/* ==========================================
   登录弹窗区 (下方 60%)
   ========================================== */
.login-panel {
  flex: 1;
  background: #fff;
  border-radius: 48rpx 48rpx 0 0;
  margin-top: -48rpx;
  padding-top: 48rpx;
  position: relative;
  z-index: 2;
}

.panel-inner {
  padding: 32rpx 48rpx 60rpx;
}

.panel-title {
  display: block;
  text-align: center;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 48rpx;
  letter-spacing: 2rpx;
}

/* --- 主CTA按钮（绿色渐变） --- */
.btn-primary {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 28rpx;
  letter-spacing: 2rpx;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
}

.btn-primary::after {
  border: none;
}

.btn-icon-wechat {
  font-size: 36rpx;
}

.btn-icon-phone {
  font-size: 32rpx;
}

/* --- 次要按钮（白色描边） --- */
.btn-secondary {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: #fff;
  color: #333;
  font-size: 30rpx;
  font-weight: 500;
  border-radius: 48rpx;
  border: 2rpx solid #E0E0E0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 36rpx;
}

.btn-secondary::after {
  border: none;
}

/* --- 手机号+验证码登录链接 --- */
.traditional-login-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
  margin-bottom: 24rpx;
}

.link-text {
  font-size: 26rpx;
  color: #07C160;
  margin-right: 8rpx;
}

.link-arrow {
  font-size: 26rpx;
  color: #07C160;
}

/* --- 底部协议勾选 --- */
.agreement-section {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 40rpx;
  padding: 0 8rpx;
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

/* ==========================================
   抖动动画（未勾选协议时）
   ========================================== */
.btn-shake {
  animation: shakeAnim 0.5s ease-in-out;
}

@keyframes shakeAnim {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-10rpx); }
  30%, 70% { transform: translateX(10rpx); }
}
</style>
