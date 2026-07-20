<template>
  <view class="wallet-page">
    <!-- 顶部资产总览卡 -->
    <view class="asset-card">
      <view class="asset-card__glow" />
      <view class="asset-card__content">
        <view class="asset-card__header">
          <text class="asset-card__label">账户余额 (元)</text>
          <view class="asset-card__eye" @tap="toggleBalanceVisible">
            <text class="eye-icon">{{ balanceVisible ? '👁' : '🙈' }}</text>
          </view>
        </view>
        <view class="asset-card__balance-row">
          <text class="asset-card__symbol">¥</text>
          <text class="asset-card__balance">{{ balanceDisplay }}</text>
        </view>
        <view class="asset-card__recharge-btn" @tap="goRecharge">
          <text class="recharge-btn__text">充值</text>
        </view>
        <view class="asset-card__metrics">
          <view class="metric-item" @tap="goCoupons">
            <text class="metric-value">{{ wallet.couponCount }}</text>
            <text class="metric-label"> 张优惠券</text>
          </view>
          <view class="metric-divider" />
          <view class="metric-item" @tap="goPoints">
            <text class="metric-value">{{ wallet.points }}</text>
            <text class="metric-label"> 积分</text>
          </view>
          <view class="metric-divider" />
          <view class="metric-item">
            <text class="metric-value">¥{{ wallet.monthlySpend.toFixed(0) }}</text>
            <text class="metric-label"> 本月消费</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷充值区域 -->
    <view class="section recharge-section">
      <text class="section-title">快捷充值</text>
      <view class="recharge-grid">
        <view
          v-for="tier in rechargeTiers"
          :key="tier.amount"
          class="recharge-card"
          :class="{ 'recharge-card--selected': selectedTier === tier.amount }"
          @tap="selectTier(tier)"
        >
          <text class="recharge-card__amount">¥{{ tier.amount }}</text>
          <view v-if="tier.gift > 0" class="recharge-card__gift">
            <text class="gift-text">送¥{{ tier.gift }}</text>
          </view>
          <text v-if="tier.isCustom" class="recharge-card__custom-label">自定义</text>
        </view>
      </view>
    </view>

    <!-- 优惠活动横幅 -->
    <view class="section banner-section">
      <swiper
        class="banner-swiper"
        :autoplay="true"
        :interval="4000"
        :circular="true"
        :indicator-dots="true"
        indicator-color="rgba(255,255,255,0.4)"
        indicator-active-color="#FFFFFF"
      >
        <swiper-item v-for="(banner, idx) in promoBanners" :key="idx">
          <view class="banner-card" :style="{ background: banner.bg }">
            <view class="banner-left">
              <text class="banner-tag">{{ banner.tag }}</text>
              <text class="banner-title">{{ banner.title }}</text>
              <text class="banner-desc">{{ banner.desc }}</text>
            </view>
            <view class="banner-action" @tap="goRechargeWithAmount(banner.actionAmount)">
              <text class="banner-action-text">立即参与</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 最近交易记录 -->
    <view class="section transaction-section">
      <view class="section-header">
        <text class="section-title">最近交易</text>
        <view class="section-more" @tap="goTransactions">
          <text class="more-text">查看全部明细</text>
          <text class="more-arrow">›</text>
        </view>
      </view>

      <view v-if="loading" class="loading-state">
        <view class="loading-spinner" />
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="transactions.length > 0" class="tx-list">
        <view
          v-for="tx in transactions"
          :key="tx.id"
          class="tx-item"
        >
          <view class="tx-icon" :class="'tx-icon--' + tx.type">
            <text class="tx-icon-text">{{ getTxIcon(tx) }}</text>
          </view>
          <view class="tx-info">
            <text class="tx-desc">{{ tx.description }}</text>
            <text class="tx-time">{{ tx.time }}</text>
          </view>
          <text class="tx-amount" :class="tx.type === 'income' ? 'tx-amount--income' : 'tx-amount--expense'">
            {{ tx.type === 'income' ? '+' : '-' }}¥{{ tx.amount.toFixed(2) }}
          </text>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无交易记录</text>
      </view>
    </view>

    <view class="safe-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api, type Transaction } from '@/api/index'
