<script setup lang="ts">
/**
 * OCPP 消息终端 (simulator-web)
 *
 * Features:
 * 1. Real WebSocket connection via @/utils/ws (auto-reconnect, heartbeat)
 * 2. Uses MessageLine component for message display fallback
 * 3. xterm.js terminal integration (with graceful fallback)
 * 4. Export as .json / .csv
 * 5. Message count stats in toolbar (total, by level, by direction)
 * 6. Filters: level, action, auto-scroll, pause
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ocppApi } from '@/api'
import { connect, disconnect, wsStatus } from '@/utils/ws'
import type { OcppWsMessage, OcppWsCallbacks } from '@/utils/ws'

// xterm.js (available in deps)
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OCPP_ACTIONS = [
  'BootNotification', 'Heartbeat', 'StatusNotification', 'StartTransaction',
  'StopTransaction', 'MeterValues', 'Reset', 'UnlockConnector',
  'ChangeConfiguration', 'GetConfiguration', 'RemoteStartTransaction', 'RemoteStopTransaction',
]

const MAX_LOG_BUFFER = 500
const TRIM_TO = 400

const LEVEL_MAP: Record<string, string> = {
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

// ANSI color codes for xterm.js rendering
const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  gray: '\x1b[38;2;107;114;128m',
  blue: '\x1b[38;2;59;130;246m',
  green: '\x1b[38;2;16;185;129m',
  cyan: '\x1b[38;2;6;182;212m',
  purple: '\x1b[38;2;192;132;252m',
  amber: '\x1b[38;2;245;158;11m',
  red: '\x1b[38;2;39;39;42m',
  white: '\x1b[38;2;156;163;175m',
  inbound: '\x1b[38;2;16;185;129m',
  outbound: '\x1b[38;2;59;130;246m',
  typeCall: '\x1b[38;2;96;165;250m',
  typeCallResult: '\x1b[38;2;52;211;153m',
  typeCallError: '\x1b[38;2;248;113;113m',
  payload: '\x1b[38;2;156;163;175m',
} as const

// ---------------------------------------------------------------------------
// Reactive state
// ---------------------------------------------------------------------------

const logs = ref<OcppWsMessage[]>([])
const autoScroll = ref(true)
const filterLevel = ref('all')
const filterAction = ref('all')
const isStreaming = ref(true)
const messageCount = ref(0)

// xterm.js
const terminalContainer = ref<HTMLElement>()
let term: Terminal | null = null
let fitAddon: FitAddon | null = null
let incrementalMode = true
let resizeObserver: ResizeObserver | null = null

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const filteredLogs = computed(() => {
  let result = logs.value
  if (filterLevel.value !== 'all') {
    result = result.filter(l => (LEVEL_MAP[l.action] || 'info') === filterLevel.value)
  }
  if (filterAction.value !== 'all') {
    result = result.filter(l => l.action === filterAction.value)
  }
  return result
})

const stats = computed(() => {
  const total = messageCount.value
  const levels = { debug: 0, info: 0, warn: 0, error: 0 }
  const directions = { inbound: 0, outbound: 0 }
  for (const msg of logs.value) {
    const lvl = LEVEL_MAP[msg.action] || 'info'
    if (lvl in levels) levels[lvl as keyof typeof levels]++
    if (msg.direction in directions) directions[msg.direction as keyof typeof directions]++
  }
  return { total, levels, directions }
})

// ---------------------------------------------------------------------------
// ANSI formatting helpers
// ---------------------------------------------------------------------------

function levelToAnsi(level: string): string {
  return { debug: ANSI.gray, info: ANSI.blue, warn: ANSI.amber, error: ANSI.red }[level] || ANSI.blue
}

function typeToAnsi(type: string): string {
  return { Call: ANSI.typeCall, CallResult: ANSI.typeCallResult, CallError: ANSI.typeCallError }[type] || ANSI.typeCall
}

function formatPayload(payload: Record<string, unknown> | undefined): string {
  if (!payload || Object.keys(payload).length === 0) return '{}'
  try { return JSON.stringify(payload) } catch { return '{}' }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function messageToAnsi(msg: OcppWsMessage): string {
  const level = LEVEL_MAP[msg.action] || 'info'
  const arrow = msg.direction === 'inbound' ? '←' : '→'
  const dirColor = msg.direction === 'inbound' ? ANSI.inbound : ANSI.outbound
  const lvlColor = levelToAnsi(level)
  const tpColor = typeToAnsi(msg.type)
  const time = formatTime(msg.timestamp)
  const src = msg.chargePointId
  const payload = formatPayload(msg.payload)

  return [
    `${ANSI.gray}${time}${ANSI.reset}`,
    `${dirColor}${arrow}${ANSI.reset}`,
    `${lvlColor}[${level.toUpperCase().padEnd(5)}]${ANSI.reset}`,
    `${tpColor}${msg.type.padEnd(11)}${ANSI.reset}`,
    `${ANSI.amber}${src.padEnd(14)}${ANSI.reset}`,
    `${ANSI.purple}${msg.action.padEnd(24)}${ANSI.reset}`,
    `${ANSI.payload}${payload}${ANSI.reset}`,
  ].join(' ')
}

// ---------------------------------------------------------------------------
// xterm.js setup
// ---------------------------------------------------------------------------

function initTerminal(): void {
  if (!terminalContainer.value) return

  term = new Terminal({
    cursorBlink: false,
    disableStdin: true,
    fontSize: 12,
    fontFamily: "'Cascadia Code', 'Fira Code', 'Courier New', monospace",
    lineHeight: 1.4,
    scrollback: 5000,
    theme: {
      background: '#0D1117',
      foreground: '#E6EDF3',
      cursor: '#58A6FF',
      selectionBackground: '#264F78',
      black: '#0D1117',
      red: '#FF7B72',
      green: '#3FB950',
      yellow: '#D29922',
      blue: '#58A6FF',
      magenta: '#BC8CFF',
      cyan: '#39D2C0',
      white: '#E6EDF3',
    },
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(terminalContainer.value)

  // Initial fit
  nextTick(() => {
    fitAddon?.fit()
    // Render any messages that arrived before terminal was ready
    if (logs.value.length > 0) {
      showAllCurrentLogs()
    }
  })

  // Keep terminal fitted on container resize
  resizeObserver = new ResizeObserver(() => {
    fitAddon?.fit()
  })
  resizeObserver.observe(terminalContainer.value)

  // Keyboard shortcuts inside terminal
  term.attachCustomKeyEventHandler((event) => {
    // Ctrl+K: clear terminal
    if (event.ctrlKey && event.key === 'k' && event.type === 'keydown') {
      clearLogs()
      return false
    }
    // Ctrl+P: toggle pause
    if (event.ctrlKey && event.key === 'p' && event.type === 'keydown') {
      toggleStreaming()
      return false
    }
    return true
  })
}

/** Write a single message to xterm.js (incremental append) */
function writeToTerminal(msg: OcppWsMessage): void {
  if (!term) return
  term.writeln(messageToAnsi(msg))
  if (autoScroll.value) {
    term.scrollToBottom()
  }
}

