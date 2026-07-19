<template>
  <view class="order-page">
    <!-- 搜索栏 -->
    <view class="navbar-content" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="search-bar">
        <text class="search-icon-text">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索订单号/充电站"
          confirm-type="search"
          @confirm="onSearch"
        />
        <text v-if="searchKeyword" class="search-clear" @tap="clearSearch">&#x2716;</text>
      </view>
    </view>

    <!-- 顶部 Tab 切换（粘性定位） -->
    <view class="tabs-wrapper">
      <scroll-view class="tabs-scroll" scroll-x :show-scrollbar="false">
        <view class="tabs">
          <view
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-item"
            :class="{ active: currentTab === tab.value }"
            @tap="switchTab(tab.value)"
          >
            <text class="tab-label">{{ tab.label }}</text>
            <view v-if="tab.badge && tab.badge > 0" class="tab-badge">
              <text class="tab-badge-text">{{ tab.badge > 99 ? '99+' : tab.badge }}</text>
            </view>
            <view v-if="currentTab === tab.value" class="tab-indicator"></view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 订单内容区域 -->
    <scroll-view
      class="order-scroll"
      scroll-y
      :show-scrollbar="false"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onPullDownRefresh"
      @scrolltolower="onReachBottom"
    >
      <!-- 进行中订单卡片（置顶高亮） -->
      <view v-if="showChargingCard && chargingOrders.length > 0" class="section-pinned">
        <view
          v-for="order in chargingOrders"
          :key="'charging-' + order.id"
          class="order-card card-charging"
          @tap="viewOrder(order.id)"
        >
          <view class="card-charging-header">
            <view class="charging-status-dot"></view>
            <text class="charging-status-text">充电中</text>
            <text class="charging-duration">{{ formatDuration(order.duration) }}</text>
          </view>
          <view class="card-charging-body">
            <text class="charging-station-name">{{ order.stationName }}</text>
            <view class="charging-soc-row">
              <text class="soc-label">SOC</text>
              <view class="soc-bar-bg">
                <view class="soc-bar-fill" :style="{ width: (order.currentSoc || 0) + '%' }"></view>
              </view>
              <text class="soc-value">{{ order.currentSoc || 0 }}%</text>
            </view>
            <view class="charging-metrics">
              <view class="metric-item">
                <text class="metric-value">{{ order.consumedEnergy || 0 }}</text>
                <text class="metric-unit">kWh</text>
              </view>
              <view class="metric-divider"></view>
              <view class="metric-item">
                <text class="metric-value">{{ order.power || 0 }}</text>
                <text class="metric-unit">kW</text>
              </view>
              <view class="metric-divider"></view>
              <view class="metric-item">
                <text class="metric-value">{{ (order.totalAmount || 0).toFixed(2) }}</text>
                <text class="metric-unit">元</text>
              </view>
            </view>
          </view>
          <view class="card-charging-footer">
            <view class="btn-charging-detail" @tap.stop="viewChargingDetail(order.id)">
              <text class="btn-charging-detail-text">查看充电详情</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 待支付订单卡片（置顶） -->
      <view v-if="showPendingCard && pendingOrders.length > 0" class="section-pinned">
        <view
          v-for="order in pendingOrders"
          :key="'pending-' + order.id"
          class="order-card card-pending"
          @tap="viewOrder(order.id)"
        >
          <view class="card-pending-header">
            <text class="pending-label">待支付</text>
            <view class="pending-countdown" v-if="order.countdown > 0">
              <text class="countdown-text">支付剩余 </text>
              <text class="countdown-time">{{ formatCountdown(order.countdown) }}</text>
            </view>
          </view>
          <view class="card-pending-body">
            <text class="pending-station-name">{{ order.stationName }}</text>
            <view class="pending-info-row">
              <text class="pending-info-text">{{ order.startTime }}</text>
              <text class="pending-info-text">{{ order.consumedEnergy }} kWh</text>
            </view>
            <view class="pending-amount-row">
              <text class="pending-amount-label">待支付金额</text>
              <text class="pending-amount-value">¥{{ (order.totalAmount || 0).toFixed(2) }}</text>
            </view>
          </view>
          <view class="card-pending-footer">
            <view class="btn-pay" @tap.stop="payOrder(order.id)">
              <text class="btn-pay-text">立即支付</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 搜索结果或普通列表 -->
      <view class="order-list" v-if="displayOrders.length > 0">
        <!-- 按月分组（已完成/全部Tab） -->
        <template v-if="currentTab === 'all' || currentTab === 'completed'">
          <view v-for="group in groupedOrders" :key="group.month" class="month-group">
            <view class="month-header">
              <text class="month-label">{{ group.monthLabel }}</text>
              <text class="month-count">{{ group.orders.length }}笔订单</text>
            </view>
            <view
              v-for="order in group.orders"
              :key="order.id"
              class="swipe-wrapper"
            >
              <view
                class="swipe-content"
                :style="{ transform: `translateX(${getSwipeOffset(order.id)}px)` }"
                @touchstart="onTouchStart($event, order.id)"
                @touchmove="onTouchMove($event, order.id)"
                @touchend="onTouchEnd($event, order.id)"
              >
                <view class="order-card card-completed" @tap="viewOrder(order.id)">
                  <view class="completed-left">
                    <text class="completed-day">{{ formatDay(order.startTime) }}</text>
                    <text class="completed-month-small">{{ formatMonthShort(order.startTime) }}</text>
                  </view>
                  <view class="completed-center">
                    <text class="completed-station-name">{{ order.stationName }}</text>
                    <view class="completed-meta">
                      <text class="completed-meta-text">{{ formatDuration(order.duration) }}</text>
                      <text class="completed-meta-dot">.</text>
                      <text class="completed-meta-text">{{ order.consumedEnergy }} kWh</text>
                      <text class="completed-meta-dot">.</text>
                      <text class="completed-meta-text">{{ order.payMethod || '微信支付' }}</text>
                    </view>
                  </view>
                  <view class="completed-right">
                    <text class="completed-amount">¥{{ (order.totalAmount || 0).toFixed(2) }}</text>
                    <text class="completed-arrow">›</text>
                  </view>
                </view>
              </view>
              <view class="swipe-actions" :class="{ visible: getSwipeOffset(order.id) < 0 }">
                <view class="swipe-action action-recharge" @tap="rechargeAgain(order)">
                  <text class="swipe-action-text">再次充电</text>
                </view>
                <view class="swipe-action action-delete" @tap="deleteOrder(order.id)">
                  <text class="swipe-action-text">删除</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 退款中订单 -->
        <template v-else-if="currentTab === 'refunding'">
          <view
            v-for="order in displayOrders"
            :key="order.id"
            class="order-card card-refunding"
            @tap="viewOrder(order.id)"
          >
            <view class="refunding-header">
              <text class="refunding-station-name">{{ order.stationName }}</text>
              <view class="refunding-status-tag" :class="'tag-' + (order.refundStatus || 'processing')">
                <text class="refunding-status-text">{{ refundStatusLabel(order.refundStatus) }}</text>
              </view>
            </view>
            <view class="refunding-body">
              <view class="refunding-row">
                <text class="refunding-label">退款金额</text>
                <text class="refunding-amount">¥{{ (order.refundAmount || order.totalAmount || 0).toFixed(2) }}</text>
              </view>
              <view class="refunding-row">
                <text class="refunding-label">退款原因</text>
                <text class="refunding-reason">{{ order.refundReason || '用户申请退款' }}</text>
              </view>
              <view class="refunding-row">
                <text class="refunding-label">订单号</text>
                <text class="refunding-order-no">{{ order.orderNo }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- 其他Tab通用列表 -->
        <template v-else>
          <view
            v-for="order in displayOrders"
            :key="order.id"
            class="order-card card-default"
            @tap="viewOrder(order.id)"
          >
            <view class="default-header">
              <text class="default-station-name">{{ order.stationName }}</text>
              <text class="default-status" :class="'status-' + order.status">{{ statusLabels[order.status] || order.status }}</text>
            </view>
            <view class="default-body">
              <text class="default-info-text">{{ order.startTime }}</text>
              <text class="default-info-text">{{ order.consumedEnergy }} kWh</text>
            </view>
            <view class="default-footer">
              <text class="default-order-no">{{ order.orderNo }}</text>
              <text class="default-amount">¥{{ (order.totalAmount || 0).toFixed(2) }}</text>
            </view>
          </view>
        </template>
      </view>

      <!-- 加载状态 -->
      <view class="load-more" v-if="displayOrders.length > 0">
        <view v-if="isLoadingMore" class="loading-spinner"></view>
        <text class="load-more-text">{{ isLoadingMore ? '加载中...' : (noMore ? '没有更多了' : '') }}</text>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && displayOrders.length === 0 && !hasPinnedOrders">
        <view class="empty-illustration">
          <view class="empty-icon-wrap">
            <text class="empty-icon-text">&#x1F4CB;</text>
          </view>
        </view>
        <text class="empty-title">{{ searchKeyword ? '未找到相关订单' : '暂无订单' }}</text>
        <text class="empty-subtitle">{{ searchKeyword ? '换个关键词试试' : '快去扫码充电吧' }}</text>
        <view v-if="!searchKeyword" class="empty-action" @tap="goScanCharge">
          <text class="empty-action-text">去充电</text>
        </view>
      </view>

      <!-- 首次加载骨架屏 -->
      <view v-if="loading && displayOrders.length === 0" class="skeleton-list">
        <view v-for="i in 3" :key="'sk-' + i" class="skeleton-card">
          <view class="skeleton-line skeleton-title"></view>
          <view class="skeleton-line skeleton-sub"></view>
          <view class="skeleton-line skeleton-short"></view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, reactive } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { api, type Order } from '@/api/index'
