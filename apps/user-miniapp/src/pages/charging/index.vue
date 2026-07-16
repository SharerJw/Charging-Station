<template>
  <view class="charging-page">
    <!-- 无充电会话时显示 -->
    <view class="empty-state" v-if="!hasSession">
      <text class="empty-icon">🔋</text>
      <text class="empty-title">暂无充电会话</text>
      <text class="empty-desc">请先扫码或在找桩页面选择充电桩开始充电</text>
      <button class="go-map-btn" @tap="goToMap">去找桩</button>
    </view>

    <!-- 充电中 -->
    <template v-else>
      <!-- 充电状态卡片 -->
      <view class="status-card" :class="session.status">
        <text class="status-icon">{{ session.status === 'charging' ? '⚡' : '✅' }}</text>
        <text class="status-text">{{ statusText }}</text>
        <text class="power">{{ powerDisplay }}</text>
      </view>

      <!-- SOC 显示 -->
      <view class="soc-section">
        <view class="soc-bar">
          <view class="soc-fill" :style="{ width: Math.min(session.currentSoc, 100) + '%' }"></view>
        </view>
        <view class="soc-labels">
          <text class="soc-value">{{ Math.floor(session.currentSoc) }}%</text>
          <text class="soc-hint">目标 80%</text>
        </view>
      </view>

      <!-- 详细数据 -->
      <view class="info-grid">
        <view class="info-item">
          <text class="info-label">已充电量</text>
          <text class="info-value">{{ energyDisplay }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">充电时长</text>
          <text class="info-value">{{ formatDuration(session.duration) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">已充金额</text>
          <text class="info-value amount">¥{{ costDisplay }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">预估剩余</text>
          <text class="info-value">{{ estimatedRemaining }}</text>
        </view>
      </view>

      <!-- 充电站信息 -->
      <view class="station-info">
        <text class="info-title">充电站信息</text>
        <view class="info-row">
          <text class="row-label">充电站</text>
          <text class="row-value">{{ session.stationName }}</text>
        </view>
        <view class="info-row">
          <text class="row-label">设备编号</text>
          <text class="row-value">{{ session.deviceCode }}</text>
        </view>
        <view class="info-row">
          <text class="row-label">开始时间</text>
          <text class="row-value">{{ formatTime(session.startTime) }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <button v-if="session.status === 'charging'" class="stop-btn" :disabled="stopping" @tap="handleStop">
          {{ stopping ? '停止中...' : '停止充电' }}
        </button>
        <button v-else class="back-btn" @tap="goBack">返回首页</button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { api, type ChargingSession } from '@/api/index'

const hasSession = ref(false)
const stopping = ref(false)
const session = ref<ChargingSession>({
  orderId: '',
  stationName: '',
  deviceCode: '',
  status: 'charging',
  currentSoc: 0,
  power: 0,
  energy: 0,
  duration: 0,
  cost: 0,
  startTime: '',
})

let refreshTimer: ReturnType<typeof setInterval> | null = null

const statusText = computed(() => {
  if (session.value.status === 'charging') return '充电中'
  if (session.value.status === 'completed') return '充电完成'
  if (session.value.status === 'stopped') return '已停止'
  return '未知状态'
})

// 功率显示: W → kW
const powerDisplay = computed(() => {
  const w = session.value.power
  if (w >= 1000) return (w / 1000).toFixed(1) + ' kW'
  return w.toFixed(0) + ' W'
})

// 电量显示: Wh → kWh
const energyDisplay = computed(() => {
  const wh = session.value.energy
  if (wh >= 1000) return (wh / 1000).toFixed(2) + ' kWh'
  return wh.toFixed(0) + ' Wh'
})

// 金额显示: 分 → 元
const costDisplay = computed(() => {
  return (session.value.cost / 100).toFixed(2)
})

const estimatedRemaining = computed(() => {
  if (session.value.status !== 'charging' || session.value.currentSoc >= 80) return '-'
  const remainingSoc = 80 - session.value.currentSoc
  const powerW = session.value.power
  if (powerW <= 0) return '-'
  // 假设电池容量60kWh，剩余电量 = remainingSoc% * 60kWh
  const remainingWh = remainingSoc / 100 * 60000
  const hours = remainingWh / powerW
  const minutes = Math.ceil(hours * 60)
  if (minutes < 60) return `~${minutes}分钟`
  return `~${Math.floor(minutes / 60)}小时${minutes % 60}分钟`
})

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatTime(time: string): string {
  if (!time) return '--'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function fetchStatus() {
  try {
    const id = currentOrderId || 'current'
    const status = await api.getChargingStatus(id)
    if (!status || status.status === 'idle') {
      hasSession.value = false
      stopPolling()
      return
    }
    session.value = status
    hasSession.value = true
    if (status.status !== 'charging') {
      stopPolling()
    }
  } catch (e) {
    console.error('fetchStatus error:', e)
  }
}

function startPolling() {
  stopPolling()
  refreshTimer = setInterval(fetchStatus, 1000) // 每秒更新
}

function stopPolling() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(async () => {
  // 从页面参数获取 orderId 或 stationId
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.$page?.options || (currentPage as any)?.options || {}
  const orderId = options.orderId
  const stationId = options.stationId

  if (orderId) {
    // 从地图页跳转过来，已有 orderId
    try {
      const status = await api.getChargingStatus(orderId)
      if (status && status.status !== 'idle') {
        session.value = status
        hasSession.value = true
        if (status.status === 'charging') {
          // 存储当前 orderId 用于后续轮询
          currentOrderId = orderId
          startPollingWithId(orderId)
        }
      }
    } catch (e) {
      console.error('获取充电状态失败:', e)
    }
  } else if (stationId) {
    // 从其他页面跳转，直接启动充电
    try {
      uni.showLoading({ title: '启动充电中...' })
      const result = await api.startCharging({
        stationId,
        deviceCode: 'DEV-' + String(stationId).padStart(4, '0'),
        connectorId: '1',
      })
      uni.hideLoading()
      if (result && (result as any).orderId) {
        session.value = result as ChargingSession
        hasSession.value = true
        currentOrderId = (result as any).orderId
        startPollingWithId((result as any).orderId)
      }
    } catch (e) {
      uni.hideLoading()
      uni.showToast({ title: '启动充电失败', icon: 'none' })
    }
  } else {
    // 默认查询当前充电状态
    await fetchStatus()
    if (hasSession.value && session.value.status === 'charging') {
      startPolling()
    }
  }
})

let currentOrderId = ''

function startPollingWithId(orderId: string) {
  stopPolling()
  currentOrderId = orderId
  refreshTimer = setInterval(async () => {
    try {
      const status = await api.getChargingStatus(orderId)
      if (!status || status.status === 'idle') {
        hasSession.value = false
        stopPolling()
        return
      }
      session.value = status
      if (status.status !== 'charging') {
        stopPolling()
      }
    } catch (e) {
      // 静默处理
    }
  }, 1000)
}

onUnmounted(() => {
  stopPolling()
})

async function handleStop() {
  if (stopping.value) return
  uni.showModal({
    title: '确认停止',
    content: '确定要停止充电吗？',
    success: async (res) => {
      if (res.confirm) {
        stopping.value = true
        try {
          const orderId = currentOrderId || session.value.orderId
          const result = await api.stopCharging(orderId)
          if (result) {
            session.value = result
          }
          stopPolling()
          uni.showToast({ title: '充电已停止', icon: 'success' })
        } catch (error) {
          uni.showToast({ title: '停止失败', icon: 'none' })
        } finally {
          stopping.value = false
        }
      }
    }
  })
}

function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}

function goToMap() {
  uni.switchTab({ url: '/pages/map/index' })
}
</script>

<style scoped>
.charging-page {
  padding: 24rpx;
  background: #F6F7FB;
  min-height: 100vh;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 48rpx 0;
}

.empty-icon { font-size: 96rpx; }
.empty-title { font-size: 32rpx; font-weight: bold; color: #333; margin-top: 24rpx; }
.empty-desc { font-size: 24rpx; color: #999; margin-top: 12rpx; text-align: center; }

.go-map-btn {
  margin-top: 48rpx;
  background: #07C160;
  color: #fff;
  border: none;
  border-radius: 48rpx;
  font-size: 30rpx;
  padding: 20rpx 80rpx;
}

.status-card {
  border-radius: 16rpx;
  padding: 48rpx;
  text-align: center;
  color: #fff;
  margin-bottom: 24rpx;
}

.status-card.charging { background: linear-gradient(135deg, #07C160, #06AD56); }
.status-card.completed { background: linear-gradient(135deg, #1677FF, #0958D9); }
.status-card.stopped { background: linear-gradient(135deg, #999, #666); }

.status-icon { font-size: 64rpx; display: block; }
.status-text { font-size: 32rpx; display: block; margin-top: 12rpx; }
.power { font-size: 56rpx; font-weight: bold; display: block; margin-top: 16rpx; }

.soc-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.soc-bar {
  height: 24rpx;
  background: #E8E8E8;
  border-radius: 12rpx;
  overflow: hidden;
}

.soc-fill {
  height: 100%;
  background: linear-gradient(90deg, #07C160, #52C41A);
  border-radius: 12rpx;
  transition: width 0.5s ease;
}

.soc-labels { display: flex; justify-content: space-between; margin-top: 12rpx; }
.soc-value { font-size: 32rpx; font-weight: bold; color: #07C160; }
.soc-hint { font-size: 22rpx; color: #999; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.info-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
}

.info-label { font-size: 22rpx; color: #999; display: block; }
.info-value { font-size: 30rpx; font-weight: bold; display: block; margin-top: 8rpx; color: #333; }
.info-value.amount { color: #FF4D4F; }

.station-info {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.info-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-row:last-child { border-bottom: none; }
.row-label { font-size: 24rpx; color: #999; }
.row-value { font-size: 24rpx; color: #333; }

.actions { margin-top: 32rpx; }

.stop-btn {
  background: #FF4D4F;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  padding: 24rpx;
}

.stop-btn[disabled] { opacity: 0.6; }

.back-btn {
  background: #07C160;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  padding: 24rpx;
}
</style>
