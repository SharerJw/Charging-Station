<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { deviceApi } from '@/api'

interface Device {
  id: string
  name: string
  ocppId: string
  model: string
  status: string
}

const props = defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 设备列表和分页
const allDevices = ref<Device[]>([])
const displayDevices = ref<Device[]>([])
const loading = ref(false)
const searchQuery = ref('')
const pageSize = 20
const currentPage = ref(1)
const hasMore = ref(true)

// 下拉框状态
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 加载所有设备（用于搜索）
async function loadAllDevices() {
  try {
    const result = await deviceApi.list({ page: 1, size: 1000 })
    allDevices.value = result?.list || []
    filterAndPaginate()
  } catch (error) {
    console.error('Failed to load devices:', error)
  }
}

// 过滤和分页
function filterAndPaginate() {
  let filtered = allDevices.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.ocppId.toLowerCase().includes(query) ||
      d.model.toLowerCase().includes(query)
    )
  }

  // 分页
  const start = 0
  const end = currentPage.value * pageSize
  displayDevices.value = filtered.slice(start, end)
  hasMore.value = end < filtered.length
}

// 搜索
function handleSearch(query: string) {
  searchQuery.value = query
  currentPage.value = 1
  filterAndPaginate()
}

// 加载更多
function loadMore() {
  if (!hasMore.value || loading.value) return
  currentPage.value++
  filterAndPaginate()
}

// 滚动加载
function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollHeight - scrollTop - clientHeight < 50) {
    loadMore()
  }
}

// 选择设备
function selectDevice(id: string) {
  emit('update:modelValue', id)
  isOpen.value = false
}

// 获取显示文本
const displayText = computed(() => {
  const device = allDevices.value.find(d => d.id === props.modelValue)
  return device ? `${device.name} (${device.ocppId})` : props.placeholder || '选择设备...'
})

// 点击外部关闭
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

// 初始化
onMounted(() => {
  loadAllDevices()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听外部值变化
watch(() => props.modelValue, () => {
  // 值变化时不需要特殊处理
})
</script>

<template>
  <div class="device-select" ref="dropdownRef">
    <div
      class="select-trigger"
      :class="{ active: isOpen, disabled: disabled }"
      @click="!disabled && (isOpen = !isOpen)"
    >
      <span class="trigger-text">{{ displayText }}</span>
      <span class="trigger-arrow" :class="{ open: isOpen }">▼</span>
    </div>

    <div v-if="isOpen" class="select-dropdown">
      <!-- 搜索框 -->
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="输入搜索设备名称/ID/型号..."
          @input="handleSearch(searchQuery)"
          @click.stop
        />
      </div>

      <!-- 设备列表 -->
      <div class="device-list" @scroll="handleScroll">
        <div
          v-for="device in displayDevices"
          :key="device.id"
          class="device-item"
          :class="{ selected: device.id === modelValue }"
          @click="selectDevice(device.id)"
        >
          <span class="device-name">{{ device.name }}</span>
          <span class="device-id">{{ device.ocppId }}</span>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="loading-more" @click.stop="loadMore">
          加载更多...
        </div>

        <!-- 空状态 -->
        <div v-if="displayDevices.length === 0 && !loading" class="empty-state">
          暂无匹配设备
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.device-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.select-trigger:hover {
  border-color: #409eff;
}

.select-trigger.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.select-trigger.disabled {
  background: #f5f7fa;
  cursor: not-allowed;
}

.trigger-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #606266;
}

.trigger-arrow {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.trigger-arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.search-box input:focus {
  border-color: #409eff;
}

.device-list {
  max-height: 300px;
  overflow-y: auto;
}

.device-item {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.device-item:hover {
  background: #f5f7fa;
}

.device-item.selected {
  background: #ecf5ff;
  color: #409eff;
}

.device-name {
  font-size: 14px;
  color: #303133;
}

.device-id {
  font-size: 12px;
  color: #909399;
}

.loading-more {
  padding: 10px;
  text-align: center;
  color: #409eff;
  cursor: pointer;
  font-size: 13px;
}

.loading-more:hover {
  background: #f5f7fa;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
