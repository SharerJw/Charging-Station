<template>
  <view class="order-detail-page">
    <!-- 顶部状态标签 -->
    <view class="status-banner" :class="'status-' + order.status">
      <view class="status-icon-wrap">
        <text class="status-icon">{{ statusIcon }}</text>
      </view>
      <view class="status-info">
        <text class="status-label">{{ statusLabel }}</text>
        <view class="order-no-wrap" @longpress="copyOrderNo">
          <text class="order-no-text">订单号: {{ order.orderNo }}</text>
          <text class="copy-hint">长按复制</text>
        </view>
      </view>
    </view>

    <!-- 电子小票卡片 -->
    <view class="receipt">
      <!-- 锯齿顶部 -->
      <view class="serrated-top">
        <view class="serrated-inner">
          <view v-for="i in 20" :key="'t'+i" class="tooth"></view>
        </view>
      </view>

      <view class="receipt-body">
        <!-- 小票头部：品牌Logo + 标题 + 站点信息 -->
        <view class="receipt-header">
          <view class="brand-row">
            <view class="brand-logo">
              <text class="logo-text">EV</text>
            </view>
            <view class="brand-info">
              <text class="receipt-title">充电小票</text>
              <text class="receipt-subtitle">CHARGING RECEIPT</text>
            </view>
          </view>
          <view class="station-info">
            <text class="station-name">{{ order.stationName }}</text>
            <text class="station-address">{{ order.stationAddress || '地址信息加载中...' }}</text>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="receipt-separator">
          <view v-for="i in 30" :key="'s1-'+i" class="separator-dot"></view>
        </view>

        <!-- 充电信息区 -->
        <view class="charge-info">
          <view class="info-grid">
            <view class="info-cell">
              <text class="cell-label">设备编号</text>
              <text class="cell-value">{{ order.deviceCode }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">充电枪号</text>
              <text class="cell-value">{{ order.connectorId || '1' }}号枪</text>
            </view>
          </view>

          <view class="time-block">
            <view class="time-col">
              <text class="time-label">开始时间</text>
              <text class="time-value">{{ formatTime(order.startTime) }}</text>
            </view>
            <view class="time-arrow">
              <text class="arrow-line">─────────</text>
              <text class="arrow-icon">&#x25B6;</text>
            </view>
            <view class="time-col time-col-end">
              <text class="time-label">结束时间</text>
              <text class="time-value">{{ formatTime(order.endTime) }}</text>
            </view>
          </view>

          <view class="info-grid">
            <view class="info-cell">
              <text class="cell-label">充电时长</text>
              <text class="cell-value cell-value-highlight">{{ formatDuration(order.duration) }}</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">充电电量</text>
              <text class="cell-value cell-value-highlight">{{ order.totalEnergy.toFixed(2) }} kWh</text>
            </view>
          </view>
          <view class="info-grid">
            <view class="info-cell">
              <text class="cell-label">SOC 变化</text>
              <text class="cell-value">{{ order.socStart || 0 }}% &#x2192; {{ order.socEnd || 0 }}%</text>
            </view>
            <view class="info-cell">
              <text class="cell-label">峰值功率</text>
              <text class="cell-value">{{ maxPower.toFixed(1) }} kW</text>
            </view>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="receipt-separator">
          <view v-for="i in 30" :key="'s2-'+i" class="separator-dot"></view>
        </view>

        <!-- 费用明细 -->
        <view class="fee-section">
          <text class="section-label">费用明细</text>

          <!-- 分段计费表格 -->
          <view class="fee-table">
            <view class="fee-table-header">
              <text class="fee-th fee-th-name">时段</text>
              <text class="fee-th fee-th-energy">电量(kWh)</text>
              <text class="fee-th fee-th-price">单价(元/度)</text>
              <text class="fee-th fee-th-amount">金额(元)</text>
            </view>
            <view
              v-for="(seg, i) in timeSegments"
              :key="'seg-'+i"
              class="fee-table-row"
            >
              <view class="fee-td fee-td-name">
                <view class="seg-dot" :style="{ background: seg.color }"></view>
                <text class="seg-text">{{ seg.label }}</text>
              </view>
              <text class="fee-td fee-td-energy">{{ seg.energy.toFixed(2) }}</text>
              <text class="fee-td fee-td-price">{{ seg.unitPrice.toFixed(2) }}</text>
              <text class="fee-td fee-td-amount">{{ seg.amount.toFixed(2) }}</text>
            </view>
          </view>

          <!-- 费用汇总行 -->
          <view class="fee-lines">
            <view class="fee-line">
              <text class="fee-line-label">电费小计</text>
              <text class="fee-line-value">&#xA5;{{ order.electricityFee.toFixed(2) }}</text>
            </view>
            <view class="fee-line">
              <text class="fee-line-label">服务费</text>
              <text class="fee-line-value">&#xA5;{{ order.serviceFee.toFixed(2) }}</text>
            </view>
            <view class="fee-line" v-if="order.couponDiscount > 0">
              <view class="fee-line-label-group">
                <view class="discount-tag coupon-tag">
                  <text class="discount-tag-text">券</text>
                </view>
                <text class="fee-line-label">优惠券抵扣</text>
              </view>
              <text class="fee-line-value discount">-&#xA5;{{ order.couponDiscount.toFixed(2) }}</text>
            </view>
            <view class="fee-line" v-if="order.memberDiscount > 0">
              <view class="fee-line-label-group">
                <view class="discount-tag member-tag">
                  <text class="discount-tag-text">VIP</text>
                </view>
                <text class="fee-line-label">会员折扣</text>
              </view>
              <text class="fee-line-value discount">-&#xA5;{{ order.memberDiscount.toFixed(2) }}</text>
            </view>
          </view>

          <!-- 粗分隔线 -->
          <view class="fee-bold-divider"></view>

          <!-- 实付金额 -->
          <view class="fee-total-row">
            <text class="fee-total-label">实付金额</text>
            <view class="fee-total-price">
              <text class="fee-total-symbol">&#xA5;</text>
              <text class="fee-total-amount">{{ order.actualAmount.toFixed(2) }}</text>
            </view>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="receipt-separator">
          <view v-for="i in 30" :key="'s3-'+i" class="separator-dot"></view>
        </view>

        <!-- 充电功率曲线 -->
        <view class="power-section">
          <text class="section-label">充电功率曲线</text>
          <view class="chart-container">
            <canvas
              canvas-id="powerChart"
              id="powerChart"
              type="2d"
              class="power-canvas"
              @touchstart="onChartTouch"
              @touchmove="onChartTouchMove"
              @touchend="onChartTouchEnd"
            ></canvas>
          </view>
          <view class="chart-stats">
            <view class="stat-item">
              <text class="stat-label">峰值功率</text>
              <text class="stat-value">{{ maxPower.toFixed(1) }} kW</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">平均功率</text>
              <text class="stat-value">{{ avgPower.toFixed(1) }} kW</text>
            </view>
            <view class="stat-item">
              <text class="stat-label">数据点</text>
              <text class="stat-value">{{ powerCurveData.length }} 个</text>
            </view>
          </view>
        </view>

        <!-- 分隔线 -->
        <view class="receipt-separator">
          <view v-for="i in 30" :key="'s4-'+i" class="separator-dot"></view>
        </view>

        <!-- 底部：环保数据 + 积分 + 小票编号 -->
        <view class="receipt-footer">
          <!-- 环保数据 -->
          <view class="eco-row">
            <text class="eco-icon">&#x1F33F;</text>
            <view class="eco-info">
              <text class="eco-title">绿色出行贡献</text>
              <view class="eco-stats">
                <text class="eco-stat">CO&#x2082; 减排 <text class="eco-num">{{ co2Offset }}</text> kg</text>
                <text class="eco-divider">|</text>
                <text class="eco-stat">相当于种 <text class="eco-num">{{ treeEquivalent }}</text> 棵树</text>
              </view>
            </view>
          </view>

          <!-- 积分 -->
          <view class="points-row">
            <text class="points-icon">&#x1F3AF;</text>
            <text class="points-text">本次充电获得 <text class="points-num">+{{ pointsEarned }}</text> 积分</text>
          </view>

          <!-- 小票编号 -->
          <view class="receipt-no-row">
            <text class="receipt-no">小票编号: {{ receiptNo }}</text>
            <text class="receipt-time">打印时间: {{ formatTime(printTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 锯齿底部 -->
      <view class="serrated-bottom">
        <view class="serrated-inner">
          <view v-for="i in 20" :key="'b'+i" class="tooth"></view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏占位 -->
    <view class="action-bar-spacer"></view>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <button class="action-btn btn-recharge" @tap="handleRecharge">
        <text class="action-icon">&#x26A1;</text>
        <text class="action-text">再次充电</text>
      </button>
      <button class="action-btn btn-rate" @tap="handleRate">
        <text class="action-icon">&#x2B50;</text>
        <text class="action-text">评价</text>
      </button>
      <button class="action-btn btn-invoice" @tap="handleInvoice">
        <text class="action-icon">&#x1F4C4;</text>
        <text class="action-text">开发票</text>
      </button>
      <button class="action-btn btn-refund" @tap="handleRefund" v-if="canRefund">
        <text class="action-icon">&#x21A9;</text>
        <text class="action-text">申请退款</text>
      </button>
      <button class="action-btn btn-service" open-type="contact">
        <text class="action-icon">&#x1F4AC;</text>
        <text class="action-text">联系客服</text>
      </button>
      <button class="action-btn btn-share" open-type="share">
        <text class="action-icon">&#x1F4E5;</text>
        <text class="action-text">分享小票</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { api } from '@/api/index'
import type { TimeSegmentData, OrderDetailData } from '@/types'

// ============================================================
// 响应式状态
// ============================================================

const order = ref<OrderDetailData>({
  id: '',
  orderNo: '',
  stationName: '',
  stationAddress: '',
  deviceCode: '',
  connectorId: '',
  status: '',
  startTime: '',
  endTime: '',
  duration: 0,
  totalEnergy: 0,
  socStart: 0,
  socEnd: 0,
  electricityFee: 0,
  serviceFee: 0,
  couponDiscount: 0,
  memberDiscount: 0,
  actualAmount: 0,
  originalAmount: 0,
  powerCurve: [],
  timeSegments: [],
  ecoData: { co2Offset: 0, treeEquivalent: 0 },
  pointsEarned: 0,
})

const chartZoom = ref(1)
const chartOffsetX = ref(0)
const touchStartX = ref(0)
const touchStartOffsetX = ref(0)

// ============================================================
// 计算属性
// ============================================================

/** 状态图标 */
const statusIcon = computed(() => {
  const map: Record<string, string> = {
    PAID: '✅',
    SETTLED: '⏳',
    CHARGING: '⏳',
    CANCELLED: '❌',
    REFUNDING: '↩',
    REFUNDED: '↩',
    ABNORMAL: '⚠',
  }
  return map[order.value.status] || '❓'
})

/** 状态标签文字 */
const statusLabel = computed(() => {
  const map: Record<string, string> = {
    PAID: '✅ 已完成',
    SETTLED: '⏳ 进行中',
    CHARGING: '⏳ 进行中',
    CANCELLED: '❌ 已取消',
    REFUNDING: '↩ 退款中',
    REFUNDED: '↩ 已退款',
    ABNORMAL: '⚠ 异常',
  }
  return map[order.value.status] || order.value.status
})

/** 分段计费数据 */
const timeSegments = computed<TimeSegmentData[]>(() => {
  if (order.value.timeSegments && order.value.timeSegments.length > 0) {
    return order.value.timeSegments
  }
  // 无后端数据时，根据电费模拟分段
  const totalE = order.value.totalEnergy
  const totalFee = order.value.electricityFee
  if (totalE <= 0) return []
  const avgPrice = totalFee / totalE
  // 模拟谷段 30%、平段 40%、峰段 30%
  const valleyEnergy = +(totalE * 0.3).toFixed(2)
  const flatEnergy = +(totalE * 0.4).toFixed(2)
  const peakEnergy = +(totalE - valleyEnergy - flatEnergy).toFixed(2)
  const valleyPrice = +(avgPrice * 0.6).toFixed(2)
  const flatPrice = +avgPrice.toFixed(2)
  const peakPrice = +(avgPrice * 1.5).toFixed(2)
  return [
    { label: '谷段', energy: valleyEnergy, unitPrice: valleyPrice, amount: +(valleyEnergy * valleyPrice).toFixed(2), color: '#52C41A' },
    { label: '平段', energy: flatEnergy, unitPrice: flatPrice, amount: +(flatEnergy * flatPrice).toFixed(2), color: '#FAAD14' },
    { label: '峰段', energy: peakEnergy, unitPrice: peakPrice, amount: +(peakEnergy * peakPrice).toFixed(2), color: '#FF4D4F' },
  ]
})

/** 功率曲线数据 */
const powerCurveData = computed<number[]>(() => {
  if (order.value.powerCurve && order.value.powerCurve.length > 0) {
    return order.value.powerCurve
  }
  // 模拟功率曲线：先升后平再降
  const points: number[] = []
  const steps = 48
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    let power = 0
    if (t < 0.08) power = t * 12.5 * 60
    else if (t < 0.15) power = 55 + Math.random() * 8
    else if (t < 0.75) power = 58 + Math.sin(t * 10) * 5 + Math.random() * 3
    else if (t < 0.9) power = 60 * (1 - (t - 0.75) / 0.25)
    else power = Math.max(0, 15 - (t - 0.9) * 150 + Math.random() * 3)
    points.push(Math.max(0, +power.toFixed(1)))
  }
  return points
})

const maxPower = computed(() => Math.max(...powerCurveData.value, 1))
const avgPower = computed(() => {
  const arr = powerCurveData.value
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
})

/** 是否可退款 */
const canRefund = computed(() => {
  return ['PAID', 'SETTLED'].includes(order.value.status)
})

/** 环保数据 */
const co2Offset = computed(() => {
  if (order.value.ecoData?.co2Offset) return order.value.ecoData.co2Offset.toFixed(1)
  return (order.value.totalEnergy * 0.5).toFixed(1)
})

const treeEquivalent = computed(() => {
  if (order.value.ecoData?.treeEquivalent) return order.value.ecoData.treeEquivalent
  return Math.max(1, Math.round(order.value.totalEnergy * 0.5 / 20))
})

/** 积分 */
const pointsEarned = computed(() => {
  if (order.value.pointsEarned) return order.value.pointsEarned
  return Math.floor(order.value.actualAmount)
})

/** 小票编号 & 打印时间 */
const receiptNo = computed(() => {
  return order.value.orderNo ? 'RCP' + order.value.orderNo.replace('ORD', '') : '--'
})
const printTime = computed(() => {
  return order.value.endTime || new Date().toISOString()
})

// ============================================================
// 工具函数
// ============================================================

function formatTime(time: string): string {
  if (!time) return '--'
  const d = new Date(time)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0分钟'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}小时${m}分钟`
  return `${m}分钟`
}

// ============================================================
// 交互操作
// ============================================================

function copyOrderNo() {
  uni.setClipboardData({
    data: order.value.orderNo,
    success: () => {
      uni.showToast({ title: '订单号已复制', icon: 'success' })
    },
  })
}

function handleRecharge() {
  uni.navigateTo({ url: '/pages/map/index' })
}

function handleRate() {
  uni.navigateTo({ url: `/pages/settlement/index?orderId=${order.value.id}` })
}

function handleInvoice() {
  uni.navigateTo({ url: `/pages/invoice/index?orderId=${order.value.id}` })
}

function handleRefund() {
  uni.showModal({
    title: '申请退款',
    content: '确定要申请退款吗？退款将在1-3个工作日内原路返回。',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.requestRefund(order.value.id)
          uni.showToast({ title: '退款申请已提交', icon: 'success' })
          order.value.status = 'REFUNDING'
        } catch (e) {
          uni.showToast({ title: '退款申请失败', icon: 'none' })
        }
      }
    },
  })
}

