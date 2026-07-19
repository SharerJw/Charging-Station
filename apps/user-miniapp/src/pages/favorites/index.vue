<template>
  <view class="favorites-page">
    <!-- 提示条 -->
    <view class="hint-bar" v-if="favorites.length > 0">
      <text class="hint-text">长按卡片可拖拽调整顺序</text>
      <text class="hint-divider">|</text>
      <text class="hint-text">左滑可取消收藏</text>
    </view>

    <!-- 收藏列表 -->
    <scroll-view
      v-if="favorites.length > 0"
      class="favorites-scroll"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
    >
      <view
        class="station-card"
        v-for="(station, idx) in favorites"
        :key="station.id"
        :class="{
          'is-dragging': dragState.draggingIndex === idx,
          'is-over': dragState.overIndex === idx && dragState.overIndex !== dragState.draggingIndex
        }"
        @touchstart="onTouchStart($event, idx)"
        @touchmove.prevent="onTouchMove($event, idx)"
        @touchend="onTouchEnd($event, idx)"
        @longpress="onLongPress(idx)"
      >
        <!-- 拖拽手柄视觉指示 -->
        <view class="drag-handle" :class="{ visible: dragState.draggingIndex === idx }">
          <view class="drag-dots">
            <text class="dot">&#8226;</text>
            <text class="dot">&#8226;</text>
            <text class="dot">&#8226;</text>
          </view>
        </view>

        <!-- 卡片主体（可滑动区域） -->
        <view
          class="card-swipe-wrapper"
          :style="{ transform: `translateX(${station._offsetX || 0}rpx)` }"
        >
          <view class="card-content">
            <!-- 顶部：站名 + 评分 + 状态标签 -->
            <view class="card-top">
              <view class="station-info">
                <view class="name-row">
                  <text class="station-name">{{ station.name }}</text>
                  <view class="rating-wrap" v-if="station._rating > 0">
                    <text class="rating-star">★</text>
                    <text class="rating-value">{{ station._rating.toFixed(1) }}</text>
                  </view>
                </view>
                <text class="station-address">{{ station.address }}</text>
              </view>
              <view
                class="status-tag"
                :class="getStatusClass(station)"
              >
                <text class="status-tag-text">{{ getStatusText(station) }}</text>
              </view>
            </view>

            <!-- 中部：距离 + 空闲枪数 + 电价 -->
            <view class="card-mid">
              <view class="mid-item">
                <text class="mid-icon">📍</text>
                <text class="mid-text">{{ formatDistance(station.distance) }}</text>
              </view>
              <view class="mid-item">
                <text class="mid-icon">⚡</text>
                <text class="mid-text">空闲 {{ station.availableCount }}/{{ station.totalCount }}</text>
              </view>
              <view class="mid-item">
                <text class="mid-icon">💰</text>
                <text class="mid-text price-text">¥{{ station.electricityPrice.toFixed(2) }}/度</text>
              </view>
            </view>

            <!-- 底部：操作按钮 -->
            <view class="card-actions">
              <view class="action-btn btn-navigate" @tap.stop="navigateTo(station)">
                <text class="btn-icon">🧭</text>
                <text class="btn-text">导航</text>
              </view>
              <view
                class="action-btn btn-charge"
                :class="{ disabled: station.availableCount <= 0 }"
                @tap.stop="startCharge(station)"
              >
                <text class="btn-icon">⚡</text>
                <text class="btn-text">充电</text>
              </view>
              <view class="action-btn btn-unfav" @tap.stop="unfavorite(station, idx)">
                <text class="btn-icon">✕</text>
                <text class="btn-text">取消收藏</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 左滑露出的删除区 -->
        <view class="card-delete-zone" @tap.stop="unfavorite(station, idx)">
          <text class="delete-text">取消</text>
          <text class="delete-text">收藏</text>
        </view>
      </view>

      <!-- 底部安全区 -->
      <view class="safe-bottom" />
    </scroll-view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading">
      <text class="empty-icon">⭐</text>
      <text class="empty-title">还没有收藏的站点</text>
      <text class="empty-hint">去发现附近好站~ ⚡</text>
      <view class="empty-btn" @tap="goFindStation">
        <text class="empty-btn-text">去找站</text>
      </view>
    </view>

    <!-- 首次加载骨架屏 -->
    <view class="skeleton-list" v-if="loading">
      <view class="skeleton-card" v-for="i in 3" :key="i">
        <view class="skeleton-line skeleton-title" />
        <view class="skeleton-line skeleton-addr" />
        <view class="skeleton-row">
          <view class="skeleton-line skeleton-tag" />
          <view class="skeleton-line skeleton-tag" />
          <view class="skeleton-line skeleton-tag" />
        </view>
      </view>
    </view>

    <!-- 下拉刷新提示 -->
    <view class="refresh-indicator" v-if="refreshing">
      <text class="refresh-text">正在刷新实时数据...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { api, type Station } from '@/api/index'

