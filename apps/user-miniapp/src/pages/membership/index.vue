<template>
  <view class="membership-page">
    <!-- 会员卡区域 -->
    <view class="member-card" :class="'member-card--' + membership.tier">
      <view class="member-card__glow" />
      <view class="member-card__content">
        <!-- 头像 + 昵称 + 等级徽章 -->
        <view class="member-card__header">
          <image
            class="member-card__avatar"
            :src="membership.avatar || '/static/default-avatar.png'"
            mode="aspectFill"
          />
          <view class="member-card__user">
            <text class="member-card__nickname">{{ membership.nickname || '充电用户' }}</text>
            <view class="member-card__badge">
              <text class="badge__icon">{{ tierConfig[membership.tier].icon }}</text>
              <text class="badge__text">{{ tierConfig[membership.tier].label }}会员</text>
              <text class="badge__star" v-if="membership.tier !== 'normal'">⭐</text>
            </view>
          </view>
          <text class="member-card__no">NO.{{ membership.memberNo }}</text>
        </view>

        <!-- 等级进度条 -->
        <view class="member-card__progress" v-if="membership.tier !== 'diamond'">
          <view class="progress-info">
            <text class="progress-info__label">当前积分</text>
            <text class="progress-info__value">{{ membership.points }}</text>
            <text class="progress-info__sep">/</text>
            <text class="progress-info__target">{{ tierConfig[nextTier].requiredPoints }}</text>
          </view>
          <view class="progress-bar">
            <view class="progress-bar__fill" :style="{ width: upgradePercent + '%' }" />
          </view>
          <text class="progress-hint">再获得 {{ membership.pointsToNext }} 积分即可升级</text>
        </view>
        <view class="member-card__progress" v-else>
          <view class="progress-info">
            <text class="progress-info__label">当前积分</text>
            <text class="progress-info__value">{{ membership.points }}</text>
          </view>
          <text class="progress-hint progress-hint--max">您已达到最高等级 👑</text>
        </view>

        <!-- 5个等级图标横排 -->
        <view class="tier-track">
          <view
            class="tier-track__item"
            v-for="(tier, idx) in tierOrder"
            :key="tier"
            :class="{
              'tier-track__item--active': tier === membership.tier,
              'tier-track__item--reached': tierOrder.indexOf(membership.tier) >= idx
            }"
          >
            <view class="tier-track__icon-wrap">
              <text class="tier-track__icon">{{ tierConfig[tier].icon }}</text>
            </view>
            <text class="tier-track__name">{{ tierConfig[tier].shortLabel }}</text>
          </view>
          <!-- 连接线 -->
          <view class="tier-track__line">
            <view class="tier-track__line-fill" :style="{ width: trackFillPercent + '%' }" />
          </view>
        </view>
      </view>
    </view>

    <!-- 会员权益展示 -->
    <view class="section benefits-section">
      <view class="section-header">
        <text class="section-title">我的权益</text>
        <view class="section-tag" v-if="membership.tier !== 'diamond'">
          <text class="section-tag__text">{{ tierConfig[nextTier].label }}更多权益等你解锁</text>
        </view>
      </view>

      <!-- 当前等级权益 -->
      <view class="benefits-label">
        <text class="benefits-label__dot benefits-label__dot--unlocked" />
        <text class="benefits-label__text">当前权益 · {{ tierConfig[membership.tier].label }}</text>
      </view>
      <view class="benefits-grid">
        <view class="benefit-card benefit-card--unlocked" v-for="(benefit, idx) in currentBenefits" :key="'c' + idx">
          <view class="benefit-card__icon-wrap">
            <text class="benefit-card__icon">{{ benefit.icon }}</text>
            <text class="benefit-card__check">✅</text>
          </view>
          <text class="benefit-card__name">{{ benefit.name }}</text>
          <text class="benefit-card__desc">{{ benefit.desc }}</text>
        </view>
      </view>

      <!-- 下一等级权益 -->
      <template v-if="membership.tier !== 'diamond'">
        <view class="benefits-label">
          <text class="benefits-label__dot benefits-label__dot--locked" />
          <text class="benefits-label__text">下一等级 · {{ tierConfig[nextTier].label }}</text>
        </view>
        <view class="benefits-grid">
          <view class="benefit-card benefit-card--locked" v-for="(benefit, idx) in nextBenefits" :key="'n' + idx">
            <view class="benefit-card__icon-wrap">
              <text class="benefit-card__icon">{{ benefit.icon }}</text>
              <text class="benefit-card__lock">🔒</text>
            </view>
            <text class="benefit-card__name">{{ benefit.name }}</text>
            <text class="benefit-card__desc">{{ benefit.desc }}</text>
          </view>
        </view>
      </template>
    </view>

    <!-- 积分信息 -->
    <view class="section points-section">
      <view class="section-header">
        <text class="section-title">积分信息</text>
        <view class="section-more" @tap="goPointsDetail">
          <text class="more-text">积分明细</text>
          <text class="more-arrow">›</text>
        </view>
      </view>

      <view class="points-display">
        <text class="points-display__label">当前积分</text>
        <text class="points-display__value">{{ membership.points }}</text>
      </view>

      <view class="points-actions">
        <view class="points-action" @tap="goEarnPoints">
          <text class="points-action__icon">💰</text>
          <text class="points-action__text">赚积分</text>
        </view>
        <view class="points-action__divider" />
        <view class="points-action" @tap="goSpendPoints">
          <text class="points-action__icon">🎁</text>
          <text class="points-action__text">花积分</text>
        </view>
        <view class="points-action__divider" />
        <view class="points-action" @tap="goPointsDetail">
          <text class="points-action__icon">📋</text>
          <text class="points-action__text">积分明细</text>
        </view>
      </view>
    </view>

    <!-- 等级说明 -->
    <view class="section rules-section">
      <view class="section-header">
        <text class="section-title">等级说明</text>
      </view>

      <!-- 升级规则 -->
      <view class="rules-block">
        <view class="rules-block__header">
          <text class="rules-block__icon">📈</text>
          <text class="rules-block__title">升级规则</text>
        </view>
        <view class="rules-list">
          <view class="rules-item" v-for="(rule, idx) in upgradeRules" :key="'u' + idx">
            <text class="rules-item__dot">•</text>
            <text class="rules-item__text">{{ rule }}</text>
          </view>
        </view>
      </view>

      <!-- 降级规则 -->
      <view class="rules-block">
        <view class="rules-block__header">
          <text class="rules-block__icon">📉</text>
          <text class="rules-block__title">降级规则</text>
        </view>
        <view class="rules-list">
          <view class="rules-item" v-for="(rule, idx) in downgradeRules" :key="'d' + idx">
            <text class="rules-item__dot">•</text>
            <text class="rules-item__text">{{ rule }}</text>
          </view>
        </view>
      </view>

      <!-- 等级有效期 -->
      <view class="rules-block">
        <view class="rules-block__header">
          <text class="rules-block__icon">📅</text>
          <text class="rules-block__title">等级有效期</text>
        </view>
        <view class="rules-list">
          <view class="rules-item">
            <text class="rules-item__dot">•</text>
            <text class="rules-item__text">会员等级自升级之日起有效期 365 天</text>
          </view>
          <view class="rules-item">
            <text class="rules-item__dot">•</text>
            <text class="rules-item__text">有效期内满足更高等级条件将自动升级，有效期重新计算</text>
          </view>
          <view class="rules-item">
            <text class="rules-item__dot">•</text>
            <text class="rules-item__text">到期后将根据近 90 天消费积分重新评定等级</text>
          </view>
        </view>
      </view>
    </view>

    <view class="safe-bottom" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/index'

