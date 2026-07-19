<template>
  <view class="coupon-page">
    <!-- 顶部标签栏 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text class="tab-label">{{ tab.label }}</text>
        <text v-if="getTabCount(tab.value) > 0" class="tab-count">({{ getTabCount(tab.value) }})</text>
        <view v-if="currentTab === tab.value" class="tab-indicator"></view>
      </view>
    </view>

    <!-- 兑换入口 -->
    <view class="redeem-bar" @tap="openRedeemDialog">
      <text class="redeem-icon">🎫</text>
      <text class="redeem-text">兑换优惠券</text>
      <text class="redeem-arrow">></text>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 优惠券列表 -->
    <view v-else-if="displayCoupons.length > 0" class="coupon-list">
      <view
        v-for="coupon in displayCoupons"
        :key="coupon.id"
        class="coupon-card"
        :class="{
          'coupon-disabled': coupon.status === 'used' || coupon.status === 'expired',
          'coupon-expiring': coupon.status === 'available' && isExpiringSoon(coupon.endTime),
        }"
      >
        <!-- 左侧彩色区域 (30%) -->
        <view
          class="coupon-left"
          :style="{ background: getCouponGradient(coupon) }"
        >
          <!-- 满减券 -->
          <template v-if="coupon.type === 'fixed'">
            <view class="coupon-amount-row">
              <text class="coupon-symbol">¥</text>
              <text class="coupon-amount">{{ coupon.amount }}</text>
            </view>
            <text class="coupon-condition">满{{ coupon.minAmount }}可用</text>
          </template>
          <!-- 折扣券 -->
          <template v-else-if="coupon.type === 'discount'">
            <text class="coupon-discount">{{ coupon.discount }}折</text>
            <text class="coupon-condition">满{{ coupon.minAmount }}可用</text>
          </template>
          <!-- 电量券 -->
          <template v-else-if="coupon.type === 'energy'">
            <text class="coupon-energy-label">免费</text>
            <view class="coupon-amount-row">
              <text class="coupon-amount">{{ coupon.energyKwh }}</text>
              <text class="coupon-unit">度</text>
            </view>
          </template>
        </view>

        <!-- 撕裂线（虚线分隔 + 半圆缺口） -->
        <view class="coupon-tear">
          <view class="tear-dot tear-dot-top"></view>
          <view class="tear-line"></view>
          <view class="tear-dot tear-dot-bottom"></view>
        </view>

        <!-- 右侧白色区域 (70%) -->
        <view class="coupon-right">
          <text class="coupon-name">{{ coupon.name }}</text>
          <text class="coupon-scope">{{ coupon.scope }}</text>
          <text class="coupon-validity">
            {{ formatDate(coupon.startTime) }} - {{ formatDate(coupon.endTime) }}
          </text>

          <!-- 即将过期标签 -->
          <view
            v-if="coupon.status === 'available' && isExpiringSoon(coupon.endTime)"
            class="expiring-tag"
          >
            <text class="expiring-text">即将过期</text>
          </view>

          <!-- 可用：立即使用按钮 -->
          <view
            v-if="coupon.status === 'available'"
            class="coupon-use-btn"
            @tap.stop="useCoupon(coupon)"
          >
            <text class="use-btn-text">立即使用</text>
          </view>

          <!-- 已使用水印 -->
          <view v-if="coupon.status === 'used'" class="stamp-overlay">
            <text class="stamp-text stamp-used">已使用</text>
          </view>

          <!-- 已过期水印 -->
          <view v-if="coupon.status === 'expired'" class="stamp-overlay">
            <text class="stamp-text stamp-expired">已过期</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">{{ emptyIcon }}</text>
      <text class="empty-text">{{ emptyText }}</text>
      <view v-if="currentTab === 'available'" class="empty-action" @tap="goCouponCenter">
        <text class="empty-action-text">去领券</text>
      </view>
    </view>

    <!-- 兑换码弹窗 -->
    <view v-if="showRedeemDialog" class="dialog-mask" @tap="closeRedeemDialog">
      <view class="dialog-box" @tap.stop>
        <text class="dialog-title">兑换优惠券</text>
        <input
          class="dialog-input"
          v-model="redeemCode"
          placeholder="请输入兑换码"
          placeholder-class="dialog-placeholder"
          :maxlength="32"
          @confirm="handleRedeem"
        />
        <view class="dialog-actions">
          <view class="dialog-btn dialog-btn-cancel" @tap="closeRedeemDialog">
            <text class="dialog-btn-text cancel-text">取消</text>
          </view>
          <view
            class="dialog-btn dialog-btn-confirm"
            :class="{ 'btn-disabled': !redeemCode.trim() }"
            @tap="handleRedeem"
          >
            <text class="dialog-btn-text confirm-text">兑换</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/index'

