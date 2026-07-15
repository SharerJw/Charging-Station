<template>
  <view class="charging-page">
    <!-- 充电状态卡片 -->
    <view class="status-card" :class="session.status">
      <text class="status-icon">{{ session.status === 'charging' ? '⚡' : '✅' }}</text>
      <text class="status-text">{{ session.status === 'charging' ? '充电中' : '充电完成' }}</text>
      <text class="power">{{ session.power.toFixed(1) }} kW</text>
    </view>

    <!-- SOC 显示 -->
    <view class="soc-section">
      <view class="soc-bar">
        <view class="soc-fill" :style="{ width: session.currentSoc + '%' }"></view>
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
        <text class="info-value">{{ session.energy.toFixed(1) }} kWh</text>
      </view>
      <view class="info-item">
        <text class="info-label">充电时长</text>
        <text class="info-value">{{ formatDuration(session.duration) }}</text>
      </view>
      <view class="info-item">
        <text class="info-label">已充金额</text>
        <text class="info-value amount">¥{{ session.cost.toFixed(2) }}</text>
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
        <text class="row-value">{{ session.startTime }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <button v-if="session.status === 'charging'" class="stop-btn" @tap="handleStop">停止充电</button>
      <button v-else class="back-btn" @tap="goBack">返回首页</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { api, type ChargingSession } from '@/api/index'

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

const estimatedRemaining = computed(() => {
  if (session.value.status !== 'charging' || session.value.currentSoc >= 80) return '-'
  const remainingSoc = 80 - session.value.currentSoc
  const minutes = Math.floor(remainingSoc / (session.value.power / 60))
  return `~${minutes}分钟`
})

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

onMounted(async () => {
  try {
    // 获取当前充电状态
    const status = await api.getChargingStatus('current')
    session.value = status

    // 每3秒刷新一次
    refreshTimer = setInterval(async () => {
      try {
        const updated = await api.getChargingStatus(session.value.orderId)
        session.value = updated
        if (updated.status === 'completed') {
          if (refreshTimer) clearInterval(refreshTimer)
          uni.showToast({ title: '充电已完成', icon: 'success' })
        }
      } catch (e) {
        console.error('刷新状态失败:', e)
      }
    }, 3000)
  } catch (error) {
    uni.showToast({ title: '获取充电状态失败', icon: 'none' })
  }
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

async function handleStop() {
  uni.showModal({
    title: '确认停止',
    content: '确定要停止充电吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          const result = await api.stopCharging(session.value.orderId)
          session.value = result
          if (refreshTimer) clearInterval(refreshTimer)
          uni.showToast({ title: '充电已停止', icon: 'success' })
        } catch (error) {
          uni.showToast({ title: '停止失败', icon: 'none' })
        }
      }
    }
  })
}

function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style scoped>
.charging-page {
  padding: 24rpx;
  background: #F6F7FB;
  min-height: 100vh;
}

.status-card {
  border-radius: 16rpx;
  padding: 48rpx;
  text-align: center;
  color: #fff;
  margin-bottom: 24rpx;
}

.status-card.charging {
  background: linear-gradient(135deg, #07C160, #06AD56);
}

.status-card.completed {
  background: linear-gradient(135deg, #1677FF, #0958D9);
}

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
  transition: width 1s ease;
}

.soc-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

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

.back-btn {
  background: #07C160;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  padding: 24rpx;
}
</style>
