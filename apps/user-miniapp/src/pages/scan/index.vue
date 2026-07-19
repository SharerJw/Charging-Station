<template>
  <view class="scan-page">
    <!-- Top custom navigation bar -->
    <view class="top-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="top-bar-inner">
        <view class="back-btn" @tap="goBack">
          <text class="back-icon">&#x2190;</text>
        </view>
        <text class="top-title">扫码充电</text>
        <text class="manual-link" @tap="showManualInput = true">手动输入</text>
      </view>
    </view>

    <!-- Camera / scanning area -->
    <view class="scan-body">
      <!-- H5 fallback: no camera -->
      <view v-if="isH5" class="h5-fallback">
        <view class="h5-icon-wrap">
          <text class="h5-icon">📷</text>
        </view>
        <text class="h5-tip">请在微信小程序中使用扫码功能</text>
        <view class="h5-input-wrap">
          <input
            class="h5-input"
            v-model="manualCode"
            placeholder="请输入充电桩设备编号"
            confirm-type="done"
            @confirm="handleManualConfirm"
          />
        </view>
        <button class="h5-confirm-btn" @tap="handleManualConfirm">确认</button>
      </view>

      <!-- Native scan UI -->
      <template v-else>
        <!-- Overlay with transparent cutout -->
        <view class="overlay-top" />
        <view class="overlay-middle">
          <view class="overlay-side overlay-left" />
          <view class="scan-frame">
            <!-- Corner brackets -->
            <view class="corner corner-tl" />
            <view class="corner corner-tr" />
            <view class="corner corner-bl" />
            <view class="corner corner-br" />
            <!-- Animated scan line -->
            <view class="scan-line" />
          </view>
          <view class="overlay-side overlay-right" />
        </view>
        <view class="overlay-bottom">
          <text class="scan-tip">请对准充电桩上的二维码扫描</text>
        </view>
      </template>
    </view>

    <!-- Bottom controls (native only) -->
    <view v-if="!isH5" class="bottom-controls">
      <view class="ctrl-btn" @tap="toggleTorch">
        <text class="ctrl-icon">{{ torchOn ? '🔦' : '💡' }}</text>
        <text class="ctrl-label">{{ torchOn ? '关灯' : '开灯' }}</text>
      </view>
      <view class="ctrl-btn" @tap="scanFromAlbum">
        <text class="ctrl-icon">🖼</text>
        <text class="ctrl-label">相册</text>
      </view>
    </view>

    <!-- Manual input modal -->
    <view class="modal-mask" v-if="showManualInput" @tap="showManualInput = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">手动输入设备编号</text>
        <view class="modal-input-wrap">
          <input
            class="modal-input"
            v-model="manualCode"
            placeholder="请输入充电桩设备编号"
            confirm-type="done"
            @confirm="handleManualConfirm"
            :focus="showManualInput"
          />
        </view>
        <view class="modal-actions">
          <view class="modal-btn modal-btn-cancel" @tap="showManualInput = false">
            <text>取消</text>
          </view>
          <view class="modal-btn modal-btn-confirm" @tap="handleManualConfirm">
            <text>确认</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const statusBarHeight = ref(0)
const isH5 = ref(false)
const torchOn = ref(false)
const showManualInput = ref(false)
const manualCode = ref('')

/** Navigate back */
function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.switchTab({ url: '/pages/index/index' })
  }
}

/** Parse device code from scan result */
function parseDeviceCode(result: string): string {
  // Support URL format: https://ev.example.com/scan?deviceCode=XXX
  if (result.includes('deviceCode=')) {
    try {
      const url = result.startsWith('http') ? new URL(result) : new URL(result, 'https://placeholder.com')
      const code = url.searchParams.get('deviceCode')
      if (code) return code
    } catch {
      // Not a valid URL, fall through
    }
  }
  // Support JSON format: {"deviceCode":"XXX"}
  if (result.startsWith('{')) {
    try {
      const obj = JSON.parse(result)
      if (obj.deviceCode) return obj.deviceCode
    } catch {
      // Not valid JSON, fall through
    }
  }
  // Plain text device code
  return result.trim()
}

