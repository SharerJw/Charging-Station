<script setup lang="ts">
/**
 * EventStream 组件 (simulator-web)
 * 功能: OCPP事件实时滚动列表
 */

interface OcppMessage {
  messageId: string
  action: string
  type: 'Call' | 'CallResult' | 'CallError'
  payload: Record<string, any>
  timestamp: string
  direction: 'inbound' | 'outbound'
  chargePointId: string
}

defineProps<{
  events: OcppMessage[]
}>()

const eventColors: Record<string, string> = {
  Heartbeat: '#6B7280', MeterValues: '#3B82F6', StatusNotification: '#F59E0B',
  BootNotification: '#10B981', StartTransaction: '#06B6D4', StopTransaction: '#8B5CF6',
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
</script>

<template>
  <div class="events-list">
    <div v-for="event in events.slice(0, 20)" :key="event.messageId" class="event-item">
      <span class="event-time">{{ formatTime(event.timestamp) }}</span>
      <span class="event-dir" :class="event.direction">{{ event.direction === 'inbound' ? '←' : '→' }}</span>
      <span class="event-source">{{ event.chargePointId }}</span>
      <span class="event-action" :style="{ color: eventColors[event.action] || '#9CA3AF' }">{{ event.action }}</span>
    </div>
  </div>
</template>

<style scoped>
.events-list { overflow-y: auto; max-height: 300px; }
.event-item { display: flex; gap: 8px; padding: 3px 0; font-size: 12px; font-family: var(--font-family-code); }
.event-time { color: #6B7280; min-width: 70px; }
.event-dir { min-width: 14px; text-align: center; font-weight: bold; }
.event-dir.inbound { color: #10B981; }
.event-dir.outbound { color: #3B82F6; }
.event-source { color: #F59E0B; min-width: 100px; }
.event-action { font-weight: bold; }
</style>