// ========== 扩展类型 ==========

interface FavoriteStation extends Station {
  _offsetX: number       // 左滑偏移量 (rpx)
  _rating: number        // 评分 (1~5)
  _sortOrder: number     // 用户排序权重
}

// ========== 响应式状态 ==========

const favorites = ref<FavoriteStation[]>([])
const loading = ref(true)
const refreshing = ref(false)
const scrollTop = ref(0)

// ========== 左滑删除状态 ==========

const swipeState = reactive({
  startX: 0,
  startY: 0,
  currentIndex: -1,
  swiping: false,
})

// ========== 拖拽排序状态 ==========

const dragState = reactive({
  draggingIndex: -1,
  overIndex: -1,
  startY: 0,
  isLongPressing: false,
  cardHeight: 200,
})

// ========== 定时刷新 ==========

let refreshTimer: ReturnType<typeof setInterval> | null = null

// ========== 工具函数 ==========

function formatDistance(d: number): string {
  if (!d || d <= 0) return '--'
  return d >= 1000 ? (d / 1000).toFixed(1) + 'km' : d + 'm'
}

function getStatusClass(station: FavoriteStation): string {
  if (station.availableCount > 5) return 'status-free'
  if (station.availableCount > 0) return 'status-tense'
  return 'status-full'
}

function getStatusText(station: FavoriteStation): string {
  if (station.availableCount > 5) return '空闲'
  if (station.availableCount > 0) return '紧张'
  return '已满'
}

function computeRating(stationId: string): number {
  // 确定性伪随机评分：基于 stationId hash 产生 3.5~5.0 之间的稳定值
  let hash = 0
  for (let i = 0; i < stationId.length; i++) {
    hash = ((hash << 5) - hash + stationId.charCodeAt(i)) | 0
  }
  return 3.5 + (Math.abs(hash) % 150) / 100
}

// ========== 统一触摸事件处理 ==========

function onTouchStart(e: TouchEvent, idx: number) {
  // 拖拽中忽略新触摸
  if (dragState.draggingIndex >= 0) return

  const touch = e.touches[0]
  swipeState.startX = touch.clientX
  swipeState.startY = touch.clientY
  swipeState.currentIndex = idx
  swipeState.swiping = false

  // 记录拖拽起始 Y（供 longpress 使用）
  dragState.startY = touch.clientY
}

function onTouchMove(e: TouchEvent, idx: number) {
  // 如果正在拖拽排序
  if (dragState.draggingIndex >= 0 && dragState.isLongPressing) {
    const touch = e.touches[0]
    const dy = touch.clientY - dragState.startY
    const cardStep = dragState.cardHeight
    const offsetSteps = Math.round(dy / cardStep)
    let newIndex = dragState.draggingIndex + offsetSteps
    newIndex = Math.max(0, Math.min(favorites.value.length - 1, newIndex))
    dragState.overIndex = newIndex
    return
  }

  // 左滑逻辑
  if (swipeState.currentIndex !== idx) return
  const touch = e.touches[0]
  const dx = touch.clientX - swipeState.startX
  const dy = touch.clientY - swipeState.startY

  // 判断是否为水平滑动
  if (!swipeState.swiping && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    swipeState.swiping = true
  }

  if (swipeState.swiping) {
    const offset = Math.min(0, Math.max(-200, dx * 2))
    favorites.value[idx]._offsetX = offset
  }
}

function onTouchEnd(_e: TouchEvent, idx: number) {
  // 拖拽排序结束
  if (dragState.draggingIndex >= 0 && dragState.isLongPressing) {
    const fromIdx = dragState.draggingIndex
    const toIdx = dragState.overIndex
    if (fromIdx !== toIdx) {
      const [moved] = favorites.value.splice(fromIdx, 1)
      favorites.value.splice(toIdx, 0, moved)
      favorites.value.forEach((item, i) => { item._sortOrder = i })
      api.reorderFavorites(favorites.value.map(s => s.id)).catch(() => {})
      uni.showToast({ title: '排序已更新', icon: 'success', duration: 800 })
    }
    dragState.draggingIndex = -1
    dragState.overIndex = -1
    dragState.isLongPressing = false
    return
  }

  // 左滑结束
  if (swipeState.currentIndex !== idx) return
  const st = favorites.value[idx]
  if (st && swipeState.swiping) {
    st._offsetX = st._offsetX < -100 ? -200 : 0
  }
  // 收起其他已展开的卡片
  favorites.value.forEach((item, i) => {
    if (i !== idx && item._offsetX !== 0) {
      item._offsetX = 0
    }
  })
  swipeState.currentIndex = -1
  swipeState.swiping = false
}

