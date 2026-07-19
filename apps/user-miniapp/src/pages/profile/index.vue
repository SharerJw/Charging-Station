<template>
  <view class="profile-page">
    <!-- ==================== 顶部用户信息区 ==================== -->
    <view class="header-area">
      <!-- 右上角设置图标 -->
      <view class="header-settings" @tap="goTo('/pages/settings/index')">
        <text class="iconfont-settings">&#x2699;</text>
      </view>

      <!-- 头像 + 用户信息 -->
      <view class="header-user-row">
        <view class="header-avatar-wrap" @tap="handleChangeAvatar">
          <image
            v-if="userInfo.avatar"
            class="header-avatar-img"
            :src="userInfo.avatar"
            mode="aspectFill"
          />
          <view v-else class="header-avatar-placeholder">
            <text class="avatar-placeholder-text">{{ (userInfo.nickname || '?').charAt(0) }}</text>
          </view>
          <view class="avatar-camera-badge">
            <text class="camera-icon">&#x1F4F7;</text>
          </view>
        </view>

        <view class="header-user-info">
          <!-- 昵称 + 会员标签 -->
          <view class="nickname-row">
            <text class="header-nickname" @tap="handleEditNickname">
              {{ userInfo.nickname || '点击设置昵称' }}
            </text>
            <view class="member-tag" @tap="goTo('/pages/membership/index')">
              <text class="member-tag-text">{{ memberLevel }}</text>
            </view>
          </view>
          <!-- 手机号 -->
          <text class="header-phone" @tap="goTo('/pages/settings/index')">
            {{ maskedPhone }}
          </text>
        </view>
      </view>
    </view>

    <!-- ==================== 数据概览卡片 ==================== -->
    <view class="stats-card">
      <view class="stats-grid">
        <view
          class="stats-item"
          v-for="(stat, idx) in statsItems"
          :key="idx"
          @tap="stat.action"
        >
          <text class="stats-value">{{ stat.value }}</text>
          <text class="stats-label">{{ stat.label }}</text>
        </view>
      </view>
    </view>

    <!-- ==================== 功能列表 ==================== -->
    <view class="menu-card">
      <view
        class="menu-cell"
        v-for="(item, idx) in allMenus"
        :key="idx"
        @tap="item.action ? handleServiceTap(item) : goTo(item.path)"
      >
        <text class="cell-icon">{{ item.icon }}</text>
        <text class="cell-label">{{ item.label }}</text>
        <text class="cell-extra" v-if="item.extra">{{ item.extra }}</text>
        <text class="cell-arrow">&#x203A;</text>
      </view>
    </view>

    <!-- ==================== 退出登录 ==================== -->
    <view class="logout-wrap">
      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>

    <!-- ==================== 底部版本信息 ==================== -->
    <view class="footer-info">
      <text class="footer-version">EV充电平台 v1.0.0</text>
      <text class="footer-hotline" @tap="callService">客服热线: 400-888-8888</text>
    </view>

    <!-- ==================== 编辑昵称弹窗 ==================== -->
    <view class="modal-mask" v-if="showNicknameModal" @click="handleMaskTap">
      <view class="modal-box">
        <text class="modal-title">修改昵称</text>
        <input
          class="modal-input"
          :value="nicknameInput"
          @input="nicknameInput = $event.detail.value"
          placeholder="请输入新昵称"
          maxlength="20"
        />
        <view class="modal-footer">
          <button class="modal-btn cancel" @tap="showNicknameModal = false">取消</button>
          <button class="modal-btn confirm" @tap="confirmNickname">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api, type UserInfo, type UserStats } from '@/api/index'
import { useUserStore } from '@/store/user'

// ==================== Store ====================
const userStore = useUserStore()

// ==================== 状态 ====================

// 优先从 store 读取已缓存的用户信息（登录时已存入），API 返回后覆盖
const userInfo = ref<UserInfo>({
  id: userStore.userInfo.id || '',
  nickname: userStore.userInfo.nickname || '',
  phone: userStore.userInfo.phone || '',
  avatar: userStore.userInfo.avatar || '',
  balance: 0,
  couponCount: 0,
})

