<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useSimulatorStore } from '@/store/simulator'
import { chargingApi, deviceApi } from '@/api'
import { ElMessage } from 'element-plus'
import DeviceSelect from '@/components/DeviceSelect.vue'
import SvgIcon from '@/components/SvgIcon.vue'

const simulatorStore = useSimulatorStore()

const selectedDevice = ref('')
const isCharging = ref(false)
const chargingStartTime = ref<number>(0)
const currentTransaction = ref<any>(null)
let chargingTimer: ReturnType<typeof setInterval> | null = null

const chargingConfig = ref({
  targetSoc: 80,
  maxPower: 60,
})

const chargingData = ref({
  currentSoc: 0,
  power: 0,
  energy: 0,
  voltage: 0,
  current: 0,
  temperature: 0,
  durationSeconds: 0,
  cost: 0,
})

const durationDisplay = computed(() => {
  const s = chargingData.value.durationSeconds
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

const selectedDeviceInfo = computed(() => simulatorStore.devices.find(d => d.id === selectedDevice.value))

onMounted(async () => {
  const devicesResponse = await deviceApi.list()
  const devices = devicesResponse?.list || devicesResponse || []
  simulatorStore.devices = devices
  const chargingDevice = devices.find(d => d.status === 'charging')
  if (chargingDevice) {
    selectedDevice.value = chargingDevice.id
    updateFromDevice(chargingDevice)
    // 如果有充电中的设备，自动开始轮询
    isCharging.value = true
    startPolling()
  }
})

function updateFromDevice(device: any) {
  chargingData.value.currentSoc = device.soc || 0
  chargingData.value.power = device.power || 0
  chargingData.value.voltage = device.voltage || 0
  chargingData.value.current = device.current || 0
  chargingData.value.temperature = device.temperature || 0
}

// 监听设备切换
watch(selectedDevice, () => {
  const device = simulatorStore.devices.find(d => d.id === selectedDevice.value)
  if (device) {
    updateFromDevice(device)
  }
})

function startPolling() {
  if (chargingTimer) clearInterval(chargingTimer)
  chargingTimer = setInterval(async () => {
    try {
      const devicesResponse = await deviceApi.list()
      const devices = devicesResponse?.list || devicesResponse || []
      simulatorStore.devices = devices
      const device = devices.find(d => d.id === selectedDevice.value)
      if (device) {
        updateFromDevice(device)
        chargingData.value.durationSeconds += 1
        chargingData.value.energy = (chargingData.value.energy || 0) + (device.power || 0) / 3600
        chargingData.value.cost = chargingData.value.energy * 1.7
      }
    } catch (e) {
      // 静默处理
    }
  }, 1000)
}

onUnmounted(() => {
  if (chargingTimer) clearInterval(chargingTimer)
})

async function startCharging() {
  if (!selectedDevice.value) {
    ElMessage.warning('请先选择设备')
    return
  }
  try {
    const tx = await chargingApi.start({
      chargePointId: selectedDevice.value,
      targetSoc: chargingConfig.value.targetSoc,
      maxPower: chargingConfig.value.maxPower,
    })
    currentTransaction.value = tx
    isCharging.value = true
    chargingStartTime.value = Date.now()
    chargingData.value.currentSoc = tx.soc || 0
    chargingData.value.voltage = tx.voltage || 0
    chargingData.value.energy = 0
    chargingData.value.durationSeconds = 0
    chargingData.value.cost = 0

    // 从后端轮询真实数据
    startPolling()

    ElMessage.success('充电已启动')
  } catch (error: any) {
    ElMessage.error(error.message || '启动失败')
  }
}

async function stopCharging() {
  if (chargingTimer) {
    clearInterval(chargingTimer)
    chargingTimer = null
  }
  if (currentTransaction.value) {
    try {
      await chargingApi.stop(currentTransaction.value.id)
      ElMessage.success('充电已停止')
    } catch (error: any) {
      ElMessage.error(error.message || '停止失败')
    }
  }
  isCharging.value = false
  const device = simulatorStore.devices.find(d => d.id === selectedDevice.value)
  if (device) {
    device.power = 0
    device.status = 'online'
  }
}

// SOC 进度条颜色
const socColor = computed(() => {
  const soc = chargingData.value.currentSoc
  if (soc < 20) return '#EF4444'
  if (soc < 60) return '#F59E0B'
  return '#10B981'
})
</script>

<template>
  <div class="charging-page">
    <!-- 左侧配置面板 -->
    <div class="config-section">
      <div class="card">
        <h3 class="card-title">充电配置</h3>
        <el-form label-position="top">
          <el-form-item label="选择设备">
            <DeviceSelect
              v-model="selectedDevice"
              placeholder="输入搜索充电桩..."
              :disabled="isCharging"
            />
          </el-form-item>
          <el-form-item label="目标 SOC">
            <el-slider v-model="chargingConfig.targetSoc" :min="10" :max="100" :step="5" show-input :disabled="isCharging" />
          </el-form-item>
          <el-form-item label="最大功率 (kW)">
            <el-input-number v-model="chargingConfig.maxPower" :min="1" :max="240" style="width: 100%" :disabled="isCharging" />
          </el-form-item>
          <el-form-item>
            <el-button
              v-if="!isCharging"
              type="primary"
              size="large"
              style="width: 100%"
              @click="startCharging"
              :disabled="!selectedDevice"
            >
              <SvgIcon name="lightning" :size="16" color="#FFFFFF" style="margin-right: 6px;" />
              开始充电
            </el-button>
            <el-button
              v-else
              type="danger"
              size="large"
              style="width: 100%"
              @click="stopCharging"
            >
              <SvgIcon name="stop" :size="16" color="#FFFFFF" style="margin-right: 6px;" />
              停止充电
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 设备信息 -->
        <div v-if="selectedDeviceInfo" class="device-info">
          <div class="info-row"><span>OCPP ID:</span><span>{{ selectedDeviceInfo.ocppId }}</span></div>
          <div class="info-row"><span>型号:</span><span>{{ selectedDeviceInfo.model }}</span></div>
          <div class="info-row"><span>状态:</span><span :class="['status-text', selectedDeviceInfo.status]">{{ { online: '在线', offline: '离线', charging: '充电中', fault: '故障' }[selectedDeviceInfo.status] }}</span></div>
        </div>
      </div>
    </div>

    <!-- 右侧监控面板 -->
    <div class="monitor-section">
      <!-- SOC 显示 -->
      <div class="card soc-card">
        <div class="soc-display">
          <svg class="soc-ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="#1F2937" stroke-width="12" />
            <circle
              cx="100" cy="100" r="85"
              fill="none"
              :stroke="socColor"
              stroke-width="12"
              stroke-linecap="round"
              :stroke-dasharray="`${chargingData.currentSoc * 5.34} 534`"
              transform="rotate(-90 100 100)"
              class="soc-progress"
            />
          </svg>
          <div class="soc-center">
            <span class="soc-value font-number">{{ Math.floor(chargingData.currentSoc) }}%</span>
            <span class="soc-label">SOC</span>
          </div>
        </div>
      </div>

      <!-- 实时指标 -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <div class="metric-icon-wrap metric-icon-blue">
            <SvgIcon name="lightning" :size="20" color="#3B82F6" />
          </div>
          <div class="metric-value font-number">{{ chargingData.power.toFixed(2) }}</div>
          <div class="metric-unit">kW</div>
          <div class="metric-label">实时功率</div>
        </div>
        <div class="metric-card card">
          <div class="metric-icon-wrap metric-icon-green">
            <SvgIcon name="battery" :size="20" color="#10B981" />
          </div>
          <div class="metric-value font-number">{{ chargingData.energy.toFixed(2) }}</div>
          <div class="metric-unit">kWh</div>
          <div class="metric-label">已充电量</div>
        </div>
        <div class="metric-card card">
          <div class="metric-icon-wrap metric-icon-purple">
            <SvgIcon name="timer" :size="20" color="#8B5CF6" />
          </div>
          <div class="metric-value font-number">{{ durationDisplay }}</div>
          <div class="metric-unit">&nbsp;</div>
          <div class="metric-label">充电时长</div>
        </div>
        <div class="metric-card card">
          <div class="metric-icon-wrap metric-icon-yellow">
            <SvgIcon name="money" :size="20" color="#F59E0B" />
          </div>
          <div class="metric-value font-number">¥{{ chargingData.cost.toFixed(2) }}</div>
          <div class="metric-unit">&nbsp;</div>
          <div class="metric-label">预计费用</div>
        </div>
        <div class="metric-card card">
          <div class="metric-icon-wrap metric-icon-cyan">
            <SvgIcon name="plug" :size="20" color="#06B6D4" />
          </div>
          <div class="metric-value font-number">{{ chargingData.voltage.toFixed(2) }}</div>
          <div class="metric-unit">V</div>
          <div class="metric-label">电压</div>
        </div>
        <div class="metric-card card">
          <div class="metric-icon-wrap metric-icon-red">
            <SvgIcon name="temperature" :size="20" color="#EF4444" />
          </div>
          <div class="metric-value font-number">{{ chargingData.temperature.toFixed(2) }}</div>
          <div class="metric-unit">°C</div>
          <div class="metric-label">温度</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.charging-page {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
  min-height: calc(100vh - 120px);
}

.card-title {
  color: var(--text-primary);
  font-size: 16px;
  margin-bottom: 20px;
}

.device-info {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.info-row span:first-child { color: var(--text-secondary); }
.info-row span:last-child { color: var(--text-primary); }

.status-text.online { color: #10B981; }
.status-text.offline { color: #EF4444; }
.status-text.charging { color: #F59E0B; }
.status-text.fault { color: #EF4444; }

.soc-card {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px;
}

.soc-display {
  position: relative;
  width: 200px;
  height: 200px;
}

.soc-ring {
  width: 100%;
  height: 100%;
}

.soc-progress {
  transition: stroke-dasharray 1s ease;
}

.soc-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.soc-value {
  font-size: 42px;
  font-weight: bold;
  color: var(--text-primary);
  display: block;
}

.soc-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.metric-card {
  padding: 16px;
  text-align: center;
}

.metric-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
}
.metric-icon-blue { background: rgba(59, 130, 246, 0.15); }
.metric-icon-green { background: rgba(16, 185, 129, 0.15); }
.metric-icon-purple { background: rgba(139, 92, 246, 0.15); }
.metric-icon-yellow { background: rgba(245, 158, 11, 0.15); }
.metric-icon-cyan { background: rgba(6, 182, 212, 0.15); }
.metric-icon-red { background: rgba(239, 68, 68, 0.15); }

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-primary);
}

.metric-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

.metric-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 8px;
}
</style>
