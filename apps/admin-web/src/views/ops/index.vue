<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormRules } from 'element-plus'

const activeTab = ref('workorders')
const loading = ref(false)

const workorders = ref([
  { id: 'W001', no: 'WO-20260713-001', type: 'repair', title: '充电桩故障维修', station: '北京朝阳充电站', device: 'BJ-CY-001-CP03', priority: 'high', status: 'pending', assignee: '', createTime: '2026-07-13 10:20:00', result: '' },
  { id: 'W002', no: 'WO-20260713-002', type: 'maintenance', title: '季度保养维护', station: '上海浦东快充站', device: '全部设备', priority: 'medium', status: 'accepted', assignee: '张工', createTime: '2026-07-13 08:00:00', acceptTime: '2026-07-13 08:15:00', result: '' },
  { id: 'W003', no: 'WO-20260712-001', type: 'repair', title: '充电枪锁止故障', station: '深圳南山超充站', device: 'SZ-NS-001-CP01', priority: 'medium', status: 'completed', assignee: '李工', createTime: '2026-07-12 14:00:00', acceptTime: '2026-07-12 14:10:00', completeTime: '2026-07-12 16:30:00', result: '已更换锁止机构，测试正常' },
])

const inspections = ref([
  { id: 'I001', name: '北京朝阳充电站日常巡检', station: '北京朝阳充电站', devices: 12, items: 24, status: 'pending', planTime: '2026-07-13 09:00', inspector: '' },
  { id: 'I002', name: '上海浦东快充站日常巡检', station: '上海浦东快充站', devices: 8, items: 16, status: 'completed', planTime: '2026-07-13 08:00', inspector: '张工', startTime: '08:05', completeTime: '09:30' },
])

const spareParts = ref([
  { id: 1, name: '充电枪锁止机构', model: 'LC-200', stock: 15, safeStock: 5, price: 280 },
  { id: 2, name: 'CCS充电接口', model: 'CCS2-60A', stock: 8, safeStock: 3, price: 450 },
  { id: 3, name: '控制板', model: 'CB-V3.2', stock: 3, safeStock: 5, price: 1200 },
  { id: 4, name: '显示屏', model: 'LCD-7', stock: 6, safeStock: 2, price: 680 },
])

const workorderStatusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'warning' },
  accepted: { label: '已接单', type: '' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'info' },
}

const priorityMap: Record<string, { label: string; type: string }> = {
  high: { label: '高', type: 'danger' },
  medium: { label: '中', type: 'warning' },
  low: { label: '低', type: 'info' },
}

const typeMap: Record<string, { label: string; type: string }> = {
  repair: { label: '维修', type: 'danger' },
  maintenance: { label: '保养', type: '' },
  inspection: { label: '巡检', type: 'success' },
}

const completeDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const completeForm = ref({ result: '' })
const completeFormRef = ref()
const currentWorkorder = ref<any>(null)

const completeRules: FormRules = {
  result: [
    { required: true, message: '请输入处理结果', trigger: 'blur' },
    { min: 2, max: 500, message: '长度在 2 到 500 个字符', trigger: 'blur' },
  ],
}

async function acceptWorkorder(row: any) {
  await ElMessageBox.confirm(`确定接受工单「${row.title}」？`, '确认接单')
  row.status = 'accepted'
  row.assignee = '当前运维'
  row.acceptTime = new Date().toISOString()
  ElMessage.success('接单成功')
}

function openCompleteDialog(row: any) {
  currentWorkorder.value = row
  completeForm.value.result = ''
  completeDialogVisible.value = true
}

async function submitComplete() {
  try { await completeFormRef.value?.validate() } catch { return }
  if (currentWorkorder.value) {
    currentWorkorder.value.status = 'completed'
    currentWorkorder.value.completeTime = new Date().toISOString()
    currentWorkorder.value.result = completeForm.value.result
  }
  ElMessage.success('工单已完成')
  completeDialogVisible.value = false
}

function viewWorkorderDetail(row: any) {
  currentWorkorder.value = row
  detailDialogVisible.value = true
}
</script>

