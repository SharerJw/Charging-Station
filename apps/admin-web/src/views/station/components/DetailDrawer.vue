<script setup lang="ts">
import { computed } from 'vue'
import { useStationStore } from '@/store/station'
import { StationStatus } from '@/types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible'])

const stationStore = useStationStore()

const drawerVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const station = computed(() => stationStore.currentStation)

const statusMap: Record<string, { label: string; type: string }> = {
  [StationStatus.ACTIVE]: { label: '运营中', type: 'success' },
  [StationStatus.INACTIVE]: { label: '已停运', type: 'info' },
  [StationStatus.MAINTENANCE]: { label: '维护中', type: 'warning' },
}
</script>

<template>
  <el-drawer v-model="drawerVisible" title="充电站详情" size="50%" destroy-on-close>
    <template v-if="station">
      <!-- 基本信息 -->
      <h4 class="section-title">基本信息</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="充电站编号">{{ station.code }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ station.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="(statusMap[station.status]?.type as any)" size="small">
            {{ statusMap[station.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="营业时间">{{ station.businessHours }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">
          {{ station.address.startsWith(station.province) || station.address.startsWith(station.city) ? station.address : `${station.province}${station.city}${station.district} ${station.address}` }}
        </el-descriptions-item>
        <el-descriptions-item label="经纬度">{{ station.longitude }}, {{ station.latitude }}</el-descriptions-item>
        <el-descriptions-item label="所属租户">{{ station.tenantId }}</el-descriptions-item>
      </el-descriptions>

      <!-- 联系信息 -->
      <h4 class="section-title">联系信息</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="联系人">{{ station.contactName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ station.contactPhone }}</el-descriptions-item>
      </el-descriptions>

      <!-- 计费信息 -->
      <h4 class="section-title">计费信息</h4>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="电价">
          <span class="font-number">¥{{ station.electricityPrice }}/kWh</span>
        </el-descriptions-item>
        <el-descriptions-item label="服务费">
          <span class="font-number">¥{{ station.servicePrice }}/kWh</span>
        </el-descriptions-item>
        <el-descriptions-item label="停车费">
          <span class="font-number">¥{{ station.parkingFee }}/h</span>
        </el-descriptions-item>
        <el-descriptions-item label="综合电价">
          <span class="font-number amount">¥{{ (station.electricityPrice + station.servicePrice).toFixed(2) }}/kWh</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 设备概况 -->
      <h4 class="section-title">设备概况</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备总数">{{ station.deviceCount }} 台</el-descriptions-item>
        <el-descriptions-item label="在线设备">
          <span :class="station.onlineCount > 0 ? 'text-success' : 'text-danger'">{{ station.onlineCount }} 台</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 时间信息 -->
      <h4 class="section-title">时间信息</h4>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="创建时间">{{ station.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ station.updateTime }}</el-descriptions-item>
      </el-descriptions>
    </template>
  </el-drawer>
</template>

<style scoped>
.section-title {
  font-size: 15px;
  color: #333;
  margin: 20px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title:first-child {
  margin-top: 0;
}

.text-success { color: #52C41A; font-weight: bold; }
.text-danger { color: #FF4D4F; font-weight: bold; }
.amount { color: #FF4D4F; font-weight: bold; }
</style>
