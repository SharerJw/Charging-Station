<template>
  <view class="charging-page">
    <!-- Custom status bar spacer for immersive -->
    <view class="status-bar-spacer"></view>

    <!-- ===== EMPTY STATE ===== -->
    <view class="empty-state" v-if="!hasSession">
      <view class="empty-illustration">
        <view class="empty-circle">
          <text class="empty-bolt">&#x26A1;</text>
        </view>
        <view class="empty-glow"></view>
      </view>
      <text class="empty-title">暂无充电会话</text>
      <text class="empty-desc">请先扫码或在找桩页面选择充电桩开始充电</text>
      <button class="go-station-btn" @tap="goToMap">去找站</button>
    </view>

    <!-- ===== CHARGING ACTIVE ===== -->
    <template v-else>
      <!-- 1. Header bar -->
      <view class="header-bar">
        <view class="header-left">
          <text class="station-name">{{ session.stationName }}</text>
          <text class="device-code">{{ session.deviceCode }}</text>
        </view>
        <view class="header-right">
          <view class="price-pill">
            <text class="price-text">&#xA5;{{ pricePerKwh }}/度</text>
          </view>
          <view class="gear-icon" @tap="openSettings">
            <text class="gear-symbol">&#x2699;</text>
          </view>
        </view>
      </view>

      <!-- 2. Central SOC Ring (core, ~60% visual weight) -->
      <view class="soc-ring-wrapper">
        <canvas
          canvas-id="socRing"
          id="socRing"
          type="2d"
          class="soc-canvas"
        ></canvas>
        <view class="soc-center-content">
          <text class="soc-value">{{ animatedSoc }}%</text>
          <text class="soc-label">SOC</text>
          <text class="soc-eta" v-if="session.status === 'charging' && etaMinutes > 0">
            约 {{ etaMinutes }} 分钟充满
          </text>
          <text class="soc-eta" v-else-if="session.status === 'completed'">充电完成</text>
          <text class="soc-eta" v-else-if="session.status === 'stopped'">充电已停止</text>
        </view>
      </view>

      <!-- 3. 4 Metric Cards -->
      <view class="metrics-row">
        <view class="metric-card">
          <text class="metric-icon">&#x23F1;</text>
          <text class="metric-value">{{ durationDisplay }}</text>
          <text class="metric-label">充电时长</text>
        </view>
        <view class="metric-card">
          <text class="metric-icon">&#x26A1;</text>
          <text class="metric-value">{{ energyDisplay }}</text>
          <text class="metric-label">已充电量</text>
        </view>
        <view class="metric-card">
          <text class="metric-icon">&#x1F50B;</text>
          <text class="metric-value">{{ powerDisplay }}</text>
          <text class="metric-label">实时功率</text>
        </view>
        <view class="metric-card">
          <text class="metric-icon">&#x1F4B0;</text>
          <text class="metric-value">&#xA5;{{ costDisplay }}</text>
          <text class="metric-label">已产生费用</text>
        </view>
      </view>

      <!-- 4. Power Curve -->
      <view class="power-curve-card">
        <view class="power-curve-header">
          <text class="power-curve-title">功率曲线</text>
          <text class="power-curve-current">{{ powerDisplay }}</text>
        </view>
        <canvas
          canvas-id="powerCurve"
          id="powerCurve"
          type="2d"
          class="power-curve-canvas"
        ></canvas>
      </view>

      <!-- 5. Smart Alert Banner -->
      <view class="alert-banner alert-warning" v-if="showPeakAlert">
        <text class="alert-icon">&#x23F0;</text>
        <text class="alert-text">距峰段电价还有{{ peakMinutes }}分钟，继续充电费用将增加</text>
      </view>
      <view class="alert-banner alert-green" v-if="showValleyAlert">
        <text class="alert-icon">&#x1F319;</text>
        <text class="alert-text">当前谷段电价，比白天省 &#xA5;{{ valleySaving }}</text>
      </view>

      <!-- Spacer before fixed button -->
      <view class="bottom-spacer"></view>

      <!-- 6. Stop Charging Button -->
      <view class="stop-area" v-if="session.status === 'charging'">
        <button class="stop-btn" :disabled="stopping" @tap="showStopModal = true">
          {{ stopping ? '停止中...' : '结束充电' }}
        </button>
      </view>
      <view class="stop-area" v-else>
        <button class="back-home-btn" @tap="goBack">返回首页</button>
      </view>
    </template>

    <!-- ===== STOP CONFIRMATION MODAL ===== -->
    <view class="modal-overlay" v-if="showStopModal" @tap="showStopModal = false">
      <view class="modal-card" @tap.stop>
        <text class="modal-title">确认结束充电？</text>
        <view class="modal-summary">
          <view class="modal-row">
            <text class="modal-label">充电时长</text>
            <text class="modal-val">{{ durationDisplay }}</text>
          </view>
          <view class="modal-row">
            <text class="modal-label">已充电量</text>
            <text class="modal-val">{{ energyDisplay }}</text>
          </view>
          <view class="modal-row">
            <text class="modal-label">已产生费用</text>
            <text class="modal-val highlight">&#xA5;{{ costDisplay }}</text>
          </view>
          <view class="modal-row">
            <text class="modal-label">当前SOC</text>
            <text class="modal-val">{{ Math.floor(session.currentSoc) }}%</text>
          </view>
        </view>

        <!-- Slide to confirm -->
        <view class="slide-track">
          <view
            class="slide-thumb"
            :style="{ left: slideX + 'px' }"
            @touchstart="onSlideStart"
            @touchmove="onSlideMove"
            @touchend="onSlideEnd"
          >
            <text class="slide-arrow">&#x300B;</text>
          </view>
          <text class="slide-hint" :style="{ opacity: slideX < 20 ? 1 : 0 }">滑动确认结束充电</text>
        </view>

        <view class="modal-cancel" @tap="showStopModal = false">
          <text class="modal-cancel-text">取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { api, type ChargingSession } from '@/api/index'

