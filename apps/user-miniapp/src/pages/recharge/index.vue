<template>
  <view class="recharge-page" v-if="!showSuccess">
    <!-- 当前余额 -->
    <view class="current-balance">
      <text class="balance-label">当前余额</text>
      <text class="balance-value">¥{{ currentBalance.toFixed(2) }}</text>
    </view>

    <!-- 充值档位 -->
    <view class="section">
      <text class="section-title">选择充值金额</text>
      <view class="tier-grid">
        <view
          v-for="tier in fixedTiers"
          :key="tier.amount"
          class="tier-card"
          :class="{ active: selectedAmount === tier.amount }"
          @tap="selectTier(tier)"
        >
          <!-- 角标 -->
          <view class="tier-badge" v-if="tier.badge" :class="tier.badgeType">
            <text class="tier-badge-text">{{ tier.badge }}</text>
          </view>
          <text class="tier-amount">¥{{ tier.amount }}</text>
          <text class="tier-desc">{{ tier.desc }}</text>
          <text class="tier-gift" v-if="tier.gift > 0">送¥{{ tier.gift }}</text>
        </view>
      </view>

      <!-- 自定义金额 -->
      <view class="custom-row">
        <text class="custom-label">自定义金额</text>
        <view class="custom-input-wrap">
          <text class="custom-input-prefix">¥</text>
          <input
            class="custom-input"
            type="digit"
            placeholder="输入充值金额"
            :value="customAmount"
            @input="onCustomInput"
            @focus="onCustomFocus"
          />
        </view>
      </view>
    </view>

    <!-- 赠送明细 -->
    <view class="gift-section" v-if="actualAmount > 0">
      <text class="gift-section-title">充值赠送明细</text>
      <view class="gift-row">
        <text class="gift-label">充值金额</text>
        <text class="gift-value">¥{{ actualAmount.toFixed(2) }}</text>
      </view>
      <view class="gift-row" v-if="giftDetail.giftAmount > 0">
        <text class="gift-label">赠送金额</text>
        <text class="gift-value gift-red">+¥{{ giftDetail.giftAmount.toFixed(2) }}</text>
      </view>
      <view class="gift-row" v-if="giftDetail.couponCount > 0">
        <text class="gift-label">赠送优惠券</text>
        <text class="gift-value gift-red">{{ giftDetail.couponCount }} 张</text>
      </view>
      <view class="gift-row" v-if="giftDetail.points > 0">
        <text class="gift-label">赠送积分</text>
        <text class="gift-value gift-red">+{{ giftDetail.points }}</text>
      </view>
      <view class="gift-row total">
        <text class="gift-label">到账金额</text>
        <text class="gift-value total-value">¥{{ totalArrival.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 支付方式 -->
    <view class="section pay-section">
      <text class="section-title">支付方式</text>
      <view class="pay-method">
        <view class="pay-icon-wrap">
          <text class="pay-icon-wechat">微</text>
        </view>
        <text class="pay-name">微信支付</text>
        <view class="pay-check">
          <text class="pay-check-icon">✓</text>
        </view>
      </view>
    </view>

    <!-- 充值协议 -->
    <view class="agreement-row">
      <view class="agreement-check" :class="{ checked: agreed }" @tap="agreed = !agreed">
        <text class="agreement-check-icon" v-if="agreed">✓</text>
      </view>
      <text class="agreement-text">
        我已阅读并同意
        <text class="agreement-link" @tap.stop="openAgreement">《充值服务协议》</text>
      </text>
    </view>

    <!-- 底部确认栏 -->
    <view class="bottom-bar">
      <button
        class="confirm-btn"
        :class="{ disabled: !canSubmit }"
        :disabled="!canSubmit"
        @tap="handleRecharge"
      >
        <text v-if="submitting" class="btn-loading">充值中...</text>
        <text v-else>确认充值 ¥{{ actualAmount > 0 ? actualAmount.toFixed(2) : '0.00' }}</text>
      </button>
    </view>
  </view>

  <!-- 充值成功页 -->
  <view class="success-page" v-else>
    <!-- 金币撒落动画 -->
    <view class="confetti-container">
      <view
        v-for="(p, i) in confettiParticles"
        :key="i"
        class="confetti-particle"
        :style="{
          left: p.left + '%',
          animationDelay: p.delay + 's',
          animationDuration: p.duration + 's',
          backgroundColor: p.color,
          width: p.size + 'rpx',
          height: p.shape === 'circle' ? p.size + 'rpx' : p.size * 1.8 + 'rpx',
          borderRadius: p.shape === 'circle' ? '50%' : '4rpx',
        }"
      />
    </view>

    <view class="success-content">
      <!-- 成功图标 -->
      <view class="success-icon-wrap">
        <text class="success-icon">✓</text>
      </view>

      <text class="success-title">充值成功！</text>
      <text class="success-balance">余额 ¥{{ newBalance.toFixed(2) }}</text>

      <!-- 赠送到账提示 -->
      <view class="success-gifts">
        <view class="success-gift-item" v-if="giftDetail.giftAmount > 0">
          <text class="success-gift-icon">💰</text>
          <text class="success-gift-text">赠送 ¥{{ giftDetail.giftAmount.toFixed(2) }} 已到账</text>
        </view>
        <view class="success-gift-item" v-if="giftDetail.couponCount > 0">
          <text class="success-gift-icon">🎫</text>
          <text class="success-gift-text">{{ giftDetail.couponCount }} 张优惠券已放入卡包</text>
        </view>
        <view class="success-gift-item" v-if="giftDetail.points > 0">
          <text class="success-gift-icon">⭐</text>
          <text class="success-gift-text">{{ giftDetail.points }} 积分已到账</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="success-actions">
        <button class="success-btn primary" @tap="goCharging">去充电</button>
        <button class="success-btn secondary" @tap="goWallet">查看余额</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/index'

interface RechargeTier {
  amount: number
  gift: number
  couponCount: number
  points: number
  desc: string
  badge?: string
  badgeType?: 'recommend' | 'best'
}

interface GiftDetail {
  giftAmount: number
  couponCount: number
  points: number
}

interface ConfettiParticle {
  left: number
  delay: number
  duration: number
  color: string
  size: number
  shape: 'circle' | 'rect'
}

const currentBalance = ref(0)
const selectedAmount = ref(100)
const customAmount = ref('')
const submitting = ref(false)
const agreed = ref(false)
const showSuccess = ref(false)
const newBalance = ref(0)
const confettiParticles = ref<ConfettiParticle[]>([])

const fixedTiers: RechargeTier[] = [
  { amount: 50, gift: 0, couponCount: 0, points: 50, desc: '基础档' },
  { amount: 100, gift: 5, couponCount: 1, points: 100, desc: '送¥5', badge: '推荐', badgeType: 'recommend' },
  { amount: 200, gift: 15, couponCount: 2, points: 200, desc: '送¥15', badge: '超值', badgeType: 'recommend' },
  { amount: 500, gift: 50, couponCount: 5, points: 500, desc: '送¥50', badge: '最划算', badgeType: 'best' },
]

const actualAmount = computed(() => {
  if (selectedAmount.value > 0) return selectedAmount.value
  const val = parseFloat(customAmount.value)
  return isNaN(val) || val <= 0 ? 0 : Math.floor(val * 100) / 100
})

const giftDetail = computed<GiftDetail>(() => {
  if (actualAmount.value <= 0) return { giftAmount: 0, couponCount: 0, points: 0 }
  // 匹配固定档位
  const tier = fixedTiers.find(t => t.amount === actualAmount.value)
  if (tier) return { giftAmount: tier.gift, couponCount: tier.couponCount, points: tier.points }
  // 自定义金额阶梯赠送
  const amt = actualAmount.value
  let giftRate = 0
  let couponCount = 0
  let pointRate = 0
  if (amt >= 500) {
    giftRate = 0.1; couponCount = 5; pointRate = 1
  } else if (amt >= 200) {
    giftRate = 0.075; couponCount = 2; pointRate = 1
  } else if (amt >= 100) {
    giftRate = 0.05; couponCount = 1; pointRate = 1
  } else {
    giftRate = 0; couponCount = 0; pointRate = 1
  }
  return {
    giftAmount: Math.floor(amt * giftRate),
    couponCount,
    points: Math.floor(amt * pointRate),
  }
})

const totalArrival = computed(() => actualAmount.value + giftDetail.value.giftAmount)

const canSubmit = computed(() => actualAmount.value > 0 && agreed.value && !submitting.value)

function selectTier(tier: RechargeTier) {
  selectedAmount.value = tier.amount
  customAmount.value = ''
}

function onCustomInput(e: any) {
  customAmount.value = e.detail.value
  if (e.detail.value) {
    selectedAmount.value = 0
  }
}

function onCustomFocus() {
  selectedAmount.value = 0
}

function openAgreement() {
  uni.navigateTo({ url: '/pages/webview/index?url=recharge-agreement' })
}

function generateConfetti() {
  const colors = ['#FFD700', '#FFA500', '#FF8C00', '#FFE44D', '#FFC107', '#E6A817', '#DAA520', '#F0C420']
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < 50; i++) {
    particles.push({
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 12 + Math.floor(Math.random() * 16),
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    })
  }
  confettiParticles.value = particles
}

