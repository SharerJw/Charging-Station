<template>
  <div class="virtual-table" ref="containerRef" :style="{ height: height + 'px' }" @scroll="onScroll">
    <div class="virtual-table-header">
      <slot name="header" />
    </div>
    <div class="virtual-table-body" :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div :style="{ position: 'absolute', top: offsetY + 'px', width: '100%' }">
        <div v-for="item in visibleItems" :key="item.key" class="virtual-table-row">
          <slot name="row" :item="item.data" :index="item.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface VirtualItem {
  key: string | number
  data: any
  index: number
}

const props = withDefaults(defineProps<{
  items: any[]
  itemHeight?: number
  height?: number
  keyField?: string
}>(), {
  itemHeight: 48,
  height: 400,
  keyField: 'id',
})

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => Math.ceil(props.height / props.itemHeight) + 2)

const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - 1))

const offsetY = computed(() => startIndex.value * props.itemHeight)

const visibleItems = computed<VirtualItem[]>(() => {
  const start = startIndex.value
  const end = Math.min(start + visibleCount.value, props.items.length)
  return props.items.slice(start, end).map((data, i) => ({
    key: data[props.keyField] ?? start + i,
    data,
    index: start + i,
  }))
})

function onScroll(e: Event) {
  scrollTop.value = (e.target as HTMLElement).scrollTop
}
</script>

<style scoped>
.virtual-table {
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}
.virtual-table-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--el-fill-color-light);
}
.virtual-table-row {
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.virtual-table-row:hover {
  background: var(--el-fill-color-lighter);
}
</style>
