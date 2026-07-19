<template>
  <view class="refund-page">
    <!-- 订单摘要 -->
    <view class="order-card">
      <view class="order-card-row">
        <text class="order-card-station">{{ orderInfo.stationName || '加载中...' }}</text>
        <text class="order-card-amount">¥{{ orderInfo.totalAmount.toFixed(2) }}</text>
      </view>
      <text class="order-card-time">{{ orderInfo.startTime }}</text>
      <text class="order-card-no">订单号 {{ orderInfo.orderNo }}</text>
    </view>

    <!-- 可退款金额 -->
    <view class="section">
      <text class="section-title">退款金额</text>
      <view v-if="isFullRefund" class="full-refund-badge" @tap="isFullRefund = false">
        <text class="full-refund-label">全额退款</text>
        <text class="full-refund-value">¥{{ orderInfo.totalAmount.toFixed(2) }}</text>
        <text class="full-refund-switch">切换为自定义</text>
      </view>
      <view v-else class="custom-amount-wrap">
        <text class="currency-sign">¥</text>
        <input
          class="amount-input"
          type="digit"
          v-model="customAmount"
          :placeholder="'最大 ¥' + orderInfo.totalAmount.toFixed(2)"
          @input="onAmountInput"
        />
        <text class="full-btn" @tap="setFullRefund">全额退款</text>
      </view>
    </view>

    <!-- 退款原因 -->
    <view class="section">
      <text class="section-title">退款原因</text>
      <view class="reason-list">
        <view
          v-for="(item, idx) in reasons"
          :key="idx"
          class="reason-item"
          :class="{ active: selectedReason === idx }"
          @tap="selectedReason = idx"
        >
          <view class="radio-outer">
            <view v-if="selectedReason === idx" class="radio-inner"></view>
          </view>
          <text class="reason-label">{{ item }}</text>
        </view>
      </view>
      <!-- "其他" 自定义输入 -->
      <view v-if="selectedReason === reasons.length - 1" class="other-reason-wrap">
        <textarea
          class="other-reason-input"
          v-model="otherReason"
          placeholder="请描述退款原因（必填）"
          :maxlength="50"
        />
        <text class="char-counter">{{ otherReason.length }}/50</text>
      </view>
    </view>

    <!-- 上传凭证 -->
    <view class="section">
      <text class="section-title">上传凭证</text>
      <view class="upload-grid">
        <view v-for="(img, idx) in photos" :key="idx" class="upload-thumb">
          <image class="thumb-img" :src="img" mode="aspectFill" @tap="previewImage(idx)" />
          <view class="thumb-remove" @tap.stop="removePhoto(idx)">
            <text class="thumb-remove-icon">×</text>
          </view>
        </view>
        <view v-if="photos.length < 3" class="upload-add" @tap="choosePhoto">
          <text class="add-icon">+</text>
          <text class="add-text">{{ photos.length }}/3</text>
        </view>
      </view>
      <text class="upload-hint">支持拍照或从相册选择，最多3张</text>
    </view>

    <!-- 补充说明 -->
    <view class="section">
      <text class="section-title">补充说明</text>
      <textarea
        class="remark-input"
        v-model="remark"
        placeholder="补充说明有助于加快审核（选填）"
        :maxlength="200"
      />
      <text class="char-counter remark-count">{{ remark.length }}/200</text>
    </view>

    <!-- 退款说明 -->
    <view class="refund-tips">
      <text class="tips-title">退款说明</text>
      <view class="tip-row">
        <text class="tip-dot">•</text>
        <text class="tip-text">退款申请提交后，预计1-3个工作日内完成审核</text>
      </view>
      <view class="tip-row">
        <text class="tip-dot">•</text>
        <text class="tip-text">审核通过后，退款将原路返回至您的付款账户</text>
      </view>
      <view class="tip-row">
        <text class="tip-dot">•</text>
        <text class="tip-text">退款金额不超过实付金额 ¥{{ orderInfo.totalAmount.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <button
        class="submit-btn"
        :class="{ disabled: !canSubmit || submitting }"
        :disabled="!canSubmit || submitting"
        @tap="handleSubmit"
      >
        <text v-if="submitting" class="btn-loading">提交中...</text>
        <text v-else>提交退款申请</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api, type Order } from '@/api/index'

// --- 订单数据 ---
const orderInfo = ref<Order>({
  id: '',
  orderNo: '',
  stationName: '',
  status: '',
  startTime: '',
  consumedEnergy: 0,
  totalAmount: 0,
})

// --- 退款金额 ---
const isFullRefund = ref(true)
const customAmount = ref('')

function setFullRefund() {
  isFullRefund.value = true
  customAmount.value = ''
}

function onAmountInput() {
  // 限制不超过实付金额
  const val = parseFloat(customAmount.value)
  if (!isNaN(val) && val > orderInfo.value.totalAmount) {
    customAmount.value = orderInfo.value.totalAmount.toFixed(2)
  }
}

const refundAmount = computed(() => {
  if (isFullRefund.value) return orderInfo.value.totalAmount
  const val = parseFloat(customAmount.value)
  return isNaN(val) ? 0 : val
})

// --- 退款原因 ---
const reasons = ['充电未成功启动', '充电中途异常中断', '多扣费用', '设备故障', '其他']
const selectedReason = ref(-1)
const otherReason = ref('')

const reasonText = computed(() => {
  if (selectedReason.value < 0) return ''
  if (selectedReason.value === reasons.length - 1) return otherReason.value.trim()
  return reasons[selectedReason.value]
})

// --- 图片上传 ---
const photos = ref<string[]>([])

function choosePhoto() {
  const remain = 3 - photos.value.length
  if (remain <= 0) return
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      photos.value.push(...res.tempFilePaths.slice(0, remain))
    },
  })
}