// ==================== 类型定义 ====================

type Tier = 'normal' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

interface TierInfo {
  icon: string
  label: string
  shortLabel: string
  requiredPoints: number
  benefits: BenefitItem[]
}

interface BenefitItem {
  icon: string
  name: string
  desc: string
}

interface MembershipData {
  tier: Tier
  memberNo: string
  nickname: string
  avatar: string
  points: number
  totalChargeCount: number
  savedAmount: number
  pointsToNext: number
}

// ==================== 等级配置 ====================

const tierOrder: Tier[] = ['normal', 'bronze', 'silver', 'gold', 'platinum', 'diamond']

const tierConfig: Record<Tier, TierInfo> = {
  normal: {
    icon: '👤',
    label: '普通会员',
    shortLabel: '普通',
    requiredPoints: 0,
    benefits: [
      { icon: '⚡', name: '基础充电', desc: '标准充电服务' },
      { icon: '📊', name: '账单查询', desc: '查看充电记录' },
    ],
  },
  bronze: {
    icon: '🥉',
    label: '铜卡会员',
    shortLabel: '铜卡',
    requiredPoints: 500,
    benefits: [
      { icon: '⚡', name: '基础充电', desc: '标准充电服务' },
      { icon: '📊', name: '账单查询', desc: '查看充电记录' },
      { icon: '🎫', name: '每月1张券', desc: '¥3充电优惠券' },
    ],
  },
  silver: {
    icon: '🥈',
    label: '银卡会员',
    shortLabel: '银卡',
    requiredPoints: 2000,
    benefits: [
      { icon: '💰', name: '充电98折', desc: '全场充电优惠' },
      { icon: '🎫', name: '每月1张券', desc: '¥5充电优惠券' },
      { icon: '⭐', name: '积分1.2x', desc: '积分加速获取' },
      { icon: '🎧', name: '优先客服', desc: '专线客服通道' },
    ],
  },
  gold: {
    icon: '🥇',
    label: '金卡会员',
    shortLabel: '金卡',
    requiredPoints: 5000,
    benefits: [
      { icon: '💰', name: '充电95折', desc: '全场充电优惠' },
      { icon: '🎫', name: '每月2张券', desc: '¥5充电优惠券' },
      { icon: '⭐', name: '积分1.5x', desc: '积分加速获取' },
      { icon: '🎧', name: '专属客服', desc: '一对一专属服务' },
      { icon: '📅', name: '预约优先', desc: '充电桩预约优先' },
    ],
  },
  platinum: {
    icon: '💎',
    label: '铂金会员',
    shortLabel: '铂金',
    requiredPoints: 15000,
    benefits: [
      { icon: '💰', name: '充电9折', desc: '全场充电优惠' },
      { icon: '🎫', name: '每月3张券', desc: '¥10充电优惠券' },
      { icon: '⭐', name: '积分2x', desc: '积分加速获取' },
      { icon: '🎧', name: '专属客服', desc: '一对一专属服务' },
      { icon: '📅', name: '预约优先', desc: '充电桩预约优先' },
      { icon: '🎂', name: '生日礼', desc: '生日专属福利' },
    ],
  },
  diamond: {
    icon: '👑',
    label: '钻石会员',
    shortLabel: '钻石',
    requiredPoints: 50000,
    benefits: [
      { icon: '💰', name: '充电8折', desc: '全场充电优惠' },
      { icon: '🎫', name: '每月5张券', desc: '¥20充电优惠券' },
      { icon: '⭐', name: '积分3x', desc: '积分加速获取' },
      { icon: '🎧', name: '专属客服', desc: '一对一专属服务' },
      { icon: '📅', name: '预约优先', desc: '充电桩预约优先' },
      { icon: '🎂', name: '生日礼', desc: '生日专属福利' },
      { icon: '🅿️', name: '免费停车', desc: '充电期间免费' },
      { icon: '⏭️', name: '免排队', desc: '高峰期免排队' },
    ],
  },
}

