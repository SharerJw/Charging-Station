<template>
  <scroll-view
    class="virtual-list"
    scroll-y
    :style="{ height: height + 'px' }"
    @scroll="onScroll"
    @scrolltolower="onScrollToLower"
  >
    <!-- 头部插槽 -->
    <slot name="header" />

    <!-- 虚拟滚动区域 -->
    <view class="virtual-list-viewport" :style="{ height: totalHeight + 'px' }">
      <view
        v-for="item in visibleItems"
        :key="item.key"
        class="virtual-list-item"
        @click="handleItemClick(item)"
      >
        <slot name="item" :item="item.data" :index="item.index" />
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="virtual-list-loading">
      <slot name="loading">
        <view class="loading-content">
          <view class="loading-spinner"></view>
          <text class="loading-text">加载中...</text>
        </view>
      </slot>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && items.length === 0" class="virtual-list-empty">
      <slot name="empty">
        <view class="empty-state">
          <text class="empty-icon">📭</text>
          <text class="empty-text">暂无数据</text>
        </view>
      </slot>
    </view>

    <!-- 没有更多 -->
    <view v-if="!loading && items.length > 0 && noMore" class="virtual-list-no-more">
      <slot name="no-more">
        <text class="no-more-text">没有更多数据了</text>
      </slot>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface VirtualItem {
  key: string | number
  data: Record<string, unknown>
  index: number
}

interface Props {
  items: Record<string, unknown>[]
  itemHeight?: number
  height?: number
  keyField?: string
  loading?: boolean
  noMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 80,
  height: 600,
  keyField: 'id',
  loading: false,
  noMore: false,
})

const emit = defineEmits<{
  (e: 'scrolltolower'): void
  (e: 'item-click', item: Record<string, unknown>, index: number): void
}>()

const scrollTop = ref(0)

// 计算总高度
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 计算可见项目数量（带缓冲区）
const visibleCount = computed(() => Math.ceil(props.height / props.itemHeight) + 4)

// 计算起始索引
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - 2
  return Math.max(0, index)
})

// 计算可见项目
const visibleItems = computed<VirtualItem[]>(() => {
  const start = startIndex.value
  const end = Math.min(start + visibleCount.value, props.items.length)
  return props.items.slice(start, end).map((data, i) => ({
    key: (data[props.keyField] as string | number) ?? start + i,
    data,
    index: start + i,
  }))
})

// 滚动处理
function onScroll(e: { detail: { scrollTop: number } }) {
  scrollTop.value = e.detail.scrollTop
}

// 滚动到底部处理
function onScrollToLower() {
  emit('scrolltolower')
}

// 点击项目处理
function handleItemClick(item: VirtualItem) {
  emit('item-click', item.data, item.index)
}

// 滚动到指定索引
function scrollToIndex(index: number) {
  // UniApp 中需要通过 scroll-view 的 scroll-top 属性控制
  // 这里通过修改 scrollTop 来实现
  scrollTop.value = index * props.itemHeight
}

// 滚动到顶部
function scrollToTop() {
  scrollTop.value = 0
}

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToTop,
})
</script>

<style scoped>
.virtual-list {
  width: 100%;
  background-color: #f6f7fb;
}

.virtual-list-viewport {
  position: relative;
}

.virtual-list-item {
  border-bottom: 1rpx solid #eee;
}

.virtual-list-item:active {
  background-color: #f0f0f0;
}

.virtual-list-loading,
.virtual-list-empty,
.virtual-list-no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24rpx;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid #ddd;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.no-more-text {
  font-size: 28rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 48rpx 0;
}

.empty-icon {
  font-size: 64rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>