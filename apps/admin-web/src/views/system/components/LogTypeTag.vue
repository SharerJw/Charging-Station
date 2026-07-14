<script setup lang="ts">
/**
 * LogTypeTag 组件
 * 功能: 操作日志类型标签（登录/编辑/新增/删除/处理）
 */
import { computed } from 'vue'

const props = defineProps<{
  type: string
}>()

const typeMap: Record<string, string> = {
  '登录': '',
  '编辑': 'warning',
  '新增': 'success',
  '删除': 'danger',
  '处理': 'info',
}

const tagType = computed(() => typeMap[props.type] || 'info')
</script>

<template>
  <el-tag :type="(tagType as any)" size="small">{{ type }}</el-tag>
</template>
