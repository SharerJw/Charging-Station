<script setup lang="ts">
import { computed } from 'vue'
import { useOrderStore } from '@/store/order'
import { OrderStatus, PayMethod } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible'])

const orderStore = useOrderStore()

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const order = computed(() => orderStore.currentOrder)

const statusMap: Record<string, { label: string; type: string }> = {
  [OrderStatus.CHARGING]: { label: '充电中', type: 'warning' },
  [OrderStatus.PAID]: { label: '已完成', type: 'success' },
  [OrderStatus.REFUNDING]: { label: '退款中', type: 'info' },
  [OrderStatus.ABNORMAL]: { label: '异常', type: 'danger' },
  [OrderStatus.CANCELLED]: { label: '已取消', type: 'info' },
}

const payMethodMap: Record<string, string> = {
  [PayMethod.WECHAT]: '微信支付',
  [PayMethod.ALIPAY]: '支付宝',
  [PayMethod.BALANCE]: '余额支付',
}

function formatDuration(seconds: number): string {
  if (!seconds) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}时${m}分` : `${m}分`
}

// 时间线数据
const timeline = computed(() => {
  if (!order.value) return []
  const items = [
    { time: order.value.startTime, label: '开始充电', color: '#1677FF' },
  ]
  if (order.value.endTime) {
    items.push({ time: order.value.endTime, label: '充电结束', color: '#52C41A' })
  }
  if (order.value.payTime) {
    items.push({ time: order.value.payTime, label: '支付完成', color: '#FAAD14' })
  }
  return items
})
</script>

<template>
  <el-drawer v-model="drawerVisible" title="订单详情" size="55%" destroy-on-close>
    <template v-if="order">
      <!-- 基本信息 -->
      <h4 class="section-title">订单信息</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="(statusMap[order.status]?.type as any)" size="small">
            {{ statusMap[order.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户">{{ order.userName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ order.userPhone }}</el-descriptions-item>
        <el-descriptions-item label="充电站" :span="2">{{ order.stationName }}</el-descriptions-item>
        <el-descriptions-item label="设备">{{ order.deviceCode }}</el-descriptions-item>
        <el-descriptions-item label="接口">#{{ order.connectorId }}</el-descriptions-item>
      </el-descriptions>

      <!-- 充电数据 -->
      <h4 class="section-title">充电数据</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="开始SOC">{{ order.startSoc }}%</el-descriptions-item>
        <el-descriptions-item label="结束SOC">{{ order.endSoc || '-' }}%</el-descriptions-item>
        <el-descriptions-item label="充电电量">{{ order.consumedEnergy }} kWh</el-descriptions-item>
        <el-descriptions-item label="充电时长">{{ formatDuration(order.duration) }}</el-descriptions-item>
        <el-descriptions-item label="起始电表">{{ order.startMeterValue }} kWh</el-descriptions-item>
        <el-descriptions-item label="结束电表">{{ order.endMeterValue || '-' }} kWh</el-descriptions-item>
      </el-descriptions>

      <!-- 费用明细 -->
      <h4 class="section-title">费用明细</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="电费">
          <span class="font-number">¥{{ order.electricityAmount.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="服务费">
          <span class="font-number">¥{{ order.serviceAmount.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="停车费">
          <span class="font-number">¥{{ order.parkingAmount.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="优惠">
          <span class="font-number discount">-¥{{ order.discountAmount.toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="应付金额" :span="2">
          <span class="font-number amount" style="font-size: 18px">¥{{ order.payableAmount.toFixed(2) }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 支付信息 -->
      <h4 class="section-title">支付信息</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="支付方式">{{ payMethodMap[order.payMethod || ''] || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ order.payTime || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 时间线 -->
      <h4 class="section-title">订单时间线</h4>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in timeline"
          :key="index"
          :timestamp="item.time"
          :color="item.color"
        >
          {{ item.label }}
        </el-timeline-item>
      </el-timeline>
    </template>
  </el-drawer>
</template>

<style scoped>
.section-title {
  font-size: 15px; color: #333; margin: 20px 0 12px;
  padding-bottom: 8px; border-bottom: 1px solid #f0f0f0;
}
.section-title:first-child { margin-top: 0; }
.amount { color: #FF4D4F; font-weight: bold; }
.discount { color: #52C41A; }
</style>