/* ==================== State ==================== */
const hasSession = ref(false)
const stopping = ref(false)
const showStopModal = ref(false)
const slideX = ref(0)
let slideStartX = 0
const slideTrackWidth = 280

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

/* ==================== Animation state ==================== */
const animatedSoc = ref(0)
let socAnimFrame: number | null = null
let targetSoc = 0
let currentDrawSoc = 0

/* ==================== Power curve history ==================== */
const powerHistory = ref<number[]>([])
const MAX_HISTORY = 60

/* ==================== Polling ==================== */
let refreshTimer: ReturnType<typeof setInterval> | null = null
let currentOrderId = ''

/* ==================== Duration ticker ==================== */
const liveDuration = ref(0)
let durationTimer: ReturnType<typeof setInterval> | null = null

/* ==================== Computed displays ==================== */
const durationDisplay = computed(() => {
  const seconds = liveDuration.value || session.value.duration
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const powerDisplay = computed(() => {
  const w = session.value.power
  if (w >= 1000) return (w / 1000).toFixed(1) + ' kW'
  return w.toFixed(0) + ' W'
})

const energyDisplay = computed(() => {
  const wh = session.value.energy
  if (wh >= 1000) return (wh / 1000).toFixed(2) + ' kWh'
  return wh.toFixed(0) + ' Wh'
})

const costDisplay = computed(() => {
  return (session.value.cost / 100).toFixed(2)
})

const pricePerKwh = computed(() => {
  if (session.value.energy > 0 && session.value.cost > 0) {
    const kwh = session.value.energy / 1000
    const yuan = session.value.cost / 100
    return (yuan / kwh).toFixed(2)
  }
  return '1.28'
})

const etaMinutes = computed(() => {
  if (session.value.status !== 'charging' || session.value.currentSoc >= 99) return 0
  const remainingSoc = 100 - session.value.currentSoc
  const powerW = session.value.power
  if (powerW <= 0) return 0
  const remainingWh = (remainingSoc / 100) * 60000
  const hours = remainingWh / powerW
  return Math.ceil(hours * 60)
})

/* ==================== Smart alert logic ==================== */
const showPeakAlert = ref(false)
const peakMinutes = ref(45)
const showValleyAlert = ref(false)
const valleySaving = ref('12.5')

function updateTimeAlerts() {
  const hour = new Date().getHours()
  if (hour >= 9 && hour < 10) {
    showPeakAlert.value = true
    peakMinutes.value = (10 - hour) * 60 - new Date().getMinutes()
    showValleyAlert.value = false
  } else if (hour >= 7 && hour < 9) {
    showPeakAlert.value = false
    showValleyAlert.value = false
  } else if (hour >= 23 || hour < 7) {
    showPeakAlert.value = false
    showValleyAlert.value = true
    valleySaving.value = '12.5'
  } else {
    showPeakAlert.value = false
    showValleyAlert.value = false
  }
}

/* ==================== Canvas: SOC Ring ==================== */
function drawSocRing(progress: number) {
  const query = uni.createSelectorQuery()
  query
    .select('#socRing')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = uni.getSystemInfoSync().pixelRatio || 2
      const w = res[0].width || 240
      const h = res[0].height || 240
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      const cx = w / 2
      const cy = h / 2
      const radius = w * 0.4167
      const lineWidth = w * 0.05

      ctx.clearRect(0, 0, w, h)

      // Background track ring
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = lineWidth
      ctx.lineCap = 'round'
      ctx.stroke()

      // Progress arc
      if (progress > 0) {
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + (Math.PI * 2 * Math.min(progress, 100)) / 100

        // Vertical gradient: #07C160 -> #00E5A0
        const grad = ctx.createLinearGradient(cx, cy + radius, cx, cy - radius)
        grad.addColorStop(0, '#07C160')
        grad.addColorStop(1, '#00E5A0')

        ctx.beginPath()
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.strokeStyle = grad
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.stroke()

        // Outer glow
        ctx.beginPath()
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.strokeStyle = 'rgba(0, 229, 160, 0.15)'
        ctx.lineWidth = lineWidth + 8
        ctx.lineCap = 'round'
        ctx.stroke()

        // End dot with glow
        const dotX = cx + radius * Math.cos(endAngle)
        const dotY = cy + radius * Math.sin(endAngle)
        ctx.beginPath()
        ctx.arc(dotX, dotY, lineWidth * 0.6 + 4, 0, Math.PI * 2)
        ctx.fillStyle = '#00E5A0'
        ctx.shadowColor = '#00E5A0'
        ctx.shadowBlur = 16
        ctx.fill()
        ctx.shadowBlur = 0
      }
    })
}

