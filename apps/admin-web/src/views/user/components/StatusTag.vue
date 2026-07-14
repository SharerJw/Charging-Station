<script setup lang="ts">
/**
 * UserStatusTag 组件
 * 功能: 用户状态标签（正常/禁用）
 */
import { computed } from 'vue'
import { UserStatus } from '@/types'

const props = defineProps<{
  status: UserStatus
}>()

const isActive = computed(() => props.status === UserStatus.ACTIVE)
</script>

<template>
  <el-tag :type="isActive ? 'success' : 'danger'" size="small">
    {{ isActive ? '正常' : '禁用' }}
  </el-tag>
</template>
