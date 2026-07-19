<template>
  <view class="messages-page">
    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <view class="top-title">
        <text class="title-text">消息中心</text>
      </view>
      <view
        class="mark-all-btn"
        :class="{ disabled: totalUnread === 0 }"
        @tap="handleMarkAllRead"
      >
        <text class="mark-all-text">全部已读</text>
      </view>
    </view>

    <!-- 消息分类Tab -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view class="tab-badge" v-if="tab.unread > 0">
          {{ tab.unread > 99 ? '99+' : tab.unread }}
        </view>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view
      class="message-scroll"
      scroll-y
      enhanced
      :show-scrollbar="false"
      @scrolltolower="loadMore"
      :lower-threshold="100"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="message-list" v-if="displayMessages.length > 0">
        <view
          class="message-item-wrap"
          v-for="msg in displayMessages"
          :key="msg.id"
        >
          <!-- 消息卡片主体 -->
          <view
            class="message-card"
            :class="{ unread: !msg.read }"
            :style="{ transform: `translateX(${getSwipeOffset(msg.id)}px)` }"
            @tap="handleMessageTap(msg)"
            @touchstart="onTouchStart($event, msg.id)"
            @touchmove="onTouchMove($event, msg.id)"
            @touchend="onTouchEnd(msg.id)"
          >
            <!-- 未读蓝色竖线 -->
            <view class="unread-indicator" v-if="!msg.read"></view>

            <!-- 左侧类型图标 -->
            <view class="msg-icon-wrap" :class="`icon-${msg.type}`">
              <text class="msg-icon">{{ getIcon(msg.type) }}</text>
            </view>

            <!-- 中间内容 -->
            <view class="msg-body">
              <view class="msg-header">
                <text class="msg-title" :class="{ 'title-unread': !msg.read }">
                  {{ msg.title }}
                </text>
                <text class="msg-time">{{ formatRelativeTime(msg.time) }}</text>
              </view>
              <text class="msg-summary">{{ msg.summary || msg.content }}</text>
              <view class="msg-meta" v-if="msg.categoryLabel">
                <text class="msg-tag">{{ msg.categoryLabel }}</text>
              </view>
            </view>

            <!-- 右侧：未读红点 + 右箭头 -->
            <view class="msg-right">
              <view class="unread-dot" v-if="!msg.read"></view>
              <text class="msg-arrow">›</text>
            </view>
          </view>

          <!-- 左滑操作按钮 -->
          <view class="swipe-actions" v-if="swipedId === msg.id">
            <view class="action-btn read-btn" @tap.stop="handleMarkSingleRead(msg)">
              <text class="action-icon">✓</text>
              <text class="action-label">已读</text>
            </view>
            <view class="action-btn delete-btn" @tap.stop="handleDelete(msg.id)">
              <text class="action-icon">✕</text>
              <text class="action-label">删除</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore && displayMessages.length > 0">
        <view class="loading-spinner" v-if="loadingMore"></view>
        <text class="load-more-text">{{ loadingMore ? '加载中...' : '上滑加载更多' }}</text>
      </view>

      <!-- 全部加载完毕 -->
      <view class="load-end" v-if="!hasMore && displayMessages.length > 0">
        <view class="end-line"></view>
        <text class="end-text">没有更多了</text>
        <view class="end-line"></view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && displayMessages.length === 0">
        <text class="empty-sun">☀️</text>
        <text class="empty-title">暂无新消息，一切都好~</text>
        <text class="empty-desc">放松心情，享受绿色出行</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { api } from '@/api/index'

// ============ 类型定义 ============

type MessageType = 'charging' | 'system' | 'promotion' | 'interactive'
type MessageCategory = 'all' | 'charging' | 'system' | 'promotion' | 'interactive'

interface Message {
  id: string
  type: MessageType
  title: string
  summary: string
  content: string
  time: string
  read: boolean
  categoryLabel?: string
  /** 点击跳转地址 */
  link?: string
}

interface TabItem {
  label: string
  value: MessageCategory
  unread: number
}

// ============ 常量 ============

