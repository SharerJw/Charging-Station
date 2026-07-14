<script setup lang="ts">
import { computed } from 'vue'
import { useDeviceStore } from '@/store/device'
import { DeviceStatus, DeviceType } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible', 'reset'])

const deviceStore = useDeviceStore()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const device = computed(() => deviceStore.currentDevice)

const statusMap: Record<string, { label: string; type: string }> = {
  [DeviceStatus.ONLINE]: { label: '在线', type: 'success' },
  [DeviceStatus.OFFLINE]: { label: '离线', type: 'danger' },
  [DeviceStatus.CHARGING]: { label: '充电中', type: 'warning' },
  [DeviceStatus.FAULT]: { label: '故障', type: 'danger' },
  [DeviceStatus.MAINTENANCE]: { label: '维护中', type: 'info' },
}

const connectorStatusMap: Record<string, { label: string; type: string }> = {
  AVAILABLE: { label: '空闲', type: 'success' },
  PREPARING: { label: '准备中', type: 'warning' },
  CHARGING: { label: '充电中', type: 'warning' },
  FINISHING: { label: '完成中', type: 'info' },
  UNAVAILABLE: { label: '不可用', type: 'danger' },
  FAULTED: { label: '故障', type: 'danger' },
}
</script>

<template>
  <el-dialog v-model="dialogVisible" title="设备详情" width="700px" destroy-on-close>
    <template v-if="device">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备编号">{{ device.code }}</el-descriptions-item>
        <el-descriptions-item label="OCPP ID">{{ device.ocppId }}</el-descriptions-item>
        <el-descriptions-item label="所属充电站" :span="2">{{ device.stationName }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ device.model }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ device.type === DeviceType.DC ? '直流快充' : '交流慢充' }}</el-descriptions-item>
        <el-descriptions-item label="额定功率">{{ device.power }} kW</el-descriptions-item>
        <el-descriptions-item label="固件版本">{{ device.firmwareVersion }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="(statusMap[device.status]?.type as any)">{{ statusMap[device.status]?.label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最后心跳">{{ device.lastHeartbeat }}</el-descriptions-item>
      </el-descriptions>

      <h4 style="margin: 20px 0 12px; font-size: 15px; color: #333;">充电接口</h4>
      <el-table :data="device.connectors" border size="small">
        <el-table-column prop="connectorId" label="接口ID" width="80" align="center" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="(connectorStatusMap[row.status]?.type as any)" size="small">
              {{ connectorStatusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实时功率" width="120">
          <template #default="{ row }"><span class="font-number">{{ row.power }} kW</span></template>
        </el-table-column>
        <el-table-column label="交易ID">
          <template #default="{ row }">{{ row.currentTransactionId || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default>
            <el-button type="warning" link size="small">解锁</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; gap: 12px;">
        <el-button type="warning" @click="emit('reset', device)">重置设备</el-button>
        <el-button type="primary">固件升级</el-button>
        <el-button>远程配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>
