<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])
import { useDashboardStore } from '@/store/dashboard'
import { useRouter } from 'vue-router'
import { OrderStatus } from '@/types'
import KpiCard from './components/KpiCard.vue'

const router = useRouter()
const dashboardStore = useDashboardStore()
const chartPeriod = ref('7d')

onMounted(() => {
  dashboardStore.fetchAll()
})

// KPI 卡片数据（6个）
const statsCards = computed(() => [
  { title: '今日充电量', value: '8,901', unit: 'kWh', trend: '+12.3%', trendUp: true, color: '#1677FF', icon: '⚡' },
  { title: '今日营收', value: '¥15,678', unit: '', trend: '+8.7%', trendUp: true, color: '#52C41A', icon: '💰' },
  { title: '今日订单数', value: '128', unit: '笔', trend: '+15.2%', trendUp: true, color: '#FAAD14', icon: '📋' },
  { title: '活跃用户数', value: '1,024', unit: '人', trend: '-2.1%', trendUp: false, color: '#FF4D4F', icon: '👥' },
  { title: '设备在线率', value: '98.5', unit: '%', trend: '+0.3%', trendUp: true, color: '#13C2C2', icon: '🟢' },
  { title: '设备利用率', value: '34.2', unit: '%', trend: '+1.5%', trendUp: true, color: '#722ED1', icon: '📊' },
])

// 营收趋势图
const revenueChart = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
  legend: { data: ['电费收入', '服务费收入', '订单量'], top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: dashboardStore.chartData.dates, axisLabel: { color: '#666' } },
  yAxis: [
    { type: 'value', name: '金额(元)', axisLabel: { color: '#666' } },
    { type: 'value', name: '订单量', axisLabel: { color: '#666' } },
  ],
  series: [
    {
      name: '电费收入', type: 'bar', stack: 'revenue',
      data: dashboardStore.chartData.revenues.map(v => Math.floor(v * 0.7)),
      itemStyle: { color: '#1677FF', borderRadius: [0, 0, 0, 0] },
    },
    {
      name: '服务费收入', type: 'bar', stack: 'revenue',
      data: dashboardStore.chartData.revenues.map(v => Math.floor(v * 0.3)),
      itemStyle: { color: '#4096FF', borderRadius: [4, 4, 0, 0] },
    },
    {
      name: '订单量', type: 'line', yAxisIndex: 1, smooth: true,
      data: dashboardStore.chartData.orderCounts,
      itemStyle: { color: '#FAAD14' },
    },
  ],
}))

// 站点营收排行
const stationRankChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', axisLabel: { color: '#666' } },
  yAxis: {
    type: 'category',
    data: ['杭州西湖慢充站', '深圳南山超充站', '上海浦东快充站', '北京朝阳充电站', '广州天河充电站'].reverse(),
    axisLabel: { color: '#666' },
  },
  series: [{
    type: 'bar',
    data: [45678, 38901, 32456, 28789, 15234].reverse(),
    itemStyle: { color: '#1677FF', borderRadius: [0, 4, 4, 0] },
    label: { show: true, position: 'right', formatter: '¥{c}', color: '#666' },
  }],
}))

// 待办事项
const todoItems = ref([
  { type: 'alert', label: '待处理告警', count: 5, color: '#FF4D4F', route: '/alert' },
  { type: 'workorder', label: '待办工单', count: 3, color: '#FAAD14', route: '/ops' },
  { type: 'settlement', label: '待结算订单', count: 12, color: '#1677FF', route: '/order' },
  { type: 'refund', label: '退款审批', count: 2, color: '#722ED1', route: '/order' },
])

const statusColors: Record<string, string> = {
  [OrderStatus.CHARGING]: 'warning', [OrderStatus.PAID]: 'success',
  [OrderStatus.REFUNDING]: 'info', [OrderStatus.ABNORMAL]: 'danger',
}
const statusLabels: Record<string, string> = {
  [OrderStatus.CHARGING]: '充电中', [OrderStatus.PAID]: '已完成',
  [OrderStatus.REFUNDING]: '退款中', [OrderStatus.ABNORMAL]: '异常',
}

function formatTime(time: string) {
  return time ? time.substring(11, 16) : '-'
}
</script>

<template>
  <div class="dashboard" v-loading="dashboardStore.loading">
    <!-- KPI 卡片 -->
    <div class="stats-grid">
      <KpiCard
        v-for="stat in statsCards"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :unit="stat.unit"
        :trend="stat.trend"
        :trend-up="stat.trendUp"
        :icon="stat.icon"
        :color="stat.color"
        :loading="dashboardStore.loading"
      />
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="16">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>营收趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
                <el-radio-button value="7d">近7天</el-radio-button>
                <el-radio-button value="30d">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart :option="revenueChart" style="height: 320px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header><span>站点营收排行 Top5</span></template>
          <v-chart :option="stationRankChart" style="height: 320px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部区域 -->
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" link @click="router.push('/order')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="dashboardStore.recentOrders" stripe size="small">
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
                <el-tag :type="(statusColors[row.status] as any)" size="small">{{ statusLabels[row.status] || row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="70" align="center">
              <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header><span>待办事项</span></template>
          <div class="todo-list">
            <div v-for="item in todoItems" :key="item.type" class="todo-item" @click="router.push(item.route)">
              <div class="todo-dot" :style="{ background: item.color }"></div>
              <span class="todo-label">{{ item.label }}</span>
              <span class="todo-count font-number" :style="{ color: item.color }">{{ item.count }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.stat-card { position: relative; }
.stat-card :deep(.el-card__body) {
  display: flex; align-items: center; gap: 12px; padding: 16px;
}

.stat-icon {
  width: 48px; height: 48px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0;
}

.stat-body { flex: 1; min-width: 0; }
.stat-value { font-size: 22px; font-weight: bold; color: #333; white-space: nowrap; }
.stat-unit { font-size: 12px; font-weight: normal; color: #999; margin-left: 2px; }
.stat-title { font-size: 12px; color: #999; margin-top: 2px; }

.stat-trend {
  position: absolute; top: 12px; right: 12px;
  font-size: 12px; font-weight: bold; padding: 2px 6px; border-radius: 4px;
}
.stat-trend.up { color: #52C41A; background: #F6FFED; }
.stat-trend.down { color: #FF4D4F; background: #FFF2F0; }

.card-header { display: flex; justify-content: space-between; align-items: center; }

.todo-list { display: flex; flex-direction: column; gap: 12px; }
.todo-item {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: #fafafa; border-radius: 8px; cursor: pointer; transition: all 0.2s;
}
.todo-item:hover { background: #f0f5ff; }
.todo-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.todo-label { flex: 1; font-size: 14px; color: #333; }
.todo-count { font-size: 20px; font-weight: bold; }

.amount { color: #FF4D4F; font-weight: bold; }
</style>