// ============================================================
// Canvas 功率曲线绘制
// ============================================================

/** 绘制功率折线图 */
function drawPowerChart() {
  const query = uni.createSelectorQuery()
  query.select('#powerChart')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        // 降级：使用旧版 Canvas API
        drawPowerChartLegacy()
        return
      }
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = uni.getSystemInfoSync().pixelRatio || 2
      const width = res[0].width
      const height = res[0].height

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)

      renderChart(ctx, width, height)
    })
}

/** 旧版 Canvas API 降级绘制 */
function drawPowerChartLegacy() {
  const ctx = uni.createCanvasContext('powerChart')
  const sysInfo = uni.getSystemInfoSync()
  const query = uni.createSelectorQuery()
  query.select('.power-canvas')
    .boundingClientRect((rect) => {
      if (!rect) return
      const width = rect.width
      const height = rect.height
      // 将 ctx 包装为兼容接口
      const compatCtx = createLegacyCompat(ctx, width, height, sysInfo.pixelRatio || 2)
      renderChart(compatCtx, width, height)
      ctx.draw()
    })
    .exec()
}

/** 旧版 Canvas 上下文兼容包装 */
function createLegacyCompat(ctx: any, _w: number, _h: number, _dpr: number) {
  return {
    clearRect: (x: number, y: number, w: number, h: number) => ctx.clearRect(x, y, w, h),
    beginPath: () => ctx.beginPath(),
    moveTo: (x: number, y: number) => ctx.moveTo(x, y),
    lineTo: (x: number, y: number) => ctx.lineTo(x, y),
    stroke: () => ctx.stroke(),
    fillText: (text: string, x: number, y: number) => ctx.fillText(text, x, y),
    fillRect: (x: number, y: number, w: number, h: number) => ctx.fillRect(x, y, w, h),
    arc: (x: number, y: number, r: number, s: number, e: number) => ctx.arc(x, y, r, s, e),
    fill: () => ctx.fill(),
    closePath: () => ctx.closePath(),
    set strokeStyle(v: string) { ctx.setStrokeStyle(v) },
    set fillStyle(v: string) { ctx.setFillStyle(v) },
    set lineWidth(v: number) { ctx.setLineWidth(v) },
    set font(v: string) { ctx.setFontSize(parseInt(v)) },
    set textAlign(v: string) { ctx.setTextAlign(v) },
    set textBaseline(v: string) { ctx.setTextBaseline(v) },
    setLineDash: (segments: number[]) => ctx.setLineDash(segments, 0),
    createLinearGradient: (x0: number, y0: number, x1: number, y1: number) => {
      const grad = ctx.createLinearGradient(x0, y0, x1, y1)
      return {
        addColorStop: (offset: number, color: string) => grad.addColorStop(offset, color),
        _raw: grad,
      }
    },
    // 存储渐变对象供赋值使用
    _ctx: ctx,
  }
}

