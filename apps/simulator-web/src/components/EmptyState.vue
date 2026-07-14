<script setup lang="ts">
defineProps<{
  icon?: string
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon || '📭' }}</div>
    <div class="empty-title">{{ title || '暂无数据' }}</div>
    <div v-if="description" class="empty-desc">{{ description }}</div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-title { font-size: 16px; color: var(--color-text-secondary); margin-bottom: 8px; }
.empty-desc { font-size: 13px; color: var(--color-text-tertiary); text-align: center; max-width: 300px; line-height: 1.6; }
</style>
