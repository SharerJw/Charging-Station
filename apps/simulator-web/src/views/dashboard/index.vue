<script setup lang="ts">
import { ref, onUnmounted, computed, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { useSimulatorStore } from '@/store/simulator'
import { systemApi, deviceApi } from '@/api'
import DeviceSelect from '@/components/DeviceSelect.vue'
import SvgIcon from '@/components/SvgIcon.vue'

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

// 切换设备时重置图表历史
watch(selectedDevice, () => {
  resetChartHistory()
})

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
  const devices = devicesResponse?.list || devicesResponse || []
  simulatorStore.devices = devices
  if (!selectedDevice.value && devices.length > 0) {
    selectedDevice.value = devices[0]?.id || ''
  }
  resetChartHistory()
}

function resetChartHistory() {
  timeLabels.value = []
  powerHistory.value = []
  voltageHistory.value = []
  currentHistory.value = []
  socHistory.value = []
  tempHistory.value = []
  // 填充初始数据点
  const selected = simulatorStore.devices.find(d => d.id === selectedDevice.value)
  const now = new Date()
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now.getTime() - i * refreshInterval.value)
    timeLabels.value.push(formatShortTime(t))
    powerHistory.value.push(selected?.power || 0)
    voltageHistory.value.push(selected?.voltage || 0)
    currentHistory.value.push(selected?.current || 0)
    socHistory.value.push(selected?.soc || 0)
    tempHistory.value.push(selected?.temperature || 0)
  }
}

function startRealtime() {
  refreshTimer = setInterval(async () => {
    if (isPaused.value) return
    // 从后端刷新设备数据
    try {
      const devicesResponse = await deviceApi.list()
      const devices = devicesResponse?.list || devicesResponse || []
      if (devices.length > 0) {
        simulatorStore.devices = devices
      }
    } catch (e) {
      // 静默处理
    }
    const now = new Date()
    const ts = formatShortTime(now)
    timeLabels.value.push(ts)

    const selected = simulatorStore.devices.find(d => d.id === selectedDevice.value)
    powerHistory.value.push(selected?.power || 0)
    voltageHistory.value.push(selected?.voltage || 0)
    currentHistory.value.push(selected?.current || 0)
    socHistory.value.push(selected?.soc || 0)
    tempHistory.value.push(selected?.temperature || 0)

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
    <!-- 环境光斑背景 -->
    <div class="ambient-bg">
      <div class="ambient-orb orb-blue"></div>
      <div class="ambient-orb orb-purple"></div>
      <div class="ambient-orb orb-green"></div>
    </div>

    <!-- 控制栏 -->
    <div class="control-bar card" style="animation: fade-in-up 0.4s var(--easing-spring) both">
      <div class="control-left">
        <span class="control-label">设备:</span>
        <DeviceSelect
          v-model="selectedDevice"
          placeholder="输入搜索设备..."
          style="width: 220px"
        />
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
      <div class="stat-card card" style="animation: fade-in-up 0.5s var(--easing-spring) 0.1s both">
        <div class="stat-icon-wrap stat-icon-blue">
          <SvgIcon name="device" :size="24" color="#3B82F6" />
        </div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ stats.totalDevices || 0 }}</div>
          <div class="stat-label">设备总数</div>
        </div>
      </div>
      <div class="stat-card card" style="animation: fade-in-up 0.5s var(--easing-spring) 0.15s both">
        <div class="stat-icon-wrap stat-icon-green">
          <SvgIcon name="online" :size="24" color="#10B981" />
        </div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ stats.onlineDevices || 0 }}</div>
          <div class="stat-label">在线设备</div>
        </div>
      </div>
      <div class="stat-card card" style="animation: fade-in-up 0.5s var(--easing-spring) 0.2s both">
        <div class="stat-icon-wrap stat-icon-yellow">
          <SvgIcon name="lightning" :size="24" color="#F59E0B" />
        </div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ stats.chargingDevices || 0 }}</div>
          <div class="stat-label">充电中</div>
        </div>
      </div>
      <div class="stat-card card" style="animation: fade-in-up 0.5s var(--easing-spring) 0.25s both">
        <div class="stat-icon-wrap stat-icon-purple">
          <SvgIcon name="battery" :size="24" color="#8B5CF6" />
        </div>
        <div class="stat-info">
          <div class="stat-value font-number">{{ (stats.totalEnergy || 0).toLocaleString() }}</div>
          <div class="stat-label">累计电量(kWh)</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="card chart-main" style="animation: fade-in-up 0.6s var(--easing-spring) 0.3s both">
        <h3 class="card-title">实时功率/电压/电流</h3>
        <v-chart :option="realtimeChartOption" style="height: 280px" autoresize />
      </div>
      <div class="card chart-side" style="animation: fade-in-up 0.6s var(--easing-spring) 0.35s both">
        <h3 class="card-title">设备状态分布</h3>
        <v-chart :option="statusPieOption" style="height: 280px" autoresize />
      </div>
    </div>

    <!-- SOC/温度曲线 -->
    <div class="card" style="animation: fade-in-up 0.6s var(--easing-spring) 0.4s both">
      <h3 class="card-title">SOC & 温度趋势</h3>
      <v-chart :option="socChartOption" style="height: 220px" autoresize />
    </div>

    <!-- 事件流 -->
    <div class="card events-section" style="animation: fade-in-up 0.6s var(--easing-spring) 0.45s both">
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
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; position: relative; }