function removePhoto(idx: number) {
  photos.value.splice(idx, 1)
}

function previewImage(idx: number) {
  uni.previewImage({ urls: photos.value, current: photos.value[idx] })
}

// --- 补充说明 ---
const remark = ref('')

// --- 提交校验 ---
const canSubmit = computed(() => {
  if (refundAmount.value <= 0) return false
  if (refundAmount.value > orderInfo.value.totalAmount) return false
  if (selectedReason.value < 0) return false
  // 选了"其他"时，必须填写自定义原因
  if (selectedReason.value === reasons.length - 1 && otherReason.value.trim().length === 0) return false
  return true
})

// --- 防抖提交 ---
const submitting = ref(false)
let submitTimer: ReturnType<typeof setTimeout> | null = null

function handleSubmit() {
  if (!canSubmit.value || submitting.value) return
  if (submitTimer) clearTimeout(submitTimer)
  submitTimer = setTimeout(() => {
    doSubmit()
  }, 300)
}

async function doSubmit() {
  submitting.value = true
  try {
    await api.submitRefund({
      orderId: orderInfo.value.id,
      amount: refundAmount.value,
      reason: reasonText.value,
      remark: remark.value.trim(),
      photos: photos.value,
    })
    uni.showToast({ title: '退款申请已提交', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch {
    // api 层已统一处理错误提示
  } finally {
    submitting.value = false
  }
}

// --- 页面加载 ---
onLoad((options) => {
  const orderId = options?.orderId || ''
  if (!orderId) {
    uni.showToast({ title: '缺少订单信息', icon: 'none' })
    return
  }
  loadOrder(orderId)
})

async function loadOrder(orderId: string) {
  try {
    const detail = await api.getOrderDetail(orderId)
    if (detail) {
      orderInfo.value = {
        id: String(detail.id || orderId),
        orderNo: detail.orderNo || '',
        stationName: detail.stationName || '',
        status: detail.status || '',
        startTime: detail.startTime || detail.createdAt || '',
        consumedEnergy: detail.consumedEnergy || detail.totalEnergy || 0,
        totalAmount: detail.totalAmount || detail.actualAmount || 0,
      }
    }
  } catch {
    uni.showToast({ title: '订单加载失败', icon: 'none' })
  }
}
</script>

<style scoped>
.refund-page {
  min-height: 100vh;
  background: #F6F7FB;
  padding: 24rpx 24rpx 200rpx;
}

/* ---- 订单摘要卡片 ---- */
.order-card {
  background: #F0F0F0;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}

.order-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.order-card-station {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-card-amount {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  margin-left: 16rpx;
}

.order-card-time {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 4rpx;
}

.order-card-no {
  font-size: 22rpx;
  color: #BBB;
  display: block;
}

/* ---- 通用 Section ---- */
.section {
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

/* ---- 全额退款 ---- */
.full-refund-badge {
  display: flex;
  align-items: center;
  background: #E8F9EF;
  border: 2rpx solid #07C160;
  border-radius: 12rpx;
  padding: 24rpx;
  gap: 12rpx;
}

.full-refund-label {
  font-size: 26rpx;
  color: #07C160;
  font-weight: 600;
}

.full-refund-value {
  font-size: 40rpx;
  color: #07C160;
  font-weight: 700;
  flex: 1;
}

.full-refund-switch {
  font-size: 22rpx;
  color: #999;
  text-decoration: underline;
}

/* ---- 自定义金额 ---- */
.custom-amount-wrap {
  display: flex;
  align-items: center;
  border: 2rpx solid #E5E5E5;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  gap: 8rpx;
}

.currency-sign {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.amount-input {
  flex: 1;
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
}

.full-btn {
  font-size: 22rpx;
  color: #07C160;
  border: 2rpx solid #07C160;
  border-radius: 28rpx;
  padding: 8rpx 20rpx;
  white-space: nowrap;
}

/* ---- 退款原因 ---- */
.reason-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 12rpx;
  transition: border-color 0.2s, background 0.2s;
}

.reason-item.active {
  border-color: #07C160;
  background: #F0FFF4;
}

.radio-outer {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #CCC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reason-item.active .radio-outer {
  border-color: #07C160;
}

.radio-inner {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #07C160;
}

.reason-label {
  font-size: 28rpx;
  color: #333;
}

.other-reason-wrap {
  margin-top: 16rpx;
  position: relative;
}

.other-reason-input {
  width: 100%;
  min-height: 120rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  line-height: 1.6;
}

/* ---- 上传凭证 ---- */
.upload-grid {
  display: flex;
  gap: 20rpx;
  flex-wrap: wrap;
}

.upload-thumb {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.thumb-img {
  width: 100%;
  height: 100%;
}

.thumb-remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 0 0 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-remove-icon {
  font-size: 24rpx;
  color: #fff;
  line-height: 1;
}

.upload-add {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #CCC;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.add-icon {
  font-size: 52rpx;
  color: #CCC;
  line-height: 1;
}

.add-text {
  font-size: 20rpx;
  color: #CCC;
}

.upload-hint {
  font-size: 22rpx;
  color: #BBB;
  display: block;
  margin-top: 12rpx;
}

/* ---- 补充说明 ---- */
.remark-input {
  width: 100%;
  min-height: 140rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  line-height: 1.6;
}

.char-counter {
  font-size: 22rpx;
  color: #CCC;
  display: block;
  text-align: right;
  margin-top: 8rpx;
}

.remark-count {
  color: #CCC;
}

/* ---- 退款说明 ---- */
.refund-tips {
  background: #fff;
  border-radius: 12rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}

.tips-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.tip-row {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  margin-bottom: 10rpx;
}

.tip-dot {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

.tip-text {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
}

/* ---- 提交按钮 ---- */
.submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #07C160;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 44rpx;
  text-align: center;
  border: none;
  padding: 0;
}

.submit-btn.disabled,
.submit-btn[disabled] {
  background: #C0C0C0;
  color: #F5F5F5;
}

.btn-loading {
  opacity: 0.8;
}
</style>