import { getStatusBarHeight } from '@/utils/system'

// ---- 状态栏高度 ----
const statusBarHeight = ref(getStatusBarHeight())

// ---- 扩展订单类型 ----
interface ExtendedOrder extends Order {
  currentSoc?: number
  power?: number
  duration?: number
  payMethod?: string
  countdown?: number
  refundAmount?: number
  refundReason?: string
  refundStatus?: string
  createdAt?: string
}

// ---- 状态标签 ----
const statusLabels: Record<string, string> = {
  charging: '充电中',
  CHARGING: '充电中',
  completed: '已完成',
  COMPLETED: '已完成',
  pending_payment: '待支付',
  PENDING_PAYMENT: '待支付',
  refunding: '退款中',
  REFUNDING: '退款中',
  refunded: '已退款',
  REFUNDED: '已退款',
  cancelled: '已取消',
  CANCELLED: '已取消',
  abnormal: '异常',
  ABNORMAL: '异常',
}

// ---- Tab 配置 ----
const tabs = computed(() => [
  { label: '全部', value: 'all', badge: 0 },
  { label: '进行中', value: 'charging', badge: chargingCount.value },
  { label: '已完成', value: 'completed', badge: 0 },
  { label: '退款中', value: 'refunding', badge: 0 },
  { label: '待支付', value: 'pending_payment', badge: pendingCount.value },
])

