<template>
  <view class="spare-parts-page">
    <!-- 顶部操作栏 -->
    <view class="top-bar">
      <view class="search-bar">
        <input class="search-input" placeholder="搜索备件编码/名称" v-model="keyword" @confirm="loadParts" />
        <view class="search-btn" @tap="loadParts">
          <text class="search-btn-text">搜索</text>
        </view>
      </view>
      <button class="request-btn" @tap="showRequestModal = true">
        <text class="request-btn-text">+ 申请备件</text>
      </button>
    </view>

    <!-- 标签切换 -->
    <view class="tabs">
      <text
        v-for="tab in tabs"
        :key="tab.value"
        class="tab"
        :class="{ active: currentTab === tab.value }"
        @tap="switchTab(tab.value)"
      >{{ tab.label }}</text>
    </view>

    <!-- 低库存提醒 -->
    <view class="low-stock-alert" v-if="lowStockCount > 0 && currentTab === 'inventory'">
      <text class="alert-icon">⚠️</text>
      <text class="alert-text">{{ lowStockCount }} 项备件库存不足</text>
    </view>

    <!-- 库存列表 -->
    <view class="parts-list" v-if="currentTab === 'inventory'">
      <view class="part-card" v-for="part in parts" :key="part.id">
        <view class="part-header">
          <text class="part-name">{{ part.name }}</text>
          <view class="stock-badge" :class="{ low: part.quantity <= part.minQuantity }">
            {{ part.quantity <= part.minQuantity ? '库存不足' : '正常' }}
          </view>
        </view>
        <text class="part-code">编码: {{ part.code }}</text>
        <text class="part-spec">规格: {{ part.spec }}</text>
        <view class="part-footer">
          <view class="quantity-info">
            <text class="quantity-value">{{ part.quantity }}</text>
            <text class="quantity-label">/{{ part.minQuantity }} (库存/最低)</text>
          </view>
          <text class="part-location">位置: {{ part.location }}</text>
        </view>
      </view>
    </view>

    <!-- 消耗历史 -->
    <view class="history-list" v-if="currentTab === 'history'">
      <view class="history-card" v-for="record in consumptionHistory" :key="record.id">
        <view class="history-header">
          <text class="history-name">{{ record.partName }}</text>
          <text class="history-quantity" :class="{ returned: record.type === 'return' }">
            {{ record.type === 'consume' ? '-' : '+' }}{{ record.quantity }}
          </text>
        </view>
        <text class="history-spec">{{ record.spec }}</text>
        <view class="history-footer">
          <text class="history-workorder">关联工单: {{ record.workorderNo || '--' }}</text>
          <text class="history-time">{{ record.time }}</text>
        </view>
      </view>
      <view class="empty-state" v-if="consumptionHistory.length === 0">
        <text class="empty-icon">📦</text>
        <text class="empty-text">暂无消耗记录</text>
      </view>
    </view>

    <!-- 申请记录 -->
    <view class="request-list" v-if="currentTab === 'requests'">
      <view class="request-card" v-for="req in requestRecords" :key="req.id">
        <view class="request-header">
          <text class="request-name">{{ req.partName }} x{{ req.quantity }}</text>
          <view class="request-status" :class="req.status">
            {{ requestStatusLabels[req.status] }}
          </view>
        </view>
        <text class="request-reason">原因: {{ req.reason }}</text>
        <text class="request-time">{{ req.time }}</text>
      </view>
      <view class="empty-state" v-if="requestRecords.length === 0">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无申请记录</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="currentTab === 'inventory' && parts.length === 0 && !loading">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无备件数据</text>
    </view>

    <!-- 申请备件弹窗 -->
    <view class="modal-mask" v-if="showRequestModal" @tap="showRequestModal = false">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">申请备件</text>
        <view class="form-item">
          <text class="form-label">备件名称</text>
          <input class="form-input" placeholder="请输入备件名称" v-model="requestForm.partName" />
        </view>
        <view class="form-item">
          <text class="form-label">备件编码</text>
          <input class="form-input" placeholder="请输入备件编码" v-model="requestForm.partCode" />
        </view>
        <view class="form-item">
          <text class="form-label">申请数量</text>
          <input class="form-input" type="number" placeholder="请输入数量" v-model="requestForm.quantity" />
        </view>
        <view class="form-item">
          <text class="form-label">申请原因</text>
          <textarea class="form-textarea" placeholder="请输入申请原因" v-model="requestForm.reason" />
        </view>
        <view class="modal-btns">
          <button class="modal-btn cancel" @tap="showRequestModal = false">取消</button>
          <button class="modal-btn confirm" @tap="submitRequest">提交申请</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/api'

interface SparePart {
  id: string
  code: string
  name: string
  spec: string
  quantity: number
  minQuantity: number
  location: string
}

interface ConsumptionRecord {
  id: string
  partName: string
  spec: string
  quantity: number
  type: 'consume' | 'return'
  workorderNo: string
  time: string
}

interface RequestRecord {
  id: string
  partName: string
  quantity: number
  reason: string
  status: string
  time: string
}