/** Re-render the full terminal from filtered data (after filter change or clear) */
function showAllCurrentLogs(): void {
  if (!term) return
  incrementalMode = false
  term.clear()
  const source = filteredLogs.value
  for (const msg of source) {
    term.writeln(messageToAnsi(msg))
  }
  if (autoScroll.value) {
    term.scrollToBottom()
  }
}

// ---------------------------------------------------------------------------
// WebSocket message handler
// ---------------------------------------------------------------------------

function handleWsMessage(msg: OcppWsMessage): void {
  // Append to reactive store
  logs.value.push(msg)
  messageCount.value++

  // Trim buffer
  if (logs.value.length > MAX_LOG_BUFFER) {
    logs.value = logs.value.slice(-TRIM_TO)
  }

  // Determine if this message passes current filters
  const passesLevel = filterLevel.value === 'all' || (LEVEL_MAP[msg.action] || 'info') === filterLevel.value
  const passesAction = filterAction.value === 'all' || msg.action === filterAction.value

  // Write to terminal
  if (term) {
    if (incrementalMode && passesLevel && passesAction) {
      writeToTerminal(msg)
    } else if (!incrementalMode) {
      // We're in full-re-render mode (filter was just changed).
      // Next unfiltered message will trigger a reset to incremental.
      if (filterLevel.value === 'all' && filterAction.value === 'all') {
        incrementalMode = true
      }
    }
  }
}

// ---------------------------------------------------------------------------
// WebSocket lifecycle
// ---------------------------------------------------------------------------

const wsCallbacks: OcppWsCallbacks = {
  onOpen: () => {
    /* connected */
  },
  onClose: () => {
    /* disconnected - ws.ts handles reconnect */
  },
  onMessage: handleWsMessage,
  onStatusChange: () => {
    /* wsStatus ref is reactive */
  },
}

// ---------------------------------------------------------------------------
// Streaming toggle (controls message acceptance, not WebSocket)
// ---------------------------------------------------------------------------