// ---- 响应式状态 ----
const currentTab = ref('all')
const allOrders = ref<ExtendedOrder[]>([])
const loading = ref(false)
const isRefreshing = ref(false)
const isLoadingMore = ref(false)
const noMore = ref(false)
const searchKeyword = ref('')
const page = ref(1)
const pageSize = 20
const swipeOffsets = reactive<Record<string, number>>({})
let touchStartX = 0
let touchStartY = 0
let touchOrderId = ''
let wsTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

// ---- 懒加载与缓存 ----
const dataLoaded = ref(false)
const loadedTabs = reactive<Set<string>>(new Set())
const tabDataCache = reactive<Record<string, ExtendedOrder[]>>({})
const DATA_STALE_MS = 60_000 // 数据过期时间 60 秒
let lastLoadTime = 0

// ---- 计算属性 ----
const chargingOrders = computed(() =>
  allOrders.value.filter(o => ['charging', 'CHARGING'].includes(o.status))
)

const pendingOrders = computed(() =>
  allOrders.value.filter(o => ['pending_payment', 'PENDING_PAYMENT'].includes(o.status))
)

const chargingCount = computed(() => chargingOrders.value.length)
const pendingCount = computed(() => pendingOrders.value.length)

const showChargingCard = computed(() =>
  currentTab.value === 'all' || currentTab.value === 'charging'
)

