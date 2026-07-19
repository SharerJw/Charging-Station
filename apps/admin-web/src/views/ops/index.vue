<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useOpsStore } from '@/store/ops'
import type { WorkOrder, SparePart } from '@/types'
import {
  WorkOrderStatus, WorkOrderType, WorkOrderPriority,
  InspectionStatus,
} from '@/types'
import PriorityTag from './components/PriorityTag.vue'
import StatusTag from './components/StatusTag.vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const opsStore = useOpsStore()

// ==================== 工单相关 ====================
const completeDialogVisible = ref(false)
const transferDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const completeFormRef = ref<FormInstance>()
const transferFormRef = ref<FormInstance>()

const completeForm = ref({ result: '' })
const transferForm = ref({ assigneeId: '', reason: '' })

const completeRules: FormRules = {
  result: [
    { required: true, message: '请输入处理结果', trigger: 'blur' },
    { min: 2, max: 500, message: '长度在 2 到 500 个字符', trigger: 'blur' },
  ],
}

const transferRules: FormRules = {
  assigneeId: [{ required: true, message: '请选择转派人', trigger: 'change' }],
  reason: [
    { required: true, message: '请输入转派原因', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' },
  ],
}

const typeMap: Record<string, { label: string; type: string }> = {
  [WorkOrderType.REPAIR]: { label: '维修', type: 'danger' },
  [WorkOrderType.MAINTENANCE]: { label: '保养', type: '' },
  [WorkOrderType.INSPECTION]: { label: '巡检', type: 'success' },
}

function openCompleteDialog(row: WorkOrder) {
  opsStore.currentWorkorder = row
  completeForm.value.result = ''
  completeDialogVisible.value = true
}

async function submitComplete() {
  try {
    await completeFormRef.value?.validate()
  } catch {
    return
  }
  if (opsStore.currentWorkorder) {
    await opsStore.completeWorkorder(opsStore.currentWorkorder.id, completeForm.value.result)
    completeDialogVisible.value = false
  }
}

function openTransferDialog(row: WorkOrder) {
  opsStore.currentWorkorder = row
  transferForm.value = { assigneeId: '', reason: '' }
  transferDialogVisible.value = true
  opsStore.fetchStaffList()
}

async function submitTransfer() {
  try {
    await transferFormRef.value?.validate()
  } catch {
    return
  }
  if (opsStore.currentWorkorder) {
    await opsStore.transferWorkorder(
      opsStore.currentWorkorder.id,
      transferForm.value.assigneeId,
      transferForm.value.reason,
    )
    transferDialogVisible.value = false
  }
}

function viewWorkorderDetail(row: WorkOrder) {
  opsStore.currentWorkorder = row
  detailDialogVisible.value = true
}

// ==================== 巡检相关 ====================
const inspectionCompleteDialogVisible = ref(false)
const inspectionCompleteForm = ref({ remark: '' })

function openInspectionComplete(row: any) {
  opsStore.currentWorkorder = row
  inspectionCompleteForm.value.remark = ''
  inspectionCompleteDialogVisible.value = true
}

async function submitInspectionComplete() {
  if (opsStore.currentWorkorder) {
    await opsStore.completeInspection(
      opsStore.currentWorkorder.id,
      inspectionCompleteForm.value.remark,
    )
    inspectionCompleteDialogVisible.value = false
  }
}

const inspectionStatusMap: Record<string, { label: string; type: string }> = {
  [InspectionStatus.PENDING]: { label: '待巡检', type: 'warning' },
  [InspectionStatus.IN_PROGRESS]: { label: '巡检中', type: '' },
  [InspectionStatus.COMPLETED]: { label: '已完成', type: 'success' },
  [InspectionStatus.CANCELLED]: { label: '已取消', type: 'info' },
}

// ==================== 备件相关 ====================
const spareDialogVisible = ref(false)
const spareFormRef = ref<FormInstance>()
const inboundDialogVisible = ref(false)
const isSpareEdit = ref(false)

const spareForm = ref({
  id: '',
  code: '',
  name: '',
  specification: '',
  category: '',
  unit: '个',
  safetyStock: 0,
  unitPrice: 0,
  supplier: '',
  remark: '',
})

const inboundForm = ref({ id: '', name: '', quantity: 1, remark: '' })

const spareRules: FormRules = {
  code: [{ required: true, message: '请输入备件编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入备件名称', trigger: 'blur' }],
  specification: [{ required: true, message: '请输入规格', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

const categoryOptions = ['电气件', '机械件', '结构件', '耗材', '其他']

function openSpareCreate() {
  isSpareEdit.value = false
  spareForm.value = {
    id: '', code: '', name: '', specification: '', category: '',
    unit: '个', safetyStock: 0, unitPrice: 0, supplier: '', remark: '',
  }
  spareDialogVisible.value = true
}

function openSpareEdit(row: SparePart) {
  isSpareEdit.value = true
  spareForm.value = {
    id: row.id,
    code: row.code,
    name: row.name,
    specification: row.specification,
    category: row.category,
    unit: row.unit,
    safetyStock: row.safetyStock,
    unitPrice: row.unitPrice,
    supplier: row.supplier,
    remark: row.remark,
  }
  spareDialogVisible.value = true
}

async function submitSpare() {
  try {
    await spareFormRef.value?.validate()
  } catch {
    return
  }
  if (isSpareEdit.value) {
    await (await import('@/api')).opsApi.spareParts.update(spareForm.value.id, spareForm.value)
    ElMessage.success('更新成功')
  } else {
    await (await import('@/api')).opsApi.spareParts.create(spareForm.value)
    ElMessage.success('创建成功')
  }
  spareDialogVisible.value = false
  opsStore.fetchSparePartList()
}

function openInbound(row: SparePart) {
  inboundForm.value = { id: row.id, name: row.name, quantity: 1, remark: '' }
  inboundDialogVisible.value = true
}

async function submitInbound() {
  if (inboundForm.value.quantity <= 0) {
    ElMessage.warning('入库数量必须大于 0')
    return
  }
  await opsStore.inboundSparePart(
    inboundForm.value.id,
    inboundForm.value.quantity,
    inboundForm.value.remark,
  )
  inboundDialogVisible.value = false
}

// ==================== Tab 切换 ====================
watch(() => opsStore.activeTab, () => {
  opsStore.fetchCurrentTabList()
})

onMounted(() => {
  opsStore.fetchWorkorderList()
})
</script>

<template>
  <div class="ops-page">
    <el-card shadow="never">
      <el-tabs v-model="opsStore.activeTab">

        <!-- ==================== 工单管理 ==================== -->
        <el-tab-pane label="工单管理" name="workorders">
          <!-- 搜索栏 -->
          <el-form :model="opsStore.workorderQuery" inline class="search-bar">
            <el-form-item label="关键词">
              <el-input
                v-model="opsStore.workorderQuery.keyword"
                placeholder="工单号/标题/充电站"
                clearable
                style="width: 200px"
                @keyup.enter="opsStore.handleWorkorderSearch"
              />
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="opsStore.workorderQuery.type" placeholder="全部" clearable style="width: 100px">
                <el-option label="维修" :value="WorkOrderType.REPAIR" />
                <el-option label="保养" :value="WorkOrderType.MAINTENANCE" />
                <el-option label="巡检" :value="WorkOrderType.INSPECTION" />
              </el-select>
            </el-form-item>
            <el-form-item label="优先级">
              <el-select v-model="opsStore.workorderQuery.priority" placeholder="全部" clearable style="width: 100px">
                <el-option label="高" :value="WorkOrderPriority.HIGH" />
                <el-option label="中" :value="WorkOrderPriority.MEDIUM" />
                <el-option label="低" :value="WorkOrderPriority.LOW" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="opsStore.workorderQuery.status" placeholder="全部" clearable style="width: 110px">
                <el-option label="待处理" :value="WorkOrderStatus.PENDING" />
                <el-option label="已接单" :value="WorkOrderStatus.ACCEPTED" />
                <el-option label="已完成" :value="WorkOrderStatus.COMPLETED" />
                <el-option label="已关闭" :value="WorkOrderStatus.CLOSED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="opsStore.handleWorkorderSearch">搜索</el-button>
              <el-button @click="opsStore.handleWorkorderReset">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="opsStore.workorderList" v-loading="opsStore.loading" stripe border>
            <el-table-column prop="orderNo" label="工单号" width="180" sortable />
            <el-table-column label="类型" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="(typeMap[row.type]?.type as any)" size="small">
                  {{ typeMap[row.type]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="优先级" width="70" align="center">
              <template #default="{ row }">
                <PriorityTag :priority="row.priority" />
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <StatusTag :status="row.status" />
              </template>
            </el-table-column>
            <el-table-column prop="stationName" label="充电站" min-width="140" show-overflow-tooltip />
            <el-table-column prop="deviceCode" label="设备" width="140" show-overflow-tooltip />
            <el-table-column prop="assigneeName" label="处理人" width="80" />
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="SLA 截止" width="160">
              <template #default="{ row }">
                <span :class="{ 'text-danger': new Date(row.slaDeadline) < new Date() && row.status !== 'completed' && row.status !== 'closed' }">
                  {{ row.slaDeadline }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewWorkorderDetail(row as unknown as WorkOrder)">详情</el-button>
                <el-button
                  v-if="row.status === WorkOrderStatus.PENDING"
                  type="primary" link size="small"
                  @click="opsStore.acceptWorkorder(row as unknown as WorkOrder)"
                >接单</el-button>
                <el-button
                  v-if="row.status === WorkOrderStatus.ACCEPTED"
                  type="success" link size="small"
                  @click="openCompleteDialog(row as unknown as WorkOrder)"
                >完成</el-button>
                <el-button
                  v-if="row.status === WorkOrderStatus.ACCEPTED"
                  type="warning" link size="small"
                  @click="openTransferDialog(row as unknown as WorkOrder)"
                >转派</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="opsStore.workorderQuery.page"
              v-model:page-size="opsStore.workorderQuery.size"
              :total="opsStore.workorderTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="opsStore.handleWorkorderPageChange"
              @size-change="opsStore.handleWorkorderSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 巡检管理 ==================== -->
        <el-tab-pane label="巡检管理" name="inspections">
          <!-- 搜索栏 -->
          <el-form :model="opsStore.inspectionQuery" inline class="search-bar">
            <el-form-item label="关键词">
              <el-input
                v-model="opsStore.inspectionQuery.keyword"
                placeholder="任务名称/充电站"
                clearable
                style="width: 200px"
                @keyup.enter="opsStore.handleInspectionSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="opsStore.inspectionQuery.status" placeholder="全部" clearable style="width: 110px">
                <el-option label="待巡检" :value="InspectionStatus.PENDING" />
                <el-option label="巡检中" :value="InspectionStatus.IN_PROGRESS" />
                <el-option label="已完成" :value="InspectionStatus.COMPLETED" />
                <el-option label="已取消" :value="InspectionStatus.CANCELLED" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="opsStore.handleInspectionSearch">搜索</el-button>
              <el-button @click="opsStore.handleInspectionReset">重置</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="opsStore.inspectionList" v-loading="opsStore.loading" stripe border>
            <el-table-column prop="name" label="任务名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="stationName" label="充电站" width="160" show-overflow-tooltip />
            <el-table-column prop="deviceCount" label="设备数" width="80" align="center" />
            <el-table-column label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="(inspectionStatusMap[row.status]?.type as any)" size="small">
                  {{ inspectionStatusMap[row.status]?.label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="inspectorName" label="巡检人" width="80" />
            <el-table-column prop="scheduledDate" label="计划日期" width="120" />
            <el-table-column prop="startTime" label="开始时间" width="160" />
            <el-table-column prop="completeTime" label="完成时间" width="160" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === InspectionStatus.PENDING"
                  type="primary" link size="small"
                  @click="opsStore.startInspection(row.id)"
                >开始巡检</el-button>
                <el-button
                  v-if="row.status === InspectionStatus.IN_PROGRESS"
                  type="success" link size="small"
                  @click="openInspectionComplete(row)"
                >完成巡检</el-button>
                <el-button type="primary" link size="small">详情</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="opsStore.inspectionQuery.page"
              v-model:page-size="opsStore.inspectionQuery.size"
              :total="opsStore.inspectionTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="opsStore.handleInspectionPageChange"
              @size-change="opsStore.handleInspectionSizeChange"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 备件管理 ==================== -->
        <el-tab-pane label="备件管理" name="spareParts">
          <!-- 搜索栏 -->
          <el-form :model="opsStore.sparePartQuery" inline class="search-bar">
            <el-form-item label="关键词">
              <el-input
                v-model="opsStore.sparePartQuery.keyword"
                placeholder="编码/名称/规格"
                clearable
                style="width: 200px"
                @keyup.enter="opsStore.handleSparePartSearch"
              />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="opsStore.sparePartQuery.category" placeholder="全部" clearable style="width: 110px">
                <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="库存预警">
              <el-select v-model="opsStore.sparePartQuery.stockWarning" placeholder="全部" clearable style="width: 100px">
                <el-option label="是" :value="true" />
                <el-option label="否" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="opsStore.handleSparePartSearch">搜索</el-button>
              <el-button @click="opsStore.handleSparePartReset">重置</el-button>
              <el-button type="success" @click="openSpareCreate">新增备件</el-button>
            </el-form-item>
          </el-form>

          <!-- 数据表格 -->
          <el-table :data="opsStore.sparePartList" v-loading="opsStore.loading" stripe border>
            <el-table-column prop="code" label="备件编码" width="130" />
            <el-table-column prop="name" label="备件名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="specification" label="规格" width="120" show-overflow-tooltip />
            <el-table-column prop="category" label="分类" width="80" align="center" />
            <el-table-column label="库存" width="90" align="center">
              <template #default="{ row }">
                <span
                  class="font-number"
                  :class="{ 'text-danger font-bold': row.stock < row.safetyStock }"
                >{{ row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="安全库存" width="90" align="center">
              <template #default="{ row }">
                <span class="font-number">{{ row.safetyStock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="库存预警" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.stock < row.safetyStock" type="danger" size="small">需补货</el-tag>
                <el-tag v-else type="success" size="small">正常</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="openSpareEdit(row as unknown as SparePart)">编辑</el-button>
                <el-button type="success" link size="small" @click="openInbound(row as unknown as SparePart)">入库</el-button>
                <el-button type="danger" link size="small" @click="opsStore.deleteSparePart(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="opsStore.sparePartQuery.page"
              v-model:page-size="opsStore.sparePartQuery.size"
              :total="opsStore.sparePartTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="opsStore.handleSparePartPageChange"
              @size-change="opsStore.handleSparePartSizeChange"
            />
          </div>
        </el-tab-pane>

      </el-tabs>
    </el-card>

    <!-- ==================== 工单完成弹窗 ==================== -->
    <el-dialog v-model="completeDialogVisible" title="完成工单" width="500px" destroy-on-close>
      <el-form ref="completeFormRef" :model="completeForm" :rules="completeRules" label-width="80px">
        <el-form-item label="工单">
          <span>{{ opsStore.currentWorkorder?.title }}</span>
        </el-form-item>
        <el-form-item label="处理结果" prop="result">
          <el-input
            v-model="completeForm.result"
            type="textarea"
            :rows="4"
            placeholder="请输入处理结果"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete" :loading="opsStore.loading">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 工单转派弹窗 ==================== -->
    <el-dialog v-model="transferDialogVisible" title="转派工单" width="500px" destroy-on-close>
      <el-form ref="transferFormRef" :model="transferForm" :rules="transferRules" label-width="80px">
        <el-form-item label="工单">
          <span>{{ opsStore.currentWorkorder?.title }}</span>
        </el-form-item>
        <el-form-item label="转派人" prop="assigneeId">
          <el-select v-model="transferForm.assigneeId" placeholder="请选择运维人员" style="width: 100%">
            <el-option
              v-for="s in opsStore.staffOptions"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="转派原因" prop="reason">
          <el-input
            v-model="transferForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入转派原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTransfer" :loading="opsStore.loading">确认转派</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 工单详情弹窗 ==================== -->
    <el-dialog v-model="detailDialogVisible" title="工单详情" width="650px" destroy-on-close>
      <template v-if="opsStore.currentWorkorder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单号">{{ opsStore.currentWorkorder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="(typeMap[opsStore.currentWorkorder.type]?.type as any)" size="small">
              {{ typeMap[opsStore.currentWorkorder.type]?.label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <PriorityTag :priority="opsStore.currentWorkorder.priority" />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <StatusTag :status="opsStore.currentWorkorder.status" />
          </el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ opsStore.currentWorkorder.title }}</el-descriptions-item>
          <el-descriptions-item label="充电站">{{ opsStore.currentWorkorder.stationName }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ opsStore.currentWorkorder.deviceCode }}</el-descriptions-item>
          <el-descriptions-item label="处理人">{{ opsStore.currentWorkorder.assigneeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ opsStore.currentWorkorder.creatorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ opsStore.currentWorkorder.createTime }}</el-descriptions-item>
          <el-descriptions-item label="SLA 截止">{{ opsStore.currentWorkorder.slaDeadline }}</el-descriptions-item>
          <el-descriptions-item v-if="opsStore.currentWorkorder.acceptTime" label="接单时间">{{ opsStore.currentWorkorder.acceptTime }}</el-descriptions-item>
          <el-descriptions-item v-if="opsStore.currentWorkorder.completeTime" label="完成时间">{{ opsStore.currentWorkorder.completeTime }}</el-descriptions-item>
          <el-descriptions-item v-if="opsStore.currentWorkorder.description" label="描述" :span="2">{{ opsStore.currentWorkorder.description }}</el-descriptions-item>
          <el-descriptions-item v-if="opsStore.currentWorkorder.result" label="处理结果" :span="2">{{ opsStore.currentWorkorder.result }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <!-- ==================== 巡检完成弹窗 ==================== -->
    <el-dialog v-model="inspectionCompleteDialogVisible" title="完成巡检" width="500px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="巡检任务">
          <span>{{ (opsStore.currentWorkorder as any)?.name }}</span>
        </el-form-item>
        <el-form-item label="巡检备注">
          <el-input
            v-model="inspectionCompleteForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入巡检结果备注"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inspectionCompleteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInspectionComplete" :loading="opsStore.loading">确认完成</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 备件表单弹窗 ==================== -->
    <el-dialog v-model="spareDialogVisible" :title="isSpareEdit ? '编辑备件' : '新增备件'" width="560px" destroy-on-close>
      <el-form ref="spareFormRef" :model="spareForm" :rules="spareRules" label-width="90px">
        <el-form-item label="备件编码" prop="code">
          <el-input v-model="spareForm.code" placeholder="如 SP-001" :disabled="isSpareEdit" />
        </el-form-item>
        <el-form-item label="备件名称" prop="name">
          <el-input v-model="spareForm.name" placeholder="请输入备件名称" />
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="spareForm.specification" placeholder="如 CCS2-60A" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="spareForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="spareForm.unit" placeholder="个/套/件" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安全库存">
              <el-input-number v-model="spareForm.safetyStock" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单价 (元)">
              <el-input-number v-model="spareForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="spareForm.supplier" placeholder="供应商名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="spareForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="spareDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSpare" :loading="opsStore.loading">
          {{ isSpareEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 备件入库弹窗 ==================== -->
    <el-dialog v-model="inboundDialogVisible" title="备件入库" width="420px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="备件">
          <span>{{ inboundForm.name }}</span>
        </el-form-item>
        <el-form-item label="入库数量">
          <el-input-number v-model="inboundForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inboundForm.remark" type="textarea" :rows="2" placeholder="入库备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inboundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitInbound" :loading="opsStore.loading">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.ops-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.search-bar {
  margin-bottom: 16px;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.text-danger {
  color: #ff4d4f;
}
.font-bold {
  font-weight: bold;
}
</style>
