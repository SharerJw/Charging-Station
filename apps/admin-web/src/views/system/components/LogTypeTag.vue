<script setup lang="ts">
/**
 * LogTypeTag 组件
 * 功能: 操作日志类型标签
 * 支持: 登录/新增/编辑/删除/处理/退款/导出/启停 等操作类型
 */
import { computed } from 'vue'

const props = defineProps<{
  type: string
}>()

const typeMap: Record<string, string> = {
  '登录': '',
  '新增': 'success',
  '编辑': 'warning',
  '删除': 'danger',
  '处理': 'info',
  '退款': 'danger',
  '导出': '',
  '启停': 'warning',
  '配置': 'warning',
  '分配': 'success',
  '重置': 'danger',
}

const tagType = computed(() => typeMap[props.type] || 'info')
</script>

<template>
  <el-tag :type="(tagType as any)" size="small">{{ type }}</el-tag>
</template>