const showPendingCard = computed(() =>
  currentTab.value === 'all' || currentTab.value === 'pending_payment'
)

const hasPinnedOrders = computed(() =>
  (showChargingCard.value && chargingOrders.value.length > 0) ||
  (showPendingCard.value && pendingOrders.value.length > 0)
)

const displayOrders = computed(() => {
  let list: ExtendedOrder[] = []

  if (currentTab.value === 'all') {
    // 全部Tab：排除进行中和待支付（它们以置顶卡片展示）
    list = allOrders.value.filter(o =>
      !['charging', 'CHARGING', 'pending_payment', 'PENDING_PAYMENT'].includes(o.status)
    )
  } else if (currentTab.value === 'charging') {
    list = [] // 进行中的以置顶卡片展示
  } else if (currentTab.value === 'pending_payment') {
    list = [] // 待支付的以置顶卡片展示
  } else if (currentTab.value === 'completed') {
    list = allOrders.value.filter(o => ['completed', 'COMPLETED'].includes(o.status))
  } else if (currentTab.value === 'refunding') {
    list = allOrders.value.filter(o => ['refunding', 'REFUNDING', 'refunded', 'REFUNDED'].includes(o.status))
  } else {
    list = allOrders.value
  }

  // 搜索过滤
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(o =>
      o.orderNo?.toLowerCase().includes(kw) ||
      o.stationName?.toLowerCase().includes(kw)
    )
  }

  return list
})

/** 按月分组 */
const groupedOrders = computed(() => {
  const groups: Record<string, ExtendedOrder[]> = {}
  displayOrders.value.forEach(order => {
    const date = order.startTime || order.createdAt || ''
    const monthKey = date.substring(0, 7) || '未知日期'
    if (!groups[monthKey]) groups[monthKey] = []
    groups[monthKey].push(order)
  })
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, orders]) => ({
      month,
      monthLabel: formatMonthLabel(month),
      orders,
    }))
})

// ---- 格式化函数 ----
function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === '未知日期') return '未知日期'
  const [year, month] = monthKey.split('-')
  const now = new Date()
  const currentYear = String(now.getFullYear())
  const yearLabel = year === currentYear ? '' : `${year}年`
  return `${yearLabel}${parseInt(month)}月`
}

function formatDay(dateStr: string): string {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return String(d.getDate()).padStart(2, '0')
}

function formatMonthShort(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月`
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '0分'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}时${m}分`
  return `${m}分`
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '已过期'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function refundStatusLabel(status?: string): string {
  const map: Record<string, string> = {
    processing: '退款处理中',
    PROCESSING: '退款处理中',
    approved: '退款已批准',
    APPROVED: '退款已批准',
    rejected: '退款已拒绝',
    REJECTED: '退款已拒绝',
    completed: '退款已完成',
    COMPLETED: '退款已完成',
  }
  return map[status || ''] || '退款处理中'
}

// ---- 左滑操作 ----
function getSwipeOffset(orderId: string): number {
  return swipeOffsets[orderId] || 0
}

function onTouchStart(e: TouchEvent, orderId: string) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  touchOrderId = orderId
}

function onTouchMove(e: TouchEvent, orderId: string) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  // 仅水平滑动时触发
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
    const offset = Math.max(Math.min(dx, 0), -160)
    swipeOffsets[orderId] = offset
  }
}

function onTouchEnd(_e: TouchEvent, orderId: string) {
  const current = swipeOffsets[orderId] || 0
  // 吸附到位置
  if (current < -60) {
    swipeOffsets[orderId] = -160
  } else {
    swipeOffsets[orderId] = 0
  }
  // 关闭其他已打开的
  Object.keys(swipeOffsets).forEach(id => {
    if (id !== orderId && swipeOffsets[id] !== 0) {
      swipeOffsets[id] = 0
    }
  })
}