const userStats = ref<UserStats>({
  chargeCount: 0, totalEnergy: 0, totalSaved: 0, carbonReduction: 0,
})

const memberLevel = ref('普通会员')
const showNicknameModal = ref(false)
const nicknameInput = ref('')
const statsLoaded = ref(false)

// ==================== 计算属性 ====================

const maskedPhone = computed(() => {
  const p = userInfo.value.phone
  if (!p || p.length < 7) return '未绑定手机'
  return p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

const statsItems = computed(() => {
  if (!statsLoaded.value) {
    return [
      { label: '充电次数', value: '–', action: () => uni.switchTab({ url: '/pages/order/index' }) },
      { label: '总充电量', value: '–', action: () => {} },
      { label: '总节省', value: '–', action: () => goTo('/pages/wallet/index') },
      { label: '碳减排', value: '–', action: () => {} },
    ]
  }
  return [
    {
      label: '充电次数',
      value: String(userStats.value.chargeCount),
      action: () => uni.switchTab({ url: '/pages/order/index' }),
    },
    {
      label: '总充电量',
      value: userStats.value.totalEnergy >= 10000
        ? (userStats.value.totalEnergy / 10000).toFixed(1) + '万kWh'
        : userStats.value.totalEnergy.toFixed(1) + 'kWh',
      action: () => {},
    },
    {
      label: '总节省',
      value: '¥' + userStats.value.totalSaved.toFixed(0),
      action: () => goTo('/pages/wallet/index'),
    },
    {
      label: '碳减排',
      value: userStats.value.carbonReduction.toFixed(1) + 'kg',
      action: () => {},
      suffix: '🌱',
    },
  ]
})

const allMenus = [
  { icon: '📦', label: '我的订单', path: '/pages/order/index' },
  { icon: '💰', label: '我的钱包', path: '/pages/wallet/index' },
  { icon: '⭐', label: '我的评价', path: '' },
  { icon: '📅', label: '我的预约', path: '' },
  { icon: '🎁', label: '邀请好友', path: '' },
  { icon: 'ℹ️', label: '关于我们', action: 'about' },
  { icon: '📜', label: '用户协议', action: 'agreement' },
  { icon: '🔒', label: '隐私政策', action: 'privacy' },
]

// ==================== 生命周期 ====================

onMounted(async () => {
  // 立即加载用户基本信息（头像/昵称/余额），首屏快速渲染
  await loadUserInfo()

  // 统计数据延迟 500ms 加载，避免阻塞首屏
  setTimeout(async () => {
    await loadUserStats()
    statsLoaded.value = true
  }, 500)
})

// ==================== 数据加载 ====================

async function loadUserInfo() {
  try {
    const data = await api.getUserInfo()
    if (data) {
      // 优先使用 store 中登录时存入的手机号（确保显示的是用户登录用的号码）
      const storePhone = userStore.userInfo.phone
      if (storePhone) {
        data.phone = storePhone
      }
      userInfo.value = data
      memberLevel.value = resolveMemberLevel(data)
      // 同步回 store（phone 保持 store 原值不被覆盖）
      userStore.mergeUserInfo({
        id: data.id,
        nickname: data.nickname,
        avatar: data.avatar,
      })
    }
  } catch (e) {
    console.error('加载用户信息失败:', e)
  }
}

async function loadUserStats() {
  try {
    const data = await api.getUserStats()
    if (data) userStats.value = data
  } catch (e) {
    console.error('加载用户统计失败:', e)
  }
}

function resolveMemberLevel(user: UserInfo): string {
  const balance = user.balance
  if (balance >= 1000) return 'SVIP'
  if (balance >= 500) return 'VIP3'
  if (balance >= 200) return 'VIP2'
  if (balance >= 50) return 'VIP1'
  return '普通会员'
}

// ==================== 交互处理 ====================

function goTo(path: string) {
  if (!path) {
    uni.showToast({ title: '功能开发中', icon: 'none' })
    return
  }
  // 判断是否为 tabBar 页面
  const tabPages = ['/pages/index/index', '/pages/map/index', '/pages/order/index', '/pages/profile/index']
  if (tabPages.includes(path)) {
    uni.switchTab({ url: path })
  } else {
    uni.navigateTo({ url: path })
  }
}

let uploading = false

function handleChangeAvatar() {
  if (uploading) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (chooseRes) => {
      const tempPath = chooseRes.tempFilePaths[0]
      uploading = true
      try {
        // 将图片转为 base64 dataURL（不使用 blob URL，避免刷新后失效）
        const base64 = await new Promise<string>((resolve, reject) => {
          uni.getFileSystemManager().readFile({
            filePath: tempPath,
            encoding: 'base64',
            success: (r) => resolve('data:image/jpeg;base64,' + r.data),
            fail: reject,
          })
        })
        // 立即本地预览（base64 dataURL 可持久化）
        userInfo.value.avatar = base64
        // 保存到后端（直连 identity 服务，绕过网关）
        uni.showLoading({ title: '保存中...' })
        await api.updateProfile({ avatar: base64 })
        userStore.mergeUserInfo({ avatar: base64 })
        uni.showToast({ title: '头像已更新', icon: 'success' })
      } catch (e) {
        console.error('头像保存失败:', e)
        uni.showToast({ title: '头像保存失败', icon: 'none' })
      } finally {
        uni.hideLoading()
        uploading = false
      }
    },
  })
}