function animateSocRing() {
  if (socAnimFrame) cancelAnimationFrame(socAnimFrame)

  function step() {
    const diff = targetSoc - currentDrawSoc
    if (Math.abs(diff) < 0.3) {
      currentDrawSoc = targetSoc
      drawSocRing(currentDrawSoc)
      animatedSoc.value = Math.floor(currentDrawSoc)
      return
    }
    currentDrawSoc += diff * 0.08
    drawSocRing(currentDrawSoc)
    animatedSoc.value = Math.floor(currentDrawSoc)
    socAnimFrame = requestAnimationFrame(step)
  }

  socAnimFrame = requestAnimationFrame(step)
}

/* ==================== Canvas: Power Curve ==================== */
function drawPowerCurve() {
  const query = uni.createSelectorQuery()
  query
    .select('#powerCurve')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = uni.getSystemInfoSync().pixelRatio || 2
      const w = res[0].width || 320
      const h = res[0].height || 80
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      ctx.clearRect(0, 0, w, h)

      const data = powerHistory.value
      if (data.length < 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('数据采集中...', w / 2, h / 2)
        return
      }

      const maxVal = Math.max(...data, 1)
      const padding = { top: 10, bottom: 10, left: 4, right: 4 }
      const chartW = w - padding.left - padding.right
      const chartH = h - padding.top - padding.bottom

      const points: { x: number; y: number }[] = []
      for (let i = 0; i < data.length; i++) {
        const x = padding.left + (i / (data.length - 1)) * chartW
        const y = padding.top + chartH - (data[i] / maxVal) * chartH
        points.push({ x, y })
      }

      // Gradient fill area under curve
      const fillGrad = ctx.createLinearGradient(0, padding.top, 0, h)
      fillGrad.addColorStop(0, 'rgba(0, 229, 160, 0.35)')
      fillGrad.addColorStop(1, 'rgba(22, 119, 255, 0.05)')

      ctx.beginPath()
      ctx.moveTo(points[0].x, h)
      for (const p of points) {
        ctx.lineTo(p.x, p.y)
      }
      ctx.lineTo(points[points.length - 1].x, h)
      ctx.closePath()
      ctx.fillStyle = fillGrad
      ctx.fill()

      // Curve line with gradient
      const lineGrad = ctx.createLinearGradient(0, 0, w, 0)
      lineGrad.addColorStop(0, '#07C160')
      lineGrad.addColorStop(1, '#00E5A0')

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.strokeStyle = lineGrad
      ctx.lineWidth = 2
      ctx.stroke()

      // Current point glow
      const last = points[points.length - 1]
      ctx.beginPath()
      ctx.arc(last.x, last.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#00E5A0'
      ctx.shadowColor = '#00E5A0'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0

      // Value bubble
      const bubbleText = powerDisplay.value
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
      const tw = ctx.measureText(bubbleText).width + 12
      const bx = Math.min(last.x - tw / 2, w - tw - 2)
      const by = Math.max(last.y - 24, 2)
      ctx.beginPath()
      roundRect(ctx, bx, by, tw, 18, 4)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(bubbleText, bx + tw / 2, by + 13)
    })
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
}

