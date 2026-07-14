<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useOrderStore } from '@/store/order'
import { OrderStatus } from '@/types'
import type { FormRules } from 'element-plus'
import DetailDrawer from './components/DetailDrawer.vue'

const orderStore = useOrderStore()
const detailVisible = ref(false)

const refundRules: FormRules = {
  amount: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入退款原因', trigger: 'blur' }, { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' }],
}

onMounted(() => {
  orderStore.fetchList()
})

const statusMap: Record<string, { label: string; type: string }> = {
  [OrderStatus.CHARGING]: { label: '充电中', type: 'warning' },
  [OrderStatus.PAID]: { label: '已完成', type: 'success' },
  [OrderStatus.REFUNDING]: { label: '退款中', type: 'info' },
  [OrderStatus.ABNORMAL]: { label: '异常', type: 'danger' },
  [OrderStatus.CANCELLED]: { label: '已取消', type: 'info' },
}

function viewDetail(row: any) {
  orderStore.currentOrder = row
  detailVisible.value = true
}

function formatDuration(seconds: number): string {
  if (!seconds) return '-'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}时${m}分` : `${m}分`
}
</script>

<template>
  <div class="order-page">
    <!-- 搜索栏 -->
    <el-card shadow="never">
      <el-form :model="orderStore.query" inline>
        <el-form-item label="订单号">
          <el-input v-model="orderStore.query.orderNo" placeholder="请输入订单号" clearable style="width: 180px" @keyup.enter="orderStore.handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="orderStore.query.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in orderStore.statusOptions" :key="opt.label" :label="opt.label" :value="(opt.value as any)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="orderStore.handleSearch">搜索</el-button>
          <el-button>导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="orderStore.list" v-loading="orderStore.loading" stripe border>
        <el-table-column prop="orderNo" label="订单号" width="170" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <div>{{ row.userName }}</div>
            <div class="text-xs text-gray">{{ row.userPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="stationName" label="充电站" min-width="150" show-overflow-tooltip />
        <el-table-column prop="deviceCode" label="设备" width="140" show-overflow-tooltip />
        <el-table-column label="电量" width="100" align="right">
          <template #default="{ row }"><span class="font-number">{{ row.consumedEnergy || '-' }} kWh</span></template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="{ row }"><span class="font-number amount">¥{{ row.payableAmount.toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column label="时长" width="80" align="center">
          <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="(statusMap[row.status]?.type as any)" size="small">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === OrderStatus.PAID" type="warning" link size="small" @click="orderStore.openRefundDialog(row as any)">退款</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="orderStore.query.page"
          v-model:page-size="orderStore.query.size"
          :total="orderStore.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="orderStore.handlePageChange"
          @size-change="orderStore.handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <DetailDrawer v-model:visible="detailVisible" />

    <!-- 退款弹窗 -->
    <el-dialog v-model="orderStore.refundDialogVisible" title="申请退款" width="480px">
      <el-form :model="orderStore.refundForm" :rules="refundRules" label-width="80px">
        <el-form-item label="退款金额">
          <el-input-number v-model="orderStore.refundForm.amount" :min="0.01" :max="orderStore.currentOrder?.payableAmount || 0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="退款原因">
          <el-input v-model="orderStore.refundForm.reason" type="textarea" :rows="3" placeholder="请输入退款原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderStore.refundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="orderStore.loading" @click="orderStore.handleRefund">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.order-page { display: flex; flex-direction: column; gap: 16px; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
.text-xs { font-size: 12px; }
.text-gray { color: #999; }
.amount { color: #FF4D4F; font-weight: bold; }
</style>
