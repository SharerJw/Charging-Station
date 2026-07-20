<template>
  <view class="remote-control-page">
    <!-- 设备搜索 -->
    <view class="search-bar">
      <input class="search-input" placeholder="输入设备编码/名称搜索" v-model="keyword" @confirm="searchDevice" />
      <view class="search-btn" @tap="searchDevice">
        <text class="search-btn-text">搜索</text>
      </view>
    </view>

    <!-- 设备列表 -->
    <view class="device-list" v-if="!selectedDevice">
      <view
        class="device-card"
        v-for="device in devices"
        :key="device.id"
        @tap="selectDevice(device)"
      >
        <view class="device-header">
          <text class="device-name">{{ device.name }}</text>
          <view class="device-status" :class="device.online ? 'online' : 'offline'">
            {{ device.online ? '在线' : '离线' }}
          </view>
        </view>
        <text class="device-code">编码: {{ device.code }}</text>
        <text class="device-station">站点: {{ device.stationName }}</text>
      </view>
      <view class="empty-state" v-if="devices.length === 0 && !loading">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">请输入关键词搜索设备</text>
      </view>
    </view>

    <!-- 设备详情 & 控制面板 -->
    <view class="control-panel" v-if="selectedDevice">
      <view class="back-row" @tap="selectedDevice = null">
        <text class="back-text">← 返回设备列表</text>
      </view>

      <!-- 设备信息头部 -->
      <view class="device-info-card">
        <view class="device-header">
          <text class="device-name">{{ selectedDevice.name }}</text>
          <view class="device-status" :class="selectedDevice.online ? 'online' : 'offline'">
            {{ selectedDevice.online ? '在线' : '离线' }}
          </view>
        </view>
        <text class="device-code">编码: {{ selectedDevice.code }}</text>
        <text class="device-station">站点: {{ selectedDevice.stationName }}</text>
      </view>

      <!-- 实时参数 -->
      <view class="param-section">
        <text class="section-title">实时参数</text>
        <view class="param-grid">
          <view class="param-item">
            <text class="param-value">{{ realtimeParams.voltage }}<text class="param-unit">V</text></text>
            <text class="param-label">电压</text>
          </view>
          <view class="param-item">
            <text class="param-value">{{ realtimeParams.current }}<text class="param-unit">A</text></text>
            <text class="param-label">电流</text>
          </view>
          <view class="param-item">
            <text class="param-value">{{ realtimeParams.power }}<text class="param-unit">kW</text></text>
            <text class="param-label">功率</text>
          </view>
          <view class="param-item">
            <text class="param-value">{{ realtimeParams.temperature }}<text class="param-unit">°C</text></text>
            <text class="param-label">温度</text>
          </view>
          <view class="param-item">
            <text class="param-value">{{ realtimeParams.soc }}<text class="param-unit">%</text></text>
            <text class="param-label">SOC</text>
          </view>
          <view class="param-item">
            <text class="param-value">{{ realtimeParams.connectorStatus }}</text>
            <text class="param-label">连接器</text>
          </view>
        </view>
      </view>

      <!-- 安全级别控制按钮 -->
      <view class="control-section">
        <text class="section-title">远程控制</text>

        <!-- Level 1: 只读 -->
        <view class="control-group">
          <text class="group-label level1">Level 1 - 只读查询</text>
          <view class="control-btns">
            <button class="ctrl-btn level1-btn" @tap="executeCommand('GetConfiguration')">获取配置</button>
            <button class="ctrl-btn level1-btn" @tap="executeCommand('GetDiagnostics')">诊断信息</button>
            <button class="ctrl-btn level1-btn" @tap="executeCommand('GetLocalListVersion')">授权列表</button>
            <button class="ctrl-btn level1-btn" @tap="executeCommand('GetCompositeSchedule')">充电计划</button>
          </view>
        </view>

        <!-- Level 2: 需要密码确认 -->
        <view class="control-group">
          <text class="group-label level2">Level 2 - 操作控制（需密码确认）</text>
          <view class="control-btns">
            <button class="ctrl-btn level2-btn" @tap="executeCommandWithPassword('UnlockConnector')">解锁连接器</button>
            <button class="ctrl-btn level2-btn" @tap="executeCommandWithPassword('Reset')">重启设备</button>
            <button class="ctrl-btn level2-btn" @tap="executeCommandWithPassword('RemoteStartTransaction')">远程启动充电</button>
            <button class="ctrl-btn level2-btn" @tap="executeCommandWithPassword('RemoteStopTransaction')">远程停止充电</button>
          </view>
        </view>

        <!-- Level 3: 需要审批 -->
        <view class="control-group">
          <text class="group-label level3">Level 3 - 高危操作（需上级审批）</text>
          <view class="control-btns">
            <button class="ctrl-btn level3-btn" @tap="executeCommandWithApproval('UpdateFirmware')">OTA固件更新</button>
            <button class="ctrl-btn level3-btn" @tap="executeCommandWithApproval('Reset')">恢复出厂设置</button>
          </view>
        </view>
      </view>

      <!-- 操作历史 -->
      <view class="history-section">
        <text class="section-title">操作历史</text>
        <view class="history-list">
          <view class="history-item" v-for="record in operationHistory" :key="record.id">
            <view class="history-header">
              <text class="history-action">{{ record.action }}</text>
              <view class="history-status" :class="record.success ? 'success' : 'fail'">
                {{ record.success ? '成功' : '失败' }}
              </view>
            </view>
            <text class="history-detail">{{ record.detail }}</text>
            <view class="history-meta">
              <text class="history-operator">{{ record.operator }}</text>
              <text class="history-time">{{ record.time }}</text>
            </view>
          </view>
          <view class="empty-state" v-if="operationHistory.length === 0">
            <text class="empty-text">暂无操作记录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import type { RemoteDevice as Device, RealtimeParams, OperationRecord } from '@/types'

