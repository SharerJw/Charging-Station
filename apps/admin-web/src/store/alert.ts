import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { alertApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Alert, AlertQuery, AlertLevel, AlertStatus } from '@/types'

export const useAlertStore = defineStore('alert', () => {
  // ==================== 通用状态 ====================
  const loading = ref(false)
  const activeTab = ref<string>('all')

  // ==================== 列表状态 ====================
  const alerts = ref<Alert[]>([])
  const total = ref(0)
  const currentAlert = ref<Alert | null>(null)

  const query = reactive<AlertQuery>({
    level: undefined,
    status: undefined,
    keyword: '',
    stationId: undefined,
    startTime: undefined,
    endTime: undefined,
    page: 1,
    size: 10,
  })

  // ==================== 弹窗状态 ====================
  const handleDialogVisible = ref(false)
  const detailDialogVisible = ref(false)
  const ruleDialogVisible = ref(false)
  const handleForm = reactive({ result: '' })

  // ==================== 告警规则 ====================
  const alertRules = ref<any[]>([])

  // ==================== 常量映射 ====================
  const levelColors: Record<AlertLevel, string> = {
    P0: 'danger',
    P1: 'warning',
    P2: '',
    P3: 'info',
  }

  const statusMap: Record<AlertStatus, { label: string; type: string }> = {
    pending: { label: '待处理', type: 'danger' },
    processing: { label: '处理中', type: 'warning' },
    resolved: { label: '已解决', type: 'success' },
    ignored: { label: '已忽略', type: 'info' },
  }

  // ==================== 计算属性 ====================
  const stats = computed(() => ({
    total: alerts.value.length,
    p0: alerts.value.filter(a => a.level === 'P0').length,
    p1: alerts.value.filter(a => a.level === 'P1').length,
    p2: alerts.value.filter(a => a.level === 'P2').length,
    p3: alerts.value.filter(a => a.level === 'P3').length,
    pending: alerts.value.filter(a => a.status === 'pending').length,
    processing: alerts.value.filter(a => a.status === 'processing').length,
    resolved: alerts.value.filter(a => a.status === 'resolved').length,
  }))

  const pendingAlerts = computed(() =>
    alerts.value.filter(a => a.status === 'pending'),
  )

  const p0Alerts = computed(() =>
    alerts.value.filter(a => a.level === 'P0'),
  )

  // ==================== 列表操作 ====================
  async function fetchAlerts() {
    loading.value = true
    try {
      const params: any = { ...query }
      // 根据 activeTab 过滤
      if (activeTab.value === 'pending') {
        params.status = 'pending'
      } else if (['P0', 'P1', 'P2'].includes(activeTab.value)) {
        params.level = activeTab.value
      }
      if (!params.keyword) delete params.keyword
      if (!params.stationId) delete params.stationId
      if (!params.startTime) delete params.startTime
      if (!params.endTime) delete params.endTime

      const result = await alertApi.list(params)
      alerts.value = result.list || result || []
      total.value = result.total || alerts.value.length
    } catch (error: any) {
      ElMessage.error(error.message || '获取告警列表失败')
    } finally {
      loading.value = false
    }
  }

  async function fetchAlertDetail(id: string) {
    loading.value = true
    try {
      currentAlert.value = await alertApi.detail(id)
      detailDialogVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取告警详情失败')
    } finally {
      loading.value = false
    }
  }

  // ==================== 告警处理 ====================
  function openHandleDialog(alert: Alert) {
    currentAlert.value = alert
    handleForm.result = ''
    handleDialogVisible.value = true
  }

  async function handleAlert() {
    if (!currentAlert.value) return
    if (!handleForm.result.trim() || handleForm.result.trim().length < 2) {
      ElMessage.warning('处理结果不能为空，至少 2 个字符')
      return
    }
    loading.value = true
    try {
      await alertApi.handle(currentAlert.value.id, { result: handleForm.result })
      ElMessage.success('处理成功')
      handleDialogVisible.value = false
      await fetchAlerts()
    } catch (error: any) {
      ElMessage.error(error.message || '处理失败')
    } finally {
      loading.value = false
    }
  }

  async function ignoreAlert(alert: Alert) {
    try {
      await ElMessageBox.confirm(`确定要忽略告警「${alert.title}」吗？`, '确认忽略', {
        type: 'warning',
        confirmButtonText: '确定忽略',
        cancelButtonText: '取消',
      })
      loading.value = true
      await alertApi.ignore(alert.id)
      ElMessage.success('已忽略')
      await fetchAlerts()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '忽略失败')
      }
    } finally {
      loading.value = false
    }
  }

  // ==================== 告警规则 ====================
  async function fetchAlertRules() {
    try {
      alertRules.value = await alertApi.getRules()
    } catch (error: any) {
      ElMessage.error(error.message || '获取告警规则失败')
    }
  }

  async function createAlertRule(data: any) {
    loading.value = true
    try {
      await alertApi.createRule(data)
      ElMessage.success('规则创建成功')
      await fetchAlertRules()
    } catch (error: any) {
      ElMessage.error(error.message || '创建规则失败')
    } finally {
      loading.value = false
    }
  }

  async function updateAlertRule(id: string, data: any) {
    loading.value = true
    try {
      await alertApi.updateRule(id, data)
      ElMessage.success('规则更新成功')
      await fetchAlertRules()
    } catch (error: any) {
      ElMessage.error(error.message || '更新规则失败')
    } finally {
      loading.value = false
    }
  }

  async function deleteAlertRule(id: string) {
    try {
      await ElMessageBox.confirm('确定要删除该告警规则吗？', '确认删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
      loading.value = true
      await alertApi.deleteRule(id)
      ElMessage.success('删除成功')
      await fetchAlertRules()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '删除失败')
      }
    } finally {
      loading.value = false
    }
  }

  async function toggleAlertRuleStatus(id: string, status: string) {
    loading.value = true
    try {
      await alertApi.toggleRuleStatus(id, status)
      ElMessage.success('状态切换成功')
      await fetchAlertRules()
    } catch (error: any) {
      ElMessage.error(error.message || '状态切换失败')
    } finally {
      loading.value = false
    }
  }

  // ==================== 分页操作 ====================
  function handlePageChange(page: number) {
    query.page = page
    fetchAlerts()
  }

  function handleSizeChange(size: number) {
    query.size = size
    query.page = 1
    fetchAlerts()
  }

  function handleSearch() {
    query.page = 1
    fetchAlerts()
  }

  function handleReset() {
    query.keyword = ''
    query.level = undefined
    query.status = undefined
    query.stationId = undefined
    query.startTime = undefined
    query.endTime = undefined
    query.page = 1
    activeTab.value = 'all'
    fetchAlerts()
  }

  function handleTabChange(tab: string) {
    activeTab.value = tab
    query.page = 1
    fetchAlerts()
  }

  return {
    // 通用
    loading, activeTab,
    // 列表
    alerts, total, currentAlert, query,
    // 弹窗
    handleDialogVisible, detailDialogVisible, ruleDialogVisible, handleForm,
    // 规则
    alertRules,
    // 常量
    levelColors, statusMap,
    // 计算
    stats, pendingAlerts, p0Alerts,
    // 操作
    fetchAlerts, fetchAlertDetail,
    openHandleDialog, handleAlert, ignoreAlert,
    fetchAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, toggleAlertRuleStatus,
    handlePageChange, handleSizeChange, handleSearch, handleReset, handleTabChange,
  }
})
