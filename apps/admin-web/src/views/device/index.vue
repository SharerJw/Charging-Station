<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDeviceStore } from '@/store/device'
import { DeviceStatus, DeviceType } from '@/types'
import type { FormRules } from 'element-plus'
import DetailDialog from './components/DetailDialog.vue'

const deviceStore = useDeviceStore()
const detailVisible = ref(false)

const searchRules: FormRules = {
  keyword: [{ max: 50, message: '关键词不超过50个字符', trigger: 'blur' }],
}

onMounted(() => {
  deviceStore.fetchList()
})

const statusMap: Record<string, { label: string; type: string }> = {
  [DeviceStatus.ONLINE]: { label: '在线', type: 'success' },
  [DeviceStatus.OFFLINE]: { label: '离线', type: 'danger' },
  [DeviceStatus.CHARGING]: { label: '充电中', type: 'warning' },
  [DeviceStatus.FAULT]: { label: '故障', type: 'danger' },
  [DeviceStatus.MAINTENANCE]: { label: '维护中', type: 'info' },
}

const connectorStatusMap: Record<string, { label: string; type: string }> = {
  AVAILABLE: { label: '空闲', type: 'success' },
  CHARGING: { label: '充电中', type: 'warning' },
  FAULTED: { label: '故障', type: 'danger' },
}

function viewDetail(row: any) {
  deviceStore.currentDevice = row
  detailVisible.value = true
}

function getTotalPower(connectors: any[]): number {
  return connectors?.reduce((sum, c) => sum + (c.power || 0), 0) || 0
}
</script>

<template>
  <div class="device-page">
    <!-- 搜索栏 -->
    <el-card shadow="never">
      <el-form :model="deviceStore.query" :rules="searchRules" inline>
        <el-form-item label="关键词">
          <el-input v-model="deviceStore.query.keyword" placeholder="设备编号/OCPP ID" clearable style="width: 200px" @keyup.enter="deviceStore.handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="deviceStore.query.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in deviceStore.statusOptions" :key="opt.label" :label="opt.label" :value="(opt.value as any)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="deviceStore.handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="deviceStore.list" v-loading="deviceStore.loading" stripe border>
        <el-table-column prop="code" label="设备编号" width="180" />
        <el-table-column prop="stationName" label="所属充电站" min-width="150" show-overflow-tooltip />
        <el-table-column prop="model" label="型号" width="130" />
        <el-table-column label="类型" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === DeviceType.DC ? 'danger' : 'info'" size="small" effect="plain">
              {{ row.type === DeviceType.DC ? '直流' : '交流' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="额定功率" width="100" align="right">
          <template #default="{ row }"><span class="font-number">{{ row.power }} kW</span></template>
        </el-table-column>
        <el-table-column label="实时功率" width="100" align="right">
          <template #default="{ row }">
            <span class="font-number" :class="{ 'text-warning': getTotalPower(row.connectors) > 0 }">
              {{ getTotalPower(row.connectors).toFixed(1) }} kW
            </span>
          </template>
        </el-table-column>
        <el-table-column label="接口状态" width="150">
          <template #default="{ row }">
            <div v-for="conn in row.connectors" :key="conn.id" class="connector-item">
              <span class="connector-id">#{{ conn.connectorId }}</span>
              <el-tag :type="(connectorStatusMap[conn.status]?.type as any)" size="small">
                {{ connectorStatusMap[conn.status]?.label || conn.status }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="(statusMap[row.status]?.type as any)" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="warning" link size="small" @click="deviceStore.handleReset(row.id)">重置</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="deviceStore.query.page"
          v-model:page-size="deviceStore.query.size"
          :total="deviceStore.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="deviceStore.handlePageChange"
          @size-change="deviceStore.handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <DetailDialog v-model:visible="detailVisible" @reset="(d) => deviceStore.handleReset(d.id)" />
  </div>
</template>

<style scoped>
.device-page { display: flex; flex-direction: column; gap: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.connector-item { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
.connector-id { font-size: 12px; color: #666; min-width: 24px; }
.text-warning { color: #E6A23C; }
</style>