// ---- 数据加载 ----
async function loadOrders(isRefresh = false) {
  if (isRefresh) {
    page.value = 1
    noMore.value = false
  }
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      pageSize,
    }
    if (currentTab.value !== 'all') {
      params.status = currentTab.value
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const result = await api.getOrders(params)
    const newOrders = (result || []).map((o: any) => ({
      ...o,
      currentSoc: o.currentSoc || 0,
      power: o.power || 0,
      duration: o.duration || 0,
      payMethod: o.payMethod || '',
      countdown: o.countdown || 0,
      refundAmount: o.refundAmount || 0,
      refundReason: o.refundReason || '',
      refundStatus: o.refundStatus || '',
    }))
    if (isRefresh || page.value === 1) {
      allOrders.value = newOrders
    } else {
      allOrders.value = [...allOrders.value, ...newOrders]
    }
    // 标记当前 Tab 已加载并更新缓存
    loadedTabs.add(currentTab.value)
    tabDataCache[currentTab.value] = [...allOrders.value]
    lastLoadTime = Date.now()
    if (newOrders.length < pageSize) {
      noMore.value = true
    }
  } catch (error) {
    if (page.value === 1) {
      allOrders.value = []
    }
    uni.showToast({ title: '加载订单失败', icon: 'none' })
  } finally {
    loading.value = false
    isRefreshing.value = false
    isLoadingMore.value = false
  }
}

function switchTab(tab: string) {
  if (currentTab.value === tab) return

  // 缓存当前 Tab 数据
  tabDataCache[currentTab.value] = [...allOrders.value]

  currentTab.value = tab
  page.value = 1
  noMore.value = false
  // 重置左滑状态
  Object.keys(swipeOffsets).forEach(k => { swipeOffsets[k] = 0 })

  // Tab 懒加载：已加载过则使用缓存，否则请求
  if (loadedTabs.has(tab)) {
    allOrders.value = tabDataCache[tab] ? [...tabDataCache[tab]] : []
  } else {
    loadOrders(true)
  }
}

function viewOrder(id: string) {
  uni.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
}

function viewChargingDetail(id: string) {
  uni.navigateTo({ url: `/pages/charging/index?orderId=${id}` })
}

async function payOrder(id: string) {
  try {
    await api.payOrder(id)
    uni.showToast({ title: '支付成功', icon: 'success' })
    // 支付成功后清除所有 Tab 缓存，触发全量刷新
    loadedTabs.clear()
    Object.keys(tabDataCache).forEach(k => delete tabDataCache[k])
    loadOrders(true)
  } catch (e) {
    uni.showToast({ title: '支付失败', icon: 'none' })
  }
}

function rechargeAgain(order: ExtendedOrder) {
  uni.navigateTo({
    url: `/pages/charging-settings/index?stationName=${encodeURIComponent(order.stationName || '')}`,
  })
}