/* ==================== Polling & Lifecycle ==================== */
async function fetchStatus() {
  try {
    const id = currentOrderId || 'current'
    const status = await api.getChargingStatus(id)
    if (!status || status.status === 'idle') {
      hasSession.value = false
      stopPolling()
      return
    }
    applyStatus(status)
    if (status.status !== 'charging') {
      stopPolling()
    }
  } catch (e) {
    console.error('fetchStatus error:', e)
  }
}

function applyStatus(status: ChargingSession) {
  session.value = status
  hasSession.value = true
  liveDuration.value = status.duration
  targetSoc = Math.min(status.currentSoc, 100)
  animateSocRing()

  // Append to power history (kW)
  const kw = status.power >= 1000 ? status.power / 1000 : status.power
  powerHistory.value.push(kw)
  if (powerHistory.value.length > MAX_HISTORY) {
    powerHistory.value.shift()
  }
  drawPowerCurve()
}

function startPolling() {
  stopPolling()
  refreshTimer = setInterval(fetchStatus, 1000)
}

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
      applyStatus(status)
      if (status.status !== 'charging') {
        stopPolling()
      }
    } catch (e) {
      // silent
    }
  }, 1000)
}

function stopPolling() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function startDurationTicker() {
  stopDurationTicker()
  durationTimer = setInterval(() => {
    if (session.value.status === 'charging') {
      liveDuration.value++
    }
  }, 1000)
}

function stopDurationTicker() {
  if (durationTimer) {
    clearInterval(durationTimer)
    durationTimer = null
  }
}

