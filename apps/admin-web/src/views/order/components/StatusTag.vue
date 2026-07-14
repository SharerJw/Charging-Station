<script setup lang="ts">
/**
 * OrderStatusTag 组件
 * 功能: 订单状态标签
 */
import { computed } from 'vue'
import { OrderStatus } from '@/types'

const props = defineProps<{
  status: OrderStatus
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  [OrderStatus.CREATED]: { label: '已创建', type: 'info' },
  [OrderStatus.CHARGING]: { label: '充电中', type: 'warning' },
  [OrderStatus.STOPPING]: { label: '停止中', type: 'warning' },
  [OrderStatus.STOPPED]: { label: '已停止', type: 'info' },
  [OrderStatus.SETTLING]: { label: '结算中', type: 'info' },
  [OrderStatus.SETTLED]: { label: '已结算', type: '' },
  [OrderStatus.PAYING]: { label: '支付中', type: 'warning' },
  [OrderStatus.PAID]: { label: '已完成', type: 'success' },
  [OrderStatus.REFUNDING]: { label: '退款中', type: 'info' },
  [OrderStatus.ABNORMAL]: { label: '异常', type: 'danger' },
  [OrderStatus.CANCELLED]: { label: '已取消', type: 'info' },
}

const info = computed(() => statusMap[props.status] || { label: props.status, type: 'info' })
</script>

<template>
  <el-tag :type="(info.type as any)" size="small">{{ info.label }}</el-tag>
</template>