interface Coupon {
  id: string
  name: string
  description: string
  type: 'fixed' | 'discount' | 'energy'
  amount: number
  discount: number
  energyKwh: number
  minAmount: number
  scope: string
  startTime: string
  endTime: string
  status: 'available' | 'used' | 'expired'
  usedTime: string
}

const currentTab = ref('available')
const coupons = ref<Coupon[]>([])
const loading = ref(false)
const showRedeemDialog = ref(false)
const redeemCode = ref('')
const redeeming = ref(false)

const tabs = [
  { label: '可用', value: 'available' },
  { label: '已使用', value: 'used' },
  { label: '已过期', value: 'expired' },
]

const displayCoupons = computed(() => {
  return coupons.value.filter(c => c.status === currentTab.value)
})

const emptyIcon = computed(() => {
  switch (currentTab.value) {
    case 'available': return '🎫'
    case 'used': return '✅'
    case 'expired': return '⏰'
    default: return '📋'
  }
})

const emptyText = computed(() => {
  switch (currentTab.value) {
    case 'available': return '暂无可用优惠券，去领券中心看看~ 🎁'
    case 'used': return '暂无已使用的优惠券'
    case 'expired': return '暂无已过期的优惠券'
    default: return '暂无优惠券'
  }
})

function getTabCount(tab: string): number {
  return coupons.value.filter(c => c.status === tab).length
}

/** 7天内过期视为即将过期 */
function isExpiringSoon(endTime: string): boolean {
  if (!endTime) return false
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  return end > now && end - now <= sevenDays
}