onMounted(async () => {
  wx.setKeepScreenOn({ keepScreenOn: true })

  updateTimeAlerts()

  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.$page?.options || (currentPage as any)?.options || {}
  const orderId = options.orderId
  const stationId = options.stationId

  if (orderId) {
    try {
      const status = await api.getChargingStatus(orderId)
      if (status && status.status !== 'idle') {
        applyStatus(status)
        if (status.status === 'charging') {
          currentOrderId = orderId
          startPollingWithId(orderId)
          startDurationTicker()
        }
      }
    } catch (e) {
      console.error('获取充电状态失败:', e)
    }
  } else if (stationId) {
    try {
      uni.showLoading({ title: '启动充电中...' })
      const result = await api.startCharging({
        stationId,
        deviceCode: 'DEV-' + String(stationId).padStart(4, '0'),
        connectorId: '1',
      })
      uni.hideLoading()
      if (result && (result as any).orderId) {
        applyStatus(result as ChargingSession)
        currentOrderId = (result as any).orderId
        startPollingWithId((result as any).orderId)
        startDurationTicker()
      }
    } catch (e) {
      uni.hideLoading()
      uni.showToast({ title: '启动充电失败', icon: 'none' })
    }
  } else {
    await fetchStatus()
    if (hasSession.value && session.value.status === 'charging') {
      startPolling()
      startDurationTicker()
    }
  }

  // Initial canvas draw after DOM is ready
  await nextTick()
  if (hasSession.value) {
    drawSocRing(animatedSoc.value)
    drawPowerCurve()
  }
})

onUnmounted(() => {
  stopPolling()
  stopDurationTicker()
  if (socAnimFrame) cancelAnimationFrame(socAnimFrame)
  wx.setKeepScreenOn({ keepScreenOn: false })
})

/* ==================== Stop charging ==================== */
async function handleStopConfirm() {
  if (stopping.value) return
  showStopModal.value = false
  stopping.value = true
  try {
    const orderId = currentOrderId || session.value.orderId
    const result = await api.stopCharging(orderId)
    if (result) {
      applyStatus(result)
    }
    stopPolling()
    stopDurationTicker()
    uni.showToast({ title: '充电已停止', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '停止失败', icon: 'none' })
  } finally {
    stopping.value = false
  }
}

/* ==================== Slide-to-confirm ==================== */
function onSlideStart(e: any) {
  slideStartX = e.touches[0].clientX
}

function onSlideMove(e: any) {
  const dx = e.touches[0].clientX - slideStartX
  slideX.value = Math.max(0, Math.min(dx, slideTrackWidth))
}

function onSlideEnd() {
  if (slideX.value >= slideTrackWidth * 0.85) {
    slideX.value = slideTrackWidth
    handleStopConfirm()
  } else {
    slideX.value = 0
  }
}

/* ==================== Navigation ==================== */
function goBack() {
  uni.switchTab({ url: '/pages/index/index' })
}

function goToMap() {
  uni.switchTab({ url: '/pages/map/index' })
}

function openSettings() {
  uni.showToast({ title: '设置', icon: 'none' })
}
</script>

<style scoped>
/* ==================== Page root ==================== */
.charging-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0A1628 0%, #1A2744 100%);
  position: relative;
  overflow-x: hidden;
}

/* ==================== Empty state ==================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 0 64rpx;
}

.empty-illustration {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 48rpx;
}

.empty-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(7, 193, 96, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.empty-bolt {
  font-size: 80rpx;
}

.empty-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(7, 193, 96, 0.15) 0%, transparent 70%);
}

.empty-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  line-height: 1.6;
}

.go-station-btn {
  margin-top: 64rpx;
  width: 320rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  color: #ffffff;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
}

/* ==================== Status bar spacer ==================== */
.status-bar-spacer {
  height: env(safe-area-inset-top, 44px);
}

/* ==================== Header bar ==================== */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24rpx 32rpx 0;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.station-name {
  font-size: 30rpx;
  color: #ffffff;
  font-weight: 600;
}

