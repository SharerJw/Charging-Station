<template>
  <view class="settings-page">
    <!-- ====== 1. 账号与安全 ====== -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">🔒</text>
        <text class="section-title">账号与安全</text>
      </view>
      <view class="cell" @tap="goChangePhone">
        <text class="cell-label">修改手机号</text>
        <view class="cell-value-wrap">
          <text class="cell-value">{{ maskedPhone }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
      <view class="cell" @tap="goPrivacyManage">
        <text class="cell-label">隐私管理</text>
        <view class="cell-value-wrap">
          <text class="cell-arrow">›</text>
        </view>
      </view>
      <view class="cell" @tap="goAuthManage">
        <text class="cell-label">授权管理</text>
        <view class="cell-value-wrap">
          <text class="cell-arrow">›</text>
        </view>
      </view>
      <view class="cell cell--danger" @tap="handleDeactivate">
        <text class="cell-label cell-label--danger">账号注销</text>
        <view class="cell-value-wrap">
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- ====== 2. 充电设置 ====== -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">⚡</text>
        <text class="section-title">充电设置</text>
      </view>
      <view class="cell">
        <text class="cell-label">默认充电方式</text>
        <picker :value="chargeModeIndex" :range="chargeModeOptions" @change="onChargeModeChange">
          <view class="cell-value-wrap">
            <text class="cell-value">{{ settings.chargeMode }}</text>
            <text class="cell-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="cell">
        <text class="cell-label">默认支付方式</text>
        <picker :value="payMethodIndex" :range="payMethodOptions" @change="onPayMethodChange">
          <view class="cell-value-wrap">
            <text class="cell-value">{{ settings.payMethod }}</text>
            <text class="cell-arrow">›</text>
          </view>
        </picker>
      </view>
      <view class="cell">
        <text class="cell-label">充电完成提醒</text>
        <switch
          :checked="settings.chargeCompleteNotify"
          color="#07C160"
          @change="onSwitchChange('chargeCompleteNotify', $event)"
        />
      </view>
      <view class="cell">
        <text class="cell-label">低电量提醒</text>
        <switch
          :checked="settings.lowBatteryNotify"
          color="#07C160"
          @change="onSwitchChange('lowBatteryNotify', $event)"
        />
      </view>
      <view class="cell" v-if="settings.lowBatteryNotify">
        <text class="cell-label">低电量阈值</text>
        <view class="cell-value-wrap">
          <slider
            class="threshold-slider"
            :value="settings.lowBatteryThreshold"
            :min="5"
            :max="30"
            :step="5"
            activeColor="#07C160"
            show-value
            @change="onThresholdChange"
          />
          <text class="cell-unit">%</text>
        </view>
      </view>
      <view class="cell">
        <text class="cell-label">即插即充</text>
        <switch
          :checked="settings.plugAndCharge"
          color="#07C160"
          @change="onSwitchChange('plugAndCharge', $event)"
        />
      </view>
    </view>

    <!-- ====== 3. 通知设置 ====== -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">🔔</text>
        <text class="section-title">通知设置</text>
      </view>
      <view class="cell">
        <text class="cell-label">充电通知</text>
        <switch
          :checked="settings.chargeNotify"
          color="#07C160"
          @change="onSwitchChange('chargeNotify', $event)"
        />
      </view>
      <view class="cell">
        <text class="cell-label">营销通知</text>
        <switch
          :checked="settings.marketingNotify"
          color="#07C160"
          @change="onSwitchChange('marketingNotify', $event)"
        />
      </view>
      <view class="cell" @tap="openDndTimePicker">
        <text class="cell-label">免打扰时段</text>
        <view class="cell-value-wrap">
          <text class="cell-value">{{ dndTimeText }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- ====== 4. 显示与外观 ====== -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">🎨</text>
        <text class="section-title">显示与外观</text>
      </view>
      <view class="cell">
        <text class="cell-label">深色模式</text>
        <view class="radio-group">
          <view
            v-for="opt in darkModeOptions"
            :key="opt.value"
            class="radio-tag"
            :class="{ 'radio-tag--active': settings.darkMode === opt.value }"
            @tap="onDarkModeChange(opt.value)"
          >
            <text class="radio-tag-text">{{ opt.label }}</text>
          </view>
        </view>
      </view>
      <view class="cell">
        <text class="cell-label">字体大小</text>
        <view class="radio-group">
          <view
            v-for="opt in fontSizeOptions"
            :key="opt.value"
            class="radio-tag"
            :class="{ 'radio-tag--active': settings.fontSize === opt.value }"
            @tap="onFontSizeChange(opt.value)"
          >
            <text class="radio-tag-text" :style="{ fontSize: opt.size }">{{ opt.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== 5. 地图偏好 ====== -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">🗺️</text>
        <text class="section-title">地图偏好</text>
      </view>
      <view class="cell">
        <text class="cell-label">默认导航地图</text>
        <view class="radio-group">
          <view
            v-for="opt in mapAppOptions"
            :key="opt.value"
            class="radio-tag"
            :class="{ 'radio-tag--active': settings.defaultMap === opt.value }"
            @tap="onMapAppChange(opt.value)"
          >
            <text class="radio-tag-text">{{ opt.label }}</text>
          </view>
        </view>
      </view>
      <view class="cell">
        <text class="cell-label">默认缩放级别</text>
        <view class="cell-value-wrap">
          <slider
            class="threshold-slider"
            :value="settings.mapZoom"
            :min="10"
            :max="18"
            :step="1"
            activeColor="#07C160"
            show-value
            @change="onMapZoomChange"
          />
        </view>
      </view>
    </view>

    <!-- ====== 6. 存储与缓存 ====== -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">💾</text>
        <text class="section-title">存储与缓存</text>
      </view>
      <view class="cell" @tap="handleClearCache">
        <text class="cell-label">清除缓存</text>
        <view class="cell-value-wrap">
          <text class="cell-value">{{ cacheSize }}</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- ====== 7. 关于 ====== -->
    <view class="section">
      <view class="section-header">
        <text class="section-icon">ℹ️</text>
        <text class="section-title">关于</text>
      </view>
      <view class="cell" @tap="checkUpdate">
        <text class="cell-label">版本号</text>
        <view class="cell-value-wrap">
          <text class="cell-value">v{{ appVersion }}</text>
          <text class="cell-hint" v-if="hasUpdate">有新版本</text>
          <text class="cell-arrow">›</text>
        </view>
      </view>
      <view class="cell" @tap="goFeatureIntro">
        <text class="cell-label">功能介绍</text>
        <view class="cell-value-wrap">
          <text class="cell-arrow">›</text>
        </view>
      </view>
      <view class="cell" @tap="goRateApp">
        <text class="cell-label">给个好评</text>
        <view class="cell-value-wrap">
          <text class="cell-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- ====== 8. 底部操作按钮 ====== -->
    <view class="bottom-actions">
      <view class="btn-logout" @tap="handleLogout">
        <text class="btn-logout-text">退出登录</text>
      </view>
      <view class="btn-switch" @tap="handleSwitchAccount">
        <text class="btn-switch-text">切换账号</text>
      </view>
    </view>

    <!-- 底部安全距离 -->
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/api/index'

/* ========== 类型定义 ========== */
interface Settings {
  // 充电设置
  chargeMode: string
  payMethod: string
  chargeCompleteNotify: boolean
  lowBatteryNotify: boolean
  lowBatteryThreshold: number
  plugAndCharge: boolean
  // 通知设置
  chargeNotify: boolean
  marketingNotify: boolean
  dndStart: string
  dndEnd: string
  // 显示外观
  darkMode: 'system' | 'light' | 'dark'
  fontSize: 'small' | 'standard' | 'large'
  // 地图偏好
  defaultMap: 'tencent' | 'amap' | 'baidu'
  mapZoom: number
}

/* ========== 常量 ========== */
const chargeModeOptions = ['充满即停', '按金额充电', '按电量充电']
const chargeModeKeys = ['full', 'amount', 'energy'] as const

const payMethodOptions = ['余额支付', '微信支付', '支付宝']
const payMethodKeys = ['balance', 'wechat', 'alipay'] as const

const darkModeOptions = [
  { label: '跟随系统', value: 'system' as const },
  { label: '浅色', value: 'light' as const },
  { label: '深色', value: 'dark' as const },
]

const fontSizeOptions = [
  { label: '小', value: 'small' as const, size: '24rpx' },
  { label: '标准', value: 'standard' as const, size: '28rpx' },
  { label: '大', value: 'large' as const, size: '32rpx' },
]

const mapAppOptions = [
  { label: '腾讯地图', value: 'tencent' as const },
  { label: '高德地图', value: 'amap' as const },
  { label: '百度地图', value: 'baidu' as const },
]

/* ========== 状态 ========== */
const appVersion = ref('1.0.0')
const cacheSize = ref('0 KB')
const phone = ref('')
const hasUpdate = ref(false)

const settings = reactive<Settings>({
  chargeMode: '充满即停',
  payMethod: '余额支付',
  chargeCompleteNotify: true,
  lowBatteryNotify: true,
  lowBatteryThreshold: 20,
  plugAndCharge: false,
  chargeNotify: true,
  marketingNotify: false,
  dndStart: '22:00',
  dndEnd: '07:00',
  darkMode: 'system',
  fontSize: 'standard',
  defaultMap: 'tencent',
  mapZoom: 14,
})

/* ========== 计算属性 ========== */
const maskedPhone = computed(() => {
  if (phone.value.length >= 11) {
    return phone.value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
  return phone.value || '未绑定'
})

const chargeModeIndex = computed(() => chargeModeOptions.indexOf(settings.chargeMode))
const payMethodIndex = computed(() => payMethodOptions.indexOf(settings.payMethod))

const dndTimeText = computed(() => {
  if (!settings.dndStart && !settings.dndEnd) return '未设置'
  return `${settings.dndStart} - ${settings.dndEnd}`
})

/* ========== 数据加载 ========== */
async function loadSettings() {
  try {
    const [settingsData, user] = await Promise.all([
      api.getSettings(),
      api.getUserInfo(),
    ])
    if (settingsData) {
      // 后端 key 到本地 key 的映射
      const mapped: Partial<Settings> = {
        chargeMode: chargeModeKeys.includes(settingsData.chargeMode) ? chargeModeOptions[chargeModeKeys.indexOf(settingsData.chargeMode)] : settingsData.chargeMode || settings.chargeMode,
        payMethod: payMethodKeys.includes(settingsData.payMethod) ? payMethodOptions[payMethodKeys.indexOf(settingsData.payMethod)] : settingsData.payMethod || settings.payMethod,
        chargeCompleteNotify: settingsData.chargeCompleteNotify ?? settingsData.notifyChargeComplete ?? settings.chargeCompleteNotify,
        lowBatteryNotify: settingsData.lowBatteryNotify ?? settings.lowBatteryNotify,
        lowBatteryThreshold: settingsData.lowBatteryThreshold ?? settings.lowBatteryThreshold,
        plugAndCharge: settingsData.plugAndCharge ?? settings.plugAndCharge,
        chargeNotify: settingsData.chargeNotify ?? settings.chargeNotify,
        marketingNotify: settingsData.marketingNotify ?? settingsData.notifyMarketing ?? settings.marketingNotify,
        dndStart: settingsData.dndStart ?? settings.dndStart,
        dndEnd: settingsData.dndEnd ?? settings.dndEnd,
        darkMode: settingsData.darkMode ?? settings.darkMode,
        fontSize: settingsData.fontSize ?? settings.fontSize,
        defaultMap: settingsData.defaultMap ?? settings.defaultMap,
        mapZoom: settingsData.mapZoom ?? settings.mapZoom,
      }
      Object.assign(settings, mapped)
    }
    phone.value = user.phone
  } catch (error) {
    uni.showToast({ title: '加载设置失败', icon: 'none' })
  }
}

function getCacheSize() {
  try {
    const info = uni.getStorageInfoSync()
    const sizeKB = info.currentSize || 0
    cacheSize.value = sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
  } catch {
    cacheSize.value = '0 KB'
  }
}

/* ========== 保存 ========== */
async function saveSettings(patch: Partial<Settings>) {
  try {
    Object.assign(settings, patch)
    await api.updateSettings(settings)
  } catch {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

/* ========== 事件处理 ========== */

// 充电设置
function onChargeModeChange(e: any) {
  const idx = Number(e.detail.value)
  saveSettings({ chargeMode: chargeModeOptions[idx] })
}

function onPayMethodChange(e: any) {
  const idx = Number(e.detail.value)
  saveSettings({ payMethod: payMethodOptions[idx] })
}

function onSwitchChange(key: keyof Settings, e: any) {
  saveSettings({ [key]: e.detail.value } as Partial<Settings>)
}

function onThresholdChange(e: any) {
  saveSettings({ lowBatteryThreshold: e.detail.value })
}

// 通知 - 免打扰
function openDndTimePicker() {
  // 先选开始时间
  uni.showActionSheet({
    itemList: ['设置开始时间', '设置结束时间', '关闭免打扰'],
    success(res) {
      if (res.tapIndex === 0) {
        pickTime('dndStart')
      } else if (res.tapIndex === 1) {
        pickTime('dndEnd')
      } else {
        saveSettings({ dndStart: '', dndEnd: '' })
      }
    },
  })
}

function pickTime(field: 'dndStart' | 'dndEnd') {
  // 使用平台原生时间选择（通过 page 模式）
  // 兼容：直接用 picker mode=time
  uni.showToast({ title: '请使用页面内时间选择器', icon: 'none' })
}

// 深色模式
function onDarkModeChange(value: 'system' | 'light' | 'dark') {
  saveSettings({ darkMode: value })
  applyDarkMode(value)
}

function applyDarkMode(mode: string) {
  if (mode === 'system') {
    uni.getSystemInfo({
      success(info) {
        // #ifdef MP-WEIXIN
        const isDark = (info as any).theme === 'dark'
        uni.setNavigationBarColor({
          frontColor: isDark ? '#ffffff' : '#000000',
          backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
        })
        // #endif
      },
    })
  } else {
    const isDark = mode === 'dark'
    uni.setNavigationBarColor({
      frontColor: isDark ? '#ffffff' : '#000000',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    })
  }
}

// 字体大小
function onFontSizeChange(value: 'small' | 'standard' | 'large') {
  saveSettings({ fontSize: value })
}

// 地图偏好
function onMapAppChange(value: 'tencent' | 'amap' | 'baidu') {
  saveSettings({ defaultMap: value })
}

function onMapZoomChange(e: any) {
  saveSettings({ mapZoom: e.detail.value })
}

/* ========== 页面跳转 ========== */

function goChangePhone() {
  // 需要先验证原手机号
  uni.showModal({
    title: '验证手机号',
    content: `将向 ${maskedPhone.value} 发送验证码，是否继续？`,
    confirmColor: '#07C160',
    success(res) {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/settings/change-phone' })
      }
    },
  })
}

function goPrivacyManage() {
  uni.navigateTo({ url: '/pages/settings/privacy' })
}

function goAuthManage() {
  uni.navigateTo({ url: '/pages/settings/authorization' })
}

function goFeatureIntro() {
  uni.navigateTo({ url: '/pages/settings/about' })
}

function goRateApp() {
  // #ifdef MP-WEIXIN
  uni.openSetting && uni.showToast({ title: '感谢您的支持！', icon: 'none' })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '感谢您的支持！', icon: 'none' })
  // #endif
}

/* ========== 账号注销 ========== */

function handleDeactivate() {
  uni.showModal({
    title: '⚠️ 账号注销',
    content: '注销账号将清除所有数据且无法恢复，需满足以下条件：\n\n1. 无进行中的充电订单\n2. 钱包余额为0\n3. 无未使用的优惠券\n\n确认要继续吗？',
    confirmText: '确认注销',
    confirmColor: '#FF4D4F',
    cancelText: '再想想',
    success(res) {
      if (res.confirm) {
        // 二次确认
        uni.showModal({
          title: '最后确认',
          content: '此操作不可逆，请输入"确认注销"以完成操作。',
          editable: true,
          placeholderText: '请输入：确认注销',
          confirmColor: '#FF4D4F',
          success(res2) {
            if (res2.confirm) {
              const input = (res2 as any).content
              if (input === '确认注销') {
                performDeactivate()
              } else {
                uni.showToast({ title: '输入不匹配，已取消', icon: 'none' })
              }
            }
          },
        })
      }
    },
  })
}

async function performDeactivate() {
  try {
    await api.updateSettings({ action: 'deactivate' })
    uni.showToast({ title: '账号已注销', icon: 'success' })
    setTimeout(() => {
      uni.clearStorageSync()
      uni.reLaunch({ url: '/pages/login/index' })
    }, 1500)
  } catch {
    uni.showToast({ title: '注销失败，请联系客服', icon: 'none' })
  }
}

/* ========== 缓存清理 ========== */

function handleClearCache() {
  uni.showModal({
    title: '清除缓存',
    content: `当前缓存 ${cacheSize.value}，清除后需重新加载数据，确认清除？`,
    confirmColor: '#07C160',
    success(res) {
      if (res.confirm) {
        // 保留登录 token，清除其他缓存
        const token = uni.getStorageSync('token')
        const userInfo = uni.getStorageSync('userInfo')
        uni.clearStorageSync()
        if (token) uni.setStorageSync('token', token)
        if (userInfo) uni.setStorageSync('userInfo', userInfo)
        cacheSize.value = '0 KB'
        uni.showToast({ title: '缓存已清除', icon: 'success' })
      }
    },
  })
}

/* ========== 版本检查 ========== */

function checkUpdate() {
  // #ifdef MP-WEIXIN
  const updateManager = uni.getUpdateManager()
  updateManager.onCheckForUpdate((res) => {
    if (res.hasUpdate) {
      hasUpdate.value = true
      updateManager.onUpdateReady(() => {
        uni.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          confirmColor: '#07C160',
          success(modalRes) {
            if (modalRes.confirm) {
              updateManager.applyUpdate()
            }
          },
        })
      })
      updateManager.onUpdateFailed(() => {
        uni.showToast({ title: '更新失败，请稍后重试', icon: 'none' })
      })
    } else {
      uni.showToast({ title: '已是最新版本', icon: 'success' })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '已是最新版本', icon: 'success' })
  // #endif
}

/* ========== 退出 / 切换账号 ========== */

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后将清除本地登录状态，需要重新登录。',
    confirmText: '退出登录',
    confirmColor: '#FF4D4F',
    success(res) {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        uni.reLaunch({ url: '/pages/login/index' })
      }
    },
  })
}

