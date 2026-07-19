<template>
  <view class="inspection-exec-page">
    <!-- 站点头部信息 -->
    <view class="station-header">
      <view class="station-name-row">
        <text class="station-name">{{ stationInfo.name }}</text>
        <text class="station-code">{{ stationInfo.code }}</text>
      </view>
      <view class="station-meta">
        <text class="meta-item">📍 {{ stationInfo.address }}</text>
        <text class="meta-item">🔌 {{ stationInfo.deviceCount }} 台设备</text>
      </view>
      <view class="station-meta">
        <text class="meta-item">📋 巡检单号: {{ taskId }}</text>
        <text class="meta-item">📅 {{ stationInfo.planDate }}</text>
      </view>
    </view>

    <!-- GPS / NFC 签到 -->
    <view class="checkin-section">
      <view class="checkin-title">
        <text class="checkin-title-text">签到打卡</text>
      </view>
      <view class="checkin-content">
        <view class="checkin-item">
          <text class="checkin-label">GPS签到</text>
          <view class="checkin-status" :class="{ checked: gpsChecked }">
            <text class="checkin-status-text">{{ gpsChecked ? '已签到 (' + gpsLocation + ')' : '未签到' }}</text>
          </view>
          <button v-if="!gpsChecked" class="checkin-btn" size="mini" @tap="checkinGPS">
            GPS打卡
          </button>
        </view>
        <view class="checkin-item">
          <text class="checkin-label">NFC签到</text>
          <view class="checkin-status" :class="{ checked: nfcChecked }">
            <text class="checkin-status-text">{{ nfcChecked ? '已签到 (NFC-' + nfcTagId + ')' : '未签到' }}</text>
          </view>
          <button v-if="!nfcChecked" class="checkin-btn" size="mini" @tap="checkinNFC">
            NFC打卡
          </button>
        </view>
      </view>
    </view>

    <!-- 设备巡检列表 -->
    <view class="device-section" v-for="device in devices" :key="device.id">
      <view class="device-header">
        <text class="device-name">{{ device.name }}</text>
        <text class="device-status" :class="device.status">{{ deviceStatusLabel[device.status] }}</text>
      </view>
      <view class="device-code-row">
        <text class="device-code">编号: {{ device.code }}</text>
        <text class="device-model">型号: {{ device.model }}</text>
      </view>

      <!-- 分类巡检项 -->
      <view class="category-block" v-for="cat in categories" :key="cat.key">
        <text class="category-title">{{ cat.icon }} {{ cat.label }}</text>
        <view
          class="check-item"
          v-for="item in getDeviceItems(device.id, cat.key)"
          :key="item.id"
        >
          <view class="check-item-top">
            <text class="check-item-name">{{ item.name }}</text>
            <view class="check-item-result">
              <view
                class="result-tag"
                :class="{ active: item.result === 'pass' }"
                @tap="setResult(item, 'pass')"
              >
                <text class="result-tag-text">✓ 通过</text>
              </view>
              <view
                class="result-tag fail"
                :class="{ active: item.result === 'fail' }"
                @tap="setResult(item, 'fail')"
              >
                <text class="result-tag-text">✗ 异常</text>
              </view>
            </view>
          </view>

          <!-- 备注 -->
          <view class="check-item-remark" v-if="item.result === 'fail' || item.remark">
            <textarea
              class="remark-input"
              placeholder="请输入异常描述或备注..."
              v-model="item.remark"
              :maxlength="200"
            />
          </view>

          <!-- 照片上传 -->
          <view class="check-item-photos">
            <view class="photo-list">
              <view class="photo-item" v-for="(photo, idx) in item.photos" :key="idx">
                <image class="photo-thumb" :src="photo" mode="aspectFill" @tap="previewPhoto(item.photos, idx)" />
                <view class="photo-remove" @tap="removePhoto(item, idx)">
                  <text class="photo-remove-text">✕</text>
                </view>
              </view>
              <view
                class="photo-add"
                v-if="item.photos.length < 5"
                @tap="addPhoto(item)"
              >
                <text class="photo-add-icon">📷</text>
                <text class="photo-add-text">拍照</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="btn-draft" @tap="saveDraft" :disabled="saving">
        <text class="btn-text">{{ saving ? '保存中...' : '保存草稿' }}</text>
      </button>
      <button class="btn-submit" @tap="submitInspection" :disabled="saving">
        <text class="btn-text-white">{{ saving ? '提交中...' : '提交巡检' }}</text>
      </button>
    </view>

    <!-- 底部占位 -->
    <view class="bottom-placeholder"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'

