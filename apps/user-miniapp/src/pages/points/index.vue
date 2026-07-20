<template>
  <view class="points-page">
    <!-- 顶部积分余额 + 搜索框 -->
    <view class="header-section">
      <view class="balance-card">
        <view class="balance-top">
          <view class="balance-info">
            <text class="balance-label">我的积分</text>
            <view class="balance-row">
              <text class="balance-value">{{ pointsData.balance }}</text>
              <text class="balance-unit">积分</text>
            </view>
          </view>
          <view class="balance-detail-btn" @tap="goPointsDetail">
            <text class="detail-btn-text">积分明细</text>
          </view>
        </view>
        <view class="balance-stats">
          <view class="stat-item">
            <text class="stat-value">{{ pointsData.earned }}</text>
            <text class="stat-label">累计获得</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ pointsData.used }}</text>
            <text class="stat-label">累计使用</text>
          </view>
          <view class="stat-divider"></view>
          <view class="stat-item">
            <text class="stat-value">{{ pointsData.expiring }}</text>
            <text class="stat-label">即将过期</text>
          </view>
        </view>
      </view>

      <!-- 搜索框 -->
      <view class="search-bar" @tap="toggleSearch">
        <text class="search-icon">🔍</text>
        <input
          v-if="isSearching"
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索积分商品"
          placeholder-class="search-placeholder"
          :focus="isSearching"
          @confirm="doSearch"
          @blur="onSearchBlur"
        />
        <text v-else class="search-placeholder-text">搜索积分商品</text>
      </view>
    </view>

    <!-- 积分赚取方式 — 横向滚动 -->
    <view class="earn-section">
      <view class="section-header">
        <text class="section-title">赚积分</text>
        <text class="section-more" @tap="goEarnDetail">查看更多 ></text>
      </view>
      <scroll-view class="earn-scroll" scroll-x :show-scrollbar="false">
        <view class="earn-list">
          <view
            v-for="method in earnMethods"
            :key="method.id"
            class="earn-card"
            :style="{ background: method.bgGradient }"
            @tap="handleEarn(method)"
          >
            <text class="earn-icon">{{ method.icon }}</text>
            <text class="earn-name">{{ method.name }}</text>
            <text class="earn-points">+{{ method.points }}积分</text>
            <text class="earn-desc">{{ method.desc }}</text>
            <view class="earn-action-btn">
              <text class="earn-action-text">{{ method.actionText }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 兑换商品分类 Tab -->
    <view class="category-section">
      <view class="category-tabs">
        <view
          v-for="cat in categories"
          :key="cat.value"
          class="category-tab"
          :class="{ active: currentCategory === cat.value }"
          @tap="switchCategory(cat.value)"
        >
          <text class="category-icon">{{ cat.icon }}</text>
          <text class="category-label">{{ cat.label }}</text>
          <view v-if="currentCategory === cat.value" class="category-indicator"></view>
        </view>
      </view>
    </view>

    <!-- 商品列表 — 网格布局 -->
    <view class="products-section">
      <view v-if="loading" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="filteredProducts.length > 0" class="products-grid">
        <view
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card"
          @tap="openDetail(product)"
        >
          <view class="product-image-wrap">
            <image
              v-if="product.image"
              class="product-image"
              :src="product.image"
              mode="aspectFill"
            />
            <view v-else class="product-image-placeholder">
              <text class="placeholder-icon">{{ product.icon }}</text>
            </view>
            <view v-if="product.tag" class="product-tag">
              <text class="product-tag-text">{{ product.tag }}</text>
            </view>
          </view>
          <text class="product-name">{{ product.name }}</text>
          <text class="product-desc">{{ product.description }}</text>
          <view class="product-bottom">
            <view class="product-price">
              <text class="price-value">{{ product.points }}</text>
              <text class="price-unit">积分</text>
            </view>
            <text class="product-exchanged">已兑{{ formatCount(product.exchangedCount) }}次</text>
          </view>
          <view
            class="redeem-btn"
            :class="{ 'redeem-btn-disabled': pointsData.balance < product.points }"
            @tap.stop="openDetail(product)"
          >
            <text class="redeem-btn-text">
              {{ pointsData.balance < product.points ? '积分不足' : '立即兑换' }}
            </text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <text class="empty-icon">🎁</text>
        <text class="empty-text">{{ searchKeyword ? '未找到相关商品' : '该分类暂无商品' }}</text>
      </view>
    </view>

    <!-- 我的兑换记录 -->
    <view class="history-section">
      <view class="section-header">
        <text class="section-title">我的兑换</text>
        <text class="section-more" @tap="goAllHistory">全部记录 ></text>
      </view>

      <view class="history-tabs">
        <view
          v-for="tab in historyTabs"
          :key="tab.value"
          class="history-tab"
          :class="{ active: currentHistoryTab === tab.value }"
          @tap="switchHistoryTab(tab.value)"
        >
          <text class="history-tab-label">{{ tab.label }}</text>
          <view v-if="currentHistoryTab === tab.value" class="history-tab-indicator"></view>
        </view>
      </view>

      <view v-if="filteredHistory.length > 0" class="history-list">
        <view
          v-for="record in filteredHistory"
          :key="record.id"
          class="history-item"
          @tap="goHistoryDetail(record)"
        >
          <view class="history-image-wrap">
            <image
              v-if="record.image"
              class="history-image"
              :src="record.image"
              mode="aspectFill"
            />
            <view v-else class="history-image-placeholder">
              <text class="history-placeholder-icon">{{ record.icon }}</text>
            </view>
          </view>
          <view class="history-info">
            <text class="history-name">{{ record.name }}</text>
            <text class="history-time">{{ record.time }}</text>
            <text class="history-points">消耗 {{ record.points }} 积分</text>
          </view>
          <view class="history-status" :class="'status-' + record.status">
            <text class="history-status-text">{{ getStatusLabel(record.status) }}</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-state empty-small">
        <text class="empty-icon-small">📋</text>
        <text class="empty-text">暂无{{ getHistoryTabLabel(currentHistoryTab) }}记录</text>
      </view>
    </view>

    <!-- 兑换详情弹窗 -->
    <view v-if="showDetail" class="dialog-mask" @tap="closeDetail">
      <view class="detail-dialog" @tap.stop>
        <!-- 关闭按钮 -->
        <view class="detail-close" @tap="closeDetail">
          <text class="close-icon">✕</text>
        </view>

        <!-- 商品大图 -->
        <view class="detail-image-wrap">
          <image
            v-if="selectedProduct?.image"
            class="detail-image"
            :src="selectedProduct.image"
            mode="aspectFill"
          />
          <view v-else class="detail-image-placeholder">
            <text class="detail-placeholder-icon">{{ selectedProduct?.icon }}</text>
          </view>
        </view>

        <!-- 商品信息 -->
        <view class="detail-content">
          <text class="detail-name">{{ selectedProduct?.name }}</text>
          <view class="detail-price-row">
            <text class="detail-price">{{ selectedProduct?.points }}</text>
            <text class="detail-price-unit">积分</text>
          </view>

          <!-- 商品描述 -->
          <view class="detail-section">
            <text class="detail-section-title">商品描述</text>
            <text class="detail-description">{{ selectedProduct?.description }}</text>
          </view>

          <!-- 兑换须知 -->
          <view class="detail-section">
            <text class="detail-section-title">兑换须知</text>
            <view class="notice-list">
              <text class="notice-item">1. 兑换成功后不支持退换，请确认后再兑换</text>
              <text class="notice-item">2. 实物商品将在7个工作日内发货</text>
              <text class="notice-item">3. 优惠券类商品即时到账，有效期请查看券详情</text>
              <text class="notice-item">4. 本活动最终解释权归平台所有</text>
            </view>
          </view>

          <!-- 数量选择 -->
          <view class="detail-section">
            <text class="detail-section-title">兑换数量</text>
            <view class="quantity-row">
              <view
                class="qty-btn"
                :class="{ 'qty-btn-disabled': redeemQuantity <= 1 }"
                @tap="changeQuantity(-1)"
              >
                <text class="qty-btn-text">-</text>
              </view>
              <text class="qty-value">{{ redeemQuantity }}</text>
              <view
                class="qty-btn"
                :class="{ 'qty-btn-disabled': redeemQuantity >= maxQuantity }"
                @tap="changeQuantity(1)"
              >
                <text class="qty-btn-text">+</text>
              </view>
            </view>
          </view>

          <!-- 总计 -->
          <view class="detail-total">
            <text class="total-label">合计</text>
            <text class="total-points">{{ totalPoints }}</text>
            <text class="total-unit">积分</text>
          </view>

          <!-- 确认兑换按钮 -->
          <view
            class="confirm-btn"
            :class="{ 'confirm-btn-disabled': !canRedeem }"
            @tap="confirmRedeem"
          >
            <text class="confirm-btn-text">
              {{ canRedeem ? `确认兑换 ${totalPoints} 积分` : '积分不足' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 兑换成功动画 -->
    <view v-if="showSuccessAnim" class="success-anim-mask">
      <view class="success-anim-content">
        <view class="success-check-circle">
          <text class="success-check-icon">✓</text>
        </view>
        <text class="success-title">兑换成功</text>
        <view class="success-points-change">
          <text class="success-points-text">-{{ lastRedeemPoints }} 积分</text>
        </view>
        <text class="success-balance">当前余额：{{ pointsData.balance }} 积分</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api/index'
import type { EarnMethod, PointsProduct, RedeemRecord } from '@/types'

/* ========== 状态 ========== */

const pointsData = ref({
  balance: 0,
  earned: 0,
  used: 0,
  expiring: 0,
})

const loading = ref(false)
const isSearching = ref(false)
const searchKeyword = ref('')
const currentCategory = ref('charging')
const currentHistoryTab = ref('pending')
const showDetail = ref(false)
const selectedProduct = ref<PointsProduct | null>(null)
const redeemQuantity = ref(1)
const showSuccessAnim = ref(false)
const lastRedeemPoints = ref(0)

/* ========== 分类 ========== */

const categories = [
  { label: '充电优惠', value: 'charging', icon: '⚡' },
  { label: '实物礼品', value: 'physical', icon: '🎁' },
  { label: '生活特权', value: 'lifestyle', icon: '👑' },
  { label: '公益捐赠', value: 'charity', icon: '💚' },
]

const historyTabs = [
  { label: '待使用', value: 'pending' },
  { label: '已使用', value: 'used' },
  { label: '待收货', value: 'shipping' },
]

/* ========== 赚积分方式 ========== */

const earnMethods: EarnMethod[] = [
  {
    id: 'signin',
    icon: '📅',
    name: '每日签到',
    points: 5,
    desc: '连续签到积分递增',
    actionText: '去签到',
    bgGradient: 'linear-gradient(135deg, #FF9A56, #FF6B35)',
  },
  {
    id: 'charging',
    icon: '⚡',
    name: '充电消费',
    points: 1,
    desc: '每消费1元得1积分',
    actionText: '去充电',
    bgGradient: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
  },
  {
    id: 'review',
    icon: '⭐',
    name: '评价充电',
    points: 50,
    desc: '完成订单评价奖励',
    actionText: '去评价',
    bgGradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
  },
  {
    id: 'share',
    icon: '🔗',
    name: '分享好友',
    points: 100,
    desc: '邀请好友注册充电',
    actionText: '去分享',
    bgGradient: 'linear-gradient(135deg, #A78BFA, #818CF8)',
  },
  {
    id: 'photo',
    icon: '📸',
    name: '上传照片',
    points: 20,
    desc: '上传充电站实拍图',
    actionText: '去上传',
    bgGradient: 'linear-gradient(135deg, #F472B6, #EC4899)',
  },
  {
    id: 'vehicle',
    icon: '🚗',
    name: '完善车辆',
    points: 200,
    desc: '完善车辆信息奖励',
    actionText: '去完善',
    bgGradient: 'linear-gradient(135deg, #34D399, #059669)',
  },
]

/* ========== 商品数据 ========== */

const products = ref<PointsProduct[]>([
  { id: '1', name: '5元充电券', description: '满20元可用，不限时段，有效期30天', icon: '🎫', image: '', points: 500, category: 'charging', exchangedCount: 12680, stock: 999, tag: '热兑' },
  { id: '2', name: '10元充电券', description: '满50元可用，不限时段，有效期30天', icon: '🎫', image: '', points: 900, category: 'charging', exchangedCount: 8540, stock: 999, tag: '热兑' },
  { id: '3', name: '快充加速卡', description: '下次充电自动享受快充速率，有效期7天', icon: '⚡', image: '', points: 300, category: 'charging', exchangedCount: 5320, stock: 500, tag: '' },
  { id: '4', name: '品牌双肩包', description: '品牌定制双肩背包，品质保证，限量发售', icon: '🎒', image: '', points: 8000, category: 'physical', exchangedCount: 234, stock: 50, tag: '限量' },
  { id: '5', name: '车载充电线', description: 'Type-C快充线，车规级材质，1.5米', icon: '🔌', image: '', points: 3000, category: 'physical', exchangedCount: 1856, stock: 200, tag: '' },
  { id: '6', name: '定制车模', description: '1:18精致车模，合金材质，收藏级', icon: '🏎️', image: '', points: 12000, category: 'physical', exchangedCount: 89, stock: 20, tag: '限量' },
  { id: '7', name: '视频会员月卡', description: '主流视频平台月度VIP会员', icon: '🎬', image: '', points: 2000, category: 'lifestyle', exchangedCount: 6720, stock: 999, tag: '' },
  { id: '8', name: '咖啡兑换券', description: '合作商家咖啡兑换券，全国通用', icon: '☕', image: '', points: 1500, category: 'lifestyle', exchangedCount: 4310, stock: 500, tag: '' },
  { id: '9', name: '洗车服务券', description: '合作洗车店单次洗车服务', icon: '🚿', image: '', points: 1800, category: 'lifestyle', exchangedCount: 3210, stock: 300, tag: '' },
  { id: '10', name: '种一棵树', description: '为荒漠地区种植一棵梭梭树', icon: '🌳', image: '', points: 2000, category: 'charity', exchangedCount: 9870, stock: 9999, tag: '公益' },
  { id: '11', name: '碳中和证书', description: '获得个人碳中和荣誉证书', icon: '📜', image: '', points: 5000, category: 'charity', exchangedCount: 1560, stock: 9999, tag: '公益' },
  { id: '12', name: '清洁水源捐赠', description: '为缺水地区捐赠1升清洁水源', icon: '💧', image: '', points: 1000, category: 'charity', exchangedCount: 7430, stock: 9999, tag: '公益' },
])

/* ========== 兑换记录 ========== */

const redeemHistory = ref<RedeemRecord[]>([
  { id: 'h1', name: '5元充电券', icon: '🎫', image: '', points: 500, time: '2026-07-15 14:30', status: 'used' },
  { id: 'h2', name: '品牌双肩包', icon: '🎒', image: '', points: 8000, time: '2026-07-10 09:15', status: 'shipping' },
  { id: 'h3', name: '种一棵树', icon: '🌳', image: '', points: 2000, time: '2026-07-08 16:45', status: 'used' },
  { id: 'h4', name: '10元充电券', icon: '🎫', image: '', points: 900, time: '2026-07-18 10:00', status: 'pending' },
  { id: 'h5', name: '视频会员月卡', icon: '🎬', image: '', points: 2000, time: '2026-07-05 20:30', status: 'used' },
])

/* ========== 计算属性 ========== */

const filteredProducts = computed(() => {
  let list = products.value.filter(p => p.category === currentCategory.value)
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = products.value.filter(
      p => p.name.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)
    )
  }
  return list
})

const filteredHistory = computed(() => {
  return redeemHistory.value.filter(r => r.status === currentHistoryTab.value)
})

const maxQuantity = computed(() => {
  if (!selectedProduct.value) return 1
  const maxByStock = selectedProduct.value.stock
  const maxByBalance = Math.floor(pointsData.value.balance / selectedProduct.value.points)
  return Math.min(maxByStock, maxByBalance, 99)
})

const totalPoints = computed(() => {
  if (!selectedProduct.value) return 0
  return selectedProduct.value.points * redeemQuantity.value
})

const canRedeem = computed(() => {
  if (!selectedProduct.value) return false
  return pointsData.value.balance >= totalPoints.value && redeemQuantity.value > 0
})

/* ========== 方法 ========== */

function toggleSearch() {
  isSearching.value = true
}

function onSearchBlur() {
  if (!searchKeyword.value.trim()) {
    isSearching.value = false
  }
}

function doSearch() {
  // 触发 filteredProducts 自动过滤
}

function switchCategory(cat: string) {
  currentCategory.value = cat
  searchKeyword.value = ''
  isSearching.value = false
}

function switchHistoryTab(tab: string) {
  currentHistoryTab.value = tab
}

function formatCount(count: number): string {
  if (count >= 10000) {
    return (count / 10000).toFixed(1).replace(/\.0$/, '') + 'w'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return String(count)
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待使用',
    used: '已使用',
    shipping: '待收货',
  }
  return map[status] || status
}

function getHistoryTabLabel(tab: string): string {
  const map: Record<string, string> = {
    pending: '待使用',
    used: '已使用',
    shipping: '待收货',
  }
  return map[tab] || ''
}

function openDetail(product: PointsProduct) {
  selectedProduct.value = product
  redeemQuantity.value = 1
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedProduct.value = null
  redeemQuantity.value = 1
}

function changeQuantity(delta: number) {
  const newVal = redeemQuantity.value + delta
  if (newVal >= 1 && newVal <= maxQuantity.value) {
    redeemQuantity.value = newVal
  }
}

async function confirmRedeem() {
  if (!canRedeem.value || !selectedProduct.value) return
  const product = selectedProduct.value
  const qty = redeemQuantity.value
  const cost = product.points * qty

  try {
    await api.redeemPoints({ itemId: product.id, quantity: qty, points: cost })

    // 扣减积分
    pointsData.value.balance -= cost
    pointsData.value.used += cost

    // 添加兑换记录
    redeemHistory.value.unshift({
      id: 'h' + Date.now(),
      name: product.name,
      icon: product.icon,
      image: product.image,
      points: cost,
      time: new Date().toLocaleString('zh-CN'),
      status: 'pending',
    })

    // 更新商品兑换次数
    product.exchangedCount += qty

    // 关闭弹窗 & 播放成功动画
    closeDetail()
    lastRedeemPoints.value = cost
    showSuccessAnim.value = true
    setTimeout(() => {
      showSuccessAnim.value = false
    }, 2000)
  } catch {
    uni.showToast({ title: '兑换失败，请重试', icon: 'none' })
  }
}

function handleEarn(method: EarnMethod) {
  switch (method.id) {
    case 'signin':
      uni.showToast({ title: '签到成功 +' + method.points + '积分', icon: 'success' })
      break
    case 'charging':
      uni.navigateTo({ url: '/pages/map/index' })
      break
    case 'review':
    case 'share':
    case 'photo':
    case 'vehicle':
      uni.showToast({ title: '功能开发中', icon: 'none' })
      break
  }
}

function goPointsDetail() {
  uni.showToast({ title: '积分明细开发中', icon: 'none' })
}

function goEarnDetail() {
  uni.showToast({ title: '赚积分详情开发中', icon: 'none' })
}

function goAllHistory() {
  uni.showToast({ title: '全部记录开发中', icon: 'none' })
}

function goHistoryDetail(record: RedeemRecord) {
  uni.showToast({ title: '记录详情开发中', icon: 'none' })
}

/* ========== 数据加载 ========== */

async function loadPointsData() {
  try {
    const data = await api.getPoints()
    if (data) {
      pointsData.value = {
        balance: data.balance ?? 0,
        earned: data.earned ?? 0,
        used: data.used ?? 0,
        expiring: data.expiring ?? 0,
      }
    }
  } catch {
    // use defaults
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const data = await api.getPointsProducts()
    if (Array.isArray(data) && data.length > 0) {
      products.value = data as PointsProduct[]
    }
  } catch {
    // use defaults
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  try {
    const data = await api.getPointsHistory()
    if (Array.isArray(data) && data.length > 0) {
      redeemHistory.value = data as RedeemRecord[]
    }
  } catch {
    // use defaults
  }
}

onMounted(() => {
  loadPointsData()
  loadProducts()
  loadHistory()
})
</script>

<style scoped>
.points-page {
  background: #F6F7FB;
  min-height: 100vh;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

/* ===== 顶部积分余额卡片 ===== */
.header-section {
  padding: 24rpx 24rpx 0;
}

.balance-card {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 24rpx;
  padding: 36rpx 32rpx 28rpx;
  color: #fff;
}

.balance-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.balance-info {
  flex: 1;
}

.balance-label {
  font-size: 24rpx;
  opacity: 0.85;
  display: block;
  margin-bottom: 8rpx;
}

.balance-row {
  display: flex;
  align-items: flex-end;
}

.balance-value {
  font-size: 72rpx;
  font-weight: bold;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  line-height: 1;
}

.balance-unit {
  font-size: 24rpx;
  opacity: 0.85;
  margin-left: 8rpx;
  margin-bottom: 12rpx;
}

.balance-detail-btn {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 24rpx;
  padding: 10rpx 24rpx;
  margin-top: 8rpx;
}

.detail-btn-text {
  font-size: 22rpx;
  color: #fff;
}

.balance-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16rpx;
  padding: 20rpx 0;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 32rpx;
  font-weight: bold;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  display: block;
}

.stat-label {
  font-size: 20rpx;
  opacity: 0.8;
  display: block;
  margin-top: 6rpx;
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.25);
}

/* ===== 搜索框 ===== */
.search-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 40rpx;
  padding: 16rpx 28rpx;
  margin-top: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.search-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.search-input {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.search-placeholder {
  color: #bbb;
}

.search-placeholder-text {
  flex: 1;
  font-size: 26rpx;
  color: #bbb;
}

/* ===== 赚积分横向滚动 ===== */
.earn-section {
  margin-top: 28rpx;
  padding: 0 24rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 24rpx;
  color: #999;
}

.earn-scroll {
  white-space: nowrap;
  margin: 0 -24rpx;
  padding: 0 24rpx;
}

.earn-list {
  display: inline-flex;
  gap: 20rpx;
  padding-right: 24rpx;
}

.earn-card {
  width: 220rpx;
  border-radius: 20rpx;
  padding: 28rpx 20rpx 20rpx;
  display: inline-flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.earn-icon {
  font-size: 44rpx;
  margin-bottom: 12rpx;
}

.earn-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 6rpx;
}

.earn-points {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: bold;
  display: block;
  margin-bottom: 4rpx;
}

.earn-desc {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.75);
  display: block;
  margin-bottom: 16rpx;
  white-space: normal;
}

.earn-action-btn {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 20rpx;
  padding: 8rpx 0;
  text-align: center;
}

.earn-action-text {
  font-size: 22rpx;
  color: #fff;
  font-weight: 500;
}

/* ===== 分类 Tab ===== */
.category-section {
  margin-top: 32rpx;
  padding: 0 24rpx;
}

.category-tabs {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.category-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0 12rpx;
  position: relative;
}

.category-icon {
  font-size: 36rpx;
  margin-bottom: 6rpx;
}

.category-label {
  font-size: 22rpx;
  color: #666;
}

.category-tab.active .category-label {
  color: #F59E0B;
  font-weight: bold;
}

.category-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #F59E0B;
  border-radius: 3rpx;
}