function handleSwitchAccount() {
  uni.showModal({
    title: '切换账号',
    content: '当前账号将退出登录，是否继续？',
    confirmColor: '#07C160',
    success(res) {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        uni.reLaunch({ url: '/pages/login/index?switchAccount=1' })
      }
    },
  })
}

/* ========== 生命周期 ========== */

onMounted(() => {
  loadSettings()
  getCacheSize()
})
</script>

<style scoped>
.settings-page {
  background: #f6f7fb;
  min-height: 100vh;
  padding: 24rpx 24rpx 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* ========== 分组卡片 ========== */
.section {
  background: #ffffff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  padding: 0 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 28rpx 0 12rpx;
  gap: 10rpx;
}

.section-icon {
  font-size: 28rpx;
}

.section-title {
  font-size: 26rpx;
  color: #999999;
  font-weight: 500;
}

/* ========== Cell 行 ========== */
.cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 96rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
}

.cell:last-child {
  border-bottom: none;
}

.cell:active {
  background: #f8f8f8;
}

.cell--danger {
  /* 注销行，无需特殊背景，仅文字标红 */
}

.cell-label {
  font-size: 30rpx;
  color: #333333;
  flex-shrink: 0;
}

.cell-label--danger {
  color: #ff4d4f;
}

.cell-value-wrap {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.cell-value {
  font-size: 28rpx;
  color: #999999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-hint {
  font-size: 22rpx;
  color: #ff4d4f;
  background: #fff1f0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 8rpx;
}

.cell-arrow {
  font-size: 36rpx;
  color: #cccccc;
  line-height: 1;
  flex-shrink: 0;
}

.cell-unit {
  font-size: 26rpx;
  color: #999999;
  flex-shrink: 0;
}

/* ========== 单选标签组 ========== */
.radio-group {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
}

.radio-tag {
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  transition: all 0.2s;
}

.radio-tag--active {
  background: #e8f8ee;
  border: 1rpx solid #07c160;
}

.radio-tag--active .radio-tag-text {
  color: #07c160;
  font-weight: 500;
}

.radio-tag-text {
  font-size: 24rpx;
  color: #666666;
  white-space: nowrap;
}

/* ========== Slider ========== */
.threshold-slider {
  width: 240rpx;
}

/* ========== 底部按钮 ========== */
.bottom-actions {
  margin-top: 32rpx;
  padding: 0 8rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.btn-logout {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 0;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.btn-logout:active {
  background: #fff1f0;
}

.btn-logout-text {
  font-size: 32rpx;
  color: #ff4d4f;
  font-weight: 600;
}

.btn-switch {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 0;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.btn-switch:active {
  background: #f0f0f0;
}

.btn-switch-text {
  font-size: 30rpx;
  color: #666666;
}

.safe-bottom {
  height: 40rpx;
}
</style>
