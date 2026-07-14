<script setup lang="ts">
defineProps<{
  columns?: number
  rows?: number
}>()
</script>

<template>
  <div class="skeleton-table">
    <div class="skeleton-header">
      <div v-for="i in (columns || 5)" :key="i" class="skeleton-cell skeleton" />
    </div>
    <div v-for="r in (rows || 5)" :key="r" class="skeleton-row">
      <div v-for="c in (columns || 5)" :key="c" class="skeleton-cell skeleton" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-header {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-header .skeleton-cell {
  height: 16px;
  flex: 1;
}

.skeleton-row {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.skeleton-row .skeleton-cell {
  height: 14px;
  flex: 1;
}
</style>