/* ===== 商品网格 ===== */
.products-section {
  padding: 24rpx 24rpx 0;
}

.products-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.product-card {
  width: calc(50% - 10rpx);
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.product-image-wrap {
  width: 100%;
  height: 260rpx;
  position: relative;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
}

.product-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FFF7ED, #FFEDD5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 72rpx;
}

.product-tag {
  position: absolute;
  top: 12rpx;
  left: 0;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 0 16rpx 16rpx 0;
  padding: 4rpx 16rpx;
}

.product-tag-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: bold;
}

.product-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
  display: block;
  padding: 16rpx 16rpx 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 20rpx;
  color: #999;
  display: block;
  padding: 0 16rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 16rpx 4rpx;
}

.product-price {
  display: flex;
  align-items: flex-end;
}

.price-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #F59E0B;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

.price-unit {
  font-size: 20rpx;
  color: #F59E0B;
  margin-left: 4rpx;
  margin-bottom: 3rpx;
}

.product-exchanged {
  font-size: 18rpx;
  color: #bbb;
}

.redeem-btn {
  margin: 12rpx 16rpx 16rpx;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 28rpx;
  padding: 14rpx 0;
  text-align: center;
}

.redeem-btn-disabled {
  background: #E8E8E8;
}

.redeem-btn-text {
  font-size: 24rpx;
  color: #fff;
  font-weight: bold;
}

