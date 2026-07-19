<template>
  <view class="vehicles-page">
    <!-- ==================== 车辆统计概览 ==================== -->
    <view class="stats-card" v-if="vehicles.length > 0">
      <view class="stats-header">
        <text class="stats-title">本月充电概况</text>
        <text class="stats-date">{{ currentMonth }}</text>
      </view>
      <view class="stats-grid">
        <view class="stats-item">
          <text class="stats-value">{{ vehicleStats.monthlyCount }}</text>
          <text class="stats-label">充电次数</text>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <text class="stats-value">&yen;{{ vehicleStats.totalCost.toFixed(2) }}</text>
          <text class="stats-label">总花费</text>
        </view>
        <view class="stats-divider"></view>
        <view class="stats-item">
          <text class="stats-value">&yen;{{ vehicleStats.avgCost.toFixed(2) }}</text>
          <text class="stats-label">平均费用</text>
        </view>
      </view>
    </view>

    <!-- ==================== 添加车辆按钮 ==================== -->
    <view class="add-bar">
      <text class="vehicle-count">已添加 {{ vehicles.length }}/5 辆车</text>
      <view
        class="add-btn"
        :class="{ disabled: vehicles.length >= 5 }"
        @tap="handleAddBtnTap"
      >
        <text class="add-btn-icon">+</text>
        <text class="add-btn-text">添加爱车</text>
      </view>
    </view>

    <!-- ==================== 加载中 ==================== -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- ==================== 车辆列表 ==================== -->
    <view v-else-if="vehicles.length > 0" class="vehicle-list">
      <view
        v-for="vehicle in vehicles"
        :key="vehicle.id"
        class="vehicle-card"
      >
        <!-- 标签区域 -->
        <view class="card-tags">
          <view class="tag tag-default" v-if="vehicle.isDefault">
            <text class="tag-text">默认</text>
          </view>
          <view class="tag tag-plug" v-if="vehicle.plugAndCharge">
            <text class="tag-text">即插即充</text>
          </view>
        </view>

        <!-- 车辆主信息 -->
        <view class="card-main">
          <view class="card-icon-wrap">
            <text class="card-icon-text">{{ getBrandIcon(vehicle.brand) }}</text>
          </view>
          <view class="card-info">
            <text class="card-brand-model">{{ vehicle.brand }} {{ vehicle.model }}</text>
            <view class="card-plate-row">
              <text class="card-plate">{{ maskPlate(vehicle.plateNumber) }}</text>
            </view>
          </view>
        </view>

        <!-- 车辆详情 -->
        <view class="card-details">
          <view class="detail-item">
            <text class="detail-label">电池容量</text>
            <text class="detail-value">{{ vehicle.batteryCapacity }} kWh</text>
          </view>
          <view class="detail-item" v-if="vehicle.range">
            <text class="detail-label">续航里程</text>
            <text class="detail-value">{{ vehicle.range }} km</text>
          </view>
          <view class="detail-item" v-if="vehicle.vin">
            <text class="detail-label">VIN码</text>
            <text class="detail-value">{{ vehicle.vin.substring(0, 8) }}***</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="card-actions">
          <view class="action-btn" @tap="editVehicle(vehicle)">
            <text class="action-icon">&#x270E;</text>
            <text class="action-text">编辑</text>
          </view>
          <view
            class="action-btn"
            v-if="!vehicle.isDefault"
            @tap="setDefault(vehicle)"
          >
            <text class="action-icon">&#x2606;</text>
            <text class="action-text">设为默认</text>
          </view>
          <view class="action-btn action-delete" @tap="handleDelete(vehicle)">
            <text class="action-icon">&#x1F5D1;</text>
            <text class="action-text">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ==================== 空状态 ==================== -->
    <view v-else class="empty-state">
      <text class="empty-icon">&#x1F697;</text>
      <text class="empty-title">暂无车辆信息</text>
      <text class="empty-desc">添加您的爱车，享受更便捷的充电服务</text>
      <view class="empty-btn" @tap="showAddForm">
        <text class="empty-btn-text">+ 立即添加</text>
      </view>
    </view>

    <!-- ==================== 添加/编辑车辆弹窗 ==================== -->
    <view class="modal-mask" v-if="showModal" @tap="closeModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">{{ isEditing ? '编辑车辆' : '添加车辆' }}</text>
          <view class="modal-close" @tap="closeModal">
            <text class="close-icon">&#x2715;</text>
          </view>
        </view>

        <!-- 滚动表单区域 -->
        <scroll-view scroll-y class="modal-scroll">
          <!-- 步骤一：品牌选择 -->
          <view class="form-section">
            <text class="form-section-title">选择品牌</text>
            <view class="brand-grid">
              <view
                v-for="brand in brandList"
                :key="brand.name"
                class="brand-item"
                :class="{ active: form.brand === brand.name }"
                @tap="selectBrand(brand.name)"
              >
                <text class="brand-icon">{{ brand.icon }}</text>
                <text class="brand-name">{{ brand.name }}</text>
              </view>
            </view>
          </view>

          <!-- 步骤二：车型选择 -->
          <view class="form-section" v-if="form.brand">
            <text class="form-section-title">选择车型</text>
            <view class="model-grid">
              <view
                v-for="m in availableModels"
                :key="m"
                class="model-item"
                :class="{ active: form.model === m }"
                @tap="form.model = m"
              >
                <text class="model-text">{{ m }}</text>
              </view>
            </view>
            <view class="custom-model" v-if="availableModels.length === 0 || showCustomModel">
              <input
                class="form-input"
                placeholder="手动输入车型名称"
                v-model="form.model"
              />
            </view>
            <view
              class="custom-model-toggle"
              v-if="availableModels.length > 0 && !showCustomModel"
              @tap="showCustomModel = true"
            >
              <text class="toggle-text">没有找到？手动输入 &gt;</text>
            </view>
          </view>

          <!-- 步骤三：车辆信息 -->
          <view class="form-section">
            <text class="form-section-title">车辆信息</text>

            <view class="form-group">
              <text class="form-label">车牌号 <text class="required">*</text></text>
              <input
                class="form-input"
                placeholder="如: 京A12345"
                v-model="form.plateNumber"
                maxlength="10"
              />
            </view>

            <view class="form-group">
              <text class="form-label">电池容量 (kWh)</text>
              <input
                class="form-input"
                type="digit"
                placeholder="如: 60"
                v-model="form.batteryCapacity"
              />
            </view>

            <view class="form-group">
              <text class="form-label">续航里程 (km)</text>
              <input
                class="form-input"
                type="digit"
                placeholder="如: 500"
                v-model="form.range"
              />
            </view>

            <view class="form-group">
              <text class="form-label">VIN码 <text class="optional">(选填)</text></text>
              <input
                class="form-input"
                placeholder="17位车辆识别码"
                v-model="form.vin"
                maxlength="17"
              />
            </view>

            <view class="form-group">
              <text class="form-label">车辆类型</text>
              <view class="type-options">
                <view
                  v-for="t in vehicleTypes"
                  :key="t"
                  class="type-option"
                  :class="{ active: form.type === t }"
                  @tap="form.type = t"
                >
                  <text class="type-text">{{ t }}</text>
                </view>
              </view>
            </view>

            <!-- 即插即充开关 -->
            <view class="form-group switch-group">
              <text class="form-label">即插即充</text>
              <switch
                :checked="form.plugAndCharge"
                color="#07C160"
                @change="form.plugAndCharge = $event.detail.value"
              />
            </view>
          </view>
        </scroll-view>

        <!-- 提交按钮 -->
        <view class="modal-footer">
          <view class="modal-btn cancel" @tap="closeModal">
            <text class="btn-text">取消</text>
          </view>
          <view class="modal-btn confirm" :class="{ disabled: submitting }" @tap="submitVehicle">
            <text class="btn-text confirm-text">{{ submitting ? '提交中...' : '确定' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { api } from '@/api/index'

// ==================== 类型定义 ====================

interface Vehicle {
  id: string
  brand: string
  model: string
  plateNumber: string
  batteryCapacity: number
  range: number
  type: string
  isDefault: boolean
  vin?: string
  plugAndCharge?: boolean
}

// ==================== 品牌 & 车型数据 ====================

const brandList = [
  { name: '特斯拉', icon: 'T' },
  { name: '比亚迪', icon: 'B' },
  { name: '蔚来', icon: 'N' },
  { name: '小鹏', icon: 'X' },
  { name: '理想', icon: 'L' },
  { name: '极氪', icon: 'Z' },
  { name: '问界', icon: 'W' },
  { name: '哪吒', icon: 'H' },
  { name: '零跑', icon: '0' },
  { name: '广汽埃安', icon: 'A' },
  { name: '长安深蓝', icon: 'S' },
  { name: '极越', icon: 'J' },
  { name: '智己', icon: 'I' },
  { name: '阿维塔', icon: 'V' },
  { name: '其他', icon: '?' },
]

const brandModelMap: Record<string, string[]> = {
  '特斯拉': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  '比亚迪': ['秦PLUS', '汉EV', '海豹', '宋PLUS', '元PLUS', '海豚', '唐EV'],
  '蔚来': ['ET5', 'ET7', 'ES6', 'ES8', 'EC6', 'EC7', 'ES7'],
  '小鹏': ['P7', 'G6', 'G9', 'X9', 'P5', 'MONA M03'],
  '理想': ['L6', 'L7', 'L8', 'L9', 'MEGA'],
  '极氪': ['001', '007', '009', 'X', 'MIX'],
  '问界': ['M5', 'M7', 'M9'],
  '哪吒': ['哪吒S', '哪吒GT', '哪吒X', '哪吒L'],
  '零跑': ['C01', 'C10', 'C11', 'C16', 'T03'],
  '广汽埃安': ['AION S', 'AION Y', 'AION V', 'AION LX', '昊铂GT'],
  '长安深蓝': ['SL03', 'S7', 'G318'],
  '极越': ['极越01', '极越07'],
  '智己': ['L6', 'L7', 'LS6', 'LS7'],
  '阿维塔': ['阿维塔11', '阿维塔12'],
}

const vehicleTypes = ['纯电动', '插电混动', '增程式']

// ==================== 状态 ====================

const loading = ref(false)
const vehicles = ref<Vehicle[]>([])
const showModal = ref(false)
const submitting = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const showCustomModel = ref(false)

const vehicleStats = reactive({
  monthlyCount: 0,
  totalCost: 0,
  avgCost: 0,
})

const form = reactive({
  brand: '',
  model: '',
  plateNumber: '',
  batteryCapacity: '',
  range: '',
  vin: '',
  type: '纯电动',
  plugAndCharge: false,
})

// ==================== 计算属性 ====================

const currentMonth = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

const availableModels = computed(() => {
  return brandModelMap[form.brand] || []
})

// ==================== 工具函数 ====================

function maskPlate(plate: string): string {
  if (!plate || plate.length < 3) return plate || ''
  // 脱敏：隐藏中间字符，如 京A***45
  const prefix = plate.substring(0, 2)
  const suffix = plate.length > 4 ? plate.substring(plate.length - 2) : ''
  return `${prefix}***${suffix}`
}

function getBrandIcon(brand: string): string {
  const found = brandList.find(b => b.name === brand)
  return found ? found.icon : '?'
}

// ==================== 数据加载 ====================

async function loadVehicles() {
  loading.value = true
  try {
    const data = await api.getVehicles()
    vehicles.value = data.map((v: any) => ({
      id: String(v.id || ''),
      brand: v.brand || '',
      model: v.model || '',
      plateNumber: v.plateNumber || '',
      batteryCapacity: v.batteryCapacity || 0,
      range: v.range || 0,
      type: v.type || '纯电动',
      isDefault: Boolean(v.isDefault),
      vin: v.vin || '',
      plugAndCharge: Boolean(v.plugAndCharge),
    }))
  } catch (e) {
    uni.showToast({ title: '加载车辆信息失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const data: any = await (api as any).getOrders?.({ page: 1, size: 1000 })
    if (Array.isArray(data)) {
      const now = new Date()
      const monthlyOrders = data.filter((o: any) => {
        const d = new Date(o.startTime || o.createdAt || '')
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      vehicleStats.monthlyCount = monthlyOrders.length
      vehicleStats.totalCost = monthlyOrders.reduce((s: number, o: any) => s + (o.totalAmount || o.amount || 0), 0) / 100
      vehicleStats.avgCost = vehicleStats.monthlyCount > 0 ? vehicleStats.totalCost / vehicleStats.monthlyCount : 0
    }
  } catch {
    // 统计加载失败不影响主功能
  }
}

// ==================== 表单操作 ====================

function resetForm() {
  form.brand = ''
  form.model = ''
  form.plateNumber = ''
  form.batteryCapacity = ''
  form.range = ''
  form.vin = ''
  form.type = '纯电动'
  form.plugAndCharge = false
  showCustomModel.value = false
  isEditing.value = false
  editingId.value = ''
}

function showAddForm() {
  resetForm()
  showModal.value = true
}

function handleAddBtnTap() {
  if (vehicles.value.length >= 5) {
    uni.showToast({ title: '最多添加5辆车', icon: 'none' })
    return
  }
  showAddForm()
}

function editVehicle(vehicle: Vehicle) {
  isEditing.value = true
  editingId.value = vehicle.id
  form.brand = vehicle.brand
  form.model = vehicle.model
  form.plateNumber = vehicle.plateNumber
  form.batteryCapacity = vehicle.batteryCapacity ? String(vehicle.batteryCapacity) : ''
  form.range = vehicle.range ? String(vehicle.range) : ''
  form.vin = vehicle.vin || ''
  form.type = vehicle.type || '纯电动'
  form.plugAndCharge = Boolean(vehicle.plugAndCharge)
  showCustomModel.value = !brandModelMap[vehicle.brand]?.includes(vehicle.model)
  showModal.value = true
}

function selectBrand(name: string) {
  form.brand = name
  // 重置车型选择
  if (brandModelMap[name]?.length) {
    form.model = ''
    showCustomModel.value = false
  } else {
    showCustomModel.value = true
  }
}

function closeModal() {
  showModal.value = false
  resetForm()
}

// ==================== 提交 ====================

async function submitVehicle() {
  if (!form.brand.trim()) {
    uni.showToast({ title: '请选择品牌', icon: 'none' })
    return
  }
  if (!form.model.trim()) {
    uni.showToast({ title: '请选择或输入车型', icon: 'none' })
    return
  }
  if (!form.plateNumber.trim()) {
    uni.showToast({ title: '请输入车牌号', icon: 'none' })
    return
  }
  if (submitting.value) return
  submitting.value = true

  const payload = {
    brand: form.brand.trim(),
    model: form.model.trim(),
    plateNumber: form.plateNumber.trim().toUpperCase(),
    batteryCapacity: Number(form.batteryCapacity) || 0,
    range: Number(form.range) || 0,
    vin: form.vin.trim() || undefined,
    type: form.type,
    plugAndCharge: form.plugAndCharge,
  }

  try {
    if (isEditing.value && editingId.value) {
      await api.updateVehicle(editingId.value, payload)
      uni.showToast({ title: '编辑成功', icon: 'success' })
    } else {
      if (vehicles.value.length >= 5) {
        uni.showToast({ title: '最多添加5辆车', icon: 'none' })
        return
      }
      await api.addVehicle(payload)
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    closeModal()
    await loadVehicles()
  } catch (e) {
    uni.showToast({ title: isEditing.value ? '编辑失败' : '添加失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ==================== 删除 & 设默认 ====================

function handleDelete(vehicle: Vehicle) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除 ${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber}) 吗？`,
    confirmColor: '#FF4D4F',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.deleteVehicle(vehicle.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          await loadVehicles()
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}

async function setDefault(vehicle: Vehicle) {
  try {
    await api.updateVehicle(vehicle.id, { isDefault: true })
    vehicles.value.forEach(v => { v.isDefault = v.id === vehicle.id })
    uni.showToast({ title: '已设为默认', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '设置失败', icon: 'none' })
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await Promise.all([loadVehicles(), loadStats()])
})
</script>

<style scoped>
/* ==================== 页面基础 ==================== */
.vehicles-page {
  min-height: 100vh;
  background: #F6F7FB;
  padding: 24rpx;
  padding-bottom: 60rpx;
}

/* ==================== 统计卡片 ==================== */
.stats-card {
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.2);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.stats-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.stats-date {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.stats-grid {
  display: flex;
  align-items: center;
}

.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.stats-value {
  font-size: 38rpx;
  font-weight: bold;
  color: #fff;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

.stats-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.75);
}

.stats-divider {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.25);
}

/* ==================== 添加栏 ==================== */
.add-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.vehicle-count {
  font-size: 26rpx;
  color: #999;
}

.add-btn {
  display: flex;
  align-items: center;
  background: #07C160;
  border-radius: 36rpx;
  padding: 14rpx 32rpx;
  gap: 8rpx;
}

.add-btn.disabled {
  background: #ccc;
}

.add-btn-icon {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

.add-btn-text {
  font-size: 26rpx;
  color: #fff;
  font-weight: 500;
}

/* ==================== 加载状态 ==================== */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 20rpx;
}

.loading-spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #E8E8E8;
  border-top-color: #07C160;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* ==================== 车辆列表 ==================== */
.vehicle-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.vehicle-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

/* 标签 */
.card-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.tag {
  border-radius: 6rpx;
  padding: 4rpx 14rpx;
}

.tag-default {
  background: #E8F8EE;
  border: 1rpx solid #07C160;
}

.tag-default .tag-text {
  color: #07C160;
  font-size: 20rpx;
  font-weight: 500;
}

.tag-plug {
  background: #E8F0FF;
  border: 1rpx solid #1677FF;
}

.tag-plug .tag-text {
  color: #1677FF;
  font-size: 20rpx;
  font-weight: 500;
}

/* 主信息 */
.card-main {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  background: #F0F2F5;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.card-icon-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.card-info {
  flex: 1;
  overflow: hidden;
}

.card-brand-model {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.card-plate-row {
  display: flex;
  align-items: center;
}

.card-plate {
  font-size: 24rpx;
  color: #666;
  background: #F0F2F5;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
  letter-spacing: 2rpx;
}

/* 详情行 */
.card-details {
  display: flex;
  padding: 16rpx 0;
  border-top: 1rpx solid #f5f5f5;
  border-bottom: 1rpx solid #f5f5f5;
  margin-bottom: 16rpx;
}

.detail-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.detail-label {
  font-size: 22rpx;
  color: #999;
}

.detail-value {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 24rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  background: #F6F7FB;
}

.action-icon {
  font-size: 24rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666;
}

.action-delete {
  background: #FFF2F0;
}

.action-delete .action-text {
  color: #FF4D4F;
}

/* ==================== 空状态 ==================== */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.empty-btn {
  background: #07C160;
  border-radius: 44rpx;
  padding: 20rpx 64rpx;
}

.empty-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: bold;
}

/* ==================== 弹窗 ==================== */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 100%;
  max-height: 90vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 32rpx 32rpx 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  position: absolute;
  right: 32rpx;
  top: 32rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 36rpx;
  color: #999;
}

.modal-scroll {
  flex: 1;
  max-height: calc(90vh - 200rpx);
  padding: 24rpx 32rpx;
}

/* ==================== 表单 ==================== */
.form-section {
  margin-bottom: 32rpx;
}

.form-section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

/* 品牌网格 */
.brand-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.brand-item {
  width: calc(20% - 14rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 0;
  background: #F6F7FB;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}

.brand-item.active {
  border-color: #07C160;
  background: #E8F8EE;
}

.brand-icon {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.brand-item.active .brand-icon {
  color: #07C160;
}

.brand-name {
  font-size: 20rpx;
  color: #666;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding: 0 4rpx;
}

.brand-item.active .brand-name {
  color: #07C160;
  font-weight: 500;
}

/* 车型网格 */
.model-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.model-item {
  padding: 14rpx 24rpx;
  background: #F6F7FB;
  border-radius: 8rpx;
  border: 2rpx solid transparent;
}

.model-item.active {
  border-color: #07C160;
  background: #E8F8EE;
}

.model-text {
  font-size: 26rpx;
  color: #333;
}

.model-item.active .model-text {
  color: #07C160;
  font-weight: 500;
}

.custom-model-toggle {
  margin-top: 16rpx;
  text-align: center;
}

.toggle-text {
  font-size: 24rpx;
  color: #07C160;
}

.custom-model {
  margin-top: 16rpx;
}

/* 表单组 */
.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: block;
}

.required {
  color: #FF4D4F;
}

.optional {
  color: #bbb;
  font-size: 22rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #E8E8E8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
  background: #FAFAFA;
}

.form-input:focus {
  border-color: #07C160;
  background: #fff;
}

/* 类型选择 */
.type-options {
  display: flex;
  gap: 16rpx;
}

.type-option {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  background: #F6F7FB;
  border-radius: 8rpx;
  border: 2rpx solid transparent;
}

.type-option.active {
  border-color: #07C160;
  background: #E8F8EE;
}

.type-text {
  font-size: 24rpx;
  color: #333;
}

.type-option.active .type-text {
  color: #07C160;
  font-weight: 500;
}

/* 即插即充开关 */
.switch-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.switch-group .form-label {
  margin-bottom: 0;
}

/* ==================== 弹窗底部按钮 ==================== */
.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 32rpx 48rpx;
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
}

.modal-btn.cancel {
  background: #F6F7FB;
}

.modal-btn.confirm {
  background: #07C160;
}

.modal-btn.confirm.disabled {
  background: #A0D9B7;
}

.btn-text {
  font-size: 30rpx;
  font-weight: bold;
  color: #666;
}

.confirm-text {
  color: #fff;
}
</style>