/** 消息类型到跳转页面的映射 */
const MESSAGE_LINK_MAP: Record<string, string> = {
  '充电开始': '/pages/charging/index',
  '充电完成': '/pages/order/detail',
  '充电异常': '/pages/charging/index',
  '支付通知': '/pages/wallet/index',
  '系统维护': '',
  '新券到账': '/pages/coupon/index',
  '评价被回复': '/pages/station/detail',
}

// ============ 状态 ============

const currentTab = ref<MessageCategory>('all')
const allMessages = ref<Message[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)
const page = ref(1)
const pageSize = 20

const tabs = reactive<TabItem[]>([
  { label: '全部', value: 'all', unread: 0 },
  { label: '充电通知', value: 'charging', unread: 0 },
  { label: '系统消息', value: 'system', unread: 0 },
  { label: '优惠活动', value: 'promotion', unread: 0 },
  { label: '互动消息', value: 'interactive', unread: 0 },
])

// ============ 左滑交互 ============

const swipedId = ref('')
const swipeOffsets = reactive<Record<string, number>>({})
let touchStartX = 0
let touchStartY = 0
let isSwiping = false

function getSwipeOffset(id: string): number {
  return swipeOffsets[id] || 0
}

function onTouchStart(e: TouchEvent | any, id: string) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  isSwiping = false
  // 如果有其他消息处于滑动状态，先关闭
  if (swipedId.value && swipedId.value !== id) {
    closeSwipe()
  }
}

function onTouchMove(e: TouchEvent | any, id: string) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  // 水平滑动距离大于垂直时触发
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 15) {
    isSwiping = true
    if (dx < 0) {
      // 左滑：最大偏移 -160（两个按钮宽度）
      const offset = Math.max(dx, -160)
      swipeOffsets[id] = offset
    } else if (swipedId.value === id) {
      // 右滑：从已展开位置恢复
      swipeOffsets[id] = Math.min(0, -160 + dx)
    }
  }
}

function onTouchEnd(id: string) {
  if (!isSwiping) return
  const offset = swipeOffsets[id] || 0
  if (offset < -60) {
    // 超过阈值，展开操作按钮
    swipeOffsets[id] = -160
    swipedId.value = id
  } else {
    // 未超过阈值，回弹
    closeSwipe()
  }
}

function closeSwipe() {
  if (swipedId.value) {
    swipeOffsets[swipedId.value] = 0
    swipedId.value = ''
  }
}

// ============ 计算属性 ============

const totalUnread = computed(() => {
  return allMessages.value.filter(m => !m.read).length
})

const displayMessages = computed(() => {
  if (currentTab.value === 'all') {
    return allMessages.value
  }
  return allMessages.value.filter(m => m.type === currentTab.value)
})

// ============ 工具函数 ============

function getIcon(type: MessageType): string {
  const icons: Record<MessageType, string> = {
    charging: '⚡',
    system: '🔔',
    promotion: '🎁',
    interactive: '💬',
  }
  return icons[type] || '📩'
}