.redeem-btn-disabled .redeem-btn-text {
  color: #bbb;
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
  border-top-color: #F59E0B;
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

/* ===== 兑换记录 ===== */
.history-section {
  margin-top: 32rpx;
  padding: 0 24rpx;
}

.history-tabs {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 0 8rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.history-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  position: relative;
}

.history-tab-label {
  font-size: 26rpx;
  color: #666;
}

.history-tab.active .history-tab-label {
  color: #F59E0B;
  font-weight: bold;
}

.history-tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #F59E0B;
  border-radius: 3rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.history-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  gap: 20rpx;
}

.history-image-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 12rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.history-image {
  width: 100%;
  height: 100%;
}

.history-image-placeholder {
  width: 100%;
  height: 100%;
  background: #FFF7ED;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-placeholder-icon {
  font-size: 44rpx;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.history-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}

.history-time {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-bottom: 4rpx;
}

.history-points {
  font-size: 22rpx;
  color: #F59E0B;
  display: block;
}

.history-status {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.history-status-text {
  font-size: 22rpx;
  font-weight: 500;
}

.status-pending {
  background: #FFF7ED;
}

.status-pending .history-status-text {
  color: #F59E0B;
}

.status-used {
  background: #F0F0F0;
}

.status-used .history-status-text {
  color: #999;
}

.status-shipping {
  background: #EFF6FF;
}

.status-shipping .history-status-text {
  color: #3B82F6;
}

/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-small {
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-icon-small {
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* ===== 兑换详情弹窗 ===== */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}

.detail-dialog {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  overflow-y: auto;
  position: relative;
}

.detail-close {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  width: 56rpx;
  height: 56rpx;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-icon {
  font-size: 28rpx;
  color: #fff;
}

.detail-image-wrap {
  width: 100%;
  height: 400rpx;
  overflow: hidden;
}

.detail-image {
  width: 100%;
  height: 100%;
}

.detail-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FFF7ED, #FFEDD5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-placeholder-icon {
  font-size: 120rpx;
}

.detail-content {
  padding: 28rpx 32rpx 40rpx;
}

.detail-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.detail-price-row {
  display: flex;
  align-items: flex-end;
  margin-bottom: 28rpx;
}

.detail-price {
  font-size: 52rpx;
  font-weight: bold;
  color: #F59E0B;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  line-height: 1;
}

.detail-price-unit {
  font-size: 24rpx;
  color: #F59E0B;
  margin-left: 8rpx;
  margin-bottom: 8rpx;
}

.detail-section {
  margin-bottom: 28rpx;
}

.detail-section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.detail-description {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.notice-item {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
  display: block;
}

/* 数量选择 */
.quantity-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.qty-btn {
  width: 64rpx;
  height: 64rpx;
  background: #F6F7FB;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn-disabled {
  opacity: 0.35;
}

.qty-btn-text {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
}

.qty-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  min-width: 60rpx;
  text-align: center;
}

/* 总计 */
.detail-total {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 20rpx 0;
  border-top: 1rpx solid #F0F0F0;
  margin-bottom: 24rpx;
}

.total-label {
  font-size: 26rpx;
  color: #666;
  margin-right: 12rpx;
  margin-bottom: 4rpx;
}

.total-points {
  font-size: 44rpx;
  font-weight: bold;
  color: #F59E0B;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  line-height: 1;
}

.total-unit {
  font-size: 24rpx;
  color: #F59E0B;
  margin-left: 8rpx;
  margin-bottom: 6rpx;
}

/* 确认兑换按钮 */
.confirm-btn {
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 44rpx;
  padding: 24rpx 0;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(245, 158, 11, 0.35);
}

.confirm-btn-disabled {
  background: #E8E8E8;
  box-shadow: none;
}

.confirm-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: bold;
}

.confirm-btn-disabled .confirm-btn-text {
  color: #bbb;
}

/* ===== 兑换成功动画 ===== */
.success-anim-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.success-anim-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border-radius: 32rpx;
  padding: 56rpx 64rpx;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.success-check-circle {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #F59E0B, #D97706);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  animation: checkBounce 0.6s ease 0.2s;
}

@keyframes checkBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.success-check-icon {
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
}

.success-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.success-points-change {
  margin-bottom: 16rpx;
  animation: pointsFly 0.8s ease;
}

@keyframes pointsFly {
  0% { transform: translateY(20rpx); opacity: 0; }
  50% { transform: translateY(-10rpx); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}

.success-points-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #F59E0B;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

.success-balance {
  font-size: 24rpx;
  color: #999;
}
</style>
