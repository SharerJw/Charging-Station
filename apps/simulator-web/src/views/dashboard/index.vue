<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { useSimulatorStore } from '@/store/simulator'
import { systemApi, deviceApi } from '@/api'

interface OcppMessage {
  messageId: string
  action: string
  type: 'Call' | 'CallResult' | 'CallError'
  payload: Record<string, any>
  timestamp: string
  direction: 'inbound' | 'outbound'
  chargePointId: string
}

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
])

const simulatorStore = useSimulatorStore()
const stats = ref<any>({})
const selectedDevice = ref('')
const refreshInterval = ref(3000)
const isPaused = ref(false)

// 多维度历史数据
const timeLabels = ref<string[]>([])
const powerHistory = ref<number[]>([])
const voltageHistory = ref<number[]>([])
const currentHistory = ref<number[]>([])
const socHistory = ref<number[]>([])
const tempHistory = ref<number[]>([])

// 事件流
const events = ref<OcppMessage[]>([])
const maxEvents = 50

let refreshTimer: ReturnType<typeof setInterval> | null = null
let eventTimer: ReturnType<typeof setInterval> | null = null

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
}

// 立即加载数据（不等待）
loadData().then(() => {
  startRealtime()
  startEventStream()
})

onUnmounted(() => {
  stopAll()
})

async function loadData() {
  const [s, devicesResponse] = await Promise.all([
    systemApi.stats(),
    deviceApi.list(),
  ])
  stats.value = s
  // API returns paginated response: { list: [...], total: ..., page: ..., size: ... }
  const devices = devicesResponse?.list || devicesResponse || []
  simulatorStore.devices = devices
  selectedDevice.value = devices[0]?.id || ''
  // 初始化历史
  const now = new Date()
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now.getTime() - i * refreshInterval.value)
    timeLabels.value.push(formatShortTime(t))
    powerHistory.value.push(20 + Math.random() * 40)
    voltageHistory.value.push(380 + Math.random() * 40)
    currentHistory.value.push(50 + Math.random() * 60)
    socHistory.value.push(30 + Math.random() * 40)
    tempHistory.value.push(25 + Math.random() * 15)
  }
}

function startRealtime() {
  refreshTimer = setInterval(() => {
    if (isPaused.value) return
    const now = new Date()
    const ts = formatShortTime(now)
    timeLabels.value.push(ts)

    // 更新设备数据
    simulatorStore.devices.forEach(d => {
      if (d.status === 'charging') {
        d.power = Math.max(0, d.power + (Math.random() - 0.5) * 5)
        d.voltage = Math.max(300, Math.min(500, d.voltage + (Math.random() - 0.5) * 10))
        d.current = Math.max(0, d.current + (Math.random() - 0.5) * 8)
        d.soc = Math.min(100, Math.round((d.soc + Math.random() * 0.5) * 10) / 10)
        d.temperature = Math.max(20, Math.min(55, d.temperature + (Math.random() - 0.5) * 2))
      }
    })

    const selected = simulatorStore.devices.find(d => d.id === selectedDevice.value)
    powerHistory.value.push(selected?.power || 0)
    voltageHistory.value.push(selected?.voltage || 0)
    currentHistory.value.push(selected?.current || 0)
    socHistory.value.push(selected?.soc || 0)
    tempHistory.value.push(selected?.temperature || 0)

    // 保持最近30个点
    const max = 30
    if (timeLabels.value.length > max) {
      timeLabels.value.shift()
      powerHistory.value.shift()
      voltageHistory.value.shift()
      currentHistory.value.shift()
      socHistory.value.shift()
      tempHistory.value.shift()
    }
  }, refreshInterval.value)
}

function startEventStream() {
  const actions = ['Heartbeat', 'MeterValues', 'StatusNotification', 'BootNotification', 'StartTransaction', 'StopTransaction']
  eventTimer = setInterval(() => {
    if (isPaused.value) return
    const device = simulatorStore.devices[Math.floor(Math.random() * simulatorStore.devices.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const msg: OcppMessage = {
      messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      type: Math.random() > 0.5 ? 'Call' : 'CallResult',
      payload: {},
      timestamp: new Date().toISOString(),
      direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
      chargePointId: device.ocppId,
    }
    events.value.unshift(msg)
    if (events.value.length > maxEvents) events.value.pop()
  }, 2000 + Math.random() * 3000)
}

function stopAll() {
  if (refreshTimer) clearInterval(refreshTimer)
  if (eventTimer) clearInterval(eventTimer)
}

function togglePause() {
  isPaused.value = !isPaused.value
}

function changeInterval(ms: number) {
  refreshInterval.value = ms
  stopAll()
  startRealtime()
  startEventStream()
}

function formatShortTime(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

// ===== 图表配置 =====

const realtimeChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['功率(kW)', '电压(V)', '电流(A)'], textStyle: { color: '#9CA3AF' }, top: 0 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
  xAxis: { type: 'category', data: timeLabels.value, axisLabel: { color: '#6B7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } } },
  yAxis: [
    { type: 'value', name: 'kW/A', axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#1F2937' } } },
    { type: 'value', name: 'V', axisLabel: { color: '#6B7280' }, splitLine: { show: false } },
  ],
  series: [
    { name: '功率(kW)', type: 'line', smooth: true, data: powerHistory.value, lineStyle: { color: COLORS.primary, width: 2 }, itemStyle: { color: COLORS.primary }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.2)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } } },
    { name: '电流(A)', type: 'line', smooth: true, data: currentHistory.value, lineStyle: { color: COLORS.warning, width: 1.5 }, itemStyle: { color: COLORS.warning } },
    { name: '电压(V)', type: 'line', smooth: true, yAxisIndex: 1, data: voltageHistory.value, lineStyle: { color: COLORS.success, width: 1.5 }, itemStyle: { color: COLORS.success } },
  ],
}))

const socChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10px', containLabel: true },
  xAxis: { type: 'category', data: timeLabels.value, axisLabel: { color: '#6B7280', fontSize: 10 }, axisLine: { lineStyle: { color: '#374151' } } },
  yAxis: { type: 'value', name: '%', min: 0, max: 100, axisLabel: { color: '#6B7280' }, splitLine: { lineStyle: { color: '#1F2937' } } },
  series: [
    { name: 'SOC', type: 'line', smooth: true, data: socHistory.value, lineStyle: { color: COLORS.success, width: 2 }, itemStyle: { color: COLORS.success }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(16,185,129,0.3)' }, { offset: 1, color: 'rgba(16,185,129,0)' }] } } },
    { name: '温度(°C)', type: 'line', smooth: true, data: tempHistory.value, lineStyle: { color: COLORS.error, width: 1.5, type: 'dashed' }, itemStyle: { color: COLORS.error } },
  ],
}))

const statusPieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie', radius: ['45%', '75%'], center: ['50%', '50%'],
    label: { color: '#9CA3AF', fontSize: 11 },
    data: [
      { value: simulatorStore.devices.filter(d => d.status === 'online').length, name: '在线', itemStyle: { color: COLORS.success } },
      { value: simulatorStore.devices.filter(d => d.status === 'charging').length, name: '充电中', itemStyle: { color: COLORS.warning } },
      { value: simulatorStore.devices.filter(d => d.status === 'offline').length, name: '离线', itemStyle: { color: COLORS.error } },
      { value: simulatorStore.devices.filter(d => d.status === 'fault').length, name: '故障', itemStyle: { color: '#6B7280' } },
    ].filter(d => d.value > 0),
  }],
}))

const eventLevelColors: Record<string, string> = {
  Heartbeat: '#6B7280',
  MeterValues: COLORS.primary,
  StatusNotification: COLORS.warning,
  BootNotification: COLORS.success,
  StartTransaction: COLORS.cyan,
  StopTransaction: COLORS.purple,
}
</script>

