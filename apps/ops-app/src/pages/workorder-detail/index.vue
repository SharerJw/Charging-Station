<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else-if="detail">
      <!-- SLA 进度时间线 -->
      <view class="sla-timeline">
        <text class="section-title">SLA 进度</text>
        <view class="sla-bar">
          <view class="sla-bar-bg">
            <view class="sla-bar-fill" :style="{ width: slaPercent + '%' }" :class="slaClass"></view>
          </view>
          <text class="sla-bar-label">{{ slaPercentText }}</text>
        </view>
        <view class="timeline-nodes">
          <view
            class="timeline-node"
            v-for="(node, idx) in slaNodes"
            :key="idx"
            :class="{ active: node.active, current: node.current }"
          >
            <view class="node-dot" :class="{ pulse: node.current }"></view>
            <text class="node-label">{{ node.label }}</text>
            <text class="node-time">{{ node.time || '--' }}</text>
          </view>
          <view class="timeline-line">
            <view class="timeline-line-fill" :style="{ width: timelineFillPercent + '%' }"></view>
          </view>
        </view>
      </view>

      <!-- 站点信息卡片 -->
      <view class="info-card">
        <text class="card-title">站点信息</text>
        <view class="card-row">
          <text class="card-label">站点名称</text>
          <text class="card-value">{{ detail.stationName }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">站点地址</text>
          <text class="card-value">{{ detail.stationAddress || '--' }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">站点编号</text>
          <text class="card-value">{{ detail.stationCode || '--' }}</text>
        </view>
      </view>

      <!-- 设备信息卡片 -->
      <view class="info-card">
        <text class="card-title">设备信息</text>
        <view class="card-row">
          <text class="card-label">设备编号</text>
          <text class="card-value">{{ detail.deviceCode }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">设备型号</text>
          <text class="card-value">{{ detail.deviceModel || '--' }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">设备状态</text>
          <text class="card-value" :class="'status-' + detail.deviceStatus">{{ deviceStatusLabels[detail.deviceStatus] || '--' }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">安装位置</text>
          <text class="card-value">{{ detail.devicePosition || '--' }}</text>
        </view>
      </view>

      <!-- 故障描述卡片 -->
      <view class="info-card">
        <text class="card-title">故障描述</text>
        <view class="fault-desc">
          <text class="fault-text">{{ detail.description }}</text>
        </view>
        <view class="card-row" v-if="detail.faultCode">
          <text class="card-label">故障代码</text>
          <text class="card-value fault-code">{{ detail.faultCode }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">故障类型</text>
          <text class="card-value">{{ typeLabels[detail.type] || detail.type }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">优先级</text>
          <text class="card-value priority-tag" :class="detail.priority">{{ priorityLabels[detail.priority] }}</text>
        </view>
        <!-- 故障图片 -->
        <view class="fault-images" v-if="detail.faultImages && detail.faultImages.length > 0">
          <text class="card-label">现场照片</text>
          <view class="image-grid">
            <image
              v-for="(img, idx) in detail.faultImages"
              :key="idx"
              :src="img"
              class="fault-image"
              mode="aspectFill"
              @tap="previewImage(idx)"
            />
          </view>
        </view>
      </view>

      <!-- 报告人信息卡片 -->
      <view class="info-card">
        <text class="card-title">报告人信息</text>
        <view class="card-row">
          <text class="card-label">报告人</text>
          <text class="card-value">{{ detail.creator }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">联系电话</text>
          <text class="card-value link" @tap="callPhone(detail.creatorPhone)">{{ detail.creatorPhone || '--' }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">报告时间</text>
          <text class="card-value">{{ detail.createTime }}</text>
        </view>
        <view class="card-row" v-if="detail.assignee">
          <text class="card-label">处理人</text>
          <text class="card-value">{{ detail.assignee }}</text>
        </view>
      </view>

      <!-- 动态操作区 -->
      <view class="action-area">
        <button v-if="detail.status === 'pending'" class="action-btn primary full" @tap="handleAccept">接受工单</button>
        <button v-if="detail.status === 'accepted'" class="action-btn primary full" @tap="goProcess">去处理</button>
        <button v-if="detail.status === 'processing'" class="action-btn success full" @tap="handleComplete">标记完成</button>
        <view v-if="detail.status === 'completed' || detail.status === 'closed'" class="action-done">
          <text class="action-done-text">工单已{{ statusLabels[detail.status] }}</text>
        </view>
      </view>

      <!-- 底部时间线与评论 -->
      <view class="comment-section">
        <text class="section-title">处理记录</text>
        <view class="comment-timeline" v-if="comments.length > 0">
          <view class="comment-item" v-for="(item, idx) in comments" :key="idx">
            <view class="comment-dot" :class="{ first: idx === 0 }"></view>
            <view class="comment-line" v-if="idx < comments.length - 1"></view>
            <view class="comment-content">
              <view class="comment-header">
                <text class="comment-user">{{ item.user }}</text>
                <text class="comment-time">{{ item.time }}</text>
              </view>
              <text class="comment-action">{{ item.action }}</text>
              <text class="comment-text" v-if="item.content">{{ item.content }}</text>
            </view>
          </view>
        </view>
        <view class="empty-comments" v-else>
          <text class="empty-text">暂无处理记录</text>
        </view>
      </view>
    </template>

    <!-- 加载失败 -->
    <EmptyState
      v-else
      icon="📋"
      title="工单不存在或加载失败"
      description="请检查工单编号是否正确"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'
import EmptyState from '@/components/EmptyState.vue'
import type { SlaNode, WorkorderComment as Comment, WorkorderDetail } from '@/types'

const detail = ref<WorkorderDetail | null>(null)
const loading = ref(true)
const comments = ref<Comment[]>([])

const statusLabels: Record<string, string> = {
  pending: '待处理',
  accepted: '已接单',
  processing: '处理中',
  completed: '已完成',
  closed: '已关闭',
}

const priorityLabels: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const typeLabels: Record<string, string> = {
  repair: '维修',
  maintenance: '保养',
  inspection: '巡检',
}

const deviceStatusLabels: Record<string, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
  maintenance: '维护中',
}

const slaNodes = computed<SlaNode[]>(() => {
  if (!detail.value) return []
  const d = detail.value
  return [
    { label: '创建', time: d.createTime || '', active: true, current: false },
    { label: '接单', time: d.acceptTime || '', active: !!d.acceptTime, current: d.status === 'pending' },
    { label: '处理', time: '', active: !!d.acceptTime, current: d.status === 'accepted' || d.status === 'processing' },
    { label: '完成', time: d.completeTime || '', active: !!d.completeTime, current: false },
  ]
})

const slaPercent = computed(() => {
  if (!detail.value) return 0
  const activeCount = slaNodes.value.filter(n => n.active).length
  return Math.round((activeCount / slaNodes.value.length) * 100)
})

const slaPercentText = computed(() => {
  return `${slaPercent.value}%`
})

const slaClass = computed(() => {
  if (slaPercent.value >= 75) return 'green'
  if (slaPercent.value >= 50) return 'yellow'
  return 'blue'
})

const timelineFillPercent = computed(() => {
  const activeCount = slaNodes.value.filter(n => n.active).length
  if (activeCount <= 1) return 0
  return ((activeCount - 1) / (slaNodes.value.length - 1)) * 100
})

function previewImage(idx: number) {
  if (detail.value?.faultImages) {
    uni.previewImage({ urls: detail.value.faultImages, current: idx })
  }
}

function callPhone(phone?: string) {
  if (phone) {
    uni.makePhoneCall({ phoneNumber: phone })
  }
}

async function loadDetail() {
  loading.value = true
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1] as any
    const id = currentPage?.options?.id || currentPage?.$page?.options?.id
    if (!id) {
      detail.value = null
      return
    }
    const result = await api.getWorkorderDetail(id)
    detail.value = result
    // 构建评论/处理记录
    const records: Comment[] = []
    if (result.createTime) {
      records.push({ user: result.creator, time: result.createTime, action: '创建了工单' })
    }
    if (result.acceptTime) {
      records.push({ user: result.assignee || '', time: result.acceptTime, action: '接受了工单' })
    }
    if (result.completeTime) {
      records.push({ user: result.assignee || '', time: result.completeTime, action: '完成了工单', content: result.result })
    }
    comments.value = records
  } catch (error) {
    detail.value = null
    uni.showToast({ title: '加载工单详情失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleAccept() {
  if (!detail.value) return
  uni.showModal({
    title: '接单确认',
    content: `确定接受工单「${detail.value.title}」？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.acceptWorkorder(detail.value!.id)
          uni.showToast({ title: '接单成功', icon: 'success' })
          loadDetail()
        } catch {
          uni.showToast({ title: '接单失败', icon: 'none' })
        }
      }
    },
  })
}

function goProcess() {
  if (!detail.value) return
  uni.navigateTo({ url: `/pages/workorder-process/index?id=${detail.value.id}` })
}

async function handleComplete() {
  if (!detail.value) return
  uni.showModal({
    title: '完成工单',
    editable: true,
    placeholderText: '请输入处理结果',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.completeWorkorder(detail.value!.id, { result: res.content || '已完成' })
          uni.showToast({ title: '工单已完成', icon: 'success' })
          loadDetail()
        } catch {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    },
  })
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.detail-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
  padding-bottom: 48rpx;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

/* SLA Timeline */
.sla-timeline {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.sla-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.sla-bar-bg {
  flex: 1;
  height: 12rpx;
  background: #F0F0F0;
  border-radius: 6rpx;
  overflow: hidden;
}

.sla-bar-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s ease;
}

.sla-bar-fill.blue { background: #1677FF; }
.sla-bar-fill.yellow { background: #FAAD14; }
.sla-bar-fill.green { background: #52C41A; }

.sla-bar-label {
  font-size: 24rpx;
  color: #666;
  font-weight: bold;
  min-width: 60rpx;
}

.timeline-nodes {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 0 16rpx;
}

.timeline-line {
  position: absolute;
  top: 16rpx;
  left: 48rpx;
  right: 48rpx;
  height: 4rpx;
  background: #E8E8E8;
  z-index: 0;
}

.timeline-line-fill {
  height: 100%;
  background: #1677FF;
  transition: width 0.6s ease;
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
  position: relative;
}

.node-dot {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #E8E8E8;
  margin-bottom: 8rpx;
  border: 4rpx solid #fff;
  box-shadow: 0 0 0 2rpx #E8E8E8;
}

.timeline-node.active .node-dot {
  background: #1677FF;
  box-shadow: 0 0 0 2rpx #1677FF;
}

.timeline-node.current .node-dot {
  background: #1677FF;
  box-shadow: 0 0 0 2rpx #1677FF;
}

.node-dot.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.4); }
  70% { box-shadow: 0 0 0 12rpx rgba(22, 119, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0); }
}

.node-label {
  font-size: 22rpx;
  color: #999;
}

.timeline-node.active .node-label {
  color: #333;
  font-weight: bold;
}

.node-time {
  font-size: 18rpx;
  color: #BBB;
  margin-top: 4rpx;
}

/* Info Cards */
.info-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.card-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12rpx 0;
}

.card-label {
  font-size: 24rpx;
  color: #999;
  min-width: 140rpx;
  flex-shrink: 0;
}

.card-value {
  font-size: 24rpx;
  color: #333;
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.card-value.link {
  color: #1677FF;
  text-decoration: underline;
}

.fault-desc {
  padding: 16rpx;
  background: #FFFBE6;
  border-radius: 8rpx;
  border-left: 6rpx solid #FAAD14;
  margin-bottom: 12rpx;
}

.fault-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.6;
}

.fault-code {
  font-family: monospace;
  color: #FF4D4F;
  font-weight: bold;
}

.priority-tag {
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
  font-size: 22rpx;
}

.priority-tag.high { background: #FFCCC7; color: #CF1322; }
.priority-tag.medium { background: #FFF7E6; color: #D48806; }
.priority-tag.low { background: #E6F7FF; color: #1677FF; }

.status-online { color: #52C41A; }
.status-offline { color: #999; }
.status-fault { color: #FF4D4F; }
.status-maintenance { color: #FAAD14; }

.fault-images {
  margin-top: 16rpx;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;
}

.fault-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
}

/* Action Area */
.action-area {
  margin-bottom: 16rpx;
}

.action-btn {
  border-radius: 12rpx;
  font-size: 30rpx;
  font-weight: bold;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
}

.action-btn.full {
  width: 100%;
}

.action-btn.primary {
  background: #1677FF;
  color: #fff;
}

.action-btn.success {
  background: #52C41A;
  color: #fff;
}

.action-done {
  background: #fff;
  border-radius: 12rpx;
  padding: 32rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.action-done-text {
  font-size: 28rpx;
  color: #52C41A;
  font-weight: bold;
}

/* Comment Timeline */
.comment-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.comment-timeline {
  position: relative;
  padding-left: 32rpx;
}

.comment-item {
  position: relative;
  padding-bottom: 24rpx;
  padding-left: 24rpx;
}

.comment-dot {
  position: absolute;
  left: -8rpx;
  top: 8rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #D9D9D9;
}

.comment-dot.first {
  background: #1677FF;
  width: 20rpx;
  height: 20rpx;
  left: -10rpx;
}

.comment-line {
  position: absolute;
  left: -1rpx;
  top: 28rpx;
  width: 2rpx;
  bottom: 0;
  background: #E8E8E8;
}

.comment-content {
  background: #FAFAFA;
  border-radius: 8rpx;
  padding: 16rpx;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.comment-user {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
}

.comment-time {
  font-size: 20rpx;
  color: #BBB;
}

.comment-action {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.comment-text {
  font-size: 24rpx;
  color: #333;
  margin-top: 8rpx;
  display: block;
  line-height: 1.5;
}

.empty-comments {
  padding: 48rpx 0;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 16rpx; }
</style>
