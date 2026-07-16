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

    <!-- 编辑资料弹窗 -->
    <view class="modal-overlay" v-if="showEditModal" @tap="showEditModal = false">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">编辑资料</text>
        <view class="form-group">
          <text class="form-label">昵称</text>
          <input class="form-input" v-model="editForm.nickname" placeholder="请输入昵称" />
        </view>
        <view class="form-group">
          <text class="form-label">头像</text>
          <input class="form-input" v-model="editForm.avatar" placeholder="输入emoji作为头像" />
        </view>
        <view class="modal-actions">
          <button class="modal-cancel" @tap="showEditModal = false">取消</button>
          <button class="modal-confirm" @tap="saveProfile">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { api, type UserInfo } from '@/api/index'

const userInfo = ref<UserInfo>({
  id: '', nickname: '', phone: '', avatar: '', balance: 0, couponCount: 0,
})
const orderCount = ref(0)
const showEditModal = ref(false)
const editForm = reactive({ nickname: '', avatar: '' })

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
    const user = await api.getUserInfo()
    if (user) userInfo.value = user
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
  try {
    const orders = await api.getOrders()
    const orderList = (orders as any)?.list || orders || []
    orderCount.value = Array.isArray(orderList) ? orderList.length : 0
  } catch (e) {
    orderCount.value = 0
  }
})

function editProfile() {
  editForm.nickname = userInfo.value.nickname
  editForm.avatar = userInfo.value.avatar
  showEditModal.value = true
}

function saveProfile() {
  if (!editForm.nickname.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  userInfo.value.nickname = editForm.nickname
  userInfo.value.avatar = editForm.avatar
  showEditModal.value = false
  uni.showToast({ title: '保存成功', icon: 'success' })
}

function goToWallet() {
  uni.showModal({
    title: '我的钱包',
    content: `当前余额: ¥${userInfo.value.balance.toFixed(2)}`,
    showCancel: false,
  })
}

function goToCoupons() {
  uni.showModal({
    title: '优惠券',
    content: `您有 ${userInfo.value.couponCount} 张优惠券可用`,
    showCancel: false,
  })
}

function handleMenuTap(action: string) {
  switch (action) {
    case 'wallet':
      goToWallet()
      break
    case 'coupons':
      goToCoupons()
      break
    case 'vehicles':
      uni.showModal({
        title: '我的车辆',
        content: '暂未添加车辆，点击确定去添加',
        success: (res) => {
          if (res.confirm) uni.showToast({ title: '添加车辆功能开发中', icon: 'none' })
        },
      })
      break
    case 'favorites':
      uni.showModal({
        title: '收藏站点',
        content: '暂无收藏站点',
        showCancel: false,
      })
      break
    case 'records':
      uni.switchTab({ url: '/pages/order/index' })
      break
    case 'support':
      uni.showModal({
        title: '联系客服',
        content: '客服电话: 400-888-8888\n服务时间: 9:00-21:00',
        showCancel: false,
      })
      break
    case 'help':
      uni.showModal({
        title: '帮助中心',
        content: '1. 如何扫码充电？\n2. 如何查看充电记录？\n3. 如何申请退款？\n4. 如何联系客服？',
        showCancel: false,
      })
      break
    case 'agreement':
      uni.showModal({
        title: '用户协议',
        content: '欢迎使用EV充电平台。使用本平台即表示您同意遵守以下条款...',
        showCancel: false,
      })
      break
    case 'settings':
      uni.showModal({
        title: '设置',
        content: '版本: v1.0.0\n清除缓存: 0KB',
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: '缓存已清除', icon: 'success' })
          }
        },
      })
      break
  }
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
.edit-btn { font-size: 24rpx; color: rgba(255, 255, 255, 0.8); }

.account-section {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.account-item { flex: 1; text-align: center; }
.account-value { font-size: 36rpx; font-weight: bold; color: #333; display: block; }
.account-label { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.account-divider { width: 1rpx; background: #f0f0f0; margin: 8rpx 0; }

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.menu-section { margin-bottom: 24rpx; }
.menu-list { background: #fff; border-radius: 12rpx; overflow: hidden; }

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

/* 编辑弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  width: 80%;
  max-width: 600rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 32rpx;
  text-align: center;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.form-input {
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.modal-cancel {
  flex: 1;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}

.modal-confirm {
  flex: 1;
  background: #07C160;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
}
</style>
