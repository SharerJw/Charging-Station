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
import type { UserProfile, InspectionRecord } from '@/types'

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
    const [profileData, inspectionData, workorders] = await Promise.all([
      api.getUserInfo(),
      api.getInspections({ page: 1, pageSize: 3 }),
      api.getWorkorders({ page: 1, size: 100 }).catch(() => ({ list: [] })),
    ])
    if (profileData) {
      const p = profileData as any
      const workorderList = workorders?.list || workorders || []
      const completed = workorderList.filter((w: any) => w.status === 'completed').length
      userProfile.value = {
        nickname: p.nickname || p.username || '运维工程师',
        role: Array.isArray(p.roles) ? p.roles.join(' / ') : (p.role || '运维工程师'),
        stats: {
          workorders: workorderList.length,
          completionRate: workorderList.length > 0 ? Math.round(completed / workorderList.length * 100) + '%' : '0%',
          rating: 4.8,
          inspections: (inspectionData as any)?.list?.length || (Array.isArray(inspectionData) ? inspectionData.length : 0),
        },
      }
    }
    if (inspectionData) {
      const list = (inspectionData as any)?.list || inspectionData
      recentRecords.value = (Array.isArray(list) ? list : []).slice(0, 3).map((i: any) => ({
        name: i.name || i.stationName || '巡检任务',
        status: i.status || 'pending',
        time: i.planTime || i.createdAt || '',
        result: i.status === 'completed' ? '巡检完成' : (i.status === 'in_progress' ? '巡检中' : '待巡检'),
      }))
    }
  } catch (e) {
    console.error('获取用户信息失败:', e)
  } finally {
    loading.value = false
  }
}

function handleMenuTap(action: string) {
  switch (action) {
    case 'records':
      uni.navigateTo({ url: '/pages/inspection/index' })
      break
    case 'stats':
      uni.showToast({ title: '工作统计功能开发中', icon: 'none' })
      break
    case 'knowledge':
      uni.showToast({ title: '知识库功能开发中', icon: 'none' })
      break
    case 'contact':
      uni.showModal({
        title: '联系管理员',
        content: '联系电话: 400-888-8888\n工作时间: 9:00-18:00',
        showCancel: false,
      })
      break
    case 'settings':
      uni.showToast({ title: '设置功能开发中', icon: 'none' })
      break
  }
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('ops_token')
        uni.showToast({ title: '已退出', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/index' })
        }, 500)
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