interface StationInfo {
  name: string
  code: string
  address: string
  deviceCount: number
  planDate: string
}

interface CheckItem {
  id: string
  deviceId: string
  category: string
  name: string
  result: '' | 'pass' | 'fail'
  remark: string
  photos: string[]
}

interface Device {
  id: string
  name: string
  code: string
  model: string
  status: string
}

const taskId = ref('')
const stationInfo = ref<StationInfo>({
  name: '',
  code: '',
  address: '',
  deviceCount: 0,
  planDate: '',
})
const devices = ref<Device[]>([])
const checkItems = ref<CheckItem[]>([])
const saving = ref(false)
const gpsChecked = ref(false)
const gpsLocation = ref('')
const nfcChecked = ref(false)
const nfcTagId = ref('')

const deviceStatusLabel: Record<string, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
  charging: '充电中',
}

const categories = [
  { key: 'appearance', label: '外观检查', icon: '🔍' },
  { key: 'electrical', label: '电气安全', icon: '⚡' },
  { key: 'functional', label: '功能测试', icon: '🔧' },
  { key: 'exception', label: '异常排查', icon: '⚠️' },
]

function getDeviceItems(deviceId: string, category: string): CheckItem[] {
  return checkItems.value.filter(i => i.deviceId === deviceId && i.category === category)
}

function setResult(item: CheckItem, result: 'pass' | 'fail') {
  item.result = item.result === result ? '' : result
}

function checkinGPS() {
  uni.getLocation({
    type: 'gcj02',
    success: (res) => {
      gpsChecked.value = true
      gpsLocation.value = `${res.latitude.toFixed(6)}, ${res.longitude.toFixed(6)}`
      uni.showToast({ title: 'GPS签到成功', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: 'GPS定位失败，请检查权限', icon: 'none' })
    },
  })
}

function checkinNFC() {
  // #ifdef APP-PLUS
  uni.showToast({ title: '请将手机靠近NFC标签', icon: 'none' })
  // NFC read would be implemented via native plugin
  setTimeout(() => {
    nfcChecked.value = true
    nfcTagId.value = 'A3B2C1'
    uni.showToast({ title: 'NFC签到成功', icon: 'success' })
  }, 1500)
  // #endif
  // #ifndef APP-PLUS
  uni.showToast({ title: 'NFC签到仅在App端可用', icon: 'none' })
  // #endif
}

function addPhoto(item: CheckItem) {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera'],
    success: (res) => {
      item.photos.push(res.tempFilePaths[0])
    },
  })
}

function removePhoto(item: CheckItem, idx: number) {
  item.photos.splice(idx, 1)
}

function previewPhoto(urls: string[], idx: number) {
  uni.previewImage({ urls, current: urls[idx] })
}

function validate(): boolean {
  const unchecked = checkItems.value.filter(i => !i.result)
  if (unchecked.length > 0) {
    uni.showModal({
      title: '提示',
      content: `还有 ${unchecked.length} 项未检查，确定继续吗？`,
      success: () => {},
    })
    return false
  }
  if (!gpsChecked.value && !nfcChecked.value) {
    uni.showToast({ title: '请先完成签到', icon: 'none' })
    return false
  }
  return true
}