function handleEditNickname() {
  nicknameInput.value = userInfo.value.nickname || ''
  showNicknameModal.value = true
}

function handleMaskTap(e: any) {
  // 仅点击遮罩层本身时关闭弹窗，点击弹窗内容区域不关闭
  if (e.target === e.currentTarget) {
    showNicknameModal.value = false
  }
}

async function confirmNickname() {
  const name = nicknameInput.value.trim()
  if (!name) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }
  try {
    await api.updateProfile({ nickname: name })
    userInfo.value.nickname = name
    userStore.mergeUserInfo({ nickname: name })
    showNicknameModal.value = false
    uni.showToast({ title: '昵称已更新', icon: 'success' })
  } catch (e) {
    console.error('昵称更新失败:', e)
    // 后端接口不存在时，保留本地修改
    userInfo.value.nickname = name
    userStore.mergeUserInfo({ nickname: name })
    showNicknameModal.value = false
    uni.showToast({ title: '昵称已保存（本地）', icon: 'none' })
  }
}

function callService() {
  uni.makePhoneCall({
    phoneNumber: '4008888888',
    fail: () => {
      uni.showToast({ title: '拨号失败', icon: 'none' })
    },
  })
}

function handleServiceTap(item: { label: string; action: string }) {
  const contentMap: Record<string, { title: string; body: string }> = {
    support: { title: '联系客服', body: '客服电话: 400-888-8888\n服务时间: 9:00 - 21:00' },
    help: { title: '帮助中心', body: '1. 如何扫码充电?\n2. 如何查看充电记录?\n3. 如何申请退款?\n4. 如何联系客服?' },
    feedback: { title: '意见反馈', body: '感谢您的反馈，请发送邮件至\nfeedback@ev-charging.com' },
    about: { title: '关于我们', body: 'EV充电平台 v1.0.0\n致力于为新能源车主提供便捷、高效的充电服务' },
    agreement: { title: '用户协议', body: '欢迎使用EV充电平台。使用本平台即表示您同意遵守用户协议条款...' },
    privacy: { title: '隐私政策', body: '我们重视您的隐私保护。本隐私政策说明了我们如何收集、使用和保护您的个人信息...' },
  }
  const info = contentMap[item.action]
  if (info) {
    uni.showModal({ title: info.title, content: info.body, showCancel: false })
  }
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗?',
    confirmColor: '#FF4D4F',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'success' })
        setTimeout(() => {
          uni.redirectTo({ url: '/pages/login/index' })
        }, 1000)
      }
    },
  })
}
</script>

<style scoped>
/* ==================== 页面基础 ==================== */
.profile-page {
  min-height: 100vh;
  background: #F6F7FB;
  padding-bottom: 40rpx;
}