import type { WalletInfo, RechargeTier, PromoBanner } from '@/types'

const loading = ref(false)
const balanceVisible = ref(false)
const selectedTier = ref<number | null>(null)

const wallet = reactive<WalletInfo>({
  balance: 0,
  couponCount: 0,
  points: 0,
  monthlySpend: 0,
})

const transactions = ref<Transaction[]>([])

const balanceDisplay = computed(() => {
  if (!balanceVisible.value) return '****'
  return wallet.balance.toFixed(2)
})

const rechargeTiers: RechargeTier[] = [
  { amount: 50, gift: 0 },
  { amount: 100, gift: 5 },
  { amount: 200, gift: 15 },
  { amount: 300, gift: 25 },
  { amount: 500, gift: 50 },
  { amount: 0, gift: 0, isCustom: true },
]

const promoBanners: PromoBanner[] = [
  {
    tag: '限时特惠',
    title: '充200送50',
    desc: '限时充值福利，多充多送',
    bg: 'linear-gradient(135deg, #07C160 0%, #06AD56 100%)',
    actionAmount: 200,
  },
  {
    tag: '新用户专享',
    title: '首充满100减20',
    desc: '新用户首次充值立享优惠',
    bg: 'linear-gradient(135deg, #FF6B35 0%, #FF4D4F 100%)',
    actionAmount: 100,
  },
  {
    tag: '会员日',
    title: '每周五充300送80',
    desc: '会员专属充值加赠活动',
    bg: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
    actionAmount: 300,
  },
]

function toggleBalanceVisible() {
  balanceVisible.value = !balanceVisible.value
}

function selectTier(tier: RechargeTier) {
  if (tier.isCustom) {
    goRecharge()
    return
  }
  selectedTier.value = tier.amount
  goRechargeWithAmount(tier.amount)
}

function getTxIcon(tx: Transaction): string {
  if (tx.icon) return tx.icon
  const categoryIcons: Record<string, string> = {
    recharge: '💰',
    charging: '⚡',
    refund: '↩️',
    coupon: '🎫',
    points: '⭐',
    income: '📥',
    expense: '📤',
  }
  return categoryIcons[tx.category] || (tx.type === 'income' ? '📥' : '📤')
}