async function deleteOrder(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '删除后将无法恢复，确认删除该订单？',
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({ url: `/api/v1/orders/${id}`, method: 'DELETE' })
          allOrders.value = allOrders.value.filter(o => o.id !== id)
          // 删除后更新当前 Tab 缓存并清除其他缓存
          tabDataCache[currentTab.value] = [...allOrders.value]
          loadedTabs.clear()
          loadedTabs.add(currentTab.value)
          Object.keys(tabDataCache).forEach(k => {
            if (k !== currentTab.value) delete tabDataCache[k]
          })
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

function onSearch() {
  page.value = 1
  noMore.value = false
  loadOrders(true)
}

function clearSearch() {
  searchKeyword.value = ''
  page.value = 1
  noMore.value = false
  loadOrders(true)
}

function goScanCharge() {
  uni.switchTab({ url: '/pages/map/index' })
}

function onPullDownRefresh() {
  isRefreshing.value = true
  // 下拉刷新清除所有 Tab 缓存
  loadedTabs.clear()
  Object.keys(tabDataCache).forEach(k => delete tabDataCache[k])
  loadOrders(true)
}

function onReachBottom() {
  if (isLoadingMore.value || noMore.value || loading.value) return
  isLoadingMore.value = true
  page.value++
  loadOrders()
}

// ---- WebSocket 实时刷新（充电中订单） ----
function startWebSocketRefresh() {
  if (wsTimer) return // 防止重复启动
  wsTimer = setInterval(() => {
    const hasCharging = allOrders.value.some(o => ['charging', 'CHARGING'].includes(o.status))
    if (hasCharging) {
      // 静默刷新进行中的订单数据
      refreshChargingOrders()
    }
  }, 10000) // 每10秒刷新
}

function stopWebSocketRefresh() {
  if (wsTimer) {
    clearInterval(wsTimer)
    wsTimer = null
  }
}

async function refreshChargingOrders() {
  try {
    const result = await api.getOrders({ status: 'charging' })
    if (!result || !Array.isArray(result)) return
    const chargingIds = new Set(result.map((o: any) => o.id))
    // 更新已有充电订单或替换
    allOrders.value = allOrders.value.map(existing => {
      if (chargingIds.has(existing.id)) {
        const updated = result.find((o: any) => o.id === existing.id)
        return updated ? { ...existing, ...updated } : existing
      }
      return existing
    })
    // 补充新的充电订单
    result.forEach((o: any) => {
      if (!allOrders.value.find(e => e.id === o.id)) {
        allOrders.value.unshift(o)
      }
    })
  } catch {
    // 静默失败
  }
}

// ---- 待支付倒计时 ----
function startCountdown() {
  countdownTimer = setInterval(() => {
    allOrders.value = allOrders.value.map(o => {
      if (['pending_payment', 'PENDING_PAYMENT'].includes(o.status) && o.countdown && o.countdown > 0) {
        return { ...o, countdown: o.countdown - 1 }
      }
      return o
    })
  }, 1000)
}

// ---- request helper (for delete) ----
function request(options: { url: string; method?: string }): Promise<any> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    uni.request({
      url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${options.url}`,
      method: (options.method || 'GET') as any,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      success: (res: any) => {
        if (res.statusCode === 200) resolve(res.data?.data)
        else reject(new Error('请求失败'))
      },
      fail: reject,
    })
  })
}

// ---- 生命周期（UniApp 页面级） ----
onShow(async () => {
  if (!dataLoaded.value) {
    await loadOrders(true)
    dataLoaded.value = true
    loadedTabs.add('all')
  } else if (Date.now() - lastLoadTime > DATA_STALE_MS) {
    // 数据过期，静默刷新当前 Tab
    await loadOrders(true)
  }
  // 启动倒计时（始终需要）
  if (!countdownTimer) startCountdown()
  // 仅在可见时建立 WebSocket 刷新
  startWebSocketRefresh()
})

onHide(() => {
  stopWebSocketRefresh()
})

onUnmounted(() => {
  if (wsTimer) clearInterval(wsTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.order-page {
  display: flex;
  flex-direction: column;
  background: #F6F7FB;
  height: 100vh;
  padding: 0 0.75rem 0.75rem;
  box-sizing: border-box;
  overflow: hidden;
}


/* ---- 搜索栏（与CustomNavBar统一） ---- */
.navbar-content {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 24rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  width: 100%;
  height: 64rpx;
  background-color: #F5F5F5;
  border-radius: 999rpx;
  padding: 0 24rpx;
}

.search-icon-text {
  font-size: 28rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 24rpx;
  color: #333;
  margin-left: 12rpx;
}

.search-clear {
  font-size: 24rpx;
  color: #999;
  padding: 8rpx;
}

/* ---- Tab 切换 ---- */
.tabs-wrapper {
  background: #fff;
  border-bottom: 1rpx solid #F0F0F0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tabs-scroll {
  white-space: nowrap;
}

.tabs {
  display: flex;
  padding: 0 12rpx;
}

.tab-item {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 24rpx;
  flex-shrink: 0;
}

.tab-label {
  font-size: 28rpx;
  color: #666;
  transition: color 0.2s;
}

.tab-item.active .tab-label {
  color: #07C160;
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #07C160;
  border-radius: 3rpx;
}

.tab-badge {
  position: absolute;
  top: 8rpx;
  right: 4rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: #FF4D4F;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.tab-badge-text {
  font-size: 18rpx;
  color: #fff;
  font-weight: 600;
}

/* ---- 滚动区域 ---- */
.order-scroll {
  flex: 1;
  height: 0;
  padding: 16rpx 0;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
}

/* ---- 置顶区域 ---- */
.section-pinned {
  margin-bottom: 16rpx;
}

/* ---- 进行中卡片 ---- */
.card-charging {
  background: #F0FFF4;
  border-left: 8rpx solid #07C160;
  border-radius: 16rpx;
  padding: 0;
  overflow: hidden;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.1);
}

.card-charging-header {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx 0;
}

.charging-status-dot {
  width: 16rpx;
  height: 16rpx;
  background: #07C160;
  border-radius: 50%;
  margin-right: 12rpx;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.charging-status-text {
  font-size: 24rpx;
  color: #07C160;
  font-weight: 600;
}

.charging-duration {
  margin-left: auto;
  font-size: 24rpx;
  color: #666;
  font-family: 'DIN Alternate', monospace;
}

.card-charging-body {
  padding: 16rpx 24rpx;
}

.charging-station-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.charging-soc-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.soc-label {
  font-size: 22rpx;
  color: #666;
  margin-right: 12rpx;
  width: 48rpx;
}

.soc-bar-bg {
  flex: 1;
  height: 16rpx;
  background: #E0E0E0;
  border-radius: 8rpx;
  overflow: hidden;
}

.soc-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #07C160, #34D87A);
  border-radius: 8rpx;
  transition: width 0.6s ease;
  min-width: 4%;
}

.soc-value {
  font-size: 24rpx;
  color: #07C160;
  font-weight: 600;
  margin-left: 12rpx;
  width: 80rpx;
  text-align: right;
  font-family: 'DIN Alternate', monospace;
}

.charging-metrics {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12rpx;
  padding: 16rpx 0;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.metric-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  font-family: 'DIN Alternate', monospace;
}

.metric-unit {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}

.metric-divider {
  width: 1rpx;
  height: 48rpx;
  background: #E0E0E0;
}

.card-charging-footer {
  padding: 12rpx 24rpx 20rpx;
}

.btn-charging-detail {
  background: #07C160;
  border-radius: 40rpx;
  padding: 16rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-charging-detail-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}

/* ---- 待支付卡片 ---- */
.card-pending {
  background: #FFFBFB;
  border-left: 8rpx solid #FF4D4F;
  border-radius: 16rpx;
  padding: 0;
  overflow: hidden;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.1);
}

.card-pending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx 0;
}

.pending-label {
  font-size: 26rpx;
  color: #FF4D4F;
  font-weight: 600;
}

.pending-countdown {
  display: flex;
  align-items: center;
}

.countdown-text {
  font-size: 22rpx;
  color: #999;
}

.countdown-time {
  font-size: 24rpx;
  color: #FF4D4F;
  font-weight: 600;
  font-family: 'DIN Alternate', monospace;
}

.card-pending-body {
  padding: 16rpx 24rpx;
}

.pending-station-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.pending-info-row {
  display: flex;
  gap: 24rpx;
  margin-bottom: 16rpx;
}

.pending-info-text {
  font-size: 24rpx;
  color: #999;
}

.pending-amount-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  background: rgba(255, 77, 79, 0.04);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.pending-amount-label {
  font-size: 26rpx;
  color: #666;
}

.pending-amount-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #FF4D4F;
  font-family: 'DIN Alternate', monospace;
}

.card-pending-footer {
  padding: 12rpx 24rpx 20rpx;
}

.btn-pay {
  background: #FF4D4F;
  border-radius: 40rpx;
  padding: 16rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-pay-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}

/* ---- 月份分组 ---- */
.month-group {
  margin-bottom: 16rpx;
}

.month-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 8rpx 12rpx;
}

.month-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.month-count {
  font-size: 22rpx;
  color: #999;
}

/* ---- 左滑容器 ---- */
.swipe-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 16rpx;
  margin-bottom: 12rpx;
}

.swipe-content {
  position: relative;
  z-index: 2;
  transition: transform 0.25s ease;
  background: #fff;
  border-radius: 16rpx;
}

.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  z-index: 1;
  border-radius: 0 16rpx 16rpx 0;
  overflow: hidden;
}

.swipe-action {
  width: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-recharge {
  background: #1677FF;
}

.action-delete {
  background: #FF4D4F;
}

.swipe-action-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

/* ---- 已完成卡片 ---- */
.card-completed {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
}

.completed-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 20rpx;
  min-width: 64rpx;
}

.completed-day {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  font-family: 'DIN Alternate', monospace;
  line-height: 1.1;
}

.completed-month-small {
  font-size: 20rpx;
  color: #999;
  margin-top: 4rpx;
}

.completed-center {
  flex: 1;
  overflow: hidden;
}

.completed-station-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.completed-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.completed-meta-text {
  font-size: 22rpx;
  color: #999;
}

.completed-meta-dot {
  font-size: 22rpx;
  color: #ddd;
  margin: 0 8rpx;
}

.completed-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.completed-amount {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  font-family: 'DIN Alternate', monospace;
}

.completed-arrow {
  font-size: 36rpx;
  color: #ccc;
  margin-top: 4rpx;
  line-height: 1;
}

/* ---- 退款中卡片 ---- */
.card-refunding {
  background: #FFFBF5;
  border-left: 8rpx solid #FAAD14;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.refunding-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.refunding-station-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.refunding-status-tag {
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.tag-processing, .tag-PROCESSING {
  background: #FFF7E6;
}

.tag-approved, .tag-APPROVED {
  background: #E6F7FF;
}

.tag-completed, .tag-COMPLETED {
  background: #F6FFED;
}

.tag-rejected, .tag-REJECTED {
  background: #FFF2F0;
}

.refunding-status-text {
  font-size: 22rpx;
  color: #FAAD14;
  font-weight: 500;
}

.refunding-body {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.refunding-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.refunding-label {
  font-size: 24rpx;
  color: #999;
}

.refunding-amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #FAAD14;
  font-family: 'DIN Alternate', monospace;
}

.refunding-reason {
  font-size: 24rpx;
  color: #666;
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.refunding-order-no {
  font-size: 22rpx;
  color: #999;
}

/* ---- 默认卡片 ---- */
.card-default {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.default-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.default-station-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.default-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

.status-charging, .status-CHARGING { background: #E6F7FF; color: #1677FF; }
.status-completed, .status-COMPLETED { background: #F6FFED; color: #52C41A; }
.status-pending_payment, .status-PENDING_PAYMENT { background: #FFF2F0; color: #FF4D4F; }
.status-refunding, .status-REFUNDING { background: #FFF7E6; color: #FAAD14; }
.status-refunded, .status-REFUNDED { background: #F6FFED; color: #52C41A; }
.status-cancelled, .status-CANCELLED { background: #F5F5F5; color: #999; }
.status-abnormal, .status-ABNORMAL { background: #FFF2F0; color: #FF4D4F; }

.default-body {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
}

.default-info-text {
  font-size: 24rpx;
  color: #999;
}

.default-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #F5F5F5;
}

.default-order-no {
  font-size: 22rpx;
  color: #999;
}

.default-amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  font-family: 'DIN Alternate', monospace;
}

/* ---- 加载更多 ---- */
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid #E0E0E0;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 12rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}

/* ---- 空状态 ---- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
}

.empty-illustration {
  margin-bottom: 32rpx;
}

.empty-icon-wrap {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon-text {
  font-size: 72rpx;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.empty-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 32rpx;
}

.empty-action {
  background: #07C160;
  border-radius: 40rpx;
  padding: 16rpx 64rpx;
}

.empty-action-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}

/* ---- 骨架屏 ---- */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
}

.skeleton-line {
  background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
  background-size: 400% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
  height: 24rpx;
  margin-bottom: 16rpx;
}

.skeleton-title {
  width: 60%;
  height: 28rpx;
}

.skeleton-sub {
  width: 80%;
}

.skeleton-short {
  width: 40%;
  margin-bottom: 0;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
