<script setup lang="ts">
/**
 * TodoList 组件
 * 功能: 待办事项列表（告警/工单/结算/退款）
 * 方法: handleClick → 路由跳转
 */
import { useRouter } from 'vue-router'

defineProps<{
  items: Array<{ type: string; label: string; count: number; color: string; route: string }>
}>()

const router = useRouter()

function handleClick(route: string) {
  router.push(route)
}
</script>

<template>
  <el-card>
    <template #header><span>待办事项</span></template>
    <div class="todo-list">
      <div v-for="item in items" :key="item.type" class="todo-item" @click="handleClick(item.route)">
        <div class="todo-dot" :style="{ background: item.color }" />
        <span class="todo-label">{{ item.label }}</span>
        <span class="todo-count font-number" :style="{ color: item.color }">{{ item.count }}</span>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.todo-list { display: flex; flex-direction: column; gap: 12px; }
.todo-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: #fafafa; border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.todo-item:hover { background: #f0f5ff; }
.todo-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.todo-label { flex: 1; font-size: 14px; color: #333; }
.todo-count { font-size: 20px; font-weight: bold; }
</style>