async function loadBalance() {
  try {
    const data = await api.getUserInfo()
    currentBalance.value = data.balance
  } catch {
    try {
      const wallet = await api.getWallet()
      currentBalance.value = (wallet.balance || 0) / 100
    } catch {
      // silent
    }
  }
}

async function handleRecharge() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const res = await api.recharge({ amount: actualAmount.value })
    // 微信支付调用
    if (res && res.payParams) {
      await new Promise<void>((resolve, reject) => {
        uni.requestPayment({
          ...res.payParams,
          provider: 'wxpay',
          success: () => resolve(),
          fail: (err: any) => reject(err),
        })
      })
    }
    // 支付成功
    const updated = await api.getUserInfo()
    newBalance.value = updated.balance
    currentBalance.value = updated.balance
    showSuccess.value = true
    generateConfetti()
  } catch (error: any) {
    if (error?.errMsg && error.errMsg.includes('cancel')) {
      // 用户取消支付，不提示
      return
    }
    uni.showToast({ title: '充值失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function goCharging() {
  uni.switchTab({ url: '/pages/map/index' })
}

function goWallet() {
  uni.navigateBack()
}

onMounted(() => {
  loadBalance()
  // 支持从钱包页带预选金额跳转
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as any
  const amount = current?.options?.amount
  if (amount) {
    const parsed = Number(amount)
    const matched = fixedTiers.find(t => t.amount === parsed)
    if (matched) {
      selectedAmount.value = parsed
    } else {
      selectedAmount.value = 0
      customAmount.value = String(parsed)
    }
  }
})
</script>

<style scoped>
/* ===== 充值页面 ===== */
.recharge-page {
  padding: 24rpx;
  padding-bottom: 180rpx;
  background: #F6F7FB;
  min-height: 100vh;
}

.current-balance {
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 20rpx;
  padding: 36rpx 32rpx;
  color: #fff;
  margin-bottom: 24rpx;
}

.balance-label {
  font-size: 24rpx;
  opacity: 0.85;
}

.balance-value {
  font-size: 52rpx;
  font-weight: bold;
  display: block;
  margin-top: 8rpx;
  font-family: 'DIN Alternate', monospace;
}

.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

/* ===== 充值档位 ===== */
.tier-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.tier-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #F6F7FB;
  border-radius: 16rpx;
  padding: 32rpx 0 24rpx;
  border: 3rpx solid transparent;
  transition: all 0.2s;
}

.tier-card.active {
  border-color: #07C160;
  background: rgba(7, 193, 96, 0.06);
}

.tier-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4rpx 16rpx;
  border-radius: 0 16rpx 0 12rpx;
}