/** 核心图表绘制逻辑 */
function renderChart(ctx: any, width: number, height: number) {
  const data = powerCurveData.value
  if (!data || data.length === 0) return

  const padding = { top: 20, right: 16, bottom: 30, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const zoom = chartZoom.value
  const offsetX = chartOffsetX.value

  // 清除画布
  ctx.clearRect(0, 0, width, height)

  // 背景
  ctx.fillStyle = '#FAFBFC'
  ctx.fillRect(0, 0, width, height)

  const maxVal = maxPower.value * 1.1
  const totalPoints = data.length
  const visiblePoints = Math.max(5, Math.floor(totalPoints / zoom))
  const startIdx = Math.max(0, Math.min(Math.round(offsetX), totalPoints - visiblePoints))
  const endIdx = Math.min(startIdx + visiblePoints, totalPoints)
  const visibleData = data.slice(startIdx, endIdx)

  // 网格线
  ctx.strokeStyle = '#F0F0F0'
  ctx.lineWidth = 0.5
  const gridLines = 4
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartH / gridLines) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()

    // Y轴标签
    const val = maxVal * (1 - i / gridLines)
    ctx.fillStyle = '#999'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(val.toFixed(0), padding.left - 4, y)
  }

  // 绘制渐变填充区域
  const stepX = chartW / (visibleData.length - 1 || 1)

  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top + chartH)
  for (let i = 0; i < visibleData.length; i++) {
    const x = padding.left + i * stepX
    const y = padding.top + chartH * (1 - visibleData[i] / maxVal)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.lineTo(padding.left + (visibleData.length - 1) * stepX, padding.top + chartH)
  ctx.lineTo(padding.left, padding.top + chartH)
  ctx.closePath()
  // 渐变填充
  const isLegacy = !!ctx._ctx
  if (!isLegacy && ctx.createLinearGradient) {
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
    grad.addColorStop(0, 'rgba(7, 193, 96, 0.25)')
    grad.addColorStop(1, 'rgba(7, 193, 96, 0.02)')
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = 'rgba(7, 193, 96, 0.15)'
  }
  ctx.fill()

  // 绘制折线
  ctx.beginPath()
  ctx.strokeStyle = '#07C160'
  ctx.lineWidth = 2
  for (let i = 0; i < visibleData.length; i++) {
    const x = padding.left + i * stepX
    const y = padding.top + chartH * (1 - visibleData[i] / maxVal)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // 绘制数据点（每隔N个显示一个）
  const dotInterval = Math.max(1, Math.floor(visibleData.length / 8))
  for (let i = 0; i < visibleData.length; i += dotInterval) {
    const x = padding.left + i * stepX
    const y = padding.top + chartH * (1 - visibleData[i] / maxVal)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#07C160'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
  }

  // X轴标签
  ctx.fillStyle = '#999'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const xLabels = ['开始', '', '中间', '', '结束']
  for (let i = 0; i < xLabels.length; i++) {
    if (!xLabels[i]) continue
    const x = padding.left + (chartW / (xLabels.length - 1)) * i
    ctx.fillText(xLabels[i], x, height - padding.bottom + 8)
  }

  // 单位标签
  ctx.textAlign = 'left'
  ctx.fillStyle = '#BBB'
  ctx.font = '9px sans-serif'
  ctx.fillText('kW', padding.left, 4)
}

/** 触摸手势：缩放 */
function onChartTouch(e: any) {
  if (e.touches && e.touches.length === 2) {
    // 双指缩放起始
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    touchStartX.value = Math.sqrt(dx * dx + dy * dy)
    touchStartOffsetX.value = chartZoom.value
  } else if (e.touches && e.touches.length === 1) {
    touchStartX.value = e.touches[0].clientX
    touchStartOffsetX.value = chartOffsetX.value
  }
}

function onChartTouchMove(e: any) {
  if (e.touches && e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (touchStartX.value > 0) {
      const scale = dist / touchStartX.value
      const newZoom = Math.max(1, Math.min(8, touchStartOffsetX.value * scale))
      chartZoom.value = newZoom
      drawPowerChart()
    }
  } else if (e.touches && e.touches.length === 1 && chartZoom.value > 1) {
    const deltaX = e.touches[0].clientX - touchStartX.value
    const totalPoints = powerCurveData.value.length
    const visiblePoints = Math.max(5, Math.floor(totalPoints / chartZoom.value))
    const maxOffset = totalPoints - visiblePoints
    const newOffset = Math.max(0, Math.min(maxOffset, touchStartOffsetX.value - deltaX * 0.05))
    chartOffsetX.value = newOffset
    drawPowerChart()
  }
}

function onChartTouchEnd() {
  touchStartX.value = 0
}

// ============================================================
// 数据加载
// ============================================================

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.$page?.options || (currentPage as any)?.options || {}
  const orderId = options.orderId || options.id || ''

  if (!orderId) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  try {
    const data = await api.getOrderDetail(orderId)
    if (data) {
      order.value = { ...order.value, ...data }
    }
  } catch (e) {
    console.error('加载订单详情失败:', e)
    // 模拟数据
    order.value = {
      id: orderId,
      orderNo: 'ORD' + String(orderId).padStart(8, '0'),
      stationName: '示例充电站A',
      stationAddress: '示例路123号示例充电站',
      deviceCode: 'EVSE-001',
      connectorId: '1',
      status: 'PAID',
      startTime: '2026-07-17T10:00:00',
      endTime: '2026-07-17T11:05:00',
      duration: 3900,
      totalEnergy: 35.6,
      socStart: 20,
      socEnd: 85,
      electricityFee: 21.36,
      serviceFee: 10.68,
      couponDiscount: 2.0,
      memberDiscount: 0,
      actualAmount: 30.04,
      originalAmount: 32.04,
      powerCurve: [],
      timeSegments: [],
      ecoData: { co2Offset: 17.8, treeEquivalent: 1 },
      pointsEarned: 30,
    }
  }

  // 绘制功率曲线
  await nextTick()
  setTimeout(() => drawPowerChart(), 300)
})

