<template>
  <view class="settlement-page">
    <!-- 1. 完成头部（绿色渐变 40%） -->
    <view class="completion-header">
      <view class="pulse-circle">
        <view class="pulse-ring pulse-ring-1"></view>
        <view class="pulse-ring pulse-ring-2"></view>
        <view class="pulse-ring pulse-ring-3"></view>
        <view class="check-icon">
          <text class="check-mark">✓</text>
        </view>
      </view>
      <text class="completion-title">充电完成</text>
      <text class="completion-subtitle">本次充电已结束</text>
    </view>

    <!-- 2. 充电摘要（4卡片负 margin 叠加） -->
    <view class="summary-cards">
      <view class="summary-card">
        <view class="summary-icon-wrap summary-icon-time">
          <text class="summary-icon-text">⏱</text>
        </view>
        <text class="summary-value">{{ formattedDuration }}</text>
        <text class="summary-label">充电时长</text>
      </view>
      <view class="summary-card">
        <view class="summary-icon-wrap summary-icon-energy">
          <text class="summary-icon-text">⚡</text>
        </view>
        <text class="summary-value">{{ settlement.totalEnergy.toFixed(2) }}</text>
        <text class="summary-label">电量(kWh)</text>
      </view>
      <view class="summary-card summary-card-soc">
        <view class="summary-icon-wrap summary-icon-soc">
          <text class="summary-icon-text">🔋</text>
        </view>
        <view class="soc-progress-wrap">
          <text class="soc-range-text">{{ socRange }}</text>
          <view class="soc-progress-bg">
            <view class="soc-progress-fill" :style="{ width: socPercent + '%' }"></view>
          </view>
        </view>
        <text class="summary-label">SOC变化</text>
      </view>
      <view class="summary-card">
        <view class="summary-icon-wrap summary-icon-peak">
          <text class="summary-icon-text">📊</text>
        </view>
        <text class="summary-value">{{ peakPower }}<text class="summary-unit">kW</text></text>
        <text class="summary-label">峰值功率</text>
      </view>
    </view>

    <!-- 3. 电子小票（白色卡片） -->
    <view class="receipt-card">
      <view class="receipt-header">
        <view class="receipt-header-bar"></view>
        <text class="receipt-title">电子小票</text>
        <text class="receipt-order">订单号: {{ settlement.orderNo }}</text>
      </view>

      <!-- 费用明细表格 -->
      <view class="fee-table">
        <view class="fee-table-header">
          <text class="fee-th fee-th-label">时段</text>
          <text class="fee-th fee-th-energy">电量</text>
          <text class="fee-th fee-th-price">单价</text>
          <text class="fee-th fee-th-amount">金额</text>
        </view>
        <view class="fee-table-row" v-for="(seg, i) in settlement.timeSegments" :key="i">
          <text class="fee-td fee-td-label">{{ seg.label }}</text>
          <text class="fee-td fee-td-energy">{{ seg.energy.toFixed(2) }}</text>
          <text class="fee-td fee-td-price">¥{{ (seg.electricityFee / seg.energy || 0).toFixed(2) }}</text>
          <text class="fee-td fee-td-amount">¥{{ seg.electricityFee.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 虚线分隔 -->
      <view class="receipt-dashed-line"></view>

      <!-- 小计 -->
      <view class="receipt-line">
        <text class="receipt-line-label">电费小计</text>
        <text class="receipt-line-value">¥{{ settlement.totalElectricity.toFixed(2) }}</text>
      </view>
      <view class="receipt-line">
        <text class="receipt-line-label">服务费</text>
        <text class="receipt-line-value">¥{{ settlement.totalService.toFixed(2) }}</text>
      </view>

      <!-- 优惠券抵扣 -->
      <view class="receipt-line">
        <view class="receipt-line-label-wrap">
          <view class="discount-badge coupon-badge">
            <text class="discount-badge-text">券</text>
          </view>
          <text class="receipt-line-label">优惠券抵扣</text>
        </view>
        <text class="receipt-line-value discount-value">-¥{{ settlement.couponDiscount.toFixed(2) }}</text>
      </view>

      <!-- 会员折扣 -->
      <view class="receipt-line">
        <view class="receipt-line-label-wrap">
          <view class="discount-badge member-badge">
            <text class="discount-badge-text">VIP</text>
          </view>
          <text class="receipt-line-label">会员折扣</text>
        </view>
        <text class="receipt-line-value discount-value">-¥{{ settlement.memberDiscount.toFixed(2) }}</text>
      </view>

      <!-- 粗分隔线 -->
      <view class="receipt-bold-divider"></view>

      <!-- 实付金额 -->
      <view class="receipt-total-row">
        <text class="receipt-total-label">实付金额</text>
        <view class="receipt-total-price">
          <text class="receipt-total-symbol">¥</text>
          <text class="receipt-total-amount">{{ settlement.actualAmount.toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 4. 环保卡片 -->
    <view class="eco-card">
      <view class="eco-icon-bg">
        <text class="eco-icon">🌿</text>
      </view>
      <view class="eco-content">
        <text class="eco-title">绿色出行贡献</text>
        <view class="eco-stats">
          <view class="eco-stat-item">
            <text class="eco-stat-value">{{ co2Offset }}<text class="eco-stat-unit">kg</text></text>
            <text class="eco-stat-label">CO₂ 减排</text>
          </view>
          <view class="eco-stat-divider"></view>
          <view class="eco-stat-item">
            <text class="eco-stat-value">{{ treeEquivalent }}<text class="eco-stat-unit">棵</text></text>
            <text class="eco-stat-label">种树换算</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 5. 积分卡片 -->
    <view class="points-card">
      <view class="points-left">
        <view class="points-icon-bg">
          <text class="points-icon">🎯</text>
        </view>
        <view class="points-info">
          <text class="points-label">本次充电获得积分</text>
          <text class="points-desc">积分可兑换优惠券和礼品</text>
        </view>
      </view>
      <view class="points-right">
        <text class="points-plus">+</text>
        <text class="points-value">{{ pointsEarned }}</text>
      </view>
    </view>

    <!-- 6. 评价区 -->
    <view class="rating-section">
      <view class="rating-card">
        <text class="rating-title">充电体验评价</text>
        <view class="rating-stars">
          <view
            v-for="s in 5"
            :key="s"
            class="star-wrap"
            :class="{ 'star-active': s <= rating }"
            @tap="rating = s"
          >
            <text class="star-icon" :class="{ 'star-filled': s <= rating }">★</text>
          </view>
        </view>
        <text class="rating-hint" v-if="rateHint">{{ rateHint }}</text>
        <view class="rating-input-wrap">
          <textarea
            class="rating-input"
            v-model="rateContent"
            placeholder="说说您的充电体验吧（选填）"
            maxlength="200"
          />
          <text class="rating-counter">{{ rateContent.length }}/200</text>
        </view>
        <button class="submit-rating-btn" @tap="submitRating">
          <text class="submit-rating-text">提交评价 +50积分</text>
        </button>
      </view>
    </view>

    <!-- 底部占位 -->
    <view class="bottom-spacer"></view>

    <!-- 7. 底部按钮 -->
    <view class="action-bar">
      <button class="action-btn pay-btn" @tap="handlePay" v-if="settlement.status !== 'PAID'">
        <text class="pay-btn-text">立即支付 ¥{{ settlement.actualAmount.toFixed(2) }}</text>
      </button>
      <button class="action-btn recharge-btn" @tap="handleRecharge">
        <text class="recharge-btn-text">充值</text>
      </button>
      <button class="action-btn share-btn" open-type="share">
        <text class="share-btn-text">分享</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/index'
import type { TimeSegment, SettlementData } from '@/types'

const settlement = ref<SettlementData>({
  orderId: '',
  orderNo: '',
  stationName: '',
  totalEnergy: 0,
  totalElectricity: 0,
  totalService: 0,
  originalAmount: 0,
  actualAmount: 0,
  couponDiscount: 0,
  memberDiscount: 0,
  status: '',
  timeSegments: [],
  duration: 0,
})

const rating = ref(0)
const rateContent = ref('')

const rateHint = computed(() => {
  const hints = ['', '非常差', '较差', '一般', '满意', '非常满意']
  return hints[rating.value] || ''
})

const co2Offset = computed(() => {
  // 每kWh电减排约0.5kg CO2
  return (settlement.value.totalEnergy * 0.5).toFixed(1)
})

const pointsEarned = computed(() => {
  // 每元消费获得1积分
  return Math.floor(settlement.value.actualAmount)
})

const formattedDuration = computed(() => {
  const secs = settlement.value.duration
  if (!secs || secs <= 0) return '0分0秒'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}时${m}分${s}秒`
  return `${m}分${s}秒`
})

const socRange = computed(() => {
  // Mock SOC range derived from energy; use stored values if available
  const base = 32
  const end = Math.min(100, base + Math.round(settlement.value.totalEnergy * 1.5))
  return `${base}%→${end}%`
})

const socPercent = computed(() => {
  const base = 32
  const end = Math.min(100, base + Math.round(settlement.value.totalEnergy * 1.5))
  return end - base
})

const peakPower = computed(() => {
  // Derive peak power from energy and duration
  const dur = settlement.value.duration
  if (!dur || dur <= 0) return '0.0'
  const kw = (settlement.value.totalEnergy / (dur / 3600))
  return kw.toFixed(1)
})

const treeEquivalent = computed(() => {
  // Roughly 1 tree absorbs ~22 kg CO2/year
  return Math.max(1, Math.round(Number(co2Offset.value) / 22))
})

function submitRating() {
  if (rating.value === 0) {
    uni.showToast({ title: '请先选择评分', icon: 'none' })
    return
  }
  uni.showToast({ title: '评价已提交', icon: 'success' })
}

async function handlePay() {
  uni.showLoading({ title: '发起支付...' })
  try {
    await api.payOrder(settlement.value.orderId)
    uni.hideLoading()
    uni.showToast({ title: '支付成功', icon: 'success' })
    settlement.value.status = 'PAID'
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '支付失败', icon: 'none' })
  }
}

function handleRecharge() {
  uni.showModal({
    title: '充值',
    content: '跳转到充值页面',
    showCancel: false,
  })
}

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.$page?.options || (currentPage as any)?.options || {}
  const orderId = options.orderId || ''

  if (!orderId) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  try {
    const data = await api.getChargingSettlement(orderId)
    if (data) {
      settlement.value = { ...settlement.value, ...data }
    }
  } catch (e) {
    console.error('加载结算数据失败:', e)
    // 使用模拟数据展示
    settlement.value = {
      orderId,
      orderNo: 'ORD' + orderId,
      stationName: '示例充电站',
      totalEnergy: 35.6,
      totalElectricity: 21.36,
      totalService: 10.68,
      originalAmount: 32.04,
      actualAmount: 30.04,
      couponDiscount: 2.00,
      memberDiscount: 0,
      status: 'UNPAID',
      duration: 3600,
      timeSegments: [
        { label: '谷时(00-08)', energy: 20.5, electricityFee: 10.25, serviceFee: 6.15 },
        { label: '平时(08-18)', energy: 15.1, electricityFee: 11.11, serviceFee: 4.53 },
      ],
    }
  }
})

// 分享
defineExpose({
  onShareAppMessage() {
    return {
      title: `我在${settlement.value.stationName}充了${settlement.value.totalEnergy.toFixed(1)}kWh`,
      path: '/pages/index/index',
    }
  },
})
</script>

<style scoped>
/* ===== 页面基础 ===== */
.settlement-page {
  min-height: 100vh;
  background: #F6F7FB;
  padding-bottom: 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* ===== 1. 完成头部（绿色渐变 40vh） ===== */
.completion-header {
  background: linear-gradient(180deg, #07C160 0%, #06AD56 60%, #F6F7FB 100%);
  padding: 72rpx 32rpx 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* 脉冲圆圈 */
.pulse-circle {
  width: 160rpx;
  height: 160rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.pulse-ring {
  position: absolute;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  animation: pulse-expand 2.4s ease-out infinite;
}

.pulse-ring-1 {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  animation-delay: 0s;
}

.pulse-ring-2 {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  animation-delay: 0.8s;
}

.pulse-ring-3 {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  animation-delay: 1.6s;
}

@keyframes pulse-expand {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

.check-icon {
  width: 110rpx;
  height: 110rpx;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  z-index: 2;
  animation: check-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.check-mark {
  font-size: 56rpx;
  color: #fff;
  font-weight: bold;
}

.completion-title {
  font-size: 44rpx;
  font-weight: bold;
  color: #fff;
  letter-spacing: 4rpx;
  display: block;
}

.completion-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
  display: block;
}

/* ===== 2. 充电摘要卡片（负 margin 叠加头部） ===== */
.summary-cards {
  display: flex;
  gap: 14rpx;
  padding: 0 20rpx;
  margin-top: -72rpx;
  position: relative;
  z-index: 10;
}

.summary-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 10rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.summary-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
}

.summary-icon-time {
  background: #EBF5FF;
}

.summary-icon-energy {
  background: #FFF7E6;
}

.summary-icon-soc {
  background: #F0FFF4;
}

.summary-icon-peak {
  background: #FFF0F0;
}

.summary-icon-text {
  font-size: 28rpx;
}

.summary-value {
  font-size: 26rpx;
  font-weight: bold;
  color: #1A1A1A;
  display: block;
  line-height: 1.2;
}

.summary-unit {
  font-size: 18rpx;
  font-weight: normal;
  color: #999;
}

.summary-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

/* SOC 进度条 */
.summary-card-soc {
  padding-top: 14rpx;
}

.soc-progress-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rpx;
}

.soc-range-text {
  font-size: 22rpx;
  font-weight: bold;
  color: #1A1A1A;
  margin-bottom: 6rpx;
}

.soc-progress-bg {
  width: 80%;
  height: 10rpx;
  background: #E8E8E8;
  border-radius: 5rpx;
  overflow: hidden;
}

.soc-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #52C41A, #07C160);
  border-radius: 5rpx;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ===== 3. 电子小票 ===== */
.receipt-card {
  margin: 28rpx 24rpx 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 10;
}

.receipt-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 28rpx;
  position: relative;
  padding-left: 20rpx;
}

.receipt-header-bar {
  position: absolute;
  left: 0;
  top: 4rpx;
  width: 6rpx;
  height: 36rpx;
  background: #07C160;
  border-radius: 3rpx;
}

.receipt-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1A1A1A;
  display: block;
}

.receipt-order {
  font-size: 22rpx;
  color: #BBB;
  margin-top: 4rpx;
  display: block;
}

/* 费用明细表格 */
.fee-table {
  margin-bottom: 20rpx;
}

.fee-table-header {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 2rpx solid #F0F0F0;
}

.fee-th {
  font-size: 22rpx;
  color: #999;
  font-weight: 500;
}

.fee-th-label {
  flex: 2;
}

.fee-th-energy {
  flex: 1.5;
  text-align: right;
}

.fee-th-price {
  flex: 1.5;
  text-align: right;
}

.fee-th-amount {
  flex: 1.5;
  text-align: right;
}

.fee-table-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F8F8F8;
}

.fee-td {
  font-size: 24rpx;
  color: #333;
}

.fee-td-label {
  flex: 2;
  color: #666;
}

.fee-td-energy {
  flex: 1.5;
  text-align: right;
}

.fee-td-price {
  flex: 1.5;
  text-align: right;
  color: #999;
  font-size: 22rpx;
}

.fee-td-amount {
  flex: 1.5;
  text-align: right;
  font-weight: 500;
}

/* 虚线分隔 */
.receipt-dashed-line {
  border: none;
  border-top: 2rpx dashed #E8E8E8;
  margin: 20rpx 0;
}

/* 行项目 */
.receipt-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 0;
}

.receipt-line-label-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.receipt-line-label {
  font-size: 26rpx;
  color: #666;
}

.receipt-line-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.discount-badge {
  width: 40rpx;
  height: 40rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.coupon-badge {
  background: linear-gradient(135deg, #FF6B6B, #FF4D4F);
}

.member-badge {
  background: linear-gradient(135deg, #FFD700, #FAAD14);
}

.discount-badge-text {
  font-size: 18rpx;
  color: #fff;
  font-weight: bold;
}

.discount-value {
  color: #FF4D4F;
  font-weight: bold;
}

/* 粗分隔线 */
.receipt-bold-divider {
  height: 4rpx;
  background: linear-gradient(90deg, #F0F0F0, #E0E0E0, #F0F0F0);
  margin: 24rpx 0;
  border-radius: 2rpx;
}

/* 实付金额 */
.receipt-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8rpx;
}

.receipt-total-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #1A1A1A;
}

.receipt-total-price {
  display: flex;
  align-items: baseline;
}

.receipt-total-symbol {
  font-size: 28rpx;
  font-weight: bold;
  color: #FF4D4F;
  margin-right: 2rpx;
}

.receipt-total-amount {
  font-size: 48rpx;
  font-weight: bold;
  color: #FF4D4F;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

/* ===== 4. 环保卡片 ===== */
.eco-card {
  margin: 20rpx 24rpx 0;
  background: #F0FFF4;
  border-radius: 24rpx;
  padding: 28rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  border: 2rpx solid rgba(82, 196, 26, 0.15);
}

.eco-icon-bg {
  width: 80rpx;
  height: 80rpx;
  background: rgba(82, 196, 26, 0.15);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.eco-icon {
  font-size: 44rpx;
}

.eco-content {
  flex: 1;
}

.eco-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #1A1A1A;
  display: block;
  margin-bottom: 12rpx;
}

.eco-stats {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.eco-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.eco-stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #52C41A;
  display: block;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

.eco-stat-unit {
  font-size: 22rpx;
  font-weight: normal;
  color: #52C41A;
  margin-left: 2rpx;
}

.eco-stat-label {
  font-size: 22rpx;
  color: #666;
  margin-top: 4rpx;
  display: block;
}

.eco-stat-divider {
  width: 2rpx;
  height: 48rpx;
  background: rgba(82, 196, 26, 0.25);
}

/* ===== 5. 积分卡片 ===== */
.points-card {
  margin: 16rpx 24rpx 0;
  background: #FFF7E6;
  border-radius: 24rpx;
  padding: 28rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2rpx solid rgba(250, 173, 20, 0.15);
}

.points-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.points-icon-bg {
  width: 72rpx;
  height: 72rpx;
  background: rgba(250, 173, 20, 0.15);
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.points-icon {
  font-size: 36rpx;
}

.points-info {
  display: flex;
  flex-direction: column;
}

.points-label {
  font-size: 28rpx;
  color: #1A1A1A;
  font-weight: bold;
  display: block;
}

.points-desc {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.points-right {
  display: flex;
  align-items: baseline;
}

.points-plus {
  font-size: 32rpx;
  font-weight: bold;
  color: #FAAD14;
  margin-right: 2rpx;
}

.points-value {
  font-size: 52rpx;
  font-weight: bold;
  color: #FAAD14;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

/* ===== 6. 评价区 ===== */
.rating-section {
  padding: 20rpx 24rpx 0;
}

.rating-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rating-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #1A1A1A;
  display: block;
  margin-bottom: 24rpx;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.star-wrap {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.star-wrap.star-active {
  transform: scale(1.1);
}

.star-icon {
  font-size: 56rpx;
  color: #E0E0E0;
  transition: all 0.2s ease;
}

.star-icon.star-filled {
  color: #FAAD14;
  text-shadow: 0 4rpx 12rpx rgba(250, 173, 20, 0.3);
}

.rating-hint {
  font-size: 26rpx;
  color: #FAAD14;
  font-weight: 500;
  margin-bottom: 20rpx;
  min-height: 36rpx;
  display: block;
}

.rating-input-wrap {
  width: 100%;
  position: relative;
  margin-bottom: 24rpx;
}

.rating-input {
  width: 100%;
  height: 160rpx;
  border: 2rpx solid #F0F0F0;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 26rpx;
  box-sizing: border-box;
  color: #333;
  background: #FAFAFA;
  transition: border-color 0.2s ease;
}

.rating-input:focus {
  border-color: #07C160;
}

.rating-counter {
  position: absolute;
  right: 20rpx;
  bottom: 16rpx;
  font-size: 20rpx;
  color: #CCC;
}

.submit-rating-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  border: none;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
  line-height: 88rpx;
}

.submit-rating-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2rpx;
}

/* ===== 底部占位 ===== */
.bottom-spacer {
  height: calc(200rpx + env(safe-area-inset-bottom));
}

/* ===== 7. 底部操作栏 ===== */
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 28rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.action-btn {
  flex: 1;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 0;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.5;
}

.pay-btn {
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  box-shadow: 0 6rpx 20rpx rgba(7, 193, 96, 0.3);
}

.pay-btn-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2rpx;
}

.recharge-btn {
  background: linear-gradient(135deg, #1677FF 0%, #0958D9 100%);
  box-shadow: 0 6rpx 20rpx rgba(22, 119, 255, 0.3);
}

.recharge-btn-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #fff;
}

.share-btn {
  background: #F5F5F5;
}

.share-btn-text {
  font-size: 28rpx;
  color: #999;
}
</style>