.device-code {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 6rpx;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.price-pill {
  background: rgba(7, 193, 96, 0.18);
  border: 1rpx solid rgba(7, 193, 96, 0.4);
  border-radius: 24rpx;
  padding: 6rpx 20rpx;
}

.price-text {
  font-size: 22rpx;
  color: #07C160;
  font-weight: 600;
}

.gear-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.gear-symbol {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* ==================== SOC Ring ==================== */
.soc-ring-wrapper {
  position: relative;
  width: 480rpx;
  height: 480rpx;
  margin: 40rpx auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.soc-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 480rpx;
  height: 480rpx;
}

.soc-center-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.soc-value {
  font-size: 80rpx;
  font-weight: 700;
  color: #ffffff;
  font-family: 'DIN Alternate', 'DIN', monospace;
  line-height: 1;
}

.soc-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8rpx;
  letter-spacing: 4rpx;
}

.soc-eta {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 12rpx;
}

/* ==================== Metric cards ==================== */
.metrics-row {
  display: flex;
  gap: 16rpx;
  padding: 0 32rpx;
  margin-top: 40rpx;
}

.metric-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12rpx;
  padding: 20rpx 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.metric-icon {
  font-size: 28rpx;
}

.metric-value {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
  font-family: 'DIN Alternate', 'DIN', monospace;
  white-space: nowrap;
}

.metric-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.45);
}

/* ==================== Power curve ==================== */
.power-curve-card {
  margin: 24rpx 32rpx 0;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16rpx;
  padding: 24rpx 24rpx 24rpx;
}

.power-curve-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.power-curve-title {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.power-curve-current {
  font-size: 24rpx;
  color: #00E5A0;
  font-weight: 600;
  font-family: 'DIN Alternate', 'DIN', monospace;
}

.power-curve-canvas {
  width: 100%;
  height: 160rpx;
}

/* ==================== Alert banners ==================== */
.alert-banner {
  margin: 20rpx 32rpx 0;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.alert-warning {
  background: rgba(250, 173, 20, 0.12);
  border: 1rpx solid rgba(250, 173, 20, 0.3);
}

.alert-green {
  background: rgba(7, 193, 96, 0.12);
  border: 1rpx solid rgba(7, 193, 96, 0.3);
}

.alert-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.alert-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
}

.alert-warning .alert-text {
  color: #FAAD14;
}

.alert-green .alert-text {
  color: #07C160;
}

/* ==================== Bottom spacer & stop button ==================== */
.bottom-spacer {
  height: 200rpx;
}

.stop-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 48rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom, 34px));
  background: linear-gradient(0deg, #1A2744 60%, transparent 100%);
  z-index: 20;
}

.stop-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: transparent;
  border: 2rpx solid #FF4D4F;
  color: #FF4D4F;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}

.stop-btn[disabled] {
  opacity: 0.5;
  border-color: rgba(255, 77, 79, 0.4);
  color: rgba(255, 77, 79, 0.4);
}

.back-home-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  color: #ffffff;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  text-align: center;
}

/* ==================== Modal overlay ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  width: 100%;
  background: #1E2D4A;
  border-radius: 32rpx 32rpx 0 0;
  padding: 48rpx 40rpx;
  padding-bottom: calc(48rpx + env(safe-area-inset-bottom, 34px));
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  display: block;
  text-align: center;
  margin-bottom: 36rpx;
}

.modal-summary {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
}

.modal-row {
  display: flex;
  justify-content: space-between;
  padding: 14rpx 0;
}

.modal-row + .modal-row {
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
}

.modal-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
}

.modal-val {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 600;
  font-family: 'DIN Alternate', 'DIN', monospace;
}

.modal-val.highlight {
  color: #FF4D4F;
}

/* ==================== Slide to confirm ==================== */
.slide-track {
  position: relative;
  width: 100%;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 44rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.slide-thumb {
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF4D4F, #FF7875);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: none;
}

.slide-arrow {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 700;
}

.slide-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.35);
  z-index: 1;
  pointer-events: none;
  transition: opacity 0.15s;
}

.modal-cancel {
  text-align: center;
  padding: 16rpx 0;
}

.modal-cancel-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.5);
}
</style>
