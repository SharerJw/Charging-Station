<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSimulatorStore } from '@/store/simulator'
import { deviceApi } from '@/api'
import type { Device } from '@/store/simulator'
import { ElMessage, ElMessageBox } from 'element-plus'

const simulatorStore = useSimulatorStore()

// 分页和搜索状态
const currentPage = ref(1)
const pageSize = ref(10)
const totalDevices = ref(0)
const loading = ref(false)
const searchText = ref('')
const filterStatus = ref('')

const showAddDialog = ref(false)
const newDevice = ref({
  name: '',
  ocppId: '',
  model: 'AC-7kW',
})

const deviceModels = [
  { label: 'AC-7kW (交流慢充)', value: 'AC-7kW' },
  { label: 'AC-11kW (交流慢充)', value: 'AC-11kW' },
  { label: 'DC-60kW (直流快充)', value: 'DC-60kW' },
  { label: 'DC-120kW (直流快充)', value: 'DC-120kW' },
  { label: 'DC-240kW (直流超充)', value: 'DC-240kW' },
]

const statusColors: Record<string, string> = {
  online: 'success',
  offline: 'danger',
  charging: 'warning',
  fault: 'danger',
}

const statusLabels: Record<string, string> = {
  online: '在线',
  offline: '离线',
  charging: '充电中',
  fault: '故障',
}

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '充电中', value: 'charging' },
  { label: '故障', value: 'fault' },
]

// 加载设备数据
async function loadDevices() {
  loading.value = true
  try {
    const result = await deviceApi.list({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchText.value || undefined,
      status: filterStatus.value || undefined,
    })
    simulatorStore.devices = result.list || []
    totalDevices.value = result.total || 0
  } catch (error) {
    console.error('Failed to load devices:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  currentPage.value = 1
  loadDevices()
}

// 分页
function handlePageChange(page: number) {
  currentPage.value = page
  loadDevices()
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  loadDevices()
}

// 初始化
onMounted(() => {
  loadDevices()
})

const handleAdd = () => {
  if (!newDevice.value.name || !newDevice.value.ocppId) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const device: Device = {
    id: `CP${String(simulatorStore.devices.length + 1).padStart(3, '0')}`,
    name: newDevice.value.name,
    ocppId: newDevice.value.ocppId,
    model: newDevice.value.model,
    status: 'online',
    power: 0, voltage: 0, current: 0, soc: 0,
    temperature: 25,
    lastHeartbeat: new Date().toISOString(),
  }
  simulatorStore.devices.push(device)
  showAddDialog.value = false
  newDevice.value = { name: '', ocppId: '', model: 'AC-7kW' }
  ElMessage.success('设备添加成功')
}

const handleReset = (device: Device) => {
  ElMessageBox.confirm(`确定要重置设备「${device.name}」吗？`, '确认重置', { type: 'warning' })
    .then(() => {
      device.status = 'online'
      device.power = 0
      device.voltage = 0
      device.current = 0
      device.soc = 0
      ElMessage.success('设备已重置')
    })
    .catch(() => {})
}

const handleDelete = (device: Device) => {
  ElMessageBox.confirm(`确定要删除设备「${device.name}」吗？`, '确认删除', { type: 'warning' })
    .then(() => {
      const idx = simulatorStore.devices.findIndex(d => d.id === device.id)
      if (idx !== -1) simulatorStore.devices.splice(idx, 1)
      ElMessage.success('设备已删除')
    })
    .catch(() => {})
}
</script>

<template>
  <div class="device-page">
    <div class="page-header">
      <h2 class="page-title">设备管理</h2>
      <el-button type="primary" @click="showAddDialog = true">添加设备</el-button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索设备名称/ID/型号"
        clearable
        style="width: 250px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- 设备网格 -->
    <div class="device-grid" v-loading="loading">
      <div v-for="device in simulatorStore.devices" :key="device.id" class="device-card card">
        <div class="device-header">
          <div class="device-info">
            <h3 class="device-name">{{ device.name }}</h3>
            <span class="device-id">{{ device.ocppId }}</span>
          </div>
          <el-tag :type="(statusColors[device.status] as any)" size="small">
            {{ statusLabels[device.status] }}
          </el-tag>
        </div>

        <div class="device-model">
          <span class="label">型号:</span>
          <span class="value">{{ device.model }}</span>
        </div>

        <div class="device-metrics">
          <div class="metric">
            <span class="metric-value font-number">{{ device.power }} kW</span>
            <span class="metric-label">功率</span>
          </div>
          <div class="metric">
            <span class="metric-value font-number">{{ device.voltage }} V</span>
            <span class="metric-label">电压</span>
          </div>
          <div class="metric">
            <span class="metric-value font-number">{{ device.current }} A</span>
            <span class="metric-label">电流</span>
          </div>
        </div>

        <div class="device-actions">
          <el-button size="small" @click="handleReset(device)">重置</el-button>
          <el-button size="small" type="danger" @click="handleDelete(device)">删除</el-button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalDevices"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog v-model="showAddDialog" title="添加设备" width="500px">
      <el-form :model="newDevice" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="newDevice.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="OCPP ID">
          <el-input v-model="newDevice.ocppId" placeholder="请输入OCPP标识" />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-select v-model="newDevice.model" style="width: 100%">
            <el-option v-for="item in deviceModels" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.device-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0;
}

.search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.device-card {
  padding: 20px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.device-name {
  font-size: 18px;
  color: var(--text-primary);
  margin: 0;
}

.device-id {
  font-size: 12px;
  color: var(--text-secondary);
}

.device-model {
  margin-bottom: 16px;
  font-size: 14px;
}

.device-model .label {
  color: var(--text-secondary);
}

.device-model .value {
  color: var(--text-primary);
  margin-left: 8px;
}

.device-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 16px;
}

.metric {
  text-align: center;
}

.metric-value {
  font-size: 18px;
  color: var(--text-primary);
  display: block;
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  display: block;
}

.device-actions {
  display: flex;
  gap: 12px;
}

.device-actions .el-button {
  flex: 1;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}
</style>