<template>
  <div class="ops-page">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <!-- 工单管理 -->
        <el-tab-pane label="工单管理" name="workorders">
          <div class="tab-header">
            <el-button type="primary">创建工单</el-button>
          </div>
          <el-table :data="workorders" v-loading="loading" stripe border>
            <el-table-column prop="no" label="工单号" width="180" />
            <el-table-column label="类型" width="70">
              <template #default="{ row }"><el-tag :type="(typeMap[row.type]?.type as any)" size="small">{{ typeMap[row.type]?.label }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="title" label="标题" min-width="150" />
            <el-table-column prop="station" label="充电站" width="160" show-overflow-tooltip />
            <el-table-column prop="device" label="设备" width="150" show-overflow-tooltip />
            <el-table-column label="优先级" width="70" align="center">
              <template #default="{ row }"><el-tag :type="(priorityMap[row.priority]?.type as any)" size="small">{{ priorityMap[row.priority]?.label }}</el-tag></template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }"><el-tag :type="(workorderStatusMap[row.status]?.type as any)" size="small">{{ workorderStatusMap[row.status]?.label }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="assignee" label="处理人" width="80" />
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewWorkorderDetail(row)">详情</el-button>
                <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="acceptWorkorder(row)">接单</el-button>
                <el-button v-if="row.status === 'accepted'" type="success" link size="small" @click="openCompleteDialog(row)">完成</el-button>
                <span v-if="row.status === 'completed'" class="text-success text-sm">✅ {{ row.result }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 巡检管理 -->
        <el-tab-pane label="巡检管理" name="inspections">
          <el-table :data="inspections" stripe border>
            <el-table-column prop="name" label="任务名称" min-width="200" />
            <el-table-column prop="station" label="充电站" width="160" />
            <el-table-column prop="devices" label="设备数" width="80" align="center" />
            <el-table-column prop="items" label="巡检项" width="80" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }"><el-tag :type="row.status === 'completed' ? 'success' : 'warning'" size="small">{{ row.status === 'completed' ? '已完成' : '待巡检' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="inspector" label="巡检人" width="80" />
            <el-table-column prop="planTime" label="计划时间" width="160" />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button v-if="row.status === 'pending'" type="primary" link size="small">开始巡检</el-button>
                <span v-else class="text-success text-sm">✅ {{ row.startTime }} - {{ row.completeTime }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 备件管理 -->
        <el-tab-pane label="备件管理" name="spareParts">
          <div class="tab-header">
            <el-button type="primary">新增备件</el-button>
          </div>
          <el-table :data="spareParts" stripe border>
            <el-table-column prop="name" label="备件名称" min-width="160" />
            <el-table-column prop="model" label="规格型号" width="120" />
            <el-table-column label="库存" width="100" align="center">
              <template #default="{ row }"><span :class="row.stock < row.safeStock ? 'text-danger font-number' : 'font-number'">{{ row.stock }}</span></template>
            </el-table-column>
            <el-table-column prop="safeStock" label="安全库存" width="100" align="center" />
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }"><span class="font-number">¥{{ row.price }}</span></template>
            </el-table-column>
            <el-table-column label="库存预警" width="100" align="center">
              <template #default="{ row }"><el-tag v-if="row.stock < row.safeStock" type="danger" size="small">需补货</el-tag><el-tag v-else type="success" size="small">正常</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default>
                <el-button type="primary" link size="small">编辑</el-button>
                <el-button type="success" link size="small">入库</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 完成工单弹窗 -->
    <el-dialog v-model="completeDialogVisible" title="完成工单" width="500px">
      <el-form ref="completeFormRef" :model="completeForm" :rules="completeRules" label-width="80px">
        <el-form-item label="工单">{{ currentWorkorder?.title }}</el-form-item>
        <el-form-item label="处理结果" prop="result">
          <el-input v-model="completeForm.result" type="textarea" :rows="4" placeholder="请输入处理结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- 工单详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="工单详情" width="600px">
      <template v-if="currentWorkorder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ currentWorkorder.no }}</el-descriptions-item>
          <el-descriptions-item label="类型"><el-tag :type="(typeMap[currentWorkorder.type]?.type as any)" size="small">{{ typeMap[currentWorkorder.type]?.label }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ currentWorkorder.title }}</el-descriptions-item>
          <el-descriptions-item label="充电站">{{ currentWorkorder.station }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ currentWorkorder.device }}</el-descriptions-item>
          <el-descriptions-item label="优先级"><el-tag :type="(priorityMap[currentWorkorder.priority]?.type as any)" size="small">{{ priorityMap[currentWorkorder.priority]?.label }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="(workorderStatusMap[currentWorkorder.status]?.type as any)" size="small">{{ workorderStatusMap[currentWorkorder.status]?.label }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentWorkorder.assignee || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentWorkorder.createTime }}</el-descriptions-item>
          <el-descriptions-item v-if="currentWorkorder.result" label="处理结果" :span="2">{{ currentWorkorder.result }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ops-page { display: flex; flex-direction: column; gap: 16px; }
.tab-header { margin-bottom: 16px; }
.text-success { color: #52C41A; }
.text-danger { color: #FF4D4F; font-weight: bold; }
.text-sm { font-size: 12px; }
</style>