function formatRelativeTime(time: string): string {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return '刚刚'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}小时前`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}天前`
  if (diffD < 30) return `${Math.floor(diffD / 7)}周前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function inferType(item: any): MessageType {
  const t = item.type || item.category || ''
  if (['charging', 'charge', '充电'].includes(t)) return 'charging'
  if (['system', '系统'].includes(t)) return 'system'
  if (['promotion', 'activity', '优惠', '活动'].includes(t)) return 'promotion'
  if (['interactive', '互动', 'comment', 'reply'].includes(t)) return 'interactive'
  return 'system'
}

function mapMessage(raw: any): Message {
  const type = inferType(raw)
  const categoryLabel = raw.categoryLabel || raw.tag || ''
  // 根据标签或类型推断跳转地址
  const link = raw.link || MESSAGE_LINK_MAP[categoryLabel] || ''
  return {
    id: String(raw.id || raw.messageId || ''),
    type,
    title: raw.title || '',
    summary: raw.summary || raw.content || raw.body || '',
    content: raw.content || raw.body || '',
    time: raw.time || raw.createdAt || raw.createTime || raw.sendTime || '',
    read: Boolean(raw.read || raw.isRead || raw.readFlag),
    categoryLabel,
    link,
  }
}

function updateTabCounts() {
  tabs[0].unread = allMessages.value.filter(m => !m.read).length
  tabs[1].unread = allMessages.value.filter(m => !m.read && m.type === 'charging').length
  tabs[2].unread = allMessages.value.filter(m => !m.read && m.type === 'system').length
  tabs[3].unread = allMessages.value.filter(m => !m.read && m.type === 'promotion').length
  tabs[4].unread = allMessages.value.filter(m => !m.read && m.type === 'interactive').length
}

// ============ 数据加载 ============

async function loadMessages(isRefresh = false) {
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
  }
  loading.value = isRefresh || page.value === 1
  try {
    const category = currentTab.value === 'all' ? undefined : currentTab.value
    const data = await api.getMessages({ page: page.value, pageSize, category })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    const mapped = list.map(mapMessage)

    if (page.value === 1) {
      allMessages.value = mapped
    } else {
      allMessages.value = [...allMessages.value, ...mapped]
    }
    hasMore.value = list.length >= pageSize
    updateTabCounts()
  } catch (e) {
    console.error('加载消息失败:', e)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value || loading.value) return
  loadingMore.value = true
  page.value++
  try {
    await loadMessages()
  } finally {
    loadingMore.value = false
  }
}

async function onRefresh() {
  refreshing.value = true
  closeSwipe()
  await loadMessages(true)
  refreshing.value = false
}

// ============ 交互操作 ============

function switchTab(tab: MessageCategory) {
  if (currentTab.value === tab) return
  currentTab.value = tab
  closeSwipe()
  page.value = 1
  hasMore.value = true
  allMessages.value = []
  loadMessages(true)
}

async function handleMessageTap(msg: Message) {
  // 如果有滑动状态，先关闭
  if (swipedId.value) {
    closeSwipe()
    return
  }

  // 标记已读
  if (!msg.read) {
    msg.read = true
    updateTabCounts()
    try {
      await api.markAsRead(msg.id)
    } catch {
      // 静默处理
    }
  }

  // 跳转对应页面
  if (msg.link) {
    uni.navigateTo({ url: msg.link })
  } else {
    // 无跳转地址时显示消息详情弹窗
    uni.showModal({
      title: msg.title,
      content: msg.content || msg.summary,
      showCancel: false,
      confirmText: '知道了',
    })
  }
}

async function handleMarkSingleRead(msg: Message) {
  if (msg.read) {
    closeSwipe()
    return
  }
  msg.read = true
  updateTabCounts()
  closeSwipe()
  try {
    await api.markAsRead(msg.id)
    uni.showToast({ title: '已标记已读', icon: 'success', duration: 1000 })
  } catch {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

async function handleMarkAllRead() {
  if (totalUnread.value === 0) return
  // 乐观更新
  allMessages.value.forEach(m => { m.read = true })
  updateTabCounts()
  try {
    const category = currentTab.value === 'all' ? undefined : currentTab.value
    await api.markAllAsRead(category)
    uni.showToast({ title: '全部已读', icon: 'success', duration: 1000 })
  } catch {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
    // 回滚：重新加载
    await loadMessages(true)
  }
}

async function handleDelete(id: string) {
  const idx = allMessages.value.findIndex(m => m.id === id)
  if (idx < 0) return
  // 乐观删除
  const removed = allMessages.value.splice(idx, 1)[0]
  updateTabCounts()
  closeSwipe()
  try {
    await api.deleteMessage(id)
    uni.showToast({ title: '已删除', icon: 'success', duration: 1000 })
  } catch {
    // 回滚
    allMessages.value.splice(idx, 0, removed)
    updateTabCounts()
    uni.showToast({ title: '删除失败', icon: 'none' })
  }
}

// ============ 生命周期 ============

onMounted(() => {
  loadMessages(true)
})
</script>

<style scoped>
.messages-page {
  background: #F6F7FB;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ====== 顶部操作栏 ====== */

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx 16rpx;
  background: #fff;
  flex-shrink: 0;
}

.title-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a1a;
}

.mark-all-btn {
  padding: 8rpx 20rpx;
  border-radius: 28rpx;
  background: #F0F7FF;
}

.mark-all-btn.disabled {
  opacity: 0.4;
}

.mark-all-text {
  font-size: 24rpx;
  color: #07C160;
  font-weight: 500;
}

/* ====== Tab标签栏 ====== */

.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 16rpx;
  flex-shrink: 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.tab-text {
  font-size: 26rpx;
  color: #999;
  transition: color 0.2s;
}

.tab-item.active .tab-text {
  color: #07C160;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 4rpx;
  background: #07C160;
  border-radius: 2rpx;
}

.tab-badge {
  min-width: 28rpx;
  height: 28rpx;
  line-height: 28rpx;
  background: #FF4D4F;
  color: #fff;
  font-size: 18rpx;
  border-radius: 14rpx;
  text-align: center;
  padding: 0 6rpx;
  position: absolute;
  top: 8rpx;
  right: 4rpx;
}

/* ====== 消息列表 ====== */

.message-scroll {
  flex: 1;
  padding: 16rpx 24rpx;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.message-item-wrap {
  position: relative;
  border-radius: 16rpx;
  overflow: hidden;
}

/* ====== 消息卡片 ====== */

.message-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  position: relative;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 1;
}

.message-card.unread {
  background: #F0F7FF;
}

/* 未读蓝色竖线 */
.unread-indicator {
  position: absolute;
  left: 0;
  top: 16rpx;
  bottom: 16rpx;
  width: 6rpx;
  background: #1677FF;
  border-radius: 0 3rpx 3rpx 0;
}

/* ====== 类型图标 ====== */

.msg-icon-wrap {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.msg-icon-wrap.icon-charging {
  background: #E6F7FF;
}
.msg-icon-wrap.icon-system {
  background: #FFF7E6;
}
.msg-icon-wrap.icon-promotion {
  background: #FFF0F6;
}
.msg-icon-wrap.icon-interactive {
  background: #F0FFF4;
}

.msg-icon {
  font-size: 38rpx;
}

/* ====== 消息内容 ====== */

.msg-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.msg-title {
  font-size: 28rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  line-height: 1.4;
}

.msg-title.title-unread {
  color: #1a1a1a;
  font-weight: bold;
}

.msg-time {
  font-size: 22rpx;
  color: #bbb;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.msg-summary {
  font-size: 24rpx;
  color: #999;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  line-height: 1.6;
}

.msg-meta {
  margin-top: 4rpx;
}

.msg-tag {
  font-size: 20rpx;
  color: #07C160;
  background: #F0FFF4;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
}

/* ====== 右侧区域 ====== */

.msg-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  flex-shrink: 0;
  padding-top: 8rpx;
}

.unread-dot {
  width: 14rpx;
  height: 14rpx;
  background: #FF4D4F;
  border-radius: 50%;
  border: 2rpx solid #fff;
}

.msg-arrow {
  font-size: 32rpx;
  color: #ccc;
  line-height: 1;
}

/* ====== 左滑操作按钮 ====== */

.swipe-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  z-index: 0;
  border-radius: 0 16rpx 16rpx 0;
  overflow: hidden;
}

.action-btn {
  width: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.action-btn.read-btn {
  background: #1677FF;
}

.action-btn.delete-btn {
  background: #FF4D4F;
}

.action-icon {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.action-label {
  font-size: 22rpx;
  color: #fff;
}

/* ====== 加载状态 ====== */

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  gap: 12rpx;
}

.loading-spinner {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid #e0e0e0;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-more-text {
  font-size: 24rpx;
  color: #999;
}

.load-end {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  gap: 16rpx;
}

.end-line {
  width: 60rpx;
  height: 1rpx;
  background: #e0e0e0;
}

.end-text {
  font-size: 22rpx;
  color: #ccc;
}

/* ====== 空状态 ====== */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0 160rpx;
}

.empty-sun {
  font-size: 120rpx;
  line-height: 1.2;
}

.empty-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-top: 32rpx;
}

.empty-desc {
  font-size: 24rpx;
  color: #bbb;
  margin-top: 12rpx;
}
</style>
