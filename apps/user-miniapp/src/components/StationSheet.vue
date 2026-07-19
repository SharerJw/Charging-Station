<template>
  <!-- StationSheet 组件 (user-miniapp) -->
  <!-- 功能: 可拖拽底部面板，用于地图页站点列表区域 -->
  <view
    class="station-sheet"
    :class="{ 'is-dragging': isDragging }"
    :style="{ height: currentHeight + 'rpx' }"
  >
    <!-- 拖拽把手 -->
    <view class="drag-handle" @touchstart.prevent="onTouchStart" @touchmove.prevent="onTouchMove" @touchend="onTouchEnd">
      <view class="handle-bar" />
    </view>

    <!-- 头部插槽 -->
    <view v-if="$slots.header" class="sheet-header">
      <slot name="header" />
    </view>

    <!-- 内容滚动区 -->
    <scroll-view
      class="sheet-content"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <slot />
      <!-- 上拉加载提示 -->
      <view v-if="loadingMore" class="load-more">
        <text class="load-more-text">加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  /** 最小高度 rpx，默认 30vh 对应值 */
  minHeight?: number
  /** 最大高度 rpx，默认 85vh 对应值 */
  maxHeight?: number
  /** 初始高度 rpx，默认 40vh 对应值 */
  initialHeight?: number
  /** 面板标题 */
  title?: string
  /** 是否正在加载更多 */
  loadingMore?: boolean
}>(), {
  minHeight: 0,
  maxHeight: 0,
  initialHeight: 0,
  title: '',
  loadingMore: false,
})

const emit = defineEmits<{
  (e: 'dragStart'): void
  (e: 'dragEnd', height: number): void
  (e: 'heightChange', height: number): void
  (e: 'refresh'): void
  (e: 'loadMore'): void
}>()

/** 获取视口高度对应的 rpx 值 */
function vhToRpx(vh: number): number {
  // uni-app 中 750rpx = 屏幕宽度，取系统信息换算
  const sysInfo = uni.getSystemInfoSync()
  // 屏幕高度 px，转换为 rpx（以 750 为基准）
  const screenHeightRpx = (sysInfo.windowHeight / sysInfo.windowWidth) * 750
  return Math.round(screenHeightRpx * (vh / 100))
}

/** 实际最小高度 */
const realMinHeight = computed(() => (props.minHeight > 0 ? props.minHeight : vhToRpx(30)))
/** 实际最大高度 */
const realMaxHeight = computed(() => (props.maxHeight > 0 ? props.maxHeight : vhToRpx(85)))
/** 实际初始高度 */
const realInitialHeight = computed(() => (props.initialHeight > 0 ? props.initialHeight : vhToRpx(40)))

const currentHeight = ref(realInitialHeight.value)
const isDragging = ref(false)
const isRefreshing = ref(false)

let startY = 0
let startHeight = 0

function onTouchStart(e: TouchEvent) {
  isDragging.value = true
  startY = e.touches[0].clientY
  startHeight = currentHeight.value
  emit('dragStart')
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  const touchY = e.touches[0].clientY
  // 向上拖动为负值，面板应增高
  const deltaY = startY - touchY
  // 将 px 差值转为 rpx 差值
  const sysInfo = uni.getSystemInfoSync()
  const deltaRpx = (deltaY / sysInfo.windowWidth) * 750
  let newHeight = startHeight + deltaRpx
  newHeight = Math.max(realMinHeight.value, Math.min(realMaxHeight.value, newHeight))
  currentHeight.value = newHeight
  emit('heightChange', Math.round(newHeight))
}

function onTouchEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  emit('dragEnd', Math.round(currentHeight.value))
}

function onRefresh() {
  isRefreshing.value = true
  emit('refresh')
  // 由父组件控制 isRefreshing 状态，提供 5s 超时保护
  setTimeout(() => {
    isRefreshing.value = false
  }, 5000)
}

function onLoadMore() {
  emit('loadMore')
}

/** 供父组件调用：停止刷新状态 */
function stopRefresh() {
  isRefreshing.value = false
}

onMounted(() => {
  currentHeight.value = realInitialHeight.value
})

defineExpose({ stopRefresh })
</script>

<style scoped>
.station-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
  z-index: 100;
  transition: height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.station-sheet.is-dragging {
  transition: none;
}

.drag-handle {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16rpx 0 8rpx;
  flex-shrink: 0;
}

.handle-bar {
  width: 64rpx;
  height: 6rpx;
  background: #d9d9d9;
  border-radius: 3rpx;
}

.sheet-header {
  padding: 0 24rpx 16rpx;
  flex-shrink: 0;
}

.sheet-content {
  flex: 1;
  overflow: hidden;
  padding: 0 24rpx;
}

.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx 0;
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}
</style>
