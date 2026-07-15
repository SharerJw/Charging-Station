<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { Loading } from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])
import { useDashboardStore } from '@/store/dashboard'
import { useRouter } from 'vue-router'
import { OrderStatus } from '@/types'
import KpiCard from './components/KpiCard.vue'

const router = useRouter()
const dashboardStore = useDashboardStore()
const chartPeriod = ref('7d')

// ── Welcome bar ──────────────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const userName = computed(() => localStorage.getItem('userName') || '管理员')
const currentDate = computed(() => {
  const d = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${weekdays[d.getDay()]}`
})

// ── WebSocket real-time updates ─────────────────────────────────────────────
const ws = ref<WebSocket | null>(null)
const wsStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
const reconnectTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const RECONNECT_DELAY = 3000

function connectWebSocket() {
  if (ws.value?.readyState === WebSocket.OPEN) return

  wsStatus.value = 'connecting'
  const token = localStorage.getItem('admin_token')
  // Connect directly to order-service for WebSocket (gateway doesn't proxy WS well)
  const wsUrl = `ws://localhost:8083/ws/dashboard?token=${token}`

  try {
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      wsStatus.value = 'connected'
      console.log('[Dashboard] WebSocket connected')
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'dashboard_update') {
          // Update store with real-time data
          if (data.stats) dashboardStore.stats = data.stats
          if (data.todoCounts) dashboardStore.todoCounts = data.todoCounts
          if (data.stationRank) dashboardStore.stationRank = data.stationRank
          if (data.recentOrders) dashboardStore.recentOrders = data.recentOrders
        }
      } catch (e) {
        console.error('[Dashboard] WebSocket message parse error:', e)
      }
    }

    ws.value.onclose = () => {
      wsStatus.value = 'disconnected'
      console.log('[Dashboard] WebSocket disconnected, reconnecting...')
      scheduleReconnect()
    }

    ws.value.onerror = (error) => {
      console.error('[Dashboard] WebSocket error:', error)
      wsStatus.value = 'disconnected'
    }
  } catch (e) {
    console.error('[Dashboard] WebSocket connection error:', e)
    wsStatus.value = 'disconnected'
    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer.value) clearTimeout(reconnectTimer.value)
  reconnectTimer.value = setTimeout(() => {
    if (document.hidden) return // Don't reconnect if page is hidden
    connectWebSocket()
  }, RECONNECT_DELAY)
}

function disconnectWebSocket() {
  if (reconnectTimer.value) {
    clearTimeout(reconnectTimer.value)
    reconnectTimer.value = null
  }
  if (ws.value) {
    ws.value.close()
    ws.value = null
  }
  wsStatus.value = 'disconnected'
}

function handleVisibilityChange() {
  if (document.hidden) {
    disconnectWebSocket()
  } else {
    connectWebSocket()
  }
}

onMounted(() => {
  dashboardStore.fetchAll() // Initial fetch
  connectWebSocket()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  disconnectWebSocket()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// ── Chart period toggle ──────────────────────────────────────────────────────
watch(chartPeriod, (val) => {
  const days = val === '30d' ? 30 : 7
  dashboardStore.fetchChartData(days)
})

// ── KPI grouped data ─────────────────────────────────────────────────────────
const formatNum = (v: number) => v > 0 ? v.toLocaleString('zh-CN') : '0'
const formatWan = (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : formatNum(v)

const operationStats = computed(() => {
  const s = dashboardStore.stats
  const t = s.trends || {}
  return [
    { title: '今日充电量', value: formatNum(Math.round(s.todayEnergy / 1000)), unit: 'kWh', icon: '⚡', color: '#1677FF', dailyTrend: t.todayEnergy?.daily ?? 0, weeklyTrend: t.todayEnergy?.weekly ?? 0 },
    { title: '今日营收', value: '¥' + formatWan(Math.round(s.todayRevenue / 100)), unit: '', icon: '💰', color: '#52C41A', dailyTrend: t.todayRevenue?.daily ?? 0, weeklyTrend: t.todayRevenue?.weekly ?? 0 },
    { title: '今日订单数', value: formatNum(s.todayOrderCount), unit: '笔', icon: '📋', color: '#FAAD14', dailyTrend: t.todayOrderCount?.daily ?? 0, weeklyTrend: t.todayOrderCount?.weekly ?? 0 },
  ]
})

const deviceStats = computed(() => {
  const s = dashboardStore.stats
  const t = s.trends || {}
  return [
    { title: '站点总数', value: formatNum(s.stationCount), unit: '个', icon: '🏭', color: '#FF4D4F', dailyTrend: t.stationCount?.daily ?? 0, weeklyTrend: t.stationCount?.weekly ?? 0 },
    { title: '设备在线率', value: s.deviceCount > 0 ? ((s.onlineDeviceCount / s.deviceCount) * 100).toFixed(1) : '0', unit: '%', icon: '🟢', color: '#13C2C2', dailyTrend: t.onlineDeviceRate?.daily ?? 0, weeklyTrend: t.onlineDeviceRate?.weekly ?? 0 },
    { title: '累计电量', value: formatNum(Math.round(s.totalEnergy / 1000)), unit: 'kWh', icon: '📊', color: '#722ED1', dailyTrend: t.totalEnergy?.daily ?? 0, weeklyTrend: t.totalEnergy?.weekly ?? 0 },
  ]
})

// ── Revenue trend chart ──────────────────────────────────────────────────────
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

// ── Station rank chart (real data) ───────────────────────────────────────────
const stationRankChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', axisLabel: { color: '#666' } },
  yAxis: {
    type: 'category',
    data: dashboardStore.stationRank.map(s => s.stationName).reverse(),
    axisLabel: { color: '#666', width: 100, overflow: 'truncate' },
  },
  series: [{
    type: 'bar',
    data: dashboardStore.stationRank.map(s => Math.floor(s.revenue / 100)).reverse(),
    itemStyle: { color: '#1677FF', borderRadius: [0, 4, 4, 0] },
    label: { show: true, position: 'right', formatter: '¥{c}', color: '#666' },
  }],
}))