async function loadWallet() {
  loading.value = true
  try {
    const [walletData, txData] = await Promise.all([
      api.getWallet(),
      api.getTransactions({ size: 5 }),
    ])
    wallet.balance = (walletData.balance || 0) / (walletData.balance > 10000 ? 100 : 1)
    wallet.couponCount = walletData.couponCount || 0
    wallet.points = walletData.points || 0
    wallet.monthlySpend = (walletData.monthlySpend || 0) / (walletData.monthlySpend > 10000 ? 100 : 1)
    transactions.value = txData
  } catch (error) {
    uni.showToast({ title: '加载钱包信息失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function goRecharge() {
  uni.navigateTo({ url: '/pages/recharge/index' })
}

function goRechargeWithAmount(amount: number) {
  uni.navigateTo({ url: `/pages/recharge/index?amount=${amount}` })
}

function goCoupons() {
  uni.navigateTo({ url: '/pages/coupon/index' })
}

function goPoints() {
  uni.navigateTo({ url: '/pages/points/index' })
}

function goTransactions() {
  uni.navigateTo({ url: '/pages/wallet/transactions' })
}

onMounted(() => {
  loadWallet()
})
</script>

<style scoped>
.wallet-page {
  min-height: 100vh;
  background: #F6F7FB;
  padding: 24rpx;
  padding-bottom: 0;
}

/* ==================== 资产总览卡 ==================== */
.asset-card {
  position: relative;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.asset-card__glow {
  position: absolute;
  top: -40rpx;
  right: -40rpx;
  width: 240rpx;
  height: 240rpx;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.asset-card__content {
  position: relative;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 50%, #059A4C 100%);
  padding: 40rpx 36rpx 32rpx;
  border-radius: 24rpx;
}

.asset-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.asset-card__label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
}

.asset-card__eye {
  padding: 8rpx;
}

.eye-icon {
  font-size: 32rpx;
}

.asset-card__balance-row {
  display: flex;
  align-items: baseline;
  margin-top: 16rpx;
  margin-bottom: 28rpx;
}

.asset-card__symbol {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-right: 4rpx;
}

.asset-card__balance {
  font-size: 72rpx;
  font-weight: bold;
  color: #FFFFFF;
  font-family: 'DIN Alternate', monospace;
  letter-spacing: 2rpx;
}

.asset-card__recharge-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(255, 255, 255, 0.7);
  border-radius: 36rpx;
  padding: 12rpx 48rpx;
  margin-bottom: 32rpx;
}

.recharge-btn__text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 600;
}

.asset-card__metrics {
  display: flex;
  align-items: center;
  padding-top: 24rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.metric-item {
  flex: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.metric-value {
  font-size: 30rpx;
  font-weight: bold;
  color: #FFFFFF;
  font-family: 'DIN Alternate', monospace;
}

.metric-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 4rpx;
}

.metric-divider {
  width: 1rpx;
  height: 32rpx;
  background: rgba(255, 255, 255, 0.25);
}

/* ==================== 通用 Section ==================== */
.section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-header .section-title {
  margin-bottom: 0;
}

.section-more {
  display: flex;
  align-items: center;
}

.more-text {
  font-size: 24rpx;
  color: #999999;
}

.more-arrow {
  font-size: 28rpx;
  color: #CCCCCC;
  margin-left: 4rpx;
}

/* ==================== 快捷充值 ==================== */
.recharge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.recharge-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #F6F7FB;
  border-radius: 12rpx;
  padding: 28rpx 0;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;
}

.recharge-card--selected {
  border-color: #07C160;
  background: rgba(7, 193, 96, 0.06);
}

.recharge-card:active {
  transform: scale(0.96);
}

.recharge-card__amount {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  font-family: 'DIN Alternate', monospace;
}

.recharge-card__gift {
  margin-top: 8rpx;
  background: #FFF1F0;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}

.gift-text {
  font-size: 20rpx;
  color: #FF4D4F;
  font-weight: 500;
}

.recharge-card__custom-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
}

/* ==================== 优惠活动横幅 ==================== */
.banner-section {
  padding: 0;
  overflow: hidden;
}

.banner-swiper {
  height: 180rpx;
}

.banner-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 28rpx 32rpx;
  border-radius: 16rpx;
}

.banner-left {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.banner-tag {
  display: inline-block;
  font-size: 20rpx;
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 6rpx;
  padding: 4rpx 12rpx;
  margin-bottom: 12rpx;
  align-self: flex-start;
}

.banner-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 6rpx;
}

.banner-desc {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
}

.banner-action {
  background: #FFFFFF;
  border-radius: 32rpx;
  padding: 14rpx 32rpx;
}

.banner-action-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #07C160;
}

/* ==================== 最近交易 ==================== */
.tx-list {
  display: flex;
  flex-direction: column;
}

.tx-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}

.tx-item:last-child {
  border-bottom: none;
}

.tx-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.tx-icon--income {
  background: rgba(7, 193, 96, 0.1);
}

.tx-icon--expense {
  background: rgba(255, 77, 79, 0.1);
}

.tx-icon-text {
  font-size: 32rpx;
}

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.tx-desc {
  font-size: 28rpx;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-time {
  font-size: 22rpx;
  color: #999999;
}

.tx-amount {
  font-size: 30rpx;
  font-weight: bold;
  font-family: 'DIN Alternate', monospace;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.tx-amount--income {
  color: #07C160;
}

.tx-amount--expense {
  color: #FF4D4F;
}

/* ==================== 状态 ==================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
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
  color: #999999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
}

.empty-icon {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}

.safe-bottom {
  height: 24rpx;
}
</style>