const keyword = ref('')
const loading = ref(false)
const currentTab = ref('inventory')
const showRequestModal = ref(false)
const parts = ref<SparePart[]>([])
const consumptionHistory = ref<ConsumptionRecord[]>([])
const requestRecords = ref<RequestRecord[]>([])

const tabs = [
  { label: '我的库存', value: 'inventory' },
  { label: '消耗历史', value: 'history' },
  { label: '申请记录', value: 'requests' },
]

const requestStatusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
  received: '已到货',
}

const requestForm = ref({
  partName: '',
  partCode: '',
  quantity: '',
  reason: '',
})

const lowStockCount = computed(() => parts.value.filter(p => p.quantity <= p.minQuantity).length)

function switchTab(tab: string) {
  currentTab.value = tab
  if (tab === 'inventory') loadParts()
  else if (tab === 'history') loadHistory()
  else if (tab === 'requests') loadRequests()
}

async function loadParts() {
  loading.value = true
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    const result = await api.getSpareParts(params)
    parts.value = result?.list || result || []
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadHistory() {
  try {
    const result = await api.getSpareParts({ type: 'history' })
    consumptionHistory.value = result?.list || result || []
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function loadRequests() {
  try {
    const result = await api.getSpareParts({ type: 'requests' })
    requestRecords.value = result?.list || result || []
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

async function submitRequest() {
  if (!requestForm.value.partName.trim()) {
    uni.showToast({ title: '请输入备件名称', icon: 'none' })
    return
  }
  if (!requestForm.value.quantity || Number(requestForm.value.quantity) <= 0) {
    uni.showToast({ title: '请输入有效数量', icon: 'none' })
    return
  }
  try {
    await api.requestSparePart({
      partName: requestForm.value.partName,
      partCode: requestForm.value.partCode,
      quantity: Number(requestForm.value.quantity),
      reason: requestForm.value.reason,
    })
    uni.showToast({ title: '申请已提交', icon: 'success' })
    showRequestModal.value = false
    requestForm.value = { partName: '', partCode: '', quantity: '', reason: '' }
    loadRequests()
  } catch {
    uni.showToast({ title: '提交失败', icon: 'none' })
  }
}

onMounted(() => {
  loadParts()
})
</script>

<style scoped>
.spare-parts-page {
  padding: 24rpx;
  background: #F0F2F5;
  min-height: 100vh;
}

.top-bar {
  margin-bottom: 24rpx;
}

.search-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
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

.request-btn {
  background: #1677FF;
  border-radius: 12rpx;
  padding: 20rpx 0;
}

.request-btn-text {
  color: #fff;
  font-size: 28rpx;
}

.tabs {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
}

.tab {
  font-size: 26rpx;
  color: #666;
  padding-bottom: 8rpx;
  flex-shrink: 0;
}

.tab.active {
  color: #1677FF;
  border-bottom: 4rpx solid #1677FF;
  font-weight: bold;
}

.low-stock-alert {
  background: #FFF7E6;
  border: 2rpx solid #FFD591;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.alert-icon {
  font-size: 32rpx;
}

.alert-text {
  font-size: 26rpx;
  color: #D48806;
}

.parts-list,
.history-list,
.request-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.part-card,
.history-card,
.request-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.part-header,
.history-header,
.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.part-name,
.history-name,
.request-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.stock-badge {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
  background: #F6FFED;
  color: #52C41A;
}

.stock-badge.low {
  background: #FFF1F0;
  color: #FF4D4F;
}

.part-code,
.part-spec {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-top: 4rpx;
}

.part-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
}

.quantity-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.quantity-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #1677FF;
}

.quantity-label {
  font-size: 22rpx;
  color: #999;
}

.part-location {
  font-size: 22rpx;
  color: #999;
}

.history-quantity {
  font-size: 30rpx;
  font-weight: bold;
  color: #FF4D4F;
}

.history-quantity.returned {
  color: #52C41A;
}

.history-spec {
  font-size: 24rpx;
  color: #666;
  display: block;
}

.history-footer,
.request-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.history-workorder,
.history-time,
.request-time {
  font-size: 22rpx;
  color: #999;
}

.request-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 4rpx;
}

.request-status.pending {
  background: #FFF7E6;
  color: #D48806;
}

.request-status.approved {
  background: #F6FFED;
  color: #52C41A;
}

.request-status.rejected {
  background: #FFF1F0;
  color: #FF4D4F;
}

.request-status.received {
  background: #E6F7FF;
  color: #1677FF;
}

.request-reason {
  font-size: 24rpx;
  color: #666;
  display: block;
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

/* Modal */
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

.modal-content {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  width: 85%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  text-align: center;
  margin-bottom: 32rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.form-input {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  width: 100%;
  box-sizing: border-box;
}

.form-textarea {
  background: #F5F7FA;
  border-radius: 8rpx;
  padding: 20rpx;
  font-size: 28rpx;
  width: 100%;
  height: 160rpx;
  box-sizing: border-box;
}

.modal-btns {
  display: flex;
  gap: 24rpx;
  margin-top: 32rpx;
}

.modal-btn {
  flex: 1;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
}

.modal-btn.cancel {
  background: #F5F7FA;
  color: #666;
}

.modal-btn.confirm {
  background: #1677FF;
  color: #fff;
}
</style>
