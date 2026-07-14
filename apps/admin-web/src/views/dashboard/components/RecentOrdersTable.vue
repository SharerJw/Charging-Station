<script setup lang="ts">
/**
 * RecentOrdersTable 组件
 * 功能: 最近订单列表，含状态标签、金额高亮
 */
import type { Order } from '@/types'
import { OrderStatus } from '@/types'

defineProps<{
  orders: Order[]
  loading?: boolean
}>()

const statusMap: Record<string, { label: string; type: string }> = {
  [OrderStatus.CHARGING]: { label: '充电中', type: 'warning' },
  [OrderStatus.PAID]: { label: '已完成', type: 'success' },
  [OrderStatus.REFUNDING]: { label: '退款中', type: 'info' },
  [OrderStatus.ABNORMAL]: { label: '异常', type: 'danger' },
}

function formatTime(time: string) {
  return time ? time.substring(11, 16) : '-'
}
</script>

<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>最近订单</span>
        <el-button type="primary" link>查看全部</el-button>
      </div>
    </template>
    <el-table :data="orders" v-loading="loading" stripe size="small">
      <el-table-column prop="orderNo" label="订单号" width="170" />
      <el-table-column prop="userName" label="用户" width="80" />
      <el-table-column prop="stationName" label="充电站" show-overflow-tooltip />
      <el-table-column label="电量" width="100" align="right">
        <template #default="{ row }"><span class="font-number">{{ row.consumedEnergy }} kWh</span></template>
      </el-table-column>
      <el-table-column label="金额" width="100" align="right">
        <template #default="{ row }"><span class="font-number amount">¥{{ row.payableAmount.toFixed(2) }}</span></template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="(statusMap[row.status]?.type as any)" size="small">{{ statusMap[row.status]?.label || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="70" align="center">
        <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; }
.amount { color: #FF4D4F; font-weight: bold; }
</style>
