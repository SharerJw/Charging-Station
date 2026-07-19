<template>
  <div class="virtual-list" ref="containerRef" :style="{ height: height + 'px' }" @scroll="onScroll">
    <!-- 头部插槽 -->
    <slot name="header" />

    <!-- 虚拟滚动区域 -->
    <div class="virtual-list-viewport" :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div :style="{ position: 'absolute', top: offsetY + 'px', width: '100%' }">
        <div
          v-for="item in visibleItems"
          :key="item.key"
          class="virtual-list-item"
          @click="handleItemClick(item)"
        >
          <slot name="item" :item="item.data" :index="item.index" />
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="virtual-list-loading">
      <slot name="loading">
        <div class="loading-spinner">
          <span class="spinner"></span>
          <span>加载中...</span>
        </div>
      </slot>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && items.length === 0" class="virtual-list-empty">
      <slot name="empty">
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <span>暂无数据</span>
        </div>
      </slot>
    </div>

    <!-- 底部加载更多提示 -->
    <div v-if="!loading && items.length > 0 && noMore" class="virtual-list-no-more">
      <slot name="no-more">
        <span>没有更多数据了</span>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

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
  bufferSize?: number
  loading?: boolean
  noMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 48,
  height: 400,
  keyField: 'id',
  bufferSize: 5,
  loading: false,
  noMore: false,
})

const emit = defineEmits<{
  (e: 'scroll-bottom'): void
  (e: 'item-click', item: Record<string, unknown>, index: number): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(props.height)

// 计算总高度
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 计算可见区域可显示的项目数量
const visibleCount = computed(() => Math.ceil(containerHeight.value / props.itemHeight) + props.bufferSize * 2)

// 计算起始索引（带缓冲区）
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.bufferSize
  return Math.max(0, index)
})

// 计算偏移量
const offsetY = computed(() => startIndex.value * props.itemHeight)

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
function onScroll(e: Event) {
  const target = e.target as HTMLElement
  scrollTop.value = target.scrollTop

  // 检查是否滚动到底部
  const { scrollHeight, clientHeight } = target
  if (scrollHeight - clientHeight - scrollTop.value < 50) {
    emit('scroll-bottom')
  }
}

// 点击项目处理
function handleItemClick(item: VirtualItem) {
  emit('item-click', item.data, item.index)
}

// 滚动到指定索引
function scrollToIndex(index: number) {
  if (!containerRef.value) return
  const targetScrollTop = index * props.itemHeight
  containerRef.value.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth',
  })
}

// 滚动到顶部
function scrollToTop() {
  if (!containerRef.value) return
  containerRef.value.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// 滚动到底部
function scrollToBottom() {
  if (!containerRef.value) return
  containerRef.value.scrollTo({
    top: totalHeight.value,
    behavior: 'smooth',
  })
}

// 监听容器尺寸变化
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    containerHeight.value = containerRef.value.clientHeight

    // 使用 ResizeObserver 监听容器尺寸变化
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
})
</script>

<style scoped>
.virtual-list {
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
}

.virtual-list-viewport {
  min-height: 100px;
}

.virtual-list-item {
  border-bottom: 1px solid var(--el-border-color-extra-light);
  transition: background-color 0.2s;
}

.virtual-list-item:hover {
  background-color: var(--el-fill-color-lighter);
}

.virtual-list-loading,
.virtual-list-empty,
.virtual-list-no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--el-border-color);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 32px;
}
</style>