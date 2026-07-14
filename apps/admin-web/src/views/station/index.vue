<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useStationStore } from '@/store/station'
import { StationStatus } from '@/types'
import FormDialog from './components/FormDialog.vue'
import DetailDrawer from './components/DetailDrawer.vue'

const stationStore = useStationStore()
const formVisible = ref(false)
const detailVisible = ref(false)

onMounted(() => {
  stationStore.fetchList()
})

const statusMap: Record<string, { label: string; type: string }> = {
  [StationStatus.ACTIVE]: { label: '运营中', type: 'success' },
  [StationStatus.INACTIVE]: { label: '已停运', type: 'info' },
  [StationStatus.MAINTENANCE]: { label: '维护中', type: 'warning' },
}

function openCreate() {
  stationStore.openCreateDialog()
  formVisible.value = true
}

function openEdit(row: any) {
  stationStore.openEditDialog(row)
  formVisible.value = true
}

function viewDetail(row: any) {
  stationStore.currentStation = row
  detailVisible.value = true
}

function handleFormSuccess() {
  formVisible.value = false
  stationStore.fetchList()
}
</script>

<template>
  <div class="station-page">
    <!-- 搜索栏 -->
    <el-card shadow="never">
      <el-form :model="stationStore.query" inline>
        <el-form-item label="关键词">
          <el-input v-model="stationStore.query.keyword" placeholder="名称/地址/编号" clearable style="width: 220px" @keyup.enter="stationStore.handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="stationStore.query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="运营中" :value="StationStatus.ACTIVE" />
            <el-option label="已停运" :value="StationStatus.INACTIVE" />
            <el-option label="维护中" :value="StationStatus.MAINTENANCE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="stationStore.handleSearch">搜索</el-button>
          <el-button @click="stationStore.handleReset">重置</el-button>
          <el-button type="success" @click="openCreate">新增充电站</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="stationStore.list" v-loading="stationStore.loading" stripe border>
        <el-table-column prop="code" label="编号" width="130" sortable />
        <el-table-column prop="name" label="充电站名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="设备" width="100" align="center">
          <template #default="{ row }">
            <span class="font-number" :class="{ 'text-success': row.onlineCount > 0 }">{{ row.onlineCount }}</span>
            <span class="text-gray">/{{ row.deviceCount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="综合电价" width="120" align="right">
          <template #default="{ row }">
            <span class="font-number">¥{{ (row.electricityPrice + row.servicePrice).toFixed(2) }}/kWh</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(statusMap[row.status]?.type as any)" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === StationStatus.ACTIVE"
              type="warning" link size="small"
              @click="stationStore.handleStatusChange(row.id, StationStatus.INACTIVE)"
            >停运</el-button>
            <el-button
              v-else
              type="success" link size="small"
              @click="stationStore.handleStatusChange(row.id, StationStatus.ACTIVE)"
            >启用</el-button>
            <el-button type="danger" link size="small" @click="stationStore.handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="stationStore.query.page"
          v-model:page-size="stationStore.query.size"
          :total="stationStore.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="stationStore.handlePageChange"
          @size-change="stationStore.handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 表单弹窗 -->
    <FormDialog v-model:visible="formVisible" @success="handleFormSuccess" />

    <!-- 详情抽屉 -->
    <DetailDrawer v-model:visible="detailVisible" />
  </div>
</template>

<style scoped>
.station-page { display: flex; flex-direction: column; gap: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.text-gray { color: #999; font-size: 12px; }
.text-success { color: #52C41A; }
</style>