<template>
  <div class="dashboard">
    <!-- 控制栏 -->
    <div class="control-bar card">
      <div class="control-left">
        <span class="control-label">设备:</span>
        <el-select v-model="selectedDevice" size="small" style="width: 160px">
          <el-option v-for="d in simulatorStore.devices" :key="d.id" :label="d.name" :value="d.id" />
        </el-select>
        <span class="control-label" style="margin-left: 16px">刷新:</span>
        <el-radio-group v-model="refreshInterval" size="small" @change="(val: any) => changeInterval(Number(val))">
          <el-radio-button :value="1000">1s</el-radio-button>
          <el-radio-button :value="3000">3s</el-radio-button>
          <el-radio-button :value="5000">5s</el-radio-button>
          <el-radio-button :value="10000">10s</el-radio-button>
        </el-radio-group>
      </div>
      <div class="control-right">
        <el-button size="small" :type="isPaused ? 'success' : 'danger'" @click="togglePause">
          {{ isPaused ? '▶ 继续' : '⏸ 暂停' }}
        </el-button>
        <span class="live-indicator" :class="{ paused: isPaused }">● LIVE</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon">🏭</div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ stats.totalDevices || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">🟢</div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ stats.onlineDevices || 0 }}</div>
          <div class="stat-label">在线设备</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">⚡</div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ stats.chargingDevices || 0 }}</div>
          <div class="stat-label">充电中</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon">🔋</div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ (stats.totalEnergy || 0).toLocaleString() }}</div>
          <div class="stat-label">累计电量(kWh)</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="card chart-main">
        <h3 class="card-title">实时功率/电压/电流</h3>
        <v-chart :option="realtimeChartOption" style="height: 280px" autoresize />
      </div>
      <div class="card chart-side">
        <h3 class="card-title">设备状态分布</h3>
        <v-chart :option="statusPieOption" style="height: 280px" autoresize />
      </div>
    </div>

    <!-- SOC/温度曲线 -->
    <div class="card">
      <h3 class="card-title">SOC & 温度趋势</h3>
      <v-chart :option="socChartOption" style="height: 220px" autoresize />
    </div>

    <!-- 设备卡片 + 事件流 -->
    <div class="bottom-row">
      <!-- 设备状态卡片 -->
      <div class="device-section">
        <h3 class="section-title">设备状态</h3>
        <div class="device-grid">
          <div v-for="device in simulatorStore.devices" :key="device.id" class="device-card card" :class="{ selected: device.id === selectedDevice }" @click="selectedDevice = device.id">
            <div class="device-header">
              <div>
                <span class="device-name">{{ device.name }}</span>
                <span class="device-model">{{ device.model }}</span>
              </div>
              <span :class="['status-badge', device.status]">
                {{ { online: '在线', offline: '离线', charging: '充电中', fault: '故障' }[device.status] }}
              </span>
            </div>
            <div class="device-metrics">
              <div class="metric"><span class="metric-value font-number">{{ device.power.toFixed(1) }}</span><span class="metric-unit">kW</span></div>
              <div class="metric"><span class="metric-value font-number">{{ Math.floor(device.soc) }}</span><span class="metric-unit">%</span></div>
              <div class="metric"><span class="metric-value font-number">{{ device.voltage }}</span><span class="metric-unit">V</span></div>
              <div class="metric"><span class="metric-value font-number">{{ device.temperature }}</span><span class="metric-unit">°C</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 事件流 -->
      <div class="events-section card">
        <h3 class="card-title">OCPP 事件流 <span class="event-count">{{ events.length }}</span></h3>
        <div class="events-list">
          <div v-for="event in events.slice(0, 20)" :key="event.messageId" class="event-item">
            <span class="event-time">{{ formatShortTime(new Date(event.timestamp)) }}</span>
            <span class="event-dir" :class="event.direction">{{ event.direction === 'inbound' ? '←' : '→' }}</span>
            <span class="event-source">{{ event.chargePointId }}</span>
            <span class="event-action" :style="{ color: eventLevelColors[event.action] || '#9CA3AF' }">{{ event.action }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }

.control-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; }
.control-left, .control-right { display: flex; align-items: center; gap: 8px; }
.control-label { font-size: 13px; color: var(--color-text-secondary); }

.live-indicator { color: #10B981; font-size: 12px; font-weight: bold; animation: blink 1.5s infinite; }
.live-indicator.paused { color: #6B7280; animation: none; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; }
.stat-icon { font-size: 28px; }
.stat-value { font-size: 24px; font-weight: bold; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }

.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.chart-main { padding: 16px; }
.chart-side { padding: 16px; }
.card-title { color: var(--color-text-primary); font-size: 14px; margin: 0 0 12px; }
.event-count { font-size: 11px; color: var(--color-text-tertiary); background: var(--color-bg-hover); padding: 2px 6px; border-radius: 4px; margin-left: 8px; }

.bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.section-title { font-size: 14px; color: var(--color-text-primary); margin: 0 0 12px; font-weight: 600; }

.device-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.device-card { padding: 14px; cursor: pointer; transition: border-color 0.2s; border: 1px solid transparent; }
.device-card.selected { border-color: var(--color-primary); }
.device-card:hover { border-color: var(--color-primary); }

.device-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.device-name { font-size: 14px; font-weight: bold; color: var(--color-text-primary); display: block; }
.device-model { font-size: 11px; color: var(--color-text-secondary); }

.status-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
.status-badge.online { background: rgba(16,185,129,0.2); color: #10B981; }
.status-badge.offline { background: rgba(239,68,68,0.2); color: #EF4444; }
.status-badge.charging { background: rgba(245,158,11,0.2); color: #F59E0B; }
.status-badge.fault { background: rgba(239,68,68,0.2); color: #EF4444; }

.device-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.metric { text-align: center; }
.metric-value { font-size: 16px; color: var(--color-text-primary); font-weight: bold; }
.metric-unit { font-size: 10px; color: var(--color-text-secondary); margin-left: 1px; }

.events-section { padding: 16px; display: flex; flex-direction: column; }
.events-list { flex: 1; overflow-y: auto; max-height: 300px; }
.event-item { display: flex; gap: 8px; padding: 3px 0; font-size: 12px; font-family: var(--font-family-code); }
.event-time { color: #6B7280; min-width: 70px; }
.event-dir { min-width: 14px; text-align: center; font-weight: bold; }
.event-dir.inbound { color: #10B981; }
.event-dir.outbound { color: #3B82F6; }
.event-source { color: #F59E0B; min-width: 100px; }
.event-action { font-weight: bold; }
</style>