/* ==================== 顶部用户信息区 ==================== */
.header-area {
  position: relative;
  background: linear-gradient(135deg, #07C160 0%, #06AD56 50%, #059A4C 100%);
  padding: 80rpx 32rpx 80rpx;
  border-radius: 0 0 40rpx 40rpx;
}

.header-settings {
  position: absolute;
  top: 24rpx;
  right: 32rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.iconfont-settings {
  font-size: 44rpx;
  color: rgba(255, 255, 255, 0.85);
}

.header-user-row {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.header-avatar-wrap {
  position: relative;
  width: 128rpx;
  height: 128rpx;
  flex-shrink: 0;
}

.header-avatar-img {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.6);
}

.header-avatar-placeholder {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid rgba(255, 255, 255, 0.6);
}

.avatar-placeholder-text {
  font-size: 52rpx;
  color: #fff;
  font-weight: bold;
}

.avatar-camera-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-icon {
  font-size: 20rpx;
}

.header-user-info {
  flex: 1;
  overflow: hidden;
}

.nickname-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.header-nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  max-width: 320rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-tag {
  background: rgba(255, 255, 255, 0.25);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
  flex-shrink: 0;
}

.member-tag-text {
  font-size: 20rpx;
  color: #fff;
  font-weight: 500;
}

.header-phone {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* ==================== 数据概览卡片 ==================== */
.stats-card {
  margin: -40rpx 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 5;
}

.stats-grid {
  display: flex;
  align-items: stretch;
}

.stats-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  position: relative;
}

.stats-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 8rpx;
  bottom: 8rpx;
  width: 1rpx;
  background: #f0f0f0;
}

.stats-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

.stats-label {
  font-size: 22rpx;
  color: #999;
}

/* ==================== 快捷功能网格 ==================== */
.grid-card {
  margin: 0 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.grid-row {
  display: flex;
  padding: 12rpx 0;
}

.grid-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 0;
}

.grid-icon {
  font-size: 52rpx;
}

.grid-label {
  font-size: 24rpx;
  color: #666;
}

/* ==================== 常用/其他 菜单列表 ==================== */
.menu-card {
  margin: 0 24rpx 24rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.menu-card-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  padding: 28rpx 28rpx 0;
}

.menu-cell {
  display: flex;
  align-items: center;
  padding: 28rpx 28rpx;
  position: relative;
}

.menu-cell:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 80rpx;
  right: 28rpx;
  bottom: 0;
  height: 1rpx;
  background: #f5f5f5;
}

.cell-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
  width: 44rpx;
  text-align: center;
}

.cell-label {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.cell-extra {
  font-size: 24rpx;
  color: #999;
  margin-right: 8rpx;
}

.cell-arrow {
  font-size: 36rpx;
  color: #ccc;
  line-height: 1;
}

/* ==================== 退出登录 ==================== */
.logout-wrap {
  margin: 0 24rpx 24rpx;
}

.logout-btn {
  background: #fff;
  color: #FF4D4F;
  border: 2rpx solid #FF4D4F;
  border-radius: 20rpx;
  font-size: 28rpx;
  line-height: 80rpx;
  height: 80rpx;
}

/* ==================== 底部版本信息 ==================== */
.footer-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 0 40rpx;
}

.footer-version {
  font-size: 22rpx;
  color: #bbb;
}

.footer-hotline {
  font-size: 22rpx;
  color: #07C160;
}

/* ==================== 编辑昵称弹窗 ==================== */
.modal-mask {
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

.modal-box {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  width: 88%;
  max-width: 680rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 32rpx;
}

.modal-input {
  border: 2rpx solid #e8e8e8;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  font-size: 30rpx;
  width: 100%;
  box-sizing: border-box;
  height: 88rpx;
  line-height: 40rpx;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  margin-top: 32rpx;
}

.modal-btn {
  flex: 1;
  border-radius: 12rpx;
  font-size: 28rpx;
  line-height: 72rpx;
  height: 72rpx;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: #07C160;
  color: #fff;
}
</style>