// ==================== 规则数据 ====================

const upgradeRules = [
  '充电消费每 1 元 = 1 积分',
  '完成充电评价 +50 积分/次',
  '每日签到 +5 积分',
  '邀请好友注册 +200 积分/人',
]

const downgradeRules = [
  '连续 90 天无充电记录，等级降一级',
  '降级后积分不清零，可重新积累升级',
  '钻石会员保级需每 90 天累计消费满 5000 积分',
]

// ==================== 响应式数据 ====================

const membership = ref<MembershipData>({
  tier: 'normal',
  memberNo: '',
  nickname: '',
  avatar: '',
  points: 0,
  totalChargeCount: 0,
  savedAmount: 0,
  pointsToNext: 0,
})

// ==================== 计算属性 ====================

const nextTier = computed<Tier>(() => {
  const idx = tierOrder.indexOf(membership.value.tier)
  return idx < tierOrder.length - 1 ? tierOrder[idx + 1] : 'diamond'
})

const upgradePercent = computed(() => {
  const currentReq = tierConfig[membership.value.tier].requiredPoints
  const nextReq = tierConfig[nextTier.value].requiredPoints
  if (nextReq === currentReq) return 100
  return Math.min(100, Math.round(((membership.value.points - currentReq) / (nextReq - currentReq)) * 100))
})

const trackFillPercent = computed(() => {
  const currentIdx = tierOrder.indexOf(membership.value.tier)
  if (currentIdx >= tierOrder.length - 1) return 100
  // 每个等级占 25%（5段间隔），根据进度条百分比微调
  const base = (currentIdx / (tierOrder.length - 1)) * 100
  const segmentWidth = 100 / (tierOrder.length - 1)
  const extra = (upgradePercent.value / 100) * segmentWidth
  return Math.min(100, base + extra)
})