async function saveDraft() {
  saving.value = true
  try {
    await api.submitInspectionItems(taskId.value, {
      status: 'draft',
      checkItems: checkItems.value,
      gps: gpsChecked.value ? gpsLocation.value : '',
      nfc: nfcChecked.value ? nfcTagId.value : '',
    })
    uni.showToast({ title: '草稿已保存', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

async function submitInspection() {
  if (!validate()) return
  saving.value = true
  try {
    await api.submitInspectionItems(taskId.value, {
      status: 'submitted',
      checkItems: checkItems.value,
      gps: gpsChecked.value ? gpsLocation.value : '',
      nfc: nfcChecked.value ? nfcTagId.value : '',
    })
    uni.showToast({ title: '巡检已提交', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1200)
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

async function loadDetail() {
  try {
    const data = await api.getInspectionDetail(taskId.value)
    stationInfo.value = data.station
    devices.value = data.devices
    checkItems.value = data.checkItems.map((item: any) => ({
      ...item,
      result: item.result || '',
      remark: item.remark || '',
      photos: item.photos || [],
    }))
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as any
  taskId.value = current?.options?.id || ''
  if (taskId.value) {
    loadDetail()
  }
})
</script>

<style scoped>
.inspection-exec-page {
  background: #F0F2F5;
  min-height: 100vh;
}

.station-header {
  background: #1677FF;
  padding: 24rpx 32rpx;
  color: #fff;
}

.station-name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.station-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.station-code {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.15);
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

.station-meta {
  display: flex;
  gap: 24rpx;
  margin-top: 12rpx;
}

.meta-item {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

.checkin-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.checkin-title {
  margin-bottom: 20rpx;
}

.checkin-title-text {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.checkin-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.checkin-item:last-child {
  border-bottom: none;
}

.checkin-label {
  font-size: 28rpx;
  color: #333;
  width: 140rpx;
}

.checkin-status {
  flex: 1;
}

.checkin-status.checked .checkin-status-text {
  color: #52C41A;
}

.checkin-status-text {
  font-size: 24rpx;
  color: #999;
}

.checkin-btn {
  background: #1677FF;
  color: #fff;
  font-size: 24rpx;
  border: none;
  border-radius: 8rpx;
  padding: 0 24rpx;
  height: 56rpx;
  line-height: 56rpx;
}

.device-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.device-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
}

.device-status.online {
  background: #f6ffed;
  color: #52C41A;
}

.device-status.offline {
  background: #fff7e6;
  color: #FAAD14;
}

.device-status.fault {
  background: #fff2f0;
  color: #FF4D4F;
}

.device-status.charging {
  background: #e6f7ff;
  color: #1677FF;
}

.device-code-row {
  display: flex;
  gap: 24rpx;
  margin-top: 8rpx;
}

.device-code,
.device-model {
  font-size: 24rpx;
  color: #999;
}

.category-block {
  margin-top: 24rpx;
}

.category-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  padding-bottom: 12rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.check-item {
  padding: 16rpx 0;
  border-bottom: 1rpx solid #fafafa;
}

.check-item:last-child {
  border-bottom: none;
}

.check-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.check-item-name {
  font-size: 28rpx;
  color: #333;
  flex: 1;
}

.check-item-result {
  display: flex;
  gap: 12rpx;
}

.result-tag {
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  border: 2rpx solid #d9d9d9;
  background: #fafafa;
}

.result-tag.active {
  border-color: #52C41A;
  background: #f6ffed;
}

.result-tag.fail.active {
  border-color: #FF4D4F;
  background: #fff2f0;
}

.result-tag-text {
  font-size: 24rpx;
  color: #666;
}

.result-tag.active .result-tag-text {
  color: #52C41A;
}

.result-tag.fail.active .result-tag-text {
  color: #FF4D4F;
}

.check-item-remark {
  margin-top: 12rpx;
}

.remark-input {
  width: 100%;
  min-height: 80rpx;
  font-size: 26rpx;
  padding: 12rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  background: #fafafa;
  box-sizing: border-box;
}

.check-item-photos {
  margin-top: 12rpx;
}

.photo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.photo-item {
  position: relative;
  width: 140rpx;
  height: 140rpx;
}

.photo-thumb {
  width: 140rpx;
  height: 140rpx;
  border-radius: 8rpx;
}

.photo-remove {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  width: 36rpx;
  height: 36rpx;
  background: #FF4D4F;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-remove-text {
  font-size: 20rpx;
  color: #fff;
}

.photo-add {
  width: 140rpx;
  height: 140rpx;
  border: 2rpx dashed #d9d9d9;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.photo-add-icon {
  font-size: 40rpx;
}

.photo-add-text {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.btn-draft {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  border: 2rpx solid #1677FF;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text {
  font-size: 30rpx;
  color: #1677FF;
}

.btn-submit {
  flex: 2;
  height: 80rpx;
  border-radius: 12rpx;
  border: none;
  background: #1677FF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text-white {
  font-size: 30rpx;
  color: #fff;
}

.bottom-placeholder {
  height: 140rpx;
}
</style>
