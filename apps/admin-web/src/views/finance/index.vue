<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { financeApi } from '@/api'
import dayjs from 'dayjs'

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const loading = ref(false)
const period = ref('month')
const detailVisible = ref(false)
const currentBill = ref<any>(null)

// 默认查询本月数据
const dateRange = ref<[string, string]>([
  dayjs().startOf('month').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])

const summary = ref({
  totalRevenue: 0,
  totalElectricityFee: 0,
  totalServiceFee: 0,
  totalOrderCount: 0,
  totalEnergyWh: 0,
  avgOrderAmount: 0,
  refundAmount: 0,
  refundCount: 0,
})

const bills = ref<any[]>([])

// 加载汇总数据
async function loadSummary() {
  loading.value = true
  try {
    const data = await financeApi.summary({
      startTime: dateRange.value[0],
      endTime: dateRange.value[1],
    })
    summary.value = data
  } catch (error) {
    console.error('Failed to load finance summary:', error)
  } finally {
    loading.value = false
  }
}

// 加载账单列表
async function loadBills() {
  try {
    const result = await financeApi.bills({ page: 1, size: 20 })
    bills.value = result?.list || []
  } catch (error) {
    console.error('Failed to load bills:', error)
  }
}

// 切换时间范围
function changePeriod(newPeriod: string) {
  period.value = newPeriod
  if (newPeriod === 'today') {
    dateRange.value = [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
  } else if (newPeriod === 'week') {
    dateRange.value = [dayjs().subtract(7, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
  } else if (newPeriod === 'month') {
    dateRange.value = [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
  }
  loadSummary()
}

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

const statusColors: Record<string, string> = { '已入账': 'success', '待结算': 'warning', '已退款': 'info' }

function viewBillDetail(bill: any) {
  currentBill.value = bill
  detailVisible.value = true
}

// 初始化
onMounted(() => {
  loadSummary()
  loadBills()
})
</script>

<template>
  <div class="finance-page" v-loading="loading">
    <!-- 汇总卡片 -->
    <div class="summary-grid">
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">总收入</div>
          <div class="summary-value font-number">¥{{ (summary.totalRevenue / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">总订单数</div>
          <div class="summary-value font-number">{{ summary.totalOrderCount }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">电费收入</div>
          <div class="summary-value font-number">¥{{ (summary.totalElectricityFee / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">服务费收入</div>
          <div class="summary-value font-number">¥{{ (summary.totalServiceFee / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
        </div>
      </el-card>
      <el-card shadow="hover">
        <div class="summary-item">
          <div class="summary-label">已退款</div>
          <div class="summary-value font-number">¥{{ (summary.refundAmount / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}</div>
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
              <el-radio-group v-model="period" size="small" @change="changePeriod">
                <el-radio-button value="today">今日</el-radio-button>
                <el-radio-button value="week">近7天</el-radio-button>
                <el-radio-button value="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart :option="revenueChart" style="height: 300px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span>支付渠道分布</span></template>
          <v-chart :option="channelChart" style="height: 300px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 账单明细 -->
    <el-card>
      <template #header><span>账单明细</span></template>
      <el-table :data="bills" stripe size="small">
        <el-table-column prop="orderNo" label="订单号" width="170" />
        <el-table-column label="用户" width="100">
          <template #default="{ row }">{{ row.userNickname || '-' }}</template>
        </el-table-column>
        <el-table-column prop="stationName" label="充电站" show-overflow-tooltip />
        <el-table-column label="电量" width="100" align="right">
          <template #default="{ row }"><span class="font-number">{{ row.energyWh || 0 }} kWh</span></template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="{ row }"><span class="font-number amount">¥{{ (row.totalAmount / 100 || 0).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="(statusColors[row.status] as any)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="160" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewBillDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.finance-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.summary-item {
  text-align: center;
  padding: 8px 0;
}

.summary-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #1677FF;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  color: #1677FF;
  font-weight: bold;
}
</style>
