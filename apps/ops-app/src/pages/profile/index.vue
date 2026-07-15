<template>
  <view class="profile-page">
    <!-- 用户卡片 -->
    <view class="user-card">
      <view class="avatar">👷</view>
      <view class="user-info">
        <text class="username">{{ userProfile.nickname || '加载中...' }}</text>
        <text class="role">{{ userProfile.role }}</text>
      </view>
    </view>

    <!-- 工作统计 -->
    <view class="stats-section">
      <text class="section-title">本月工作统计</text>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ userProfile.stats.workorders }}</text>
          <text class="stat-label">处理工单</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userProfile.stats.completionRate }}</text>
          <text class="stat-label">完成率</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userProfile.stats.rating }}</text>
          <text class="stat-label">评分</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userProfile.stats.inspections }}</text>
          <text class="stat-label">巡检任务</text>
        </view>
      </view>
    </view>

    <!-- 最近巡检记录 -->
    <view class="section">
      <text class="section-title">最近巡检记录</text>
      <view class="record-list">
        <view class="record-item" v-for="(record, index) in recentRecords" :key="index">
          <view class="record-header">
            <text class="record-name">{{ record.name }}</text>
            <text class="record-status" :class="record.status">{{ record.status === 'completed' ? '已完成' : '进行中' }}</text>
          </view>
          <text class="record-time">{{ record.time }}</text>
          <text class="record-result">{{ record.result }}</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list">
      <view class="menu-item" v-for="(item, index) in menuItems" :key="index" @tap="handleMenuTap(item.action)">
        <text class="menu-icon">{{ item.icon }}</text>
        <text class="menu-label">{{ item.label }}</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <button class="logout-btn" @tap="handleLogout">退出登录</button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/index'

interface UserProfile {
  nickname: string
  role: string
  stats: {
    workorders: number
    completionRate: string
    rating: number
    inspections: number
  }
}

interface InspectionRecord {
  name: string
  status: string
  time: string
  result: string
}

const userProfile = ref<UserProfile>({
  nickname: '',
  role: '',
  stats: { workorders: 0, completionRate: '0%', rating: 0, inspections: 0 },
})
const recentRecords = ref<InspectionRecord[]>([])
const loading = ref(false)

const menuItems = [
  { icon: '📊', label: '工作统计', action: 'stats' },
  { icon: '📝', label: '巡检记录', action: 'records' },
  { icon: '📚', label: '知识库', action: 'knowledge' },
  { icon: '📞', label: '联系管理员', action: 'contact' },
  { icon: '⚙️', label: '设置', action: 'settings' },
]

async function loadProfile() {
  loading.value = true
  try {
    const [profileData, inspectionData] = await Promise.all([
      api.getUserInfo(),
      api.getInspections({ page: 1, pageSize: 3 }),
    ])
    if (profileData) {
      userProfile.value = profileData as any
    }
    if (inspectionData) {
      const list = (inspectionData as any)?.list || inspectionData
      recentRecords.value = (Array.isArray(list) ? list : []).slice(0, 3)
    }
  } catch (e) {
    console.error('获取用户信息失败:', e)
  } finally {
    loading.value = false
  }
}

function handleMenuTap(action: string) {
  uni.showToast({ title: action, icon: 'none' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('ops_token')
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page { padding: 24rpx; background: #F0F2F5; min-height: 100vh; }
.user-card { background: linear-gradient(135deg, #1677FF, #0958D9); border-radius: 16rpx; padding: 40rpx 32rpx; display: flex; align-items: center; gap: 24rpx; margin-bottom: 24rpx; }
.avatar { width: 96rpx; height: 96rpx; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48rpx; }
.user-info { flex: 1; }
.username { font-size: 32rpx; font-weight: bold; color: #fff; display: block; }
.role { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; display: block; }

.stats-section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; }
.stat-item { text-align: center; }
.stat-value { font-size: 32rpx; font-weight: bold; color: #1677FF; display: block; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }

.section { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 24rpx; }
.record-list { display: flex; flex-direction: column; gap: 16rpx; }
.record-item { padding: 16rpx; background: #fafafa; border-radius: 8rpx; }
.record-header { display: flex; justify-content: space-between; align-items: center; }
.record-name { font-size: 26rpx; color: #333; font-weight: bold; }
.record-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 4rpx; }
.record-status.completed { background: #F6FFED; color: #52C41A; }
.record-status.in_progress { background: #E6F7FF; color: #1677FF; }
.record-time { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.record-result { font-size: 24rpx; color: #666; margin-top: 4rpx; display: block; }

.menu-list { background: #fff; border-radius: 12rpx; overflow: hidden; margin-bottom: 24rpx; }
.menu-item { display: flex; align-items: center; padding: 28rpx 24rpx; border-bottom: 1rpx solid #f5f5f5; }
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 36rpx; margin-right: 20rpx; }
.menu-label { flex: 1; font-size: 28rpx; color: #333; }
.menu-arrow { font-size: 32rpx; color: #ccc; }

.logout-btn { background: #fff; color: #FF4D4F; border: 2rpx solid #FF4D4F; border-radius: 12rpx; font-size: 28rpx; }
</style>
