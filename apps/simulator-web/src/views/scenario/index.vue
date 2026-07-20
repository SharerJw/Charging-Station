<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  VideoPlay,
  VideoPause,
  Edit,
  Delete,
  Document,
  ArrowUp,
  ArrowDown,
  Loading,
  SuccessFilled,
  CircleCloseFilled,
  InfoFilled,
} from '@element-plus/icons-vue'
import { scenarioApi, deviceApi } from '@/api'
import type {
  ScenarioStep,
  ScenarioStepType,
  ScenarioStatus,
  Scenario,
  ExecutionLog,
  ExecutionLogEntry,
  DeviceOption,
} from '@/types'

// Step type definitions
const STEP_TYPES: Record<ScenarioStepType, { label: string; color: string; icon: string; params: { key: string; label: string; type: string; default: unknown; options?: { label: string; value: string }[] }[] }> = {
  CONNECT: {
    label: '连接充电桩',
    color: '#3B82F6',
    icon: '🔗',
    params: [
      { key: 'timeout', label: '超时时间 (ms)', type: 'number', default: 30000 },
      { key: 'retryCount', label: '重试次数', type: 'number', default: 3 },
    ],
  },
  REMOTE_START: {
    label: '远程启动充电',
    color: '#10B981',
    icon: '⚡',
    params: [
      { key: 'connectorId', label: '充电枪 ID', type: 'number', default: 1 },
      { key: 'idTag', label: '用户标签', type: 'string', default: 'DEMO_TAG_001' },
      { key: 'power', label: '目标功率 (kW)', type: 'number', default: 60 },
    ],
  },
  WAIT: {
    label: '等待',
    color: '#F59E0B',
    icon: '⏱',
    params: [
      { key: 'duration', label: '等待时长 (s)', type: 'number', default: 10 },
    ],
  },
  METER_VALUES: {
    label: '上报计量数据',
    color: '#8B5CF6',
    icon: '📊',
    params: [
      { key: 'interval', label: '上报间隔 (s)', type: 'number', default: 5 },
      { key: 'count', label: '上报次数', type: 'number', default: 6 },
      { key: 'powerIncrement', label: '功率递增 (kW)', type: 'number', default: 0 },
    ],
  },
  REMOTE_STOP: {
    label: '远程停止充电',
    color: '#EF4444',
    icon: '⏹',
    params: [
      { key: 'transactionId', label: '交易 ID', type: 'string', default: 'AUTO' },
      { key: 'reason', label: '停止原因', type: 'select', default: 'Remote', options: [
        { label: '远程停止 (Remote)', value: 'Remote' },
        { label: '本地停止 (Local)', value: 'Local' },
        { label: '紧急停止 (EmergencyStop)', value: 'EmergencyStop' },
      ]},
    ],
  },
  INJECT_FAULT: {
    label: '注入故障',
    color: '#DC2626',
    icon: '⚠',
    params: [
      { key: 'faultType', label: '故障类型', type: 'select', default: 'PowerMeterFailure', options: [
        { label: '电表故障 (PowerMeterFailure)', value: 'PowerMeterFailure' },
        { label: '通信故障 (CommunicationFailure)', value: 'CommunicationFailure' },
        { label: '过温保护 (OverTemperature)', value: 'OverTemperature' },
        { label: '接地故障 (GroundFault)', value: 'GroundFault' },
      ]},
      { key: 'severity', label: '严重程度', type: 'select', default: 'ERROR', options: [
        { label: '信息 (INFO)', value: 'INFO' },
        { label: '警告 (WARNING)', value: 'WARNING' },
        { label: '错误 (ERROR)', value: 'ERROR' },
      ]},
    ],
  },
}

