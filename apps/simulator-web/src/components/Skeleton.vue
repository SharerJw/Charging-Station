<script setup lang="ts">
defineProps<{
  rows?: number
  avatar?: boolean
}>()
</script>

<template>
  <div class="skeleton-wrapper">
    <div v-if="avatar" class="skeleton-avatar skeleton" />
    <div class="skeleton-content">
      <div class="skeleton-title skeleton" />
      <div v-for="i in (rows || 3)" :key="i" class="skeleton-row skeleton" :style="{ width: i === (rows || 3) ? '60%' : '100%' }" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-wrapper { display: flex; gap: 16px; padding: 16px; }
.skeleton-avatar { width: 48px; height: 48px; border-radius: 50%; flex-shrink: 0; }
.skeleton-content { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.skeleton-title { height: 20px; width: 40%; }
.skeleton-row { height: 14px; }
</style>