function onLongPress(idx: number) {
  if (swipeState.swiping) return
  dragState.isLongPressing = true
  dragState.draggingIndex = idx
  dragState.overIndex = idx

  // 估算卡片高度
  const sysInfo = uni.getSystemInfoSync()
  dragState.cardHeight = sysInfo.windowWidth * 0.42

  uni.vibrateShort({ type: 'medium' }).catch(() => {})
}

// ========== 业务操作 ==========

async function unfavorite(station: FavoriteStation, idx: number) {
  uni.showModal({
    title: '取消收藏',
    content: `确定取消收藏「${station.name}」吗？`,
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await api.removeFavorite(station.id)
        favorites.value.splice(idx, 1)
        uni.showToast({ title: '已取消收藏', icon: 'success' })
      } catch (e) {
        uni.showToast({ title: '操作失败，请重试', icon: 'none' })
      }
    },
  })
}

function navigateTo(station: FavoriteStation) {
  uni.openLocation({
    latitude: station.latitude,
    longitude: station.longitude,
    name: station.name,
    address: station.address,
  })
}

function startCharge(station: FavoriteStation) {
  if (station.availableCount <= 0) {
    uni.showToast({ title: '该站点已满，请稍后再试', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/charging/index?stationId=${station.id}` })
}

function goFindStation() {
  uni.switchTab({ url: '/pages/map/index' })
}

// ========== 数据加载 ==========

async function loadFavorites() {
  loading.value = true
  try {
    const data = await api.getFavorites()
    if (Array.isArray(data)) {
      favorites.value = (data as Station[]).map((s, i) => ({
        ...s,
        _offsetX: 0,
        _rating: computeRating(s.id),
        _sortOrder: i,
      }))
    }
  } catch (e) {
    favorites.value = []
  } finally {
    loading.value = false
  }
}

async function refreshRealtimeData() {
  if (favorites.value.length === 0) return
  refreshing.value = true
  try {
    const freshList = await api.getFavorites()
    if (Array.isArray(freshList)) {
      const oldMap = new Map(favorites.value.map(s => [s.id, s]))
      const updated: FavoriteStation[] = (freshList as Station[]).map((s) => {
        const old = oldMap.get(s.id)
        return {
          ...s,
          _offsetX: old?._offsetX || 0,
          _rating: old?._rating ?? computeRating(s.id),
          _sortOrder: old?._sortOrder ?? 0,
        }
      })
      updated.sort((a, b) => a._sortOrder - b._sortOrder)
      favorites.value = updated
    }
  } catch (e) {
    // 静默失败，不影响当前展示
  } finally {
    refreshing.value = false
  }
}

// ========== 生命周期 ==========

onMounted(() => {
  loadFavorites().then(() => {
    refreshTimer = setInterval(refreshRealtimeData, 30000)
  })
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style lang="scss">
@import '@/styles/variables.scss';

.favorites-page {
  min-height: 100vh;
  background: $color-bg-page;
  display: flex;
  flex-direction: column;
}

/* ===== 提示条 ===== */
.hint-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin: $spacing-lg $spacing-lg $spacing-md;
  padding: $spacing-md $spacing-lg;
  background: #FFFBE6;
  border-radius: $radius-md;
}

.hint-text {
  font-size: $font-size-sm;
  color: $color-warning;
}

.hint-divider {
  font-size: $font-size-xs;
  color: #F5D59A;
}

/* ===== 滚动列表 ===== */
.favorites-scroll {
  flex: 1;
  padding: 0 $spacing-lg;
}

/* ===== 站点卡片 ===== */
.station-card {
  position: relative;
  overflow: hidden;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
  transition: opacity 0.2s, transform 0.15s;

  &.is-dragging {
    opacity: 0.75;
    transform: scale(1.03);
    box-shadow: $shadow-lg;
    z-index: $z-index-card;
    position: relative;
  }

  &.is-over {
    border-top: 4rpx solid $color-primary;
  }
}

.drag-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  opacity: 0;
  transition: opacity 0.15s;

  &.visible {
    opacity: 1;
  }
}

.drag-dots {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.dot {
  font-size: 20rpx;
  color: $color-text-tertiary;
  line-height: 1;
}

.card-swipe-wrapper {
  position: relative;
  z-index: 2;
  transition: transform 0.25s ease;
}

.card-content {
  background: $color-bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  padding-left: 56rpx; // 为拖拽手柄留空间
  box-shadow: $shadow-sm;
}

/* 左滑删除区 */
.card-delete-zone {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 200rpx;
  background: $color-error;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  border-radius: 0 $radius-lg $radius-lg 0;
  z-index: 1;
}

.delete-text {
  font-size: $font-size-base;
  color: $color-text-inverse;
  font-weight: $font-weight-medium;
}

/* ===== 卡片顶部 ===== */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.station-info {
  flex: 1;
  margin-right: $spacing-md;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.station-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rating-wrap {
  display: flex;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
}

.rating-star {
  font-size: $font-size-sm;
  color: $color-warning;
}

.rating-value {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $color-warning;
  font-family: $font-family-number;
}

.station-address {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  margin-top: 6rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 状态标签 */
.status-tag {
  flex-shrink: 0;
  padding: 6rpx 16rpx;
  border-radius: $radius-sm;
}

.status-tag-text {
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
}

.status-free {
  background: #F6FFED;
  .status-tag-text { color: $color-success; }
}

.status-tense {
  background: #FFF7E6;
  .status-tag-text { color: $color-warning; }
}

.status-full {
  background: #FFF2F0;
  .status-tag-text { color: $color-error; }
}

/* ===== 卡片中部 ===== */
.card-mid {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  margin-top: $spacing-md;
  padding: $spacing-sm 0;
}

.mid-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.mid-icon {
  font-size: $font-size-sm;
}

.mid-text {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.price-text {
  color: $color-warning;
  font-weight: $font-weight-semibold;
  font-family: $font-family-number;
}

/* ===== 操作按钮区 ===== */
.card-actions {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 1rpx solid $color-bg-grey;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: $spacing-sm 0;
  border-radius: $radius-md;
  transition: transform $transition-fast;

  &:active {
    transform: scale(0.96);
  }
}

.btn-navigate {
  background: $color-bg-card;
  border: 2rpx solid $color-secondary;

  .btn-icon { color: $color-secondary; }
  .btn-text { color: $color-secondary; }
}

.btn-charge {
  background: $color-primary;
  border: 2rpx solid $color-primary;

  .btn-icon { color: $color-text-inverse; }
  .btn-text { color: $color-text-inverse; }

  &.disabled {
    background: #B7EB8F;
    border-color: #B7EB8F;
    opacity: 0.7;
  }
}

.btn-unfav {
  background: $color-bg-grey;
  border: 2rpx solid $color-bg-grey;

  .btn-icon { color: $color-text-tertiary; font-size: $font-size-xs; }
  .btn-text { color: $color-text-tertiary; }
}

.btn-icon {
  font-size: $font-size-base;
}

.btn-text {
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

/* ===== 空状态 ===== */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-3xl $spacing-xl;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: $spacing-lg;
}

.empty-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
}

.empty-hint {
  font-size: $font-size-base;
  color: $color-text-tertiary;
  margin-top: $spacing-sm;
}

.empty-btn {
  margin-top: $spacing-xl;
  padding: $spacing-md $spacing-3xl;
  background: $color-primary;
  border-radius: $radius-full;
  transition: transform $transition-fast;

  &:active {
    transform: scale(0.96);
  }
}

.empty-btn-text {
  font-size: $font-size-lg;
  font-weight: $font-weight-semibold;
  color: $color-text-inverse;
}

/* ===== 骨架屏 ===== */
.skeleton-list {
  padding: $spacing-lg;
}

.skeleton-card {
  background: $color-bg-card;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: $radius-sm;
}

.skeleton-title {
  width: 60%;
  height: 28rpx;
  margin-bottom: 12rpx;
}

.skeleton-addr {
  width: 80%;
  height: 22rpx;
  margin-bottom: 16rpx;
}

.skeleton-row {
  display: flex;
  gap: $spacing-md;
}

.skeleton-tag {
  width: 120rpx;
  height: 36rpx;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== 刷新指示器 ===== */
.refresh-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: $z-index-sticky;
  padding: $spacing-md 0;
  background: rgba($color-primary, 0.9);
  text-align: center;
}

.refresh-text {
  font-size: $font-size-sm;
  color: $color-text-inverse;
}

/* ===== 底部安全区 ===== */
.safe-bottom {
  height: calc(env(safe-area-inset-bottom, 0) + 24rpx);
}
</style>