const STEP_TYPE_OPTIONS = Object.entries(STEP_TYPES).map(([value, cfg]) => ({
  value: value as ScenarioStepType,
  label: `${cfg.icon} ${cfg.label}`,
}))

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const loading = ref(false)
const scenarios = ref<Scenario[]>([])
const deviceOptions = ref<DeviceOption[]>([])
const deviceLoading = ref(false)
const searchKeyword = ref('')
const filterStatus = ref<ScenarioStatus | ''>('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

// Dialog
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const formRef = ref()
const form = reactive({
  name: '',
  description: '',
  deviceIds: [] as string[],
  steps: [] as ScenarioStep[],
})

const formRules = {
  name: [{ required: true, message: '请输入场景名称', trigger: 'blur' }],
  deviceIds: [{ required: true, type: 'array', min: 1, message: '请选择至少一个设备', trigger: 'change' }],
}

// Execution detail drawer
const drawerVisible = ref(false)
const activeExecution = ref<ExecutionLog | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const statusConfig: Record<ScenarioStatus, { label: string; tagType: string; color: string }> = {
  draft: { label: '草稿', tagType: 'info', color: '#909399' },
  running: { label: '运行中', tagType: 'warning', color: '#E6A23C' },
  completed: { label: '已完成', tagType: 'success', color: '#67C23A' },
  failed: { label: '失败', tagType: 'danger', color: '#F56C6C' },
}

function stepStatusIcon(s: string) {
  switch (s) {
    case 'success': return SuccessFilled
    case 'failed': return CircleCloseFilled
    case 'running': return Loading
    default: return InfoFilled
  }
}

function stepStatusColor(s: string) {
  switch (s) {
    case 'success': return '#67C23A'
    case 'failed': return '#F56C6C'
    case 'running': return '#E6A23C'
    default: return '#C0C4CC'
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function loadScenarios() {
  loading.value = true
  try {
    const res = await scenarioApi.list({
      page: currentPage.value,
      size: pageSize.value,
      keyword: searchKeyword.value || undefined,
      status: filterStatus.value || undefined,
    })
    scenarios.value = (res.list || res) as Scenario[]
    totalCount.value = res.total ?? scenarios.value.length
  } catch {
    // Fallback to empty list when backend is unavailable
    scenarios.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

async function loadDevices() {
  deviceLoading.value = true
  try {
    const res = await deviceApi.list({ page: 1, size: 500 })
    deviceOptions.value = (res.list || res) as DeviceOption[]
  } catch {
    deviceOptions.value = []
  } finally {
    deviceLoading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadScenarios()
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadScenarios()
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

function openCreateDialog() {
  dialogMode.value = 'create'
  editingId.value = null
  resetForm()
  dialogVisible.value = true
  loadDevices()
}

function openEditDialog(row: Scenario) {
  dialogMode.value = 'edit'
  editingId.value = row.id
  form.name = row.name
  form.description = row.description
  form.deviceIds = [...row.deviceIds]
  form.steps = row.steps.map((s, i) => ({ ...s, params: { ...s.params }, order: i }))
  dialogVisible.value = true
  loadDevices()
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.deviceIds = []
  form.steps = []
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  if (form.steps.length === 0) {
    ElMessage.warning('请至少添加一个步骤')
    return
  }

  const payload = {
    name: form.name,
    description: form.description,
    deviceIds: form.deviceIds,
    steps: form.steps.map((s, i) => ({ ...s, order: i })),
  }

  try {
    if (dialogMode.value === 'create') {
      await scenarioApi.create(payload)
      ElMessage.success('场景创建成功')
    } else {
      await scenarioApi.update(editingId.value!, payload)
      ElMessage.success('场景更新成功')
    }
    dialogVisible.value = false
    loadScenarios()
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '操作失败')
  }
}

async function handleDelete(row: Scenario) {
  try {
    await ElMessageBox.confirm(`确定删除场景「${row.name}」？`, '确认删除', { type: 'warning' })
    await scenarioApi.delete(row.id)
    ElMessage.success('场景已删除')
    loadScenarios()
  } catch {
    // cancelled or failed
  }
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

async function handleRun(row: Scenario) {
  try {
    await scenarioApi.execute(row.id)
    row.status = 'running'
    ElMessage.success(`场景「${row.name}」开始执行`)
    loadScenarios()
  } catch (err: unknown) {
    ElMessage.error((err as Error).message || '执行失败')
  }
}

async function handleStop(row: Scenario) {
  try {
    await ElMessageBox.confirm(`确定停止场景「${row.name}」？`, '确认停止', { type: 'warning' })
    await scenarioApi.stop(row.id)
    row.status = 'failed'
    ElMessage.info('场景已停止')
    loadScenarios()
  } catch {
    // cancelled
  }
}

async function viewExecutionLog(row: Scenario) {
  drawerVisible.value = true
  activeExecution.value = null
  try {
    // Try fetching execution detail from API
    const res: any = await scenarioApi.list({ id: row.id, detail: true })
    activeExecution.value = res.execution || buildMockExecution(row)
  } catch {
    activeExecution.value = buildMockExecution(row)
  }

  // If running, start polling
  if (row.status === 'running') {
    startExecutionPolling(row.id)
  }
}

function buildMockExecution(row: Scenario): ExecutionLog {
  return {
    id: `exec-${row.id}`,
    scenarioId: row.id,
    scenarioName: row.name,
    status: row.status,
    startedAt: row.lastRunTime || new Date().toISOString(),
    currentStepIndex: row.status === 'completed' ? row.steps.length : 0,
    totalSteps: row.steps.length,
    completedSteps: row.status === 'completed' ? row.steps.length : 0,
    failedSteps: row.status === 'failed' ? 1 : 0,
    logs: row.steps.map((step, idx) => ({
      timestamp: new Date(Date.now() + idx * 5000).toISOString(),
      stepIndex: idx,
      stepType: step.type,
      status: row.status === 'completed' ? 'success' as const : row.status === 'failed' && idx === 0 ? 'failed' as const : 'pending' as const,
      message: `${STEP_TYPES[step.type].label} - ${row.status === 'completed' ? '完成' : '等待执行'}`,
    })),
  }
}

function startExecutionPolling(scenarioId: string) {
  stopExecutionPolling()
  pollTimer = setInterval(async () => {
    try {
      await loadScenarios()
      const target = scenarios.value.find(s => s.id === scenarioId)
      if (!target || target.status !== 'running') {
        stopExecutionPolling()
        if (target) viewExecutionLog(target)
      }
    } catch {
      // ignore polling errors
    }
  }, 3000)
}

function stopExecutionPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// ---------------------------------------------------------------------------
// Step editor helpers
// ---------------------------------------------------------------------------

let stepUid = 0

function createStepId() {
  return `step-${Date.now()}-${++stepUid}`
}

function addStep() {
  const stepType: ScenarioStepType = 'CONNECT'
  const cfg = STEP_TYPES[stepType]
  const defaultParams: Record<string, unknown> = {}
  for (const p of cfg.params) {
    defaultParams[p.key] = p.default
  }
  form.steps.push({
    id: createStepId(),
    type: stepType,
    label: cfg.label,
    params: defaultParams,
    order: form.steps.length,
  })
}

function removeStep(index: number) {
  form.steps.splice(index, 1)
  reindexSteps()
}

function moveStep(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= form.steps.length) return
  const tmp = form.steps[index]
  form.steps[index] = form.steps[target]
  form.steps[target] = tmp
  reindexSteps()
}

function reindexSteps() {
  form.steps.forEach((s, i) => { s.order = i })
}

function onStepTypeChange(step: ScenarioStep) {
  const cfg = STEP_TYPES[step.type]
  step.label = cfg.label
  const newParams: Record<string, unknown> = {}
  for (const p of cfg.params) {
    newParams[p.key] = p.default
  }
  step.params = newParams
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(() => {
  loadScenarios()
})

onUnmounted(() => {
  stopExecutionPolling()
})
</script>

<template>
  <div class="scenario-page">
    <!-- Header -->
    <div class="page-header">
      <h2 class="page-title">场景编排</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建场景</el-button>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索场景名称"
        clearable
        style="width: 250px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-select v-model="filterStatus" placeholder="全部状态" clearable style="width: 140px" @change="handleSearch">
        <el-option v-for="(cfg, key) in statusConfig" :key="key" :label="cfg.label" :value="key" />
      </el-select>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <!-- Scenario Table -->
    <el-table :data="scenarios" v-loading="loading" stripe border row-key="id" class="scenario-table">
      <el-table-column prop="name" label="场景名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="(statusConfig[row.status as ScenarioStatus]?.tagType as any) || 'info'" size="small" effect="dark">
            {{ statusConfig[row.status as ScenarioStatus]?.label || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="设备数" width="80" align="center">
        <template #default="{ row }">
          {{ row.deviceIds?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="步骤数" width="80" align="center">
        <template #default="{ row }">
          {{ row.steps?.length || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="最后运行时间" width="180" align="center">
        <template #default="{ row }">
          {{ row.lastRunTime || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" align="center" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button
              v-if="row.status !== 'running'"
              type="success"
              size="small"
              :icon="VideoPlay"
              @click="handleRun(row as Scenario)"
            >运行</el-button>
            <el-button
              v-if="row.status === 'running'"
              type="warning"
              size="small"
              :icon="VideoPause"
              @click="handleStop(row as Scenario)"
            >停止</el-button>
            <el-button size="small" :icon="Edit" @click="openEditDialog(row as Scenario)">编辑</el-button>
            <el-button size="small" :icon="Document" @click="viewExecutionLog(row as Scenario)">日志</el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row as Scenario)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalCount"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <!-- ================================================================== -->
    <!-- Create / Edit Dialog                                              -->
    <!-- ================================================================== -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '创建场景' : '编辑场景'"
      width="820px"
      top="5vh"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="场景名称" prop="name">
          <el-input v-model="form.name" placeholder="例: 正常充电全流程测试" maxlength="60" show-word-limit />
        </el-form-item>
        <el-form-item label="场景描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="描述此测试场景的目的" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="关联设备" prop="deviceIds">
          <el-select
            v-model="form.deviceIds"
            multiple
            filterable
            placeholder="选择参与场景的设备"
            style="width: 100%"
            :loading="deviceLoading"
          >
            <el-option
              v-for="d in deviceOptions"
              :key="d.id"
              :label="`${d.name} (${d.ocppId})`"
              :value="d.id"
            />
          </el-select>
        </el-form-item>

        <!-- Step list editor -->
        <el-form-item label="场景步骤">
          <div class="step-editor">
            <div v-if="form.steps.length === 0" class="step-empty">
              <el-text type="info">暂无步骤，请点击下方按钮添加。</el-text>
            </div>

            <div v-for="(step, idx) in form.steps" :key="step.id" class="step-card">
              <div class="step-header">
                <div class="step-index">{{ idx + 1 }}</div>
                <el-select
                  v-model="step.type"
                  size="small"
                  style="width: 200px"
                  @change="onStepTypeChange(step)"
                >
                  <el-option
                    v-for="opt in STEP_TYPE_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
                <div class="step-actions">
                  <el-button :icon="ArrowUp" size="small" circle :disabled="idx === 0" @click="moveStep(idx, -1)" />
                  <el-button :icon="ArrowDown" size="small" circle :disabled="idx === form.steps.length - 1" @click="moveStep(idx, 1)" />
                  <el-button :icon="Delete" size="small" circle type="danger" @click="removeStep(idx)" />
                </div>
              </div>

              <div class="step-params">
                <div
                  v-for="param in STEP_TYPES[step.type].params"
                  :key="param.key"
                  class="param-item"
                >
                  <label class="param-label">{{ param.label }}</label>
                  <el-select
                    v-if="param.type === 'select'"
                    v-model="step.params[param.key]"
                    size="small"
                    style="width: 200px"
                  >
                    <el-option
                      v-for="opt in param.options"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                  <el-input-number
                    v-else-if="param.type === 'number'"
                    v-model="step.params[param.key]"
                    size="small"
                    :min="0"
                    controls-position="right"
                    style="width: 200px"
                  />
                  <el-input
                    v-else
                    v-model="step.params[param.key]"
                    size="small"
                    style="width: 200px"
                    :placeholder="String(param.default)"
                  />
                </div>
              </div>
            </div>

            <el-button type="primary" :icon="Plus" plain size="small" class="add-step-btn" @click="addStep">添加步骤</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ================================================================== -->
    <!-- Execution Detail Drawer                                           -->
    <!-- ================================================================== -->
    <el-drawer
      v-model="drawerVisible"
      title="执行详情"
      size="520px"
      direction="rtl"
    >
      <template v-if="activeExecution">
        <!-- Progress overview -->
        <div class="exec-overview">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="场景名称">{{ activeExecution.scenarioName }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="(statusConfig[activeExecution.status]?.tagType as any)" size="small">
                {{ statusConfig[activeExecution.status]?.label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ activeExecution.startedAt }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ activeExecution.finishedAt || '进行中...' }}</el-descriptions-item>
          </el-descriptions>

          <!-- Progress bar -->
          <div class="exec-progress">
            <div class="progress-label">
              <span>步骤进度</span>
              <span class="font-number">{{ activeExecution.completedSteps }} / {{ activeExecution.totalSteps }}</span>
            </div>
            <el-progress
              :percentage="activeExecution.totalSteps > 0 ? Math.round((activeExecution.completedSteps / activeExecution.totalSteps) * 100) : 0"
              :status="activeExecution.status === 'failed' ? 'exception' : activeExecution.status === 'completed' ? 'success' : undefined"
              :stroke-width="10"
              striped
              :striped-flow="activeExecution.status === 'running'"
            />
          </div>

          <div class="exec-stats">
            <el-tag effect="plain" type="success">完成: {{ activeExecution.completedSteps }}</el-tag>
            <el-tag effect="plain" type="danger">失败: {{ activeExecution.failedSteps }}</el-tag>
            <el-tag effect="plain" type="warning">当前: {{ activeExecution.currentStepIndex + 1 }}</el-tag>
          </div>
        </div>

        <!-- Step timeline -->
        <el-divider content-position="left">步骤执行时间线</el-divider>
        <el-timeline>
          <el-timeline-item
            v-for="(entry, idx) in activeExecution.logs"
            :key="idx"
            :timestamp="entry.timestamp"
            :color="stepStatusColor(entry.status)"
            placement="top"
          >
            <div class="timeline-content">
              <div class="timeline-header">
                <el-icon :size="16" :color="stepStatusColor(entry.status)">
                  <component :is="stepStatusIcon(entry.status)" :class="{ 'spin-icon': entry.status === 'running' }" />
                </el-icon>
                <span class="timeline-step-type">{{ STEP_TYPES[entry.stepType as ScenarioStepType]?.label || entry.stepType }}</span>
                <el-tag :type="entry.status === 'success' ? 'success' : entry.status === 'failed' ? 'danger' : entry.status === 'running' ? 'warning' : 'info'" size="small" effect="plain">
                  {{ entry.status === 'success' ? '成功' : entry.status === 'failed' ? '失败' : entry.status === 'running' ? '执行中' : '等待' }}
                </el-tag>
              </div>
              <div class="timeline-msg">{{ entry.message }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </template>

      <template v-else>
        <div class="drawer-empty">
          <el-icon :size="48" color="#C0C4CC"><Document /></el-icon>
          <el-text type="info">暂无执行记录</el-text>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.scenario-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.scenario-table {
  width: 100%;
}

.table-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

/* ---- Step editor ---- */

.step-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-empty {
  text-align: center;
  padding: 24px 0;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.step-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  transition: box-shadow 0.2s;
}

.step-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.step-params {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding-left: 40px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.add-step-btn {
  align-self: flex-start;
  margin-left: 40px;
}

/* ---- Execution drawer ---- */

.exec-overview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exec-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.exec-stats {
  display: flex;
  gap: 8px;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-step-type {
  font-weight: 500;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.timeline-msg {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding-left: 24px;
}

.drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
}

/* Animation for running icon */
.spin-icon {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.font-number {
  font-family: 'DIN Alternate', monospace;
}
</style>