/** 根据券类型返回渐变背景色 */
function getCouponGradient(coupon: Coupon): string {
  if (coupon.status === 'used' || coupon.status === 'expired') {
    return 'linear-gradient(135deg, #B0B0B0, #C8C8C8)'
  }
  switch (coupon.type) {
    case 'fixed':
      return 'linear-gradient(135deg, #FF6B6B, #FF4D4F)'
    case 'discount':
      return 'linear-gradient(135deg, #FFA940, #FA8C16)'
    case 'energy':
      return 'linear-gradient(135deg, #36CFC9, #13C2C2)'
    default:
      return 'linear-gradient(135deg, #FF6B6B, #FF4D4F)'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

async function loadCoupons() {
  loading.value = true
  try {
    coupons.value = await api.getCoupons()
  } catch {
    uni.showToast({ title: '加载优惠券失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(tab: string) {
  currentTab.value = tab
}

function useCoupon(coupon: Coupon) {
  uni.navigateTo({ url: '/pages/map/index' })
}

function goCouponCenter() {
  uni.navigateTo({ url: '/pages/coupon/center' })
}

function openRedeemDialog() {
  redeemCode.value = ''
  showRedeemDialog.value = true
}

function closeRedeemDialog() {
  showRedeemDialog.value = false
  redeemCode.value = ''
}

async function handleRedeem() {
  const code = redeemCode.value.trim()
  if (!code || redeeming.value) return
  redeeming.value = true
  try {
    await api.redeemCoupon(code)
    uni.showToast({ title: '兑换成功', icon: 'success' })
    closeRedeemDialog()
    loadCoupons()
  } catch {
    uni.showToast({ title: '兑换失败，请检查兑换码', icon: 'none' })
  } finally {
    redeeming.value = false
  }
}

onMounted(() => {
  loadCoupons()
})
</script>

<style scoped>
.coupon-page {
  background: #F6F7FB;
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ===== 标签栏 ===== */
.tab-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 0 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 96rpx;
  position: relative;
}

.tab-label {
  font-size: 28rpx;
  color: #666;
}

.tab-count {
  font-size: 22rpx;
  color: #999;
  margin-left: 4rpx;
}

.tab-item.active .tab-label {
  color: #07C160;
  font-weight: bold;
}

.tab-item.active .tab-count {
  color: #07C160;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 6rpx;
  background: #07C160;
  border-radius: 3rpx;
}

/* ===== 兑换入口 ===== */
.redeem-bar {
  display: flex;
  align-items: center;
  margin: 24rpx 24rpx 0;
  padding: 24rpx 28rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.redeem-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.redeem-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.redeem-arrow {
  font-size: 28rpx;
  color: #ccc;
}

/* ===== 加载状态 ===== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #E8E8E8;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}

/* ===== 优惠券列表 ===== */
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx;
}

/* ===== 优惠券卡片 — 撕裂效果 ===== */
.coupon-card {
  display: flex;
  align-items: stretch;
  border-radius: 16rpx;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  position: relative;
}

.coupon-card.coupon-expiring {
  background: #FFF5F5;
}

.coupon-card.coupon-expiring .coupon-right {
  background: #FFF5F5;
}

/* 左侧彩色区域 — 30% */
.coupon-left {
  width: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 16rpx;
  position: relative;
}

.coupon-amount-row {
  display: flex;
  align-items: flex-end;
}

.coupon-symbol {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 6rpx;
}

.coupon-amount {
  font-size: 72rpx;
  font-weight: bold;
  color: #fff;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  line-height: 1;
}

.coupon-discount {
  font-size: 56rpx;
  font-weight: bold;
  color: #fff;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  line-height: 1;
}

.coupon-energy-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

.coupon-unit {
  font-size: 28rpx;
  color: #fff;
  margin-bottom: 8rpx;
  margin-left: 4rpx;
}

.coupon-condition {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
}

/* 撕裂线 — 虚线 + 半圆缺口 */
.coupon-tear {
  position: relative;
  width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
}

.tear-line {
  width: 0;
  height: 100%;
  border-left: 2rpx dashed rgba(0, 0, 0, 0.1);
  flex: 1;
}

.tear-dot {
  width: 24rpx;
  height: 12rpx;
  background: #F6F7FB;
  position: absolute;
}

.coupon-card.coupon-expiring .tear-dot {
  background: #FFF5F5;
}

.tear-dot-top {
  top: 0;
  border-radius: 0 0 12rpx 12rpx;
}

.tear-dot-bottom {
  bottom: 0;
  border-radius: 12rpx 12rpx 0 0;
}

/* 右侧白色区域 — 70% */
.coupon-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28rpx 24rpx;
  position: relative;
  background: #fff;
  min-height: 160rpx;
}

.coupon-card.coupon-disabled .coupon-right {
  background: #FAFAFA;
}

.coupon-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 6rpx;
}

.coupon-card.coupon-disabled .coupon-name {
  color: #999;
}

.coupon-scope {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 6rpx;
}

.coupon-validity {
  font-size: 20rpx;
  color: #bbb;
}

/* 即将过期标签 */
.expiring-tag {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
}

.expiring-text {
  font-size: 18rpx;
  color: #FF4D4F;
  background: #FFF1F0;
  border: 1rpx solid #FFCCC7;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}

/* 立即使用按钮 */
.coupon-use-btn {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
}

.use-btn-text {
  font-size: 24rpx;
  color: #fff;
  font-weight: bold;
  background: linear-gradient(135deg, #07C160, #06AD56);
  padding: 12rpx 28rpx;
  border-radius: 28rpx;
}

/* 水印印章效果 */
.stamp-overlay {
  position: absolute;
  top: 50%;
  right: 24rpx;
  transform: translateY(-50%) rotate(-15deg);
  pointer-events: none;
}

.stamp-text {
  font-size: 40rpx;
  font-weight: bold;
  letter-spacing: 8rpx;
  padding: 8rpx 20rpx;
  border: 4rpx solid;
  border-radius: 8rpx;
  opacity: 0.25;
}

.stamp-used {
  color: #999;
  border-color: #999;
}

.stamp-expired {
  color: #bbb;
  border-color: #bbb;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 160rpx 48rpx 0;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.empty-action {
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 32rpx;
  padding: 16rpx 48rpx;
}

.empty-action-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

/* ===== 兑换码弹窗 ===== */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog-box {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 36rpx;
}

.dialog-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 32rpx;
}

.dialog-input {
  width: 100%;
  height: 88rpx;
  background: #F6F7FB;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.dialog-placeholder {
  color: #ccc;
}

.dialog-actions {
  display: flex;
  gap: 24rpx;
  margin-top: 36rpx;
}

.dialog-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 40rpx;
}

.dialog-btn-cancel {
  background: #F6F7FB;
}

.dialog-btn-confirm {
  background: linear-gradient(135deg, #07C160, #06AD56);
}

.dialog-btn-confirm.btn-disabled {
  opacity: 0.5;
}

.dialog-btn-text {
  font-size: 28rpx;
  font-weight: bold;
}

.cancel-text {
  color: #666;
}

.confirm-text {
  color: #fff;
}
</style>