/** Navigate to charging-settings with device code */
function navigateToSettings(deviceCode: string) {
  if (!deviceCode) {
    uni.showToast({ title: '未识别到设备编号', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/charging-settings/index?deviceCode=${encodeURIComponent(deviceCode)}`,
  })
}

/** Start native scan */
function startScan() {
  // #ifdef MP-WEIXIN
  uni.scanCode({
    scanType: ['qrCode', 'barCode'],
    success: (res) => {
      const deviceCode = parseDeviceCode(res.result || '')
      navigateToSettings(deviceCode)
    },
    fail: (err) => {
      // User cancelled or error — silently ignore cancellation
      if (err.errMsg && !err.errMsg.includes('cancel')) {
        uni.showToast({ title: '扫码失败，请重试', icon: 'none' })
      }
    },
  })
  // #endif

  // #ifdef H5
  showManualInput.value = true
  // #endif
}

/** Scan from photo album */
function scanFromAlbum() {
  uni.scanCode({
    scanType: ['qrCode', 'barCode'],
    sourceType: ['album'],
    success: (res) => {
      const deviceCode = parseDeviceCode(res.result || '')
      navigateToSettings(deviceCode)
    },
    fail: (err) => {
      if (err.errMsg && !err.errMsg.includes('cancel')) {
        uni.showToast({ title: '识别失败，请选择清晰的二维码图片', icon: 'none' })
      }
    },
  })
}

/** Toggle flashlight */
function toggleTorch() {
  // #ifdef MP-WEIXIN
  uni.setKeepScreenOn && uni.setKeepScreenOn({ keepScreenOn: true })
  // Use wx API directly for torch
  const systemInfo = uni.getSystemInfoSync()
  if (systemInfo.platform === 'android' || systemInfo.platform === 'ios') {
    wx.setTorch({
      isTorchOn: !torchOn.value,
      success: () => {
        torchOn.value = !torchOn.value
      },
      fail: () => {
        uni.showToast({ title: '当前设备不支持手电筒', icon: 'none' })
      },
    })
  }
  // #endif

  // #ifdef H5
  uni.showToast({ title: 'H5环境不支持手电筒', icon: 'none' })
  // #endif
}

/** Handle manual device code input */
function handleManualConfirm() {
  const code = manualCode.value.trim()
  if (!code) {
    uni.showToast({ title: '请输入设备编号', icon: 'none' })
    return
  }
  showManualInput.value = false
  navigateToSettings(code)
}

onMounted(() => {
  // Get status bar height for custom nav bar
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 0

  // Detect H5 environment
  // #ifdef H5
  isH5.value = true
  // #endif

  // #ifndef H5
  isH5.value = false
  // Auto-start scanning on native
  setTimeout(() => {
    startScan()
  }, 300)
  // #endif
})

onBeforeUnmount(() => {
  // Turn off torch if still on
  if (torchOn.value) {
    // #ifdef MP-WEIXIN
    wx.setTorch({ isTorchOn: false })
    // #endif
  }
})
</script>

<style scoped>
.scan-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

/* ── Top navigation bar ── */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: transparent;
}

.top-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.top-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #fff;
}

.manual-link {
  font-size: 28rpx;
  color: #fff;
  padding: 8rpx 16rpx;
}

/* ── Scan body ── */
.scan-body {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ── Overlay layers for cutout effect ── */
.overlay-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* Distance from top to scan frame top */
  height: calc((100vh - 560rpx) / 2 - 60rpx);
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
}

.overlay-middle {
  position: fixed;
  /* Position below overlay-top */
  top: calc((100vh - 560rpx) / 2 - 60rpx);
  left: 0;
  right: 0;
  height: 560rpx;
  display: flex;
  flex-direction: row;
  z-index: 100;
}

.overlay-side {
  height: 100%;
  background: rgba(0, 0, 0, 0.55);
}

.overlay-left {
  flex: 1;
}

.overlay-right {
  flex: 1;
}

.overlay-bottom {
  position: fixed;
  /* Position below scan frame */
  top: calc((100vh - 560rpx) / 2 + 560rpx - 60rpx);
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 48rpx;
  z-index: 100;
}

/* ── Scan frame ── */
.scan-frame {
  width: 560rpx;
  height: 560rpx;
  position: relative;
  flex-shrink: 0;
}

/* Corner brackets */
.corner {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
}

.corner-tl {
  top: 0;
  left: 0;
  border-top: 4rpx solid #07C160;
  border-left: 4rpx solid #07C160;
}

.corner-tr {
  top: 0;
  right: 0;
  border-top: 4rpx solid #07C160;
  border-right: 4rpx solid #07C160;
}

.corner-bl {
  bottom: 0;
  left: 0;
  border-bottom: 4rpx solid #07C160;
  border-left: 4rpx solid #07C160;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-bottom: 4rpx solid #07C160;
  border-right: 4rpx solid #07C160;
}

/* Animated scan line */
.scan-line {
  position: absolute;
  left: 8rpx;
  right: 8rpx;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, #07C160, #07C160, transparent);
  box-shadow: 0 0 16rpx rgba(7, 193, 96, 0.6);
  animation: scanMove 2s linear infinite;
}

@keyframes scanMove {
  0% {
    top: 8rpx;
  }
  50% {
    top: calc(100% - 12rpx);
  }
  100% {
    top: 8rpx;
  }
}

.scan-tip {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 2rpx;
}

/* ── Bottom controls ── */
.bottom-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 120rpx;
  padding: 48rpx 0;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom));
  z-index: 200;
}

.ctrl-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.ctrl-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  line-height: 80rpx;
  text-align: center;
}

.ctrl-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* ── H5 fallback ── */
.h5-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
  padding-top: 240rpx;
}

.h5-icon-wrap {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(7, 193, 96, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.h5-icon {
  font-size: 72rpx;
}

.h5-tip {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 48rpx;
  text-align: center;
}

.h5-input-wrap {
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 32rpx;
}

.h5-input {
  width: 100%;
  font-size: 30rpx;
  color: #fff;
}

.h5-confirm-btn {
  width: 100%;
  background: #07C160;
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 48rpx;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
}

.h5-confirm-btn::after {
  border: none;
}

/* ── Manual input modal ── */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-box {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 36rpx 36rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 32rpx;
}

.modal-input-wrap {
  border: 2rpx solid #e8e8e8;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 32rpx;
}

.modal-input {
  width: 100%;
  font-size: 30rpx;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 24rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}

.modal-btn-cancel {
  background: #F5F5F5;
  color: #666;
}

.modal-btn-confirm {
  background: #07C160;
  color: #fff;
  font-weight: bold;
}
</style>
