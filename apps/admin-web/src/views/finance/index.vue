<script setup lang="ts">
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const period = ref('month')
const detailVisible = ref(false)
const currentBill = ref<any>(null)

const summary = ref({
  totalRevenue: 1234567.89,
  monthRevenue: 456789.00,
  pendingSettlement: 123456.00,
  refundedAmount: 23456.78,
  todayRevenue: 15678.90,
  yesterdayRevenue: 14321.50,
})

const revenueChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['电费收入', '服务费收入'] },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'] },
  yAxis: { type: 'value', name: '元' },
  series: [
    { name: '电费收入', type: 'bar', stack: 'revenue', data: [180000, 210000, 230000, 250000, 280000, 320000, 350000], itemStyle: { color: '#1677FF' } },
    { name: '服务费收入', type: 'bar', stack: 'revenue', data: [60000, 70000, 77000, 83000, 93000, 107000, 117000], itemStyle: { color: '#4096FF' } },
  ],
}))

const channelChart = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['40%', '70%'],
    data: [
      { value: 65, name: '微信支付', itemStyle: { color: '#07C160' } },
      { value: 30, name: '支付宝', itemStyle: { color: '#1677FF' } },
      { value: 5, name: '余额支付', itemStyle: { color: '#FAAD14' } },
    ],
  }],
}))

const bills = ref([
  { id: 'B001', orderNo: 'ORD-20260713-001', amount: 77.35, channel: '微信支付', status: '已入账', time: '2026-07-13 15:31:00' },
  { id: 'B002', orderNo: 'ORD-20260713-002', amount: 62.40, channel: '支付宝', status: '已入账', time: '2026-07-13 15:30:00' },
  { id: 'B003', orderNo: 'ORD-20260712-001', amount: 95.20, channel: '微信支付', status: '已入账', time: '2026-07-12 17:16:00' },
  { id: 'B004', orderNo: 'ORD-20260712-002', amount: 45.80, channel: '余额支付', status: '待结算', time: '2026-07-12 16:00:00' },
  { id: 'B005', orderNo: 'ORD-20260711-001', amount: 11.55, channel: '微信支付', status: '已退款', time: '2026-07-11 21:31:00' },
])

const statusColors: Record<string, string> = { '已入账': 'success', '待结算': 'warning', '已退款': 'info' }

function viewBillDetail(bill: any) {
  currentBill.value = bill
  detailVisible.value = true
}
</script>

<template>
  <div class="finance-page">
    <!-- 汇总卡片 -->
    <div class="summary-grid">
      <el-card v-for="(item, key) in { totalRevenue: '总收入', monthRevenue: '本月收入', todayRevenue: '今日收入', pendingSettlement: '待结算', refundedAmount: '已退款' }" :key="key" shadow="hover">
        <div class="summary-item">
          <div class="summary-label">{{ item }}</div>
          <div class="summary-value font-number">¥{{ (summary as any)[key].toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
        </div>
      </el-card>
    </div>

    <!-- 图表区 -->
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>营收趋势</span>
              <el-radio-group v-model="period" size="small">
                <el-radio-button value="week">本周</el-radio-button>
                <el-radio-button value="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart :option="revenueChart" style="height: 300px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span>支付渠道占比</span></template>
          <v-chart :option="channelChart" style="height: 300px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 账单列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资金流水</span>
          <el-button type="primary">导出</el-button>
        </div>
      </template>
      <el-table :data="bills" stripe border>
        <el-table-column prop="orderNo" label="关联订单" width="180" />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }"><span class="font-number amount">¥{{ row.amount.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="channel" label="支付渠道" width="120" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }"><el-tag :type="(statusColors[row.status] as any)" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="time" label="时间" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewBillDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 账单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="账单详情" width="500px">
      <template v-if="currentBill">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="账单号">{{ currentBill.id }}</el-descriptions-item>
          <el-descriptions-item label="关联订单">{{ currentBill.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="金额"><span class="font-number amount">¥{{ currentBill.amount.toFixed(2) }}</span></el-descriptions-item>
          <el-descriptions-item label="支付渠道">{{ currentBill.channel }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(statusColors[currentBill.status] as any)" size="small">{{ currentBill.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ currentBill.time }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.finance-page { display: flex; flex-direction: column; gap: 16px; }
.summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.summary-item { text-align: center; padding: 8px 0; }
.summary-label { font-size: 13px; color: #999; }
.summary-value { font-size: 22px; font-weight: bold; color: #1677FF; margin-top: 4px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.amount { color: #FF4D4F; font-weight: bold; }
</style>