const currentBenefits = computed<BenefitItem[]>(() => {
  return tierConfig[membership.value.tier].benefits
})

const nextBenefits = computed<BenefitItem[]>(() => {
  const next = tierConfig[nextTier.value]
  // 展示下一等级中新增的权益（不在当前权益中的）
  const currentNames = new Set(tierConfig[membership.value.tier].benefits.map(b => b.name))
  const newBenefits = next.benefits.filter(b => !currentNames.has(b.name))
  // 如果没有全新权益，展示下一等级的全部权益作为激励
  return newBenefits.length > 0 ? newBenefits : next.benefits.slice(0, 3)
})

// ==================== 导航 ====================

function goPointsDetail() {
  uni.navigateTo({ url: '/pages/points/index' })
}

function goEarnPoints() {
  uni.navigateTo({ url: '/pages/points/index?tab=earn' })
}

function goSpendPoints() {
  uni.navigateTo({ url: '/pages/points/index?tab=redeem' })
}

// ==================== 数据加载 ====================

onMounted(async () => {
  try {
    const [memberData, pointsData] = await Promise.allSettled([
      api.getMembership(),
      api.getPoints(),
    ])

    if (memberData.status === 'fulfilled' && memberData.value) {
      const d = memberData.value as any
      membership.value = {
        tier: d.tier || d.level || 'normal',
        memberNo: d.memberNo || d.memberNumber || '',
        nickname: d.nickname || d.username || '',
        avatar: d.avatar || '',
        points: d.points || d.totalPoints || 0,
        totalChargeCount: d.totalChargeCount || d.chargeCount || 0,
        savedAmount: d.savedAmount || d.totalSaved || 0,
        pointsToNext: d.pointsToNext || 0,
      }
    }

    if (pointsData.status === 'fulfilled' && pointsData.value) {
      const p = pointsData.value as any
      // 用积分接口的余额覆盖（更精确）
      if (p.balance !== undefined) {
        membership.value.points = p.balance
      }
    }
  } catch (e) {
    // 使用默认值
  }
})
</script>

<style scoped>
.membership-page {
  min-height: 100vh;
  background: #F6F7FB;
  padding: 24rpx;
  padding-bottom: 0;
}

/* ==================== 会员卡区域 ==================== */
.member-card {
  position: relative;
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.member-card__glow {
  position: absolute;
  top: -60rpx;
  right: -40rpx;
  width: 300rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.member-card__content {
  position: relative;
  padding: 40rpx 32rpx 32rpx;
  border-radius: 24rpx;
}

/* 各等级渐变背景 */
.member-card--normal .member-card__content {
  background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 50%, #D1D5DB 100%);
}
.member-card--bronze .member-card__content {
  background: linear-gradient(135deg, #B45309 0%, #D97706 50%, #F59E0B 100%);
}
.member-card--silver .member-card__content {
  background: linear-gradient(135deg, #6B7280 0%, #9CA3AF 50%, #D1D5DB 100%);
}
.member-card--gold .member-card__content {
  background: linear-gradient(135deg, #B45309 0%, #F59E0B 50%, #FDE68A 100%);
}
.member-card--platinum .member-card__content {
  background: linear-gradient(135deg, #6366F1 0%, #818CF8 50%, #C4B5FD 100%);
}
.member-card--diamond .member-card__content {
  background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #E9D5FF 100%);
}

/* 头像区域 */
.member-card__header {
  display: flex;
  align-items: center;
  margin-bottom: 28rpx;
}

.member-card__avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  margin-right: 20rpx;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.2);
}

.member-card__user {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.member-card__nickname {
  font-size: 32rpx;
  font-weight: bold;
  color: #FFFFFF;
}

.member-card__badge {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
  align-self: flex-start;
}

.badge__icon {
  font-size: 24rpx;
}

.badge__text {
  font-size: 22rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.badge__star {
  font-size: 20rpx;
}

.member-card__no {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'DIN Alternate', monospace;
}

/* 进度条 */
.member-card__progress {
  margin-bottom: 28rpx;
}

.progress-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-bottom: 12rpx;
}

.progress-info__label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.75);
}

.progress-info__value {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  font-family: 'DIN Alternate', monospace;
  margin-left: 8rpx;
}

.progress-info__sep {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 4rpx;
}

.progress-info__target {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'DIN Alternate', monospace;
}

.progress-bar {
  height: 12rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.6), #FFFFFF);
  border-radius: 6rpx;
  transition: width 0.5s ease;
}

.progress-hint {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
  display: block;
}

.progress-hint--max {
  font-size: 24rpx;
  color: #FFFFFF;
  font-weight: 500;
}

/* 等级轨道 */
.tier-track {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 20rpx;
}

.tier-track__line {
  position: absolute;
  top: 36rpx;
  left: 24rpx;
  right: 24rpx;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 2rpx;
  z-index: 0;
}

.tier-track__line-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 2rpx;
  transition: width 0.5s ease;
}

.tier-track__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  z-index: 1;
  width: 80rpx;
}

