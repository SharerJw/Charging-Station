<template>
  <view class="shift-handover-page">
    <text class="page-title">交接班记录</text>

    <!-- 交班信息 -->
    <view class="form-section">
      <text class="section-title">交班人信息</text>
      <view class="info-row">
        <text class="info-label">交班人:</text>
        <text class="info-value">{{ handoverForm.fromName }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">班次:</text>
        <text class="info-value">{{ handoverForm.shiftName }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">时间:</text>
        <text class="info-value">{{ handoverForm.shiftTime }}</text>
      </view>
    </view>

    <!-- 未完成工单 -->
    <view class="form-section">
      <text class="section-title">未完成工单 ({{ unfinishedOrders.length }})</text>
      <view class="order-list">
        <view class="order-item" v-for="order in unfinishedOrders" :key="order.id">
          <view class="order-header">
            <text class="order-no">{{ order.no }}</text>
            <view class="order-priority" :class="order.priority">{{ order.priority === 'urgent' ? '紧急' : '普通' }}</view>
          </view>
          <text class="order-desc">{{ order.description }}</text>
          <text class="order-progress">进度: {{ order.progress }}</text>
        </view>
        <view class="empty-hint" v-if="unfinishedOrders.length === 0">
          <text class="hint-text">暂无未完成工单</text>
        </view>
      </view>
      <view class="add-row" @tap="addUnfinishedOrder">
        <text class="add-text">+ 手动添加</text>
      </view>
    </view>

    <!-- 设备异常 -->
    <view class="form-section">
      <text class="section-title">设备异常情况</text>
      <view class="abnormal-list">
        <view class="abnormal-item" v-for="(item, idx) in handoverForm.abnormalDevices" :key="idx">
          <view class="abnormal-header">
            <text class="abnormal-device">{{ item.deviceName }}</text>
            <view class="abnormal-status" :class="item.severity">{{ severityLabels[item.severity] }}</view>
          </view>
          <text class="abnormal-desc">{{ item.description }}</text>
        </view>
      </view>
      <textarea
        class="form-textarea"
        placeholder="补充说明设备异常情况..."
        v-model="handoverForm.abnormalNotes"
      />
    </view>

    <!-- 备件盘点 -->
    <view class="form-section">
      <text class="section-title">备件库存盘点</text>
      <view class="spare-parts-count">
        <view class="count-item" v-for="(item, idx) in handoverForm.sparePartsCount" :key="idx">
          <text class="count-name">{{ item.name }}</text>
          <view class="count-input-row">
            <text class="count-label">数量:</text>
            <input
              class="count-input"
              type="number"
              v-model="item.quantity"
              :placeholder="'0'"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 工具检查 -->
    <view class="form-section">
      <text class="section-title">工具检查清单</text>
      <view class="checklist">
        <view class="check-item" v-for="(item, idx) in handoverForm.toolsChecklist" :key="idx">
          <view class="check-box" :class="{ checked: item.checked }" @tap="item.checked = !item.checked">
            <text class="check-icon" v-if="item.checked">✓</text>
          </view>
          <text class="check-label">{{ item.name }}</text>
          <text class="check-status" :class="{ missing: item.missing }">
            {{ item.missing ? '缺失' : (item.checked ? '已确认' : '待确认') }}
          </text>
        </view>
      </view>
    </view>

    <!-- 车辆状态 -->
    <view class="form-section">
      <text class="section-title">工作车辆状态</text>
      <view class="vehicle-status">
        <view class="vehicle-item">
          <text class="vehicle-label">车牌号</text>
          <input class="vehicle-input" v-model="handoverForm.vehiclePlate" placeholder="请输入车牌号" />
        </view>
        <view class="vehicle-item">
          <text class="vehicle-label">里程数(km)</text>
          <input class="vehicle-input" type="number" v-model="handoverForm.vehicleMileage" placeholder="当前里程" />
        </view>
        <view class="vehicle-item">
          <text class="vehicle-label">油量/电量</text>
          <input class="vehicle-input" v-model="handoverForm.vehicleFuel" placeholder="如: 80%" />
        </view>
        <view class="vehicle-item">
          <text class="vehicle-label">车辆状况</text>
          <textarea class="vehicle-textarea" v-model="handoverForm.vehicleCondition" placeholder="描述车辆状况..." />
        </view>
      </view>
    </view>

    <!-- 补充说明 -->
    <view class="form-section">
      <text class="section-title">补充说明</text>
      <textarea
        class="form-textarea"
        placeholder="其他需要交接的事项..."
        v-model="handoverForm.notes"
      />
    </view>

    <!-- 签名区域 -->
    <view class="signature-section">
      <text class="section-title">双方签字确认</text>

      <view class="signature-row">
        <view class="signature-box">
          <text class="sig-label">交班人签字</text>
          <view class="sig-area" :class="{ signed: handoverForm.fromSignature }" @tap="signFor('from')">
            <text class="sig-text" v-if="handoverForm.fromSignature">{{ handoverForm.fromSignature }}</text>
            <text class="sig-placeholder" v-else>点击签字</text>
          </view>
        </view>
        <view class="signature-box">
          <text class="sig-label">接班人签字</text>
          <view class="sig-area" :class="{ signed: handoverForm.toSignature }" @tap="signFor('to')">
            <text class="sig-text" v-if="handoverForm.toSignature">{{ handoverForm.toSignature }}</text>
            <text class="sig-placeholder" v-else>点击签字</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-area">
      <button class="submit-btn" @tap="submitHandover">
        <text class="submit-text">提交交接班记录</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'

interface UnfinishedOrder {
  id: string
  no: string
  description: string
  progress: string
  priority: string
}

interface AbnormalDevice {
  deviceName: string
  description: string
  severity: string
}

interface SparePartCount {
  name: string
  quantity: string
}

interface ToolCheckItem {
  name: string
  checked: boolean
  missing: boolean
}

const unfinishedOrders = ref<UnfinishedOrder[]>([])

const severityLabels: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
}

const handoverForm = reactive({
  fromName: '',
  shiftName: '',
  shiftTime: '',
  abnormalDevices: [] as AbnormalDevice[],
  abnormalNotes: '',
  sparePartsCount: [] as SparePartCount[],
  toolsChecklist: [] as ToolCheckItem[],
  vehiclePlate: '',
  vehicleMileage: '',
  vehicleFuel: '',
  vehicleCondition: '',
  notes: '',
  fromSignature: '',
  toSignature: '',
})

function signFor(who: 'from' | 'to') {
  uni.showModal({
    title: '签字确认',
    content: '请输入您的姓名作为电子签名',
    editable: true,
    placeholderText: '请输入姓名',
    success: (res) => {
      if (res.confirm && res.content) {
        if (who === 'from') {
          handoverForm.fromSignature = res.content
        } else {
          handoverForm.toSignature = res.content
        }
      }
    },
  })
}

function addUnfinishedOrder() {
  uni.showModal({
    title: '添加工单',
    content: '请输入工单编号',
    editable: true,
    placeholderText: '工单编号',
    success: (res) => {
      if (res.confirm && res.content) {
        unfinishedOrders.value.push({
          id: String(Date.now()),
          no: res.content,
          description: '手动添加',
          progress: '待交接',
          priority: 'normal',
        })
      }
    },
  })
}

async function submitHandover() {
  if (!handoverForm.fromSignature) {
    uni.showToast({ title: '请交班人签字', icon: 'none' })
    return
  }
  if (!handoverForm.toSignature) {
    uni.showToast({ title: '请接班人签字', icon: 'none' })
    return
  }
  try {
    await api.submitHandover({
      ...handoverForm,
      unfinishedOrders: unfinishedOrders.value,
    })
    uni.showToast({ title: '交接班记录已提交', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch {
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}

onMounted(async () => {
  // 初始化默认数据
  const now = new Date()
  handoverForm.shiftTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  handoverForm.shiftName = now.getHours() < 14 ? '白班' : '夜班'

  // 加载用户信息
  try {
    const userInfo = await api.getUserInfo()
    handoverForm.fromName = userInfo?.name || '当前用户'
  } catch {
    handoverForm.fromName = '当前用户'
  }

  // 加载默认工具清单
  handoverForm.toolsChecklist = [
    { name: '万用表', checked: false, missing: false },
    { name: '绝缘手套', checked: false, missing: false },
    { name: '螺丝刀套装', checked: false, missing: false },
    { name: '网络测试仪', checked: false, missing: false },
    { name: '对讲机', checked: false, missing: false },
    { name: '安全帽', checked: false, missing: false },
    { name: '工作服', checked: false, missing: false },
  ]

  // 加载默认备件
  handoverForm.sparePartsCount = [
    { name: '充电枪头', quantity: '' },
    { name: '充电线缆', quantity: '' },
    { name: '接触器', quantity: '' },
    { name: '保险丝', quantity: '' },
  ]
})
</script>

<style scoped>
.shift-handover-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
  padding-bottom: 160rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 24rpx;
}

.form-section {
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

.info-row {
  display: flex;
  align-items: center;
  padding: 8rpx 0;
}

.info-label {
  font-size: 26rpx;
  color: #666;
  width: 140rpx;
}

.info-value {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

/* 工单 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.order-item {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 16rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.order-no {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.order-priority {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}

.order-priority.urgent {
  background: #FFF1F0;
  color: #CF1322;
}

.order-priority.normal {
  background: #E6F7FF;
  color: #1677FF;
}

.order-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.order-progress {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.add-row {
  margin-top: 12rpx;
  padding: 16rpx;
  text-align: center;
  border: 2rpx dashed #ccc;
  border-radius: 8rpx;
}

.add-text {
  font-size: 26rpx;
  color: #1677FF;
}

/* 设备异常 */
.abnormal-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.abnormal-item {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 16rpx;
}

.abnormal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4rpx;
}

.abnormal-device {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.abnormal-status {
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 4rpx;
}

.abnormal-status.critical {
  background: #FFF1F0;
  color: #CF1322;
}

.abnormal-status.warning {
  background: #FFF7E6;
  color: #D48806;
}

.abnormal-status.info {
  background: #E6F7FF;
  color: #1677FF;
}

.abnormal-desc {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.form-textarea {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 26rpx;
  width: 100%;
  height: 160rpx;
  box-sizing: border-box;
}

/* 备件盘点 */
.spare-parts-count {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
}

.count-item {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 16rpx;
}

.count-name {
  font-size: 24rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.count-input-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.count-label {
  font-size: 22rpx;
  color: #999;
}

.count-input {
  background: #fff;
  border-radius: 6rpx;
  padding: 8rpx 12rpx;
  font-size: 26rpx;
  width: 120rpx;
  text-align: center;
}

/* 工具检查 */
.checklist {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.check-item:last-child {
  border-bottom: none;
}

.check-box {
  width: 48rpx;
  height: 48rpx;
  border: 2rpx solid #ccc;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-box.checked {
  background: #1677FF;
  border-color: #1677FF;
}

.check-icon {
  color: #fff;
  font-size: 28rpx;
}

.check-label {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.check-status {
  font-size: 22rpx;
  color: #52C41A;
}

.check-status.missing {
  color: #FF4D4F;
}

/* 车辆状态 */
.vehicle-status {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.vehicle-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.vehicle-label {
  font-size: 26rpx;
  color: #666;
  width: 160rpx;
  flex-shrink: 0;
}

.vehicle-input {
  flex: 1;
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 26rpx;
}

.vehicle-textarea {
  flex: 1;
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 16rpx;
  font-size: 26rpx;
  height: 120rpx;
}

/* 签名 */
.signature-section {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.signature-row {
  display: flex;
  gap: 24rpx;
}

.signature-box {
  flex: 1;
}

.sig-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
  text-align: center;
}

.sig-area {
  height: 160rpx;
  border: 2rpx dashed #ccc;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sig-area.signed {
  border-color: #52C41A;
  background: #F6FFED;
}

.sig-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.sig-placeholder {
  font-size: 24rpx;
  color: #ccc;
}

/* 提交 */
.submit-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: #fff;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.submit-btn {
  background: #1677FF;
  border-radius: 12rpx;
  padding: 24rpx;
}

.submit-text {
  color: #fff;
  font-size: 30rpx;
  font-weight: bold;
}

.empty-hint {
  padding: 24rpx;
  text-align: center;
}

.hint-text {
  font-size: 24rpx;
  color: #999;
}
</style>