.tier-badge.recommend {
  background: linear-gradient(135deg, #FF6B35, #FF4D4F);
}

.tier-badge.best {
  background: linear-gradient(135deg, #FAAD14, #FF8C00);
}

.tier-badge-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: bold;
}

.tier-amount {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  font-family: 'DIN Alternate', monospace;
}

.tier-desc {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.tier-gift {
  font-size: 22rpx;
  color: #FF4D4F;
  margin-top: 4rpx;
  font-weight: 500;
}

/* ===== 自定义金额 ===== */
.custom-row {
  display: flex;
  align-items: center;
  margin-top: 28rpx;
  padding-top: 28rpx;
  border-top: 1rpx solid #f0f0f0;
}

.custom-label {
  font-size: 28rpx;
  color: #333;
  white-space: nowrap;
  margin-right: 20rpx;
}

.custom-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  height: 76rpx;
  border: 2rpx solid #E8E8E8;
  border-radius: 12rpx;
  padding: 0 20rpx;
  background: #FAFAFA;
}

.custom-input-prefix {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  margin-right: 8rpx;
}

.custom-input {
  flex: 1;
  height: 76rpx;
  font-size: 28rpx;
  color: #333;
}

/* ===== 赠送明细 ===== */
.gift-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.gift-section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.gift-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
}

