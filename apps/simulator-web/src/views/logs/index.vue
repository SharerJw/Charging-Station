<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ocppApi } from '@/api'

interface OcppMessage {
  messageId: string
  action: string
  type: string
  payload: any
  timestamp: string
  direction: string
  chargePointId: string
}

const logContainer = ref<HTMLElement>()
const autoScroll = ref(true)
const filterLevel = ref('all')
const filterAction = ref('all')
const isStreaming = ref(true)
let streamTimer: ReturnType<typeof setInterval> | null = null

const logs = ref<OcppMessage[]>([])
const messageCount = ref(0)

const OCPP_ACTIONS = [
  'BootNotification', 'Heartbeat', 'StatusNotification', 'StartTransaction',
  'StopTransaction', 'MeterValues', 'Reset', 'UnlockConnector',
  'ChangeConfiguration', 'GetConfiguration', 'RemoteStartTransaction', 'RemoteStopTransaction',
]

const levelMap: Record<string, string> = {
  BootNotification: 'info',
  Heartbeat: 'debug',
  StatusNotification: 'info',
  StartTransaction: 'info',
  StopTransaction: 'info',
  MeterValues: 'debug',
  Reset: 'warn',
  UnlockConnector: 'warn',
  RemoteStartTransaction: 'info',
  RemoteStopTransaction: 'warn',
}

const levelColors: Record<string, string> = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
}

const filteredLogs = computed(() => {
  let result = logs.value
  if (filterLevel.value !== 'all') {
    result = result.filter(l => (levelMap[l.action] || 'info') === filterLevel.value)
  }
  if (filterAction.value !== 'all') {
    result = result.filter(l => l.action === filterAction.value)
  }
  return result
})

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function generateRandomMessage(): OcppMessage {
  const devices = ['EVSE-BJ-001', 'EVSE-BJ-002', 'EVSE-SH-001', 'EVSE-SZ-001']
  const action = OCPP_ACTIONS[Math.floor(Math.random() * OCPP_ACTIONS.length)]
  const device = devices[Math.floor(Math.random() * devices.length)]
  const direction = Math.random() > 0.5 ? 'inbound' : 'outbound'

  const payloads: Record<string, any> = {
    BootNotification: { chargePointVendor: 'EV-Charge', chargePointModel: 'DC-120kW', firmwareVersion: '3.2.1' },
    Heartbeat: {},
    StatusNotification: { connectorId: 1, status: ['Available', 'Preparing', 'Charging', 'Finishing'][Math.floor(Math.random() * 4)], errorCode: 'NoError' },
    StartTransaction: { connectorId: 1, idTag: `USER-${Math.floor(Math.random() * 1000)}`, meterStart: Math.floor(Math.random() * 100000), timestamp: new Date().toISOString() },
    StopTransaction: { transactionId: Math.floor(Math.random() * 10000), meterStop: Math.floor(Math.random() * 100000), reason: ['Remote', 'Local', 'Other'][Math.floor(Math.random() * 3)] },
    MeterValues: { connectorId: 1, meterValue: [{ sampledValue: [{ value: (Math.random() * 100).toFixed(1), unit: 'W' }] }] },
    Reset: { type: 'Hard' },
    UnlockConnector: { connectorId: 1 },
  }

  return {
    messageId: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    action,
    type: direction === 'inbound' ? 'Call' : 'CallResult',
    payload: payloads[action] || {},
    timestamp: new Date().toISOString(),
    direction,
    chargePointId: device,
  }
}

function scrollToBottom() {
  if (autoScroll.value && logContainer.value) {
    nextTick(() => {
      logContainer.value!.scrollTop = logContainer.value!.scrollHeight
    })
  }
}

function startStreaming() {
  isStreaming.value = true
  streamTimer = setInterval(() => {
    const msg = generateRandomMessage()
    logs.value.push(msg)
    messageCount.value++
    // 保留最近500条
    if (logs.value.length > 500) {
      logs.value = logs.value.slice(-400)
    }
    scrollToBottom()
  }, 800 + Math.random() * 1200)
}

function stopStreaming() {
  isStreaming.value = false
  if (streamTimer) {
    clearInterval(streamTimer)
    streamTimer = null
  }
}

