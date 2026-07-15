<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

interface Alert {
  id: string
  level: 'P0' | 'P1' | 'P2' | 'P3'
  title: string
  description: string
  stationName: string
  deviceCode: string
  status: 'pending' | 'processing' | 'resolved' | 'ignored'
  handler?: string
  handleTime?: string
  handleResult?: string
  createTime: string
}

const currentTab = ref('all')
const alerts = ref<Alert[]>([])
const loading = ref(false)
const handleDialogVisible = ref(false)
const ruleDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentAlert = ref<Alert | null>(null)
const handleFormRef = ref<FormInstance>()
const handleForm = ref({ result: '' })

const handleRules: FormRules = {
  result: [
    { required: true, message: '请输入处理结果', trigger: 'blur' },
    { min: 2, max: 200, message: '长度在 2 到 200 个字符', trigger: 'blur' },
  ],
}

const tabs = [
  { label: '全部', value: 'all' },
  { label: 'P0-紧急', value: 'P0' },
  { label: 'P1-严重', value: 'P1' },
  { label: 'P2-警告', value: 'P2' },
  { label: '待处理', value: 'pending' },
]

const levelColors: Record<string, string> = { P0: 'danger', P1: 'warning', P2: '', P3: 'info' }
const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'danger' },
  processing: { label: '处理中', type: 'warning' },
  resolved: { label: '已解决', type: 'success' },
  ignored: { label: '已忽略', type: 'info' },
}

const alertRules = ref([
  { id: 1, name: '设备离线告警', condition: '心跳超时 > 5分钟', level: 'P0', notify: '短信+推送', status: '启用' },
  { id: 2, name: '充电中断告警', condition: '充电中突然断开', level: 'P1', notify: '短信+推送', status: '启用' },
  { id: 3, name: '温度过高告警', condition: '设备温度 > 50°C', level: 'P2', notify: '推送', status: '启用' },
  { id: 4, name: 'SOC异常告警', condition: 'SOC变化率异常', level: 'P2', notify: '推送', status: '停用' },
])

onMounted(() => {
  loadAlerts()
})

async function loadAlerts() {
  loading.value = true
  try {
    // 根据当前标签筛选
    let params: any = {}
    if (currentTab.value === 'pending') {
      params.status = 'pending'
    } else if (['P0', 'P1', 'P2'].includes(currentTab.value)) {
      params.level = currentTab.value
    }

    // 调用真实 API
    const token = localStorage.getItem('admin_token')
    const response = await fetch(`http://localhost:8080/api/v1/ops/alerts?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()

    if (data.code === 0) {
      alerts.value = data.data || []
    } else {
      alerts.value = []
    }
  } catch (error) {
    console.error('Failed to load alerts:', error)
    alerts.value = []
  } finally {
    loading.value = false
  }
}

function openHandleDialog(alert: Alert) {
  currentAlert.value = alert
  handleForm.value.result = ''
  handleDialogVisible.value = true
}

async function submitHandle() {
  try {
    await handleFormRef.value?.validate()
  } catch {
    return
  }
  if (currentAlert.value) {
    currentAlert.value.status = 'resolved'
    currentAlert.value.handler = '当前运维'
    currentAlert.value.handleTime = new Date().toISOString()
    currentAlert.value.handleResult = handleForm.value.result
  }
  ElMessage.success('处理成功')
  handleDialogVisible.value = false
}

function viewDetail(alert: Alert) {
  currentAlert.value = alert
  detailDialogVisible.value = true
}

async function ignoreAlert(alert: Alert) {
  await ElMessageBox.confirm(`确定要忽略告警「${alert.title}」吗？`, '确认忽略', { type: 'warning' })
  alert.status = 'ignored'
  ElMessage.success('已忽略')
}
</script>

<template>
  <div class="alert-page">
    <!-- 标签页 -->
    <el-card shadow="never">
      <el-tabs v-model="currentTab" @tab-change="loadAlerts">
        <el-tab-pane v-for="tab in tabs" :key="tab.value" :label="tab.label" :name="tab.value" />
      </el-tabs>
    </el-card>

    <!-- 告警列表 -->
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>告警列表</span>
          <el-button @click="ruleDialogVisible = true">告警规则</el-button>
        </div>
      </template>
      <el-table :data="alerts" v-loading="loading" stripe border>
        <el-table-column prop="level" label="级别" width="80" align="center">
          <template #default="{ row }"><el-tag :type="(levelColors[row.level] as any)" size="small">{{ row.level }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="title" label="告警标题" width="160" />
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="stationName" label="充电站" width="160" show-overflow-tooltip />
        <el-table-column prop="deviceCode" label="设备" width="150" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }"><el-tag :type="(statusMap[row.status]?.type as any)" size="small">{{ statusMap[row.status]?.label }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createTime" label="时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row as any)">详情</el-button>
            <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="openHandleDialog(row as any)">处理</el-button>
            <el-button v-if="row.status === 'pending'" type="info" link size="small" @click="ignoreAlert(row as any)">忽略</el-button>
            <span v-if="row.status === 'resolved'" class="text-success text-sm">✅ {{ row.handler }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleDialogVisible" title="处理告警" width="500px">
      <el-form ref="handleFormRef" :model="handleForm" :rules="handleRules" label-width="80px">
        <el-form-item label="告警">{{ currentAlert?.title }}</el-form-item>
        <el-form-item label="描述">{{ currentAlert?.description }}</el-form-item>
        <el-form-item label="处理结果" required>
          <el-input v-model="handleForm.result" type="textarea" :rows="3" placeholder="请输入处理结果" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 告警规则弹窗 -->
    <el-dialog v-model="ruleDialogVisible" title="告警规则配置" width="700px">
      <el-table :data="alertRules" border size="small">
        <el-table-column prop="name" label="规则名称" />
        <el-table-column prop="condition" label="触发条件" />
        <el-table-column prop="level" label="告警级别" width="80" />
        <el-table-column prop="notify" label="通知方式" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }"><el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small">编辑</el-button>
            <el-button :type="row.status === '启用' ? 'warning' : 'success'" link size="small">{{ row.status === '启用' ? '停用' : '启用' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer><el-button type="primary">新增规则</el-button></template>
    </el-dialog>

    <!-- 告警详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="告警详情" width="600px">
      <template v-if="currentAlert">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="告警级别">
            <el-tag :type="(levelColors[currentAlert.level] as any)" size="small">{{ currentAlert.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(statusMap[currentAlert.status]?.type as any)" size="small">{{ statusMap[currentAlert.status]?.label }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警标题" :span="2">{{ currentAlert.title }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentAlert.description }}</el-descriptions-item>
          <el-descriptions-item label="充电站">{{ currentAlert.stationName }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ currentAlert.deviceCode }}</el-descriptions-item>
          <el-descriptions-item label="告警时间" :span="2">{{ currentAlert.createTime }}</el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handler" label="处理人">{{ currentAlert.handler }}</el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handleTime" label="处理时间">{{ currentAlert.handleTime }}</el-descriptions-item>
          <el-descriptions-item v-if="currentAlert.handleResult" label="处理结果" :span="2">{{ currentAlert.handleResult }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.alert-page { display: flex; flex-direction: column; gap: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.text-success { color: #52C41A; }
.text-sm { font-size: 12px; }
</style>
