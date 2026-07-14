<template>
  <view class="profile-page">
    <!-- 用户卡片 -->
    <view class="user-card">
      <view class="avatar">{{ userInfo.avatar || '👤' }}</view>
      <view class="user-info">
        <text class="username">{{ userInfo.nickname || '未登录' }}</text>
        <text class="phone">{{ maskPhone(userInfo.phone) }}</text>
      </view>
      <text class="edit-btn" @tap="editProfile">编辑 ›</text>
    </view>

    <!-- 账户信息 -->
    <view class="account-section">
      <view class="account-item" @tap="goToWallet">
        <text class="account-value">¥{{ userInfo.balance.toFixed(2) }}</text>
        <text class="account-label">余额</text>
      </view>
      <view class="account-divider"></view>
      <view class="account-item" @tap="goToCoupons">
        <text class="account-value">{{ userInfo.couponCount }}</text>
        <text class="account-label">优惠券</text>
      </view>
      <view class="account-divider"></view>
      <view class="account-item">
        <text class="account-value">{{ orderCount }}</text>
        <text class="account-label">总订单</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <text class="section-title">我的服务</text>
      <view class="menu-list">
        <view class="menu-item" v-for="(item, index) in menuItems" :key="index" @tap="handleMenuTap(item.action)">
          <text class="menu-icon">{{ item.icon }}</text>
          <text class="menu-label">{{ item.label }}</text>
          <text class="menu-extra" v-if="item.extra">{{ item.extra }}</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 更多服务 -->
    <view class="menu-section">
      <text class="section-title">更多</text>
      <view class="menu-list">
        <view class="menu-item" v-for="(item, index) in moreMenus" :key="index" @tap="handleMenuTap(item.action)">
          <text class="menu-icon">{{ item.icon }}</text>
          <text class="menu-label">{{ item.label }}</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <button class="logout-btn" @tap="handleLogout">退出登录</button>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { mockApi, type UserInfo } from '@/api/mock'

const userInfo = ref<UserInfo>({
  id: '', nickname: '', phone: '', avatar: '', balance: 0, couponCount: 0,
})
const orderCount = ref(0)

const menuItems = [
  { icon: '💰', label: '我的钱包', action: 'wallet', extra: '' },
  { icon: '🎫', label: '优惠券', action: 'coupons', extra: '' },
  { icon: '🚗', label: '我的车辆', action: 'vehicles', extra: '' },
  { icon: '⭐', label: '收藏站点', action: 'favorites', extra: '' },
  { icon: '📋', label: '充电记录', action: 'records', extra: '' },
]

const moreMenus = [
  { icon: '📞', label: '联系客服', action: 'support' },
  { icon: '❓', label: '帮助中心', action: 'help' },
  { icon: '📄', label: '用户协议', action: 'agreement' },
  { icon: '⚙️', label: '设置', action: 'settings' },
]

function maskPhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

onMounted(async () => {
  try {
    const user = await mockApi.getUserInfo()
    userInfo.value = user
    const orders = await mockApi.getOrders()
    orderCount.value = orders.length
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
})

function editProfile() {
  uni.showToast({ title: '编辑资料', icon: 'none' })
}

function goToWallet() {
  uni.showToast({ title: '我的钱包', icon: 'none' })
}

function goToCoupons() {
  uni.showToast({ title: '优惠券', icon: 'none' })
}

function handleMenuTap(action: string) {
  const messages: Record<string, string> = {
    wallet: '我的钱包',
    coupons: '优惠券',
    vehicles: '我的车辆',
    favorites: '收藏站点',
    records: '充电记录',
    support: '联系客服',
    help: '帮助中心',
    agreement: '用户协议',
    settings: '设置',
  }
  uni.showToast({ title: messages[action] || action, icon: 'none' })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.showToast({ title: '已退出登录', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/login/index' })
        }, 1000)
      }
    }
  })
}
</script>

<style scoped>
.profile-page {
  padding: 24rpx;
  background: #F6F7FB;
  min-height: 100vh;
}

.user-card {
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 16rpx;
  padding: 40rpx 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.avatar {
  width: 96rpx;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
}

.user-info { flex: 1; }
.username { font-size: 32rpx; font-weight: bold; color: #fff; display: block; }
.phone { font-size: 24rpx; color: rgba(255, 255, 255, 0.8); margin-top: 8rpx; display: block; }

.edit-btn {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.account-section {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.account-item {
  flex: 1;
  text-align: center;
}

.account-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.account-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.account-divider {
  width: 1rpx;
  background: #f0f0f0;
  margin: 8rpx 0;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.menu-section {
  margin-bottom: 24rpx;
}

.menu-list {
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 36rpx; margin-right: 20rpx; }
.menu-label { flex: 1; font-size: 28rpx; color: #333; }
.menu-extra { font-size: 24rpx; color: #999; margin-right: 8rpx; }
.menu-arrow { font-size: 32rpx; color: #ccc; }

.logout-btn {
  margin-top: 32rpx;
  background: #fff;
  color: #FF4D4F;
  border: 2rpx solid #FF4D4F;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>
