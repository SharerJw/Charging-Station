<template>
  <view class="dispatch-page">
    <!-- 顶部标签切换 -->
    <view class="top-tabs">
      <text
        class="top-tab"
        :class="{ active: activeTab === tab.value }"
        v-for="tab in tabs"
        :key="tab.value"
        @tap="activeTab = tab.value"
      >{{ tab.label }}</text>
    </view>

    <!-- 自动派单规则 -->
    <view v-if="activeTab === 'rules'">
      <view class="rule-list">
        <view class="rule-card" v-for="rule in autoRules" :key="rule.id">
          <view class="rule-header">
            <text class="rule-name">{{ rule.name }}</text>
            <view class="rule-switch" :class="{ on: rule.enabled }" @tap="toggleRule(rule)">
              <view class="switch-thumb"></view>
            </view>
          </view>
          <view class="rule-conditions">
            <text class="rule-condition" v-for="(cond, idx) in rule.conditions" :key="idx">
              {{ cond }}
            </text>
          </view>
          <view class="rule-meta">
            <text class="rule-meta-item">触发: {{ rule.triggerCount }} 次</text>
            <text class="rule-meta-item">成功率: {{ rule.successRate }}%</text>
            <text class="rule-meta-item">最近: {{ rule.lastTrigger }}</text>
          </view>
          <view class="rule-assignee">
            <text class="rule-assignee-label">默认指派:</text>
            <text class="rule-assignee-name">{{ rule.assigneeName }}</text>
          </view>
        </view>
      </view>
      <view class="add-rule-bar">
        <button class="add-rule-btn" @tap="addRule">
          <text class="add-rule-btn-text">+ 新增规则</text>
        </button>
      </view>
    </view>

    <!-- 手动派单 -->
    <view v-if="activeTab === 'manual'">
      <!-- 告警信息 (从告警详情页进入时) -->
      <view class="alert-info-card" v-if="alertInfo">
        <view class="alert-info-header">
          <view class="alert-level-tag" :class="alertInfo.level">
            <text class="alert-level-text">{{ alertInfo.level }}</text>
          </view>
          <text class="alert-info-title">{{ alertInfo.title }}</text>
        </view>
        <text class="alert-info-station">{{ alertInfo.stationName }}</text>
        <text class="alert-info-device">{{ alertInfo.deviceName }} ({{ alertInfo.deviceCode }})</text>
      </view>

      <!-- 地图区域 -->
      <view class="map-section">
        <view class="map-placeholder">
          <text class="map-icon">🗺️</text>
          <text class="map-text">地图加载区域</text>
          <text class="map-subtext">显示站点位置及附近运维人员分布</text>
        </view>
      </view>

      <!-- 推荐人员列表 -->
      <view class="personnel-section">
        <text class="section-title">推荐派单人员</text>
        <text class="section-subtitle">综合评分 = 距离30% + 技能匹配40% + 当前工作量30%</text>

        <view class="personnel-list">
          <view
            class="personnel-card"
            :class="{ selected: selectedPersonnel === person.id }"
            v-for="person in recommendedPersonnel"
            :key="person.id"
            @tap="selectPersonnel(person.id)"
          >
            <view class="person-left">
              <view class="person-avatar">
                <text class="avatar-text">{{ person.name.charAt(0) }}</text>
              </view>
              <view class="person-info">
                <view class="person-name-row">
                  <text class="person-name">{{ person.name }}</text>
                  <text class="person-status" :class="person.availability">
                    {{ availLabel[person.availability] }}
                  </text>
                </view>
                <text class="person-title">{{ person.title }}</text>
                <view class="person-skills">
                  <text class="skill-tag" v-for="skill in person.skills" :key="skill">{{ skill }}</text>
                </view>
              </view>
            </view>
            <view class="person-right">
              <view class="score-bar">
                <view class="score-item">
                  <text class="score-label">综合</text>
                  <text class="score-value total">{{ person.totalScore }}</text>
                </view>
                <view class="score-item">
                  <text class="score-label">距离</text>
                  <text class="score-value">{{ person.distanceScore }}</text>
                </view>
                <view class="score-item">
                  <text class="score-label">技能</text>
                  <text class="score-value">{{ person.skillScore }}</text>
                </view>
                <view class="score-item">
                  <text class="score-label">工作量</text>
                  <text class="score-value">{{ person.workloadScore }}</text>
                </view>
              </view>
              <view class="person-distance">
                <text class="distance-value">{{ person.distance }}km</text>
              </view>
              <view class="person-workload">
                <text class="workload-text">当前工单: {{ person.activeOrders }}</text>
              </view>
            </view>
            <view class="select-check" v-if="selectedPersonnel === person.id">
              <text class="check-icon">✓</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 批量派单区域 -->
      <view class="batch-section" v-if="batchAlerts.length > 0">
        <text class="section-title">批量派单</text>
        <view class="batch-alert-list">
          <view class="batch-alert-item" v-for="alert in batchAlerts" :key="alert.id">
            <view class="batch-check" :class="{ checked: alert.selected }" @tap="toggleBatchAlert(alert)">
              <text class="batch-check-text" v-if="alert.selected">✓</text>
            </view>
            <view class="batch-alert-info">
              <view class="batch-alert-level" :class="alert.level">
                <text class="batch-level-text">{{ alert.level }}</text>
              </view>
              <text class="batch-alert-title">{{ alert.title }}</text>
            </view>
            <text class="batch-alert-station">{{ alert.stationName }}</text>
          </view>
        </view>
        <view class="batch-selected-count">
          已选 {{ batchSelectedCount }} / {{ batchAlerts.length }} 条
        </view>
      </view>

      <!-- 派单备注 -->
      <view class="remark-section">
        <text class="section-title">派单备注</text>
        <textarea
          class="remark-input"
          placeholder="请输入派单说明或注意事项..."
          v-model="dispatchRemark"
          :maxlength="500"
        />
      </view>

      <!-- 派单按钮 -->
      <view class="dispatch-bar">
        <button class="dispatch-btn" @tap="confirmDispatch" :disabled="!selectedPersonnel">
          <text class="dispatch-btn-text">
            {{ batchAlerts.length > 0 ? `批量派单 (${batchSelectedCount})` : '确认派单' }}
          </text>
        </button>
      </view>
    </view>

    <!-- 派单历史 -->
    <view v-if="activeTab === 'history'">
      <view class="history-list">
        <view class="history-card" v-for="item in dispatchHistory" :key="item.id">
          <view class="history-header">
            <view class="history-level-tag" :class="item.alertLevel">
              <text class="history-level-text">{{ item.alertLevel }}</text>
            </view>
            <text class="history-time">{{ item.dispatchTime }}</text>
          </view>
          <text class="history-alert-title">{{ item.alertTitle }}</text>
          <view class="history-detail">
            <text class="history-detail-item">指派给: {{ item.assigneeName }}</text>
            <text class="history-detail-item">方式: {{ item.type === 'auto' ? '自动' : '手动' }}</text>
          </view>
          <view class="history-status-bar">
            <text class="history-status" :class="item.status">
              {{ statusLabel[item.status] }}
            </text>
            <text class="history-duration" v-if="item.acceptTime">接受耗时: {{ item.acceptDuration }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-spacer"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'
import type { AutoRule, Personnel, BatchAlert, DispatchRecord } from '@/types'

const activeTab = ref('manual')
const alertId = ref('')
const alertInfo = ref<any>(null)
const selectedPersonnel = ref('')
const dispatchRemark = ref('')

const tabs = [
  { label: '手动派单', value: 'manual' },
  { label: '自动规则', value: 'rules' },
  { label: '派单历史', value: 'history' },
]

const availLabel: Record<string, string> = {
  available: '空闲',
  busy: '忙碌',
  offline: '离线',
}

const statusLabel: Record<string, string> = {
  pending: '待接受',
  accepted: '已接受',
  completed: '已完成',
  rejected: '已拒绝',
}

const autoRules = ref<AutoRule[]>([])
const recommendedPersonnel = ref<Personnel[]>([])
const batchAlerts = ref<BatchAlert[]>([])
const dispatchHistory = ref<DispatchRecord[]>([])

const batchSelectedCount = computed(() => batchAlerts.value.filter(a => a.selected).length)

function toggleRule(rule: AutoRule) {
  rule.enabled = !rule.enabled
}

function selectPersonnel(id: string) {
  selectedPersonnel.value = selectedPersonnel.value === id ? '' : id
}

function toggleBatchAlert(alert: BatchAlert) {
  alert.selected = !alert.selected
}

function addRule() {
  uni.showToast({ title: '新增规则功能开发中', icon: 'none' })
}

async function confirmDispatch() {
  if (!selectedPersonnel.value) {
    uni.showToast({ title: '请选择派单人员', icon: 'none' })
    return
  }

  const person = recommendedPersonnel.value.find(p => p.id === selectedPersonnel.value)
  if (!person) return

  uni.showModal({
    title: '确认派单',
    content: `是否将告警派发给 ${person.name}？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const ids = batchAlerts.value.length > 0
            ? batchAlerts.value.filter(a => a.selected).map(a => a.id)
            : [alertId.value]

          await api.dispatchAlert({
            alertIds: ids,
            assigneeId: selectedPersonnel.value,
            remark: dispatchRemark.value,
          })
          uni.showToast({ title: '派单成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1200)
        } catch (e: any) {
          uni.showToast({ title: e.message || '派单失败', icon: 'none' })
        }
      }
    },
  })
}

async function loadDispatchData() {
  try {
    const data = await api.getDispatchList()
    autoRules.value = data.rules || []
    recommendedPersonnel.value = data.recommendedPersonnel || []
    batchAlerts.value = (data.pendingAlerts || []).map((a: any) => ({ ...a, selected: false }))
    dispatchHistory.value = data.history || []
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1] as any
  alertId.value = current?.options?.alertId || ''
  loadDispatchData()
})
</script>

<style scoped>
.dispatch-page {
  background: #F0F2F5;
  min-height: 100vh;
}

.top-tabs {
  display: flex;
  background: #fff;
  padding: 0 24rpx;
}

.top-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.top-tab.active {
  color: #1677FF;
  font-weight: 600;
}

.top-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: #1677FF;
  border-radius: 2rpx;
}

/* 自动规则 */
.rule-list {
  padding: 20rpx 24rpx;
}

.rule-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.rule-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.rule-switch {
  width: 88rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #d9d9d9;
  padding: 4rpx;
  transition: background 0.3s;
}

.rule-switch.on {
  background: #1677FF;
}

.switch-thumb {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fff;
  transition: margin-left 0.3s;
}

.rule-switch.on .switch-thumb {
  margin-left: 40rpx;
}

.rule-conditions {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.rule-condition {
  font-size: 22rpx;
  color: #1677FF;
  background: #e6f4ff;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.rule-meta {
  display: flex;
  gap: 24rpx;
  margin-bottom: 8rpx;
}

.rule-meta-item {
  font-size: 22rpx;
  color: #999;
}

.rule-assignee {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.rule-assignee-label {
  font-size: 24rpx;
  color: #666;
}

.rule-assignee-name {
  font-size: 24rpx;
  color: #1677FF;
  font-weight: 500;
}

.add-rule-bar {
  padding: 20rpx 24rpx;
}

.add-rule-btn {
  width: 100%;
  height: 80rpx;
  border: 2rpx dashed #1677FF;
  background: #fff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-rule-btn-text {
  font-size: 28rpx;
  color: #1677FF;
}

/* 告警信息卡片 */
.alert-info-card {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.alert-info-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.alert-level-tag {
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
}

.alert-level-tag.P0 {
  background: #fff2f0;
}

.alert-level-tag.P1 {
  background: #fff7e6;
}

.alert-level-tag.P2 {
  background: #fffbe6;
}

.alert-level-tag.P3 {
  background: #e6f4ff;
}

.alert-level-text {
  font-size: 22rpx;
  color: #666;
}

.alert-info-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.alert-info-station,
.alert-info-device {
  font-size: 26rpx;
  color: #666;
  margin-top: 4rpx;
}

/* 地图 */
.map-section {
  margin: 20rpx 24rpx;
}

.map-placeholder {
  height: 300rpx;
  background: #e8ecf0;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.map-icon {
  font-size: 64rpx;
}

.map-text {
  font-size: 28rpx;
  color: #666;
}

.map-subtext {
  font-size: 22rpx;
  color: #999;
}

/* 推荐人员 */
.personnel-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.section-subtitle {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 20rpx;
  display: block;
}

.personnel-card {
  display: flex;
  align-items: flex-start;
  padding: 20rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 12rpx;
  margin-bottom: 12rpx;
  position: relative;
}

.personnel-card.selected {
  border-color: #1677FF;
  background: #f0f7ff;
}

.person-left {
  display: flex;
  gap: 16rpx;
  flex: 1;
}

.person-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #1677FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}

.person-info {
  flex: 1;
}

.person-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 4rpx;
}

.person-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.person-status {
  font-size: 20rpx;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}

.person-status.available {
  background: #f6ffed;
  color: #52C41A;
}

.person-status.busy {
  background: #fff7e6;
  color: #FAAD14;
}

.person-status.offline {
  background: #f5f5f5;
  color: #999;
}

.person-title {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.person-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
}

.skill-tag {
  font-size: 20rpx;
  color: #1677FF;
  background: #e6f4ff;
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}

.person-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6rpx;
  margin-left: 16rpx;
}

.score-bar {
  display: flex;
  gap: 12rpx;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
}

.score-label {
  font-size: 18rpx;
  color: #bbb;
}

.score-value {
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
}

.score-value.total {
  font-size: 28rpx;
  color: #1677FF;
}

.distance-value {
  font-size: 22rpx;
  color: #666;
}

.workload-text {
  font-size: 20rpx;
  color: #999;
}

.select-check {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #1677FF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  font-size: 20rpx;
  color: #fff;
}

/* 批量派单 */
.batch-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.batch-alert-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.batch-check {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #d9d9d9;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.batch-check.checked {
  background: #1677FF;
  border-color: #1677FF;
}

.batch-check-text {
  font-size: 22rpx;
  color: #fff;
}

.batch-alert-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.batch-alert-level {
  padding: 2rpx 10rpx;
  border-radius: 4rpx;
}

.batch-level-text {
  font-size: 20rpx;
  color: #666;
}

.batch-alert-title {
  font-size: 26rpx;
  color: #333;
}

.batch-alert-station {
  font-size: 22rpx;
  color: #999;
}

.batch-selected-count {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
}

/* 备注 */
.remark-section {
  background: #fff;
  margin: 20rpx 24rpx;
  border-radius: 16rpx;
  padding: 28rpx;
}

.remark-input {
  width: 100%;
  min-height: 120rpx;
  font-size: 26rpx;
  padding: 16rpx;
  border: 1rpx solid #e8e8e8;
  border-radius: 10rpx;
  background: #fafafa;
  box-sizing: border-box;
}

/* 派单按钮 */
.dispatch-bar {
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.dispatch-btn {
  width: 100%;
  height: 88rpx;
  background: #1677FF;
  border-radius: 12rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dispatch-btn[disabled] {
  background: #b0c4de;
}

.dispatch-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: 600;
}

/* 派单历史 */
.history-list {
  padding: 20rpx 24rpx;
}

.history-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.history-level-tag {
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.history-level-tag.P0 { background: #fff2f0; }
.history-level-tag.P1 { background: #fff7e6; }
.history-level-tag.P2 { background: #fffbe6; }
.history-level-tag.P3 { background: #e6f4ff; }

.history-level-text {
  font-size: 22rpx;
  color: #666;
}

.history-time {
  font-size: 22rpx;
  color: #bbb;
}

.history-alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.history-detail {
  display: flex;
  gap: 24rpx;
  margin-bottom: 8rpx;
}

.history-detail-item {
  font-size: 24rpx;
  color: #666;
}

.history-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-status {
  font-size: 24rpx;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.history-status.pending {
  background: #fff7e6;
  color: #FAAD14;
}

.history-status.accepted {
  background: #e6f4ff;
  color: #1677FF;
}

.history-status.completed {
  background: #f6ffed;
  color: #52C41A;
}

.history-status.rejected {
  background: #fff2f0;
  color: #FF4D4F;
}

.history-duration {
  font-size: 22rpx;
  color: #999;
}

.bottom-spacer {
  height: 40rpx;
}
</style>