// 数据更新后重绘图表
watch(() => order.value.powerCurve, () => {
  nextTick(() => setTimeout(() => drawPowerChart(), 200))
})

// ============================================================
// 分享
// ============================================================

defineExpose({
  onShareAppMessage() {
    return {
      title: `我在${order.value.stationName}充了${order.value.totalEnergy.toFixed(1)}kWh电`,
      path: `/pages/order-detail/index?orderId=${order.value.id}`,
    }
  },
})
</script>

<style scoped>
/* ============================================================
   页面基础
   ============================================================ */
.order-detail-page {
  background: #F6F7FB;
  min-height: 100vh;
  padding-bottom: env(safe-area-inset-bottom);
}

/* ============================================================
   顶部状态标签
   ============================================================ */
.status-banner {
  display: flex;
  align-items: center;
  padding: 32rpx 32rpx 28rpx;
  gap: 20rpx;
}
.status-PAID { background: linear-gradient(135deg, #E8F8E0, #F0FFF4); }
.status-SETTLED, .status-CHARGING { background: linear-gradient(135deg, #E6F7FF, #F0F8FF); }
.status-CANCELLED { background: linear-gradient(135deg, #F5F5F5, #FAFAFA); }
.status-REFUNDING { background: linear-gradient(135deg, #FFF2F0, #FFF8F6); }
.status-REFUNDED { background: linear-gradient(135deg, #F5F5F5, #FAFAFA); }
.status-ABNORMAL { background: linear-gradient(135deg, #FFF7E6, #FFFBF0); }

.status-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.status-icon { font-size: 36rpx; }
.status-info { flex: 1; }
.status-label {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  display: block;
  margin-bottom: 6rpx;
}
.order-no-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.order-no-text { font-size: 22rpx; color: #999; }
.copy-hint {
  font-size: 18rpx;
  color: #BBB;
  background: rgba(0,0,0,0.04);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

/* ============================================================
   电子小票卡片 & 锯齿效果
   ============================================================ */
.receipt {
  margin: 0 24rpx 24rpx;
  background: #FFFFFF;
  border-radius: 0;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
  overflow: hidden;
}

/* 锯齿撕边效果 */
.serrated-top, .serrated-bottom {
  position: relative;
  height: 16rpx;
  overflow: hidden;
  background: #FFFFFF;
}
.serrated-inner {
  display: flex;
  width: 100%;
  height: 16rpx;
}
.tooth {
  flex-shrink: 0;
  width: 24rpx;
  height: 16rpx;
  position: relative;
}
.serrated-top .tooth::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 24rpx;
  height: 16rpx;
  background: radial-gradient(circle at 12rpx 0rpx, transparent 12rpx, #F6F7FB 12rpx);
}
.serrated-bottom .tooth::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 24rpx;
  height: 16rpx;
  background: radial-gradient(circle at 12rpx 16rpx, transparent 12rpx, #F6F7FB 12rpx);
}

.receipt-body {
  padding: 0 32rpx;
}

/* ============================================================
   小票头部
   ============================================================ */
.receipt-header {
  padding: 28rpx 0 20rpx;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.brand-logo {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text {
  font-size: 28rpx;
  font-weight: 900;
  color: #FFFFFF;
  letter-spacing: 1rpx;
}
.brand-info { flex: 1; }
.receipt-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #222;
  display: block;
}
.receipt-subtitle {
  font-size: 18rpx;
  color: #CCC;
  letter-spacing: 2rpx;
  display: block;
  margin-top: 2rpx;
}
.station-info {
  padding: 16rpx 0;
  border-top: 1rpx solid #F5F5F5;
}
.station-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}
.station-address {
  font-size: 22rpx;
  color: #999;
  display: block;
}

/* ============================================================
   虚线分隔
   ============================================================ */
.receipt-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 0;
  overflow: hidden;
}
.separator-dot {
  width: 8rpx;
  height: 2rpx;
  background: #E8E8E8;
  margin: 0 4rpx;
  border-radius: 1rpx;
}

/* ============================================================
   充电信息区
   ============================================================ */
.charge-info {
  padding: 20rpx 0;
}
.info-grid {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}
.info-cell {
  flex: 1;
  background: #FAFBFC;
  border-radius: 10rpx;
  padding: 16rpx;
}
.cell-label {
  font-size: 20rpx;
  color: #999;
  display: block;
  margin-bottom: 6rpx;
}
.cell-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
}
.cell-value-highlight {
  color: #07C160;
  font-weight: 700;
}

/* 时间箭头 */
.time-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
  padding: 12rpx 0;
}
.time-col { flex: 1; }
.time-col-end { text-align: right; }
.time-label {
  font-size: 20rpx;
  color: #999;
  display: block;
  margin-bottom: 4rpx;
}
.time-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
  display: block;
}
.time-arrow {
  display: flex;
  align-items: center;
  padding: 0 12rpx;
}
.arrow-line { font-size: 16rpx; color: #DDD; letter-spacing: -1rpx; }
.arrow-icon { font-size: 16rpx; color: #07C160; margin-left: -4rpx; }

/* ============================================================
   费用明细
   ============================================================ */
.fee-section {
  padding: 20rpx 0;
}
.section-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
  display: block;
  margin-bottom: 16rpx;
}

/* 分段计费表格 */
.fee-table {
  margin-bottom: 20rpx;
}
.fee-table-header {
  display: flex;
  padding: 10rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}
.fee-th {
  font-size: 20rpx;
  color: #999;
  text-align: center;
}
.fee-th-name { flex: 1.2; text-align: left; }
.fee-th-energy { flex: 1; }
.fee-th-price { flex: 1.2; }
.fee-th-amount { flex: 1; text-align: right; }

.fee-table-row {
  display: flex;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #F8F8F8;
}
.fee-td {
  font-size: 24rpx;
  color: #333;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fee-td-name {
  flex: 1.2;
  justify-content: flex-start;
  gap: 8rpx;
}
.fee-td-energy { flex: 1; }
.fee-td-price { flex: 1.2; }
.fee-td-amount { flex: 1; text-align: right; justify-content: flex-end; }

.seg-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 3rpx;
  flex-shrink: 0;
}
.seg-text { font-size: 24rpx; }

/* 费用行 */
.fee-lines { margin-bottom: 16rpx; }
.fee-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}
.fee-line-label { font-size: 24rpx; color: #666; }
.fee-line-value { font-size: 24rpx; color: #333; }
.fee-line-value.discount { color: #FF4D4F; }
.fee-line-label-group {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.discount-tag {
  width: 36rpx;
  height: 36rpx;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.coupon-tag { background: #FFF2F0; }
.member-tag { background: #FFF7E6; }
.discount-tag-text { font-size: 18rpx; color: #FF4D4F; font-weight: 700; }
.member-tag .discount-tag-text { color: #FAAD14; }

/* 粗分隔线 */
.fee-bold-divider {
  height: 2rpx;
  background: repeating-linear-gradient(
    90deg,
    #333 0, #333 6rpx,
    transparent 6rpx, transparent 12rpx
  );
  margin: 16rpx 0;
}

/* 实付金额 */
.fee-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}
.fee-total-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #222;
}
.fee-total-price {
  display: flex;
  align-items: baseline;
}
.fee-total-symbol {
  font-size: 28rpx;
  font-weight: 700;
  color: #07C160;
  margin-right: 4rpx;
}
.fee-total-amount {
  font-size: 48rpx;
  font-weight: 900;
  color: #07C160;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

/* ============================================================
   功率曲线
   ============================================================ */
.power-section {
  padding: 20rpx 0;
}
.chart-container {
  border-radius: 12rpx;
  overflow: hidden;
  border: 1rpx solid #F0F0F0;
}
.power-canvas {
  width: 100%;
  height: 240rpx;
}
.chart-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 12rpx;
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-label { font-size: 20rpx; color: #999; }
.stat-value {
  font-size: 24rpx;
  color: #07C160;
  font-weight: 600;
  margin-top: 4rpx;
}

/* ============================================================
   小票底部
   ============================================================ */
.receipt-footer {
  padding: 20rpx 0 28rpx;
}
.eco-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx;
  background: #F0FFF4;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}
.eco-icon { font-size: 36rpx; }
.eco-info { flex: 1; }
.eco-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #52C41A;
  display: block;
  margin-bottom: 6rpx;
}
.eco-stats { display: flex; align-items: center; gap: 12rpx; }
.eco-stat { font-size: 20rpx; color: #666; }
.eco-num { color: #52C41A; font-weight: 700; }
.eco-divider { font-size: 18rpx; color: #DDD; }

.points-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 16rpx;
  background: #FFF7E6;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}
.points-icon { font-size: 28rpx; }
.points-text { font-size: 24rpx; color: #666; }
.points-num { color: #FAAD14; font-weight: 700; }

.receipt-no-row {
  padding-top: 16rpx;
  border-top: 1rpx dashed #F0F0F0;
}
.receipt-no {
  font-size: 20rpx;
  color: #CCC;
  display: block;
  margin-bottom: 4rpx;
  font-family: 'Courier New', monospace;
}
.receipt-time {
  font-size: 20rpx;
  color: #CCC;
  display: block;
  font-family: 'Courier New', monospace;
}

/* ============================================================
   底部操作栏
   ============================================================ */
.action-bar-spacer {
  height: calc(120rpx + env(safe-area-inset-bottom));
}
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 16rpx 20rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06);
  z-index: 100;
}
.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  background: #F5F5F5;
  border: none;
  border-radius: 12rpx;
  padding: 12rpx 0;
  min-height: 0;
  line-height: 1;
  margin: 0;
}
.action-btn::after { border: none; }
.action-icon { font-size: 28rpx; }
.action-text { font-size: 18rpx; color: #666; }

.btn-recharge { background: #E6F7FF; }
.btn-recharge .action-text { color: #1677FF; }
.btn-rate { background: #FFF7E6; }
.btn-rate .action-text { color: #FAAD14; }
.btn-invoice { background: #F0FFF4; }
.btn-invoice .action-text { color: #52C41A; }
.btn-refund { background: #FFF2F0; }
.btn-refund .action-text { color: #FF4D4F; }
.btn-service { background: #F5F0FF; }
.btn-service .action-text { color: #722ED1; }
.btn-share { background: #E6F7FF; }
.btn-share .action-text { color: #1677FF; }
</style>
