<template>
  <!-- FilterBar 组件 (user-miniapp) -->
  <!-- 功能: 地图页充电类型筛选胶囊按钮组 -->
  <scroll-view class="filter-bar" scroll-x :show-scrollbar="false">
    <view class="filter-inner">
      <view
        v-for="filter in filters"
        :key="filter.key"
        class="filter-chip"
        :class="{ active: isActive(filter) }"
        @tap="handleTap(filter)"
      >
        <text v-if="filter.icon" class="chip-icon">{{ filter.icon }}</text>
        <text class="chip-label">{{ filter.label }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
interface FilterItem {
  key: string
  label: string
  icon?: string
  type: 'radio' | 'toggle'
}

const props = withDefaults(defineProps<{
  filters: FilterItem[]
  modelValue: Record<string, string | boolean>
  radioGroup?: string
}>(), {
  radioGroup: 'type',
})

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string | boolean>]
  change: [filterKey: string, value: string | boolean]
}>()

function isActive(filter: FilterItem): boolean {
  const val = props.modelValue[filter.key]
  if (filter.type === 'radio') {
    return val === filter.key
  }
  return val === true
}

function handleTap(filter: FilterItem) {
  const current = { ...props.modelValue }

  if (filter.type === 'radio') {
    // 单选互斥: 点击已选中的不取消，点击未选中的切换
    if (current[filter.key] === filter.key) return
    // 清除同组其他 radio 选中态
    props.filters
      .filter(f => f.type === 'radio')
      .forEach(f => { delete current[f.key] })
    current[filter.key] = filter.key
  } else {
    // toggle 开关: 切换布尔值
    current[filter.key] = current[filter.key] === true ? false : true
  }

  emit('update:modelValue', current)
  emit('change', filter.key, current[filter.key])
}
</script>

<style scoped>
.filter-bar {
  white-space: nowrap;
  padding: 16rpx 24rpx;
  background: transparent;
}

.filter-inner {
  display: inline-flex;
  gap: 12rpx;
  align-items: center;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: #fff;
  border: 2rpx solid #dcdfe6;
  box-sizing: border-box;
  flex-shrink: 0;
}

.filter-chip.active {
  background: #07C160;
  border-color: #07C160;
}

.chip-icon {
  font-size: 24rpx;
  margin-right: 6rpx;
}

.chip-label {
  font-size: 24rpx;
  color: #333;
  line-height: 56rpx;
}

.filter-chip.active .chip-label {
  color: #fff;
}
</style>