.gift-row.total {
  padding-top: 20rpx;
  margin-top: 8rpx;
  border-top: 1rpx solid #f0f0f0;
}

.gift-label {
  font-size: 26rpx;
  color: #666;
}

.gift-value {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.gift-red {
  color: #FF4D4F;
}

.total-value {
  color: #07C160;
  font-size: 32rpx;
}

/* ===== 支付方式 ===== */
.pay-section {
  padding-bottom: 20rpx;
}

.pay-method {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
}

.pay-icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.pay-icon-wechat {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.pay-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.pay-check {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-check-icon {
  font-size: 24rpx;
  color: #fff;
}

/* ===== 充值协议 ===== */
.agreement-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  margin-bottom: 24rpx;
}

.agreement-check {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #ddd;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  transition: all 0.2s;
}

.agreement-check.checked {
  background: #07C160;
  border-color: #07C160;
}

.agreement-check-icon {
  font-size: 22rpx;
  color: #fff;
}

.agreement-text {
  font-size: 24rpx;
  color: #999;
}

.agreement-link {
  color: #07C160;
  font-weight: 500;
}

/* ===== 底部确认栏 ===== */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.confirm-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  color: #fff;
  font-size: 34rpx;
  font-weight: bold;
  border-radius: 48rpx;
  border: none;
  text-align: center;
}

.confirm-btn.disabled {
  background: #ccc;
  color: #999;
}

.btn-loading {
  font-size: 30rpx;
}

/* ===== 充值成功页 ===== */
.success-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #E8F8EE 0%, #F6F7FB 100%);
  position: relative;
  overflow: hidden;
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;
}

.confetti-particle {
  position: absolute;
  top: -40rpx;
  animation: confetti-fall linear forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-20rpx) rotate(0deg);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.success-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx 60rpx;
}

.success-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #07C160, #06AD56);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(7, 193, 96, 0.3);
}

.success-icon {
  font-size: 56rpx;
  color: #fff;
  font-weight: bold;
}

.success-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.success-balance {
  font-size: 52rpx;
  font-weight: bold;
  color: #07C160;
  font-family: 'DIN Alternate', monospace;
  margin-bottom: 40rpx;
}

.success-gifts {
  width: 100%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 60rpx;
}

.success-gift-item {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
}

.success-gift-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.success-gift-text {
  font-size: 28rpx;
  color: #333;
}

.success-actions {
  display: flex;
  gap: 24rpx;
  width: 100%;
}

.success-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: bold;
  text-align: center;
  border: none;
}

.success-btn.primary {
  background: linear-gradient(135deg, #07C160, #06AD56);
  color: #fff;
}

.success-btn.secondary {
  background: #fff;
  color: #07C160;
  border: 2rpx solid #07C160;
}
</style>
