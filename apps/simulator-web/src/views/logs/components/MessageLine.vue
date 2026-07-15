<script setup lang="ts">
/**
 * OcppMessage 组件 (simulator-web)
 * 功能: 单条OCPP消息展示（时间/方向/来源/动作/载荷）
 */
defineProps<{
  message: {
    messageId: string
    action: string
    type: string
    payload: any
    timestamp: string
    direction: 'inbound' | 'outbound'
    chargePointId: string
  }
}>()

const levelColors: Record<string, string> = {
  Heartbeat: '#6B7280', MeterValues: '#3B82F6', StatusNotification: '#F59E0B',
  BootNotification: '#10B981', StartTransaction: '#06B6D4', StopTransaction: '#8B5CF6',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

function formatPayload(payload: any): string {
  if (!payload || Object.keys(payload).length === 0) return '{}'
  return JSON.stringify(payload)
}
</script>

<template>
  <div class="log-line" :class="message.type.toLowerCase()">
    <span class="log-time">{{ formatTime(message.timestamp) }}</span>
    <span class="log-direction" :class="message.direction">{{ message.direction === 'inbound' ? '←' : '→' }}</span>
    <span class="log-type" :class="message.type">{{ message.type }}</span>
    <span class="log-source">{{ message.chargePointId }}</span>
    <span class="log-action" :style="{ color: levelColors[message.action] || '#C084FC' }">{{ message.action }}</span>
    <span class="log-payload">{{ formatPayload(message.payload) }}</span>
  </div>
</template>

<style scoped>
.log-line { display: flex; gap: 8px; padding: 1px 4px; border-radius: 2px; font-size: 12px; font-family: var(--font-family-code); line-height: 1.8; }
.log-line:hover { background: rgba(255, 255, 255, 0.05); }
.log-time { color: #6B7280; min-width: 100px; flex-shrink: 0; }
.log-direction { min-width: 16px; text-align: center; font-weight: bold; }
.log-direction.inbound { color: #10B981; }
.log-direction.outbound { color: #3B82F6; }
.log-type { min-width: 80px; font-size: 11px; padding: 0 4px; border-radius: 2px; flex-shrink: 0; }
.log-type.Call { background: rgba(59,130,246,0.15); color: #60A5FA; }
.log-type.CallResult { background: rgba(16,185,129,0.15); color: #34D399; }
.log-type.CallError { background: rgba(239,68,68,0.15); color: #F87171; }
.log-source { color: #F59E0B; min-width: 120px; flex-shrink: 0; }
.log-action { min-width: 180px; font-weight: bold; flex-shrink: 0; }
.log-payload { color: #9CA3AF; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