function toggleStreaming(): void {
  isStreaming.value = !isStreaming.value
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

function clearLogs(): void {
  logs.value = []
  messageCount.value = 0
  if (term) {
    term.clear()
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function exportMessages(format: 'json' | 'csv'): void {
  const data = filteredLogs.value
  if (data.length === 0) return

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, `ocpp-messages-${timestamp}.json`)
  } else {
    const headers = ['timestamp', 'direction', 'type', 'chargePointId', 'action', 'payload']
    const rows = data.map(msg =>
      [
        msg.timestamp,
        msg.direction,
        msg.type,
        msg.chargePointId,
        msg.action,
        `"${formatPayload(msg.payload).replace(/"/g, '""')}"`,
      ].join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `ocpp-messages-${timestamp}.csv`)
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Watch filters -> re-render terminal
// ---------------------------------------------------------------------------

watch([filterLevel, filterAction], () => {
  showAllCurrentLogs()
})

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(async () => {
  // 1. Init xterm.js
  initTerminal()

  // 2. Load historical messages
  try {
    const history = await ocppApi.history({ limit: 50 })
    if (Array.isArray(history)) {
      logs.value = history
      messageCount.value = history.length
      if (term && history.length > 0) {
        showAllCurrentLogs()
      }
    }
  } catch {
    // History endpoint may not exist; WebSocket will provide real-time data
  }

  // 3. Connect WebSocket
  connect(wsCallbacks)
})

onUnmounted(() => {
  // Cleanup terminal
  resizeObserver?.disconnect()
  resizeObserver = null
  term?.dispose()
  term = null
  fitAddon = null

  // Disconnect WebSocket
  disconnect()
})
</script>

<template>
  <div class="logs-page">
    <!-- Toolbar -->
    <div class="toolbar card">
      <div class="toolbar-row">
        <!-- Left: title + stats -->
        <div class="toolbar-left">
          <h2 class="page-title">OCPP 消息终端</h2>
          <span class="ws-status" :class="wsStatus">
            <span class="ws-dot" />{{ wsStatus }}
          </span>
          <span class="stat-badge total">{{ stats.total }} 条</span>
          <span class="stat-badge info">{{ stats.levels.info }} info</span>
          <span class="stat-badge debug">{{ stats.levels.debug }} debug</span>
          <span class="stat-badge warn">{{ stats.levels.warn }} warn</span>
          <span class="stat-badge error">{{ stats.levels.error }} error</span>
          <span class="stat-badge direction">
            <span class="arrow-in">&larr;</span>{{ stats.directions.inbound }}
            <span class="arrow-out">&rarr;</span>{{ stats.directions.outbound }}
          </span>
        </div>

        <!-- Right: filters + actions -->
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
          <el-button
            size="small"
            :type="isStreaming ? 'danger' : 'success'"
            @click="toggleStreaming"
          >
            {{ isStreaming ? '⏸ 暂停' : '▶ 继续' }}
          </el-button>
          <el-button size="small" @click="clearLogs">
            <el-icon style="margin-right:4px"><Delete /></el-icon>清空
          </el-button>
          <el-dropdown trigger="click" @command="exportMessages">
            <el-button size="small" type="primary" plain>
              <el-icon style="margin-right:4px"><Download /></el-icon>导出
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="json">导出 JSON</el-dropdown-item>
                <el-dropdown-item command="csv">导出 CSV</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- Hint line -->
      <div class="toolbar-hint">
        <span>Ctrl+K 清空</span>
        <span class="sep">|</span>
        <span>Ctrl+P 暂停/继续</span>
        <span class="sep">|</span>
        <span>终端模式 (xterm.js)</span>
      </div>
    </div>

    <!-- xterm.js terminal container -->
    <div class="terminal-card card">
      <div ref="terminalContainer" class="terminal-xterm" />
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

/* -- Toolbar ------------------------------------------------------------- */

.toolbar {
  padding: 12px 16px;
  flex-shrink: 0;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 18px;
  color: var(--text-primary, #e6edf3);
  margin: 0;
}

/* -- WebSocket status badge ---------------------------------------------- */

.ws-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.ws-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.ws-status.connected {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.ws-status.connected .ws-dot {
  background: #10b981;
  box-shadow: 0 0 4px #10b981;
}

.ws-status.connecting,
.ws-status.reconnecting {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.ws-status.connecting .ws-dot,
.ws-status.reconnecting .ws-dot {
  background: #f59e0b;
  animation: blink 1s infinite;
}

.ws-status.disconnected {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.ws-status.disconnected .ws-dot {
  background: #ef4444;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* -- Stat badges --------------------------------------------------------- */

.stat-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 4px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.stat-badge.total {
  background: rgba(59, 130, 246, 0.12);
  color: #60a5fa;
}

.stat-badge.info {
  background: rgba(59, 130, 246, 0.1);
  color: #60a5fa;
}

.stat-badge.debug {
  background: rgba(107, 114, 128, 0.12);
  color: #9ca3af;
}

.stat-badge.warn {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.stat-badge.error {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.stat-badge.direction {
  background: rgba(255, 255, 255, 0.05);
  color: #9ca3af;
}

.arrow-in {
  color: #10b981;
  margin-right: 2px;
}

.arrow-out {
  color: #3b82f6;
  margin-left: 6px;
  margin-right: 2px;
}

/* -- Toolbar hint line --------------------------------------------------- */

.toolbar-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: #6b7280;
}

.toolbar-hint .sep {
  opacity: 0.3;
}

/* -- Terminal ------------------------------------------------------------ */

.terminal-card {
  flex: 1;
  padding: 0;
  overflow: hidden;
  background: #0d1117;
}

.terminal-xterm {
  width: 100%;
  height: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* Ensure xterm fills the container */
.terminal-xterm :deep(.xterm) {
  height: 100%;
}

.terminal-xterm :deep(.xterm-viewport) {
  overflow-y: auto;
}
</style>