/* 环境光斑背景 */
.ambient-bg {
  position: fixed;
  top: 0;
  left: 200px;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.07;
}
.orb-blue {
  width: 400px;
  height: 400px;
  background: #3B82F6;
  top: -100px;
  right: -50px;
  animation: ambient-float-1 20s ease-in-out infinite;
}
.orb-purple {
  width: 300px;
  height: 300px;
  background: #8B5CF6;
  bottom: 100px;
  left: 10%;
  animation: ambient-float-2 25s ease-in-out infinite;
}
.orb-green {
  width: 250px;
  height: 250px;
  background: #10B981;
  top: 40%;
  right: 20%;
  animation: ambient-float-3 18s ease-in-out infinite;
}

/* 让内容在光斑之上 */
.control-bar, .stats-grid, .charts-row, .events-section { position: relative; z-index: 1; }

.control-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; }
.control-left, .control-right { display: flex; align-items: center; gap: 8px; }
.control-label { font-size: 13px; color: var(--color-text-secondary); }

.live-indicator {
  color: #10B981;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: glow-pulse 2s ease-in-out infinite;
}
.live-indicator.paused { color: #6B7280; animation: none; text-shadow: none; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; }
.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform var(--duration-normal) var(--easing-spring),
              box-shadow var(--duration-normal);
}
.stat-card:hover .stat-icon-wrap {
  transform: scale(1.1);
}
.stat-card:hover .stat-icon-blue { box-shadow: var(--glow-blue); }
.stat-card:hover .stat-icon-green { box-shadow: var(--glow-green); }
.stat-card:hover .stat-icon-yellow { box-shadow: var(--glow-yellow); }
.stat-card:hover .stat-icon-purple { box-shadow: var(--glow-purple); }
.stat-icon-blue { background: rgba(59, 130, 246, 0.15); }
.stat-icon-green { background: rgba(16, 185, 129, 0.15); }
.stat-icon-yellow { background: rgba(245, 158, 11, 0.15); }
.stat-icon-purple { background: rgba(139, 92, 246, 0.15); }
.stat-value { font-size: 24px; font-weight: bold; color: var(--color-text-primary); }
.stat-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }

.charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.chart-main { padding: 16px; }
.chart-side { padding: 16px; }
.card-title { color: var(--color-text-primary); font-size: 14px; margin: 0 0 12px; }
.event-count { font-size: 11px; color: var(--color-text-tertiary); background: var(--color-bg-hover); padding: 2px 6px; border-radius: 4px; margin-left: 8px; }

.events-section { padding: 16px; display: flex; flex-direction: column; }
.events-list { flex: 1; overflow-y: auto; max-height: 300px; }
.event-item {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 12px;
  font-family: var(--font-family-code);
  animation: event-enter 0.3s var(--easing-spring) both;
}
.event-item:first-child {
  animation: slide-in-left 0.3s var(--easing-spring) both;
}
.event-time { color: #6B7280; min-width: 70px; }
.event-dir { min-width: 14px; text-align: center; font-weight: bold; }
.event-dir.inbound { color: #10B981; }
.event-dir.outbound { color: #3B82F6; }
.event-source { color: #F59E0B; min-width: 100px; }
.event-action { font-weight: bold; }
</style>