// ── Todo items (real data) ───────────────────────────────────────────────────
const todoItems = computed(() => [
  { type: 'alert', label: '待处理告警', count: dashboardStore.todoCounts.pendingAlerts, color: '#FF4D4F', route: '/alert', query: { status: 'pending' } },
  { type: 'workorder', label: '待办工单', count: dashboardStore.todoCounts.pendingWorkOrders, color: '#FAAD14', route: '/ops', query: { status: 'pending' } },
  { type: 'settlement', label: '待结算订单', count: dashboardStore.todoCounts.settledOrders, color: '#1677FF', route: '/order', query: { status: 'SETTLED' } },
  { type: 'refund', label: '退款审批', count: dashboardStore.todoCounts.refundingOrders, color: '#722ED1', route: '/order', query: { status: 'REFUNDING' } },
])

// ── Order status helpers ─────────────────────────────────────────────────────
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
    <!-- Welcome bar -->
    <div class="welcome-bar">
      <div class="welcome-left">
        <span class="greeting">{{ greeting }}，{{ userName }}</span>
        <span class="subtitle">欢迎回到 EV 充电管理平台</span>
      </div>
      <div class="welcome-right">
        <span class="datetime">{{ currentDate }}</span>
        <span class="ws-status" :class="wsStatus">
          <span class="ws-dot"></span>
          {{ wsStatus === 'connected' ? '实时' : wsStatus === 'connecting' ? '连接中...' : '离线' }}
        </span>
      </div>
    </div>

    <!-- 运营指标 -->
    <div class="stats-group">
      <div class="group-title">运营指标</div>
      <div class="stats-row">
        <KpiCard
          v-for="stat in operationStats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :unit="stat.unit"
          :icon="stat.icon"
          :color="stat.color"
          :daily-trend="stat.dailyTrend"
          :weekly-trend="stat.weeklyTrend"
          :loading="dashboardStore.loading"
        />
      </div>
    </div>

    <!-- 设备指标 -->
    <div class="stats-group">
      <div class="group-title">设备指标</div>
      <div class="stats-row">
        <KpiCard
          v-for="stat in deviceStats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :unit="stat.unit"
          :icon="stat.icon"
          :color="stat.color"
          :daily-trend="stat.dailyTrend"
          :weekly-trend="stat.weeklyTrend"
          :loading="dashboardStore.loading"
        />
      </div>
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
              <template #default="{ row }"><span class="font-number">{{ (row.consumedEnergy || row.energyWh || 0) }} kWh</span></template>
            </el-table-column>
            <el-table-column label="金额" width="100" align="right">
              <template #default="{ row }"><span class="font-number amount">¥{{ (row.payableAmount || row.totalAmount || 0).toFixed(2) }}</span></template>
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
            <div v-for="item in todoItems" :key="item.type" class="todo-item" @click="router.push({ path: item.route, query: item.query })">
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
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Welcome bar ──────────────────────────────────────────────────────────── */
.welcome-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1677FF 0%, #4096FF 100%);
  color: #fff;
  border-radius: 10px;
  padding: 18px 24px;
}
.welcome-left { display: flex; flex-direction: column; gap: 4px; }
.greeting { font-size: 20px; font-weight: 600; }
.subtitle { font-size: 13px; opacity: 0.85; }
.welcome-right { display: flex; align-items: center; gap: 16px; }
.datetime { font-size: 13px; opacity: 0.9; }

/* WebSocket status indicator */
.ws-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
}
.ws-status .ws-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}
.ws-status.connected .ws-dot {
  background: #52C41A;
  box-shadow: 0 0 6px #52C41A;
  animation: pulse 2s infinite;
}
.ws-status.connecting .ws-dot {
  background: #FAAD14;
  animation: pulse 1s infinite;
}
.ws-status.disconnected .ws-dot {
  background: #FF4D4F;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── KPI groups ───────────────────────────────────────────────────────────── */
.stats-group { display: flex; flex-direction: column; gap: 8px; }
.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding-left: 2px;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}

/* ── Card header ──────────────────────────────────────────────────────────── */
.card-header { display: flex; justify-content: space-between; align-items: center; }

/* ── Todo list ────────────────────────────────────────────────────────────── */
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
