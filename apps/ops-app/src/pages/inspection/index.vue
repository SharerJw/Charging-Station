<template>
  <view class="inspection-page">
    <!-- 统计头部 -->
    <view class="task-header">
      <view class="header-left">
        <text class="task-count">今日巡检任务: {{ tasks.length }} 项</text>
        <text class="task-complete">已完成: {{ completedCount }} 项</text>
      </view>
    </view>

    <!-- 进度条 -->
    <view class="progress-section">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
      <text class="progress-text">{{ completedCount }}/{{ tasks.length }}</text>
    </view>

    <!-- 任务列表 -->
    <view class="task-list" v-if="tasks.length > 0">
      <view class="task-card" v-for="task in tasks" :key="task.id">
        <view class="task-top">
          <text class="task-name">{{ task.name }}</text>
          <text class="task-status" :class="task.status">{{ statusLabels[task.status] }}</text>
        </view>
        <view class="task-info">
          <text class="info-item">📍 {{ task.stationName }}</text>
          <text class="info-item">🔧 {{ task.deviceCount }}</text>
          <text class="info-item">📋 {{ task.itemCount }}</text>
        </view>
        <view class="task-time">
          <text class="time-label">计划时间:</text>
          <text class="time-value">{{ task.planTime }}</text>
        </view>
        <view class="task-inspector" v-if="task.inspector">
          <text class="inspector-label">巡检人:</text>
          <text class="inspector-value">{{ task.inspector }}</text>
        </view>
        <view class="task-footer">
          <text class="task-duration" v-if="task.startTime && task.completeTime">
            耗时: {{ calculateDuration(task.startTime, task.completeTime) }}
          </text>
          <view class="task-actions">
            <button v-if="task.status === 'pending'" class="action-btn primary" size="mini" @tap="startTask(task)">开始巡检</button>
            <button v-if="task.status === 'in_progress'" class="action-btn success" size="mini" @tap="completeTask(task)">完成巡检</button>
            <button v-if="task.status === 'completed'" class="action-btn" size="mini" disabled>已完成</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">🔍</text>
      <text class="empty-text">今日无巡检任务</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { mockOpsApi, type InspectionTask } from '@/api/mock'

const tasks = ref<InspectionTask[]>([])
const loading = ref(false)

const statusLabels: Record<string, string> = {
  pending: '待巡检',
  in_progress: '巡检中',
  completed: '已完成',
}

const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length)

const progressPercent = computed(() => {
  if (tasks.value.length === 0) return 0
  return (completedCount.value / tasks.value.length) * 100
})

function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60
  return `${hours}小时${remainMinutes}分钟`
}

async function loadTasks() {
  loading.value = true
  try {
    tasks.value = await mockOpsApi.getInspections()
  } catch (error) {
    uni.showToast({ title: '加载巡检任务失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function startTask(task: InspectionTask) {
  uni.showModal({
    title: '开始巡检',
    content: `确定要开始「${task.name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await mockOpsApi.startInspection(task.id)
          uni.showToast({ title: '巡检已开始', icon: 'success' })
          loadTasks()
        } catch (error) {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

function completeTask(task: InspectionTask) {
  uni.showModal({
    title: '完成巡检',
    content: `确定要完成「${task.name}」吗？所有巡检项都已检查完毕？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await mockOpsApi.completeInspection(task.id)
          uni.showToast({ title: '巡检已完成', icon: 'success' })
          loadTasks()
        } catch (error) {
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.inspection-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.task-count {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.task-complete {
  font-size: 24rpx;
  color: #52C41A;
}

.progress-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background: #E8E8E8;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #52C41A, #73D13D);
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 24rpx;
  color: #666;
  min-width: 60rpx;
  text-align: right;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.task-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.task-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.task-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.task-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
}

.task-status.pending { background: #FFF7E6; color: #D48806; }
.task-status.in_progress { background: #E6F7FF; color: #1677FF; }
.task-status.completed { background: #F6FFED; color: #52C41A; }

.task-info {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.info-item {
  font-size: 22rpx;
  color: #666;
}

.task-time, .task-inspector {
  display: flex;
  gap: 8rpx;
  margin-top: 4rpx;
}

.time-label, .inspector-label {
  font-size: 22rpx;
  color: #999;
}

.time-value, .inspector-value {
  font-size: 22rpx;
  color: #666;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.task-duration {
  font-size: 22rpx;
  color: #999;
}

.task-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  font-size: 24rpx;
  border-radius: 8rpx;
  padding: 8rpx 24rpx;
}

.action-btn.primary {
  background: #1677FF;
  color: #fff;
}

.action-btn.success {
  background: #52C41A;
  color: #fff;
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
