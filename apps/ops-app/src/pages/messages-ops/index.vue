<template>
  <view class="messages-page">
    <!-- 标签切换 -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view class="tab-badge" v-if="tab.unread > 0">
          <text class="badge-text">{{ tab.unread > 99 ? '99+' : tab.unread }}</text>
        </view>
      </view>
    </view>

    <!-- 消息列表 -->
    <view class="message-list" v-if="messages.length > 0">
      <view
        class="message-card"
        :class="{ unread: !msg.read }"
        v-for="msg in messages"
        :key="msg.id"
        @tap="openMessage(msg)"
      >
        <view class="msg-left">
          <view class="msg-icon" :class="msg.type">
            <text class="icon-text">{{ typeIcons[msg.type] }}</text>
          </view>
          <view class="unread-dot" v-if="!msg.read"></view>
        </view>
        <view class="msg-body">
          <view class="msg-header">
            <text class="msg-title">{{ msg.title }}</text>
            <text class="msg-time">{{ msg.time }}</text>
          </view>
          <text class="msg-content">{{ msg.content }}</text>
          <view class="msg-footer" v-if="msg.extra">
            <text class="msg-extra">{{ msg.extra }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="!loading">
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无{{ currentTab === 'all' ? '' : tabLabels[currentTab] }}消息</text>
    </view>

    <!-- 加载中 -->
    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import type { OpsMessage as Message } from '@/types'

const currentTab = ref('all')
const loading = ref(false)
const messages = ref<Message[]>([])

const typeIcons: Record<string, string> = {
  workorder: '📋',
  alert: '🚨',
  system: '📢',
}

const tabLabels: Record<string, string> = {
  workorder: '工单',
  alert: '告警',
  system: '系统',
}

const tabs = ref([
  { label: '全部', value: 'all', unread: 0 },
  { label: '工单', value: 'workorder', unread: 0 },
  { label: '告警', value: 'alert', unread: 0 },
  { label: '系统', value: 'system', unread: 0 },
])

function switchTab(tab: string) {
  currentTab.value = tab
  loadMessages()
}

async function loadMessages() {
  loading.value = true
  try {
    const params: any = {}
    if (currentTab.value !== 'all') {
      params.type = currentTab.value
    }
    const result = await api.getMessages(params)
    const data = result || {}
    messages.value = data.list || data || []

    // 更新未读数
    if (data.unreadCounts) {
      tabs.value.forEach((tab) => {
        if (tab.value === 'all') {
          tab.unread = data.unreadCounts.total || 0
        } else {
          tab.unread = data.unreadCounts[tab.value] || 0
        }
      })
    }
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function openMessage(msg: Message) {
  // 标记已读
  if (!msg.read) {
    msg.read = true
    const tab = tabs.value.find(t => t.value === msg.type)
    if (tab && tab.unread > 0) tab.unread--
    const allTab = tabs.value.find(t => t.value === 'all')
    if (allTab && allTab.unread > 0) allTab.unread--
  }

  // 跳转到关联页面
  if (msg.relatedType === 'workorder') {
    uni.navigateTo({ url: `/pages/workorder/index?id=${msg.relatedId}` })
  } else if (msg.relatedType === 'alert') {
    uni.navigateTo({ url: `/pages/alert/index?id=${msg.relatedId}` })
  }
}

onMounted(() => {
  loadMessages()
})
</script>

<style scoped>
.messages-page {
  background: #F0F2F5;
  min-height: 100vh;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0 16rpx;
  position: relative;
}

.tab-item.active .tab-text {
  color: #1677FF;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  right: 25%;
  height: 4rpx;
  background: #1677FF;
  border-radius: 2rpx;
}

.tab-text {
  font-size: 28rpx;
  color: #666;
}

.tab-badge {
  position: absolute;
  top: 12rpx;
  right: 10%;
  background: #FF4D4F;
  border-radius: 20rpx;
  padding: 2rpx 10rpx;
  min-width: 28rpx;
  text-align: center;
}

.badge-text {
  font-size: 18rpx;
  color: #fff;
}

.message-list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.message-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  display: flex;
  gap: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.message-card.unread {
  background: #F0F5FF;
}

.message-card:active {
  background: #E6F7FF;
}

.msg-left {
  position: relative;
  flex-shrink: 0;
}

.msg-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-icon.workorder {
  background: #E6F7FF;
}

.msg-icon.alert {
  background: #FFF1F0;
}

.msg-icon.system {
  background: #F6FFED;
}

.icon-text {
  font-size: 36rpx;
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 16rpx;
  height: 16rpx;
  background: #FF4D4F;
  border-radius: 50%;
}

.msg-body {
  flex: 1;
  min-width: 0;
}

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.msg-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msg-time {
  font-size: 22rpx;
  color: #999;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.msg-content {
  font-size: 24rpx;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.msg-footer {
  margin-top: 8rpx;
}

.msg-extra {
  font-size: 22rpx;
  color: #1677FF;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 100rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 24rpx;
}

.loading-state {
  text-align: center;
  padding: 40rpx;
}

.loading-text {
  font-size: 26rpx;
  color: #999;
}
</style>