.tier-track__icon-wrap {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.tier-track__item--reached .tier-track__icon-wrap {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
}

.tier-track__item--active .tier-track__icon-wrap {
  background: rgba(255, 255, 255, 0.45);
  border-color: #FFFFFF;
  box-shadow: 0 0 16rpx rgba(255, 255, 255, 0.4);
  transform: scale(1.15);
}

.tier-track__icon {
  font-size: 24rpx;
}

.tier-track__name {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.55);
}

.tier-track__item--reached .tier-track__name {
  color: rgba(255, 255, 255, 0.8);
}

.tier-track__item--active .tier-track__name {
  color: #FFFFFF;
  font-weight: bold;
}

/* ==================== 通用 Section ==================== */
.section {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333;
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

.section-tag {
  background: rgba(124, 58, 237, 0.08);
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
}

.section-tag__text {
  font-size: 20rpx;
  color: #7C3AED;
}

/* ==================== 权益区域 ==================== */
.benefits-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 16rpx;
  margin-top: 12rpx;
}

.benefits-label:first-child {
  margin-top: 0;
}

.benefits-label__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}

.benefits-label__dot--unlocked {
  background: #52C41A;
}

.benefits-label__dot--locked {
  background: #FAAD14;
}

.benefits-label__text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

.benefits-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.benefit-card {
  width: calc(50% - 8rpx);
  background: #F9FAFB;
  border-radius: 12rpx;
  padding: 20rpx;
  box-sizing: border-box;
  position: relative;
}

.benefit-card--unlocked {
  background: linear-gradient(135deg, #F6FFED 0%, #F0FFF0 100%);
  border: 1rpx solid rgba(82, 196, 26, 0.15);
}

.benefit-card--locked {
  background: #F9FAFB;
  border: 1rpx solid #F0F0F0;
  opacity: 0.75;
}

.benefit-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.benefit-card__icon {
  font-size: 40rpx;
}

.benefit-card__check {
  font-size: 22rpx;
}

.benefit-card__lock {
  font-size: 22rpx;
}

.benefit-card__name {
  font-size: 26rpx;
  font-weight: bold;
  color: #333333;
  display: block;
}

.benefit-card__desc {
  font-size: 20rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

/* ==================== 积分信息 ==================== */
.points-display {
  text-align: center;
  padding: 20rpx 0 24rpx;
}

.points-display__label {
  font-size: 24rpx;
  color: #999999;
  display: block;
  margin-bottom: 8rpx;
}

.points-display__value {
  font-size: 72rpx;
  font-weight: bold;
  color: #F59E0B;
  font-family: 'DIN Alternate', monospace;
  letter-spacing: 2rpx;
  display: block;
}

.points-actions {
  display: flex;
  align-items: center;
  background: #F9FAFB;
  border-radius: 12rpx;
  padding: 24rpx 0;
}

.points-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.points-action__icon {
  font-size: 40rpx;
}

.points-action__text {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
}

.points-action__divider {
  width: 1rpx;
  height: 56rpx;
  background: #E8E8E8;
}

/* ==================== 等级说明 ==================== */
.rules-block {
  margin-bottom: 24rpx;
}

.rules-block:last-child {
  margin-bottom: 0;
}

.rules-block__header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.rules-block__icon {
  font-size: 28rpx;
}

.rules-block__title {
  font-size: 26rpx;
  font-weight: bold;
  color: #333333;
}

.rules-list {
  padding-left: 8rpx;
}

.rules-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.rules-item:last-child {
  margin-bottom: 0;
}

.rules-item__dot {
  font-size: 22rpx;
  color: #7C3AED;
  line-height: 1.6;
  flex-shrink: 0;
}

.rules-item__text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.6;
}

.safe-bottom {
  height: 24rpx;
}
</style>