const keyword = ref('')
const loading = ref(false)
const devices = ref<Device[]>([])
const selectedDevice = ref<Device | null>(null)
const realtimeParams = ref<RealtimeParams>({
  voltage: 0,
  current: 0,
  power: 0,
  temperature: 0,
  soc: 0,
  connectorStatus: '--',
})
const operationHistory = ref<OperationRecord[]>([])
let refreshTimer: ReturnType<typeof setInterval> | null = null

async function searchDevice() {
  if (!keyword.value.trim()) return
  loading.value = true
  try {
    const result = await api.getDeviceControl({ keyword: keyword.value })
    devices.value = result?.list || result || []
  } catch {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function selectDevice(device: Device) {
  selectedDevice.value = device
  await loadDeviceData(device.id)
  startAutoRefresh()
}

async function loadDeviceData(deviceId: string) {
  try {
    const result = await api.getDeviceControl({ deviceId })
    if (result?.params) {
      realtimeParams.value = result.params
    }
    if (result?.history) {
      operationHistory.value = result.history
    }
  } catch {
    console.error('加载设备数据失败')
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    if (selectedDevice.value) {
      loadDeviceData(selectedDevice.value.id)
    }
  }, 5000)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

async function executeCommand(action: string) {
  if (!selectedDevice.value) return
  try {
    await api.executeRemoteCommand({
      deviceId: selectedDevice.value.id,
      action,
      securityLevel: 1,
    })
    uni.showToast({ title: '指令已发送', icon: 'success' })
    loadDeviceData(selectedDevice.value.id)
  } catch {
    uni.showToast({ title: '指令发送失败', icon: 'none' })
  }
}

function executeCommandWithPassword(action: string) {
  if (!selectedDevice.value) return
  uni.showModal({
    title: '安全确认',
    content: `即将执行「${action}」，请输入操作密码`,
    editable: true,
    placeholderText: '请输入操作密码',
    success: async (res) => {
      if (res.confirm) {
        if (!res.content) {
          uni.showToast({ title: '请输入密码', icon: 'none' })
          return
        }
        try {
          await api.executeRemoteCommand({
            deviceId: selectedDevice.value!.id,
            action,
            securityLevel: 2,
            password: res.content,
          })
          uni.showToast({ title: '指令已发送', icon: 'success' })
          loadDeviceData(selectedDevice.value!.id)
        } catch {
          uni.showToast({ title: '指令发送失败', icon: 'none' })
        }
      }
    },
  })
}

function executeCommandWithApproval(action: string) {
  if (!selectedDevice.value) return
  uni.showModal({
    title: '高危操作确认',
    content: `「${action}」属于高危操作，需提交上级审批后执行。是否提交审批申请？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.executeRemoteCommand({
            deviceId: selectedDevice.value!.id,
            action,
            securityLevel: 3,
            requestApproval: true,
          })
          uni.showToast({ title: '审批申请已提交', icon: 'success' })
        } catch {
          uni.showToast({ title: '提交失败', icon: 'none' })
        }
      }
    },
  })
}

onMounted(() => {
  // 预加载最近操作设备
})

function onUnmount() {
  stopAutoRefresh()
}

import { onUnmounted } from 'vue'
onUnmounted(onUnmount)
</script>

<style scoped>
.remote-control-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-input {
  flex: 1;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
}

.search-btn {
  background: #1677FF;
  border-radius: 12rpx;
  padding: 20rpx 32rpx;
  display: flex;
  align-items: center;
}

.search-btn-text {
  color: #fff;
  font-size: 28rpx;
  white-space: nowrap;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.device-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.device-card:active {
  background: #f5f7fa;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.device-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.device-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
}

.device-status.online {
  background: #F6FFED;
  color: #52C41A;
}

.device-status.offline {
  background: #FFF1F0;
  color: #FF4D4F;
}

.device-code {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 4rpx;
}

.device-station {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.back-row {
  margin-bottom: 16rpx;
}

.back-text {
  font-size: 28rpx;
  color: #1677FF;
}

.device-info-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.param-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 16rpx;
}

.param-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.param-item {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 20rpx;
  text-align: center;
}

.param-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #1677FF;
  display: block;
}

.param-unit {
  font-size: 22rpx;
  color: #999;
  font-weight: normal;
}

.param-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.control-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.control-group {
  margin-bottom: 24rpx;
}

.control-group:last-child {
  margin-bottom: 0;
}

.group-label {
  font-size: 24rpx;
  font-weight: bold;
  display: block;
  margin-bottom: 12rpx;
  padding: 8rpx 16rpx;
  border-radius: 4rpx;
}

.group-label.level1 {
  background: #E6F7FF;
  color: #1677FF;
}

.group-label.level2 {
  background: #FFF7E6;
  color: #D48806;
}

.group-label.level3 {
  background: #FFF1F0;
  color: #CF1322;
}

.control-btns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}

.ctrl-btn {
  font-size: 24rpx;
  border-radius: 8rpx;
  padding: 16rpx;
  text-align: center;
}

.level1-btn {
  background: #E6F7FF;
  color: #1677FF;
  border: 2rpx solid #91D5FF;
}

.level2-btn {
  background: #FFF7E6;
  color: #D48806;
  border: 2rpx solid #FFD591;
}

.level3-btn {
  background: #FFF1F0;
  color: #CF1322;
  border: 2rpx solid #FFA39E;
}

.history-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.history-item {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 20rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.history-action {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.history-status {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}

.history-status.success {
  background: #F6FFED;
  color: #52C41A;
}

.history-status.fail {
  background: #FFF1F0;
  color: #FF4D4F;
}

.history-detail {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.history-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.history-operator,
.history-time {
  font-size: 22rpx;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}
</style>