function clearLogs() {
  logs.value = []
  messageCount.value = 0
}

function toggleStreaming() {
  if (isStreaming.value) {
    stopStreaming()
  } else {
    startStreaming()
  }
}

onMounted(async () => {
  // 加载初始日志
  const initial = await ocppApi.history({ limit: 20 })
  logs.value = initial
  messageCount.value = initial.length
  scrollToBottom()
  // 启动实时流
  startStreaming()
})

onUnmounted(() => {
  stopStreaming()
})

function formatPayload(payload: any): string {
  if (!payload || Object.keys(payload).length === 0) return '{}'
  return JSON.stringify(payload)
}
</script>

<template>
  <div class="logs-page">
    <!-- 工具栏 -->
    <div class="toolbar card">
      <div class="toolbar-left">
        <h2 class="page-title">OCPP 消息终端</h2>
        <span class="message-count font-number">{{ messageCount }} 条消息</span>
      </div>
      <div class="toolbar-right">
        <el-select v-model="filterLevel" style="width: 100px" size="small">
          <el-option label="全部级别" value="all" />
          <el-option label="Info" value="info" />
          <el-option label="Debug" value="debug" />
          <el-option label="Warn" value="warn" />
          <el-option label="Error" value="error" />
        </el-select>
        <el-select v-model="filterAction" style="width: 160px" size="small">
          <el-option label="全部动作" value="all" />
          <el-option v-for="action in OCPP_ACTIONS" :key="action" :label="action" :value="action" />
        </el-select>
        <el-checkbox v-model="autoScroll" size="small">自动滚动</el-checkbox>
        <el-button size="small" :type="isStreaming ? 'danger' : 'success'" @click="toggleStreaming">
          {{ isStreaming ? '⏸ 暂停' : '▶ 继续' }}
        </el-button>
        <el-button size="small" @click="clearLogs">清空</el-button>
      </div>
    </div>

    <!-- 日志终端 -->
    <div class="terminal card" ref="logContainer">
      <div v-for="(log, index) in filteredLogs" :key="log.messageId || index" class="log-line" :class="levelMap[log.action]">
        <span class="log-time">{{ formatTime(log.timestamp) }}</span>
        <span class="log-direction" :class="log.direction">
          {{ log.direction === 'inbound' ? '←' : '→' }}
        </span>
        <span class="log-level" :style="{ color: levelColors[levelMap[log.action] || 'info'] }">
          [{{ (levelMap[log.action] || 'info').toUpperCase() }}]
        </span>
        <span class="log-type" :class="log.type">{{ log.type }}</span>
        <span class="log-source">{{ log.chargePointId }}</span>
        <span class="log-action">{{ log.action }}</span>
        <span class="log-payload">{{ formatPayload(log.payload) }}</span>
      </div>
      <div v-if="filteredLogs.length === 0" class="empty-state">
        暂无日志消息
      </div>
    </div>
  </div>
</template>

<style scoped>
.logs-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

.message-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-family: 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.8;
  background: #0D1117;
}

.log-line {
  display: flex;
  gap: 8px;
  padding: 1px 4px;
  border-radius: 2px;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-time {
  color: #6B7280;
  min-width: 100px;
  flex-shrink: 0;
}

.log-direction {
  min-width: 16px;
  text-align: center;
  font-weight: bold;
}

.log-direction.inbound { color: #10B981; }
.log-direction.outbound { color: #3B82F6; }

.log-level {
  min-width: 60px;
  font-weight: bold;
  flex-shrink: 0;
}

.log-type {
  min-width: 80px;
  font-size: 11px;
  padding: 0 4px;
  border-radius: 2px;
  flex-shrink: 0;
}

.log-type.Call { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
.log-type.CallResult { background: rgba(16, 185, 129, 0.15); color: #34D399; }
.log-type.CallError { background: rgba(239, 68, 68, 0.15); color: #F87171; }

.log-source {
  color: #F59E0B;
  min-width: 120px;
  flex-shrink: 0;
}

.log-action {
  color: #C084FC;
  min-width: 180px;
  font-weight: bold;
  flex-shrink: 0;
}

.log-payload {
  color: #9CA3AF;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}
</style>
