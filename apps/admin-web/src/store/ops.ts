import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { opsApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  WorkOrder, WorkOrderQuery,
  Inspection, InspectionQuery,
  SparePart, SparePartQuery,
} from '@/types'

export const useOpsStore = defineStore('ops', () => {
  // ==================== 通用状态 ====================
  const activeTab = ref<'workorders' | 'inspections' | 'spareParts'>('workorders')
  const loading = ref(false)
  const staffOptions = ref<{ id: string; name: string }[]>([])

  // ==================== 工单状态 ====================
  const workorderList = ref<WorkOrder[]>([])
  const workorderTotal = ref(0)
  const currentWorkorder = ref<WorkOrder | null>(null)

  const workorderQuery = reactive<WorkOrderQuery>({
    keyword: '',
    type: undefined,
    status: undefined,
    priority: undefined,
    page: 1,
    size: 10,
  })

  // ==================== 巡检状态 ====================
  const inspectionList = ref<Inspection[]>([])
  const inspectionTotal = ref(0)

  const inspectionQuery = reactive<InspectionQuery>({
    keyword: '',
    status: undefined,
    stationId: undefined,
    page: 1,
    size: 10,
  })

  // ==================== 备件状态 ====================
  const sparePartList = ref<SparePart[]>([])
  const sparePartTotal = ref(0)

  const sparePartQuery = reactive<SparePartQuery>({
    keyword: '',
    category: undefined,
    stockWarning: undefined,
    page: 1,
    size: 10,
  })

  // ==================== 工单操作 ====================
  async function fetchWorkorderList() {
    loading.value = true
    try {
      const result = await opsApi.workorders.list(workorderQuery)
      workorderList.value = result.list
      workorderTotal.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取工单列表失败')
    } finally {
      loading.value = false
    }
  }

  async function fetchWorkorderDetail(id: string) {
    loading.value = true
    try {
      currentWorkorder.value = await opsApi.workorders.detail(id)
    } catch (error: any) {
      ElMessage.error(error.message || '获取工单详情失败')
    } finally {
      loading.value = false
    }
  }

  async function acceptWorkorder(row: WorkOrder) {
    try {
      await ElMessageBox.confirm(`确定接受工单「${row.title}」？`, '确认接单', {
        confirmButtonText: '确定接单',
        cancelButtonText: '取消',
        type: 'info',
      })
      loading.value = true
      await opsApi.workorders.accept(row.id)
      ElMessage.success('接单成功')
      await fetchWorkorderList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '接单失败')
      }
    } finally {
      loading.value = false
    }
  }

  async function completeWorkorder(id: string, result: string) {
    loading.value = true
    try {
      await opsApi.workorders.complete(id, { result })
      ElMessage.success('工单已完成')
      await fetchWorkorderList()
    } catch (error: any) {
      ElMessage.error(error.message || '完成工单失败')
    } finally {
      loading.value = false
    }
  }

  async function transferWorkorder(id: string, assigneeId: string, reason: string) {
    loading.value = true
    try {
      await opsApi.workorders.transfer(id, { assigneeId, reason })
      ElMessage.success('工单已转派')
      await fetchWorkorderList()
    } catch (error: any) {
      ElMessage.error(error.message || '转派工单失败')
    } finally {
      loading.value = false
    }
  }

  function handleWorkorderPageChange(page: number) {
    workorderQuery.page = page
    fetchWorkorderList()
  }

  function handleWorkorderSizeChange(size: number) {
    workorderQuery.size = size
    workorderQuery.page = 1
    fetchWorkorderList()
  }

  function handleWorkorderSearch() {
    workorderQuery.page = 1
    fetchWorkorderList()
  }

  function handleWorkorderReset() {
    workorderQuery.keyword = ''
    workorderQuery.type = undefined
    workorderQuery.status = undefined
    workorderQuery.priority = undefined
    workorderQuery.page = 1
    fetchWorkorderList()
  }

  // ==================== 巡检操作 ====================
  async function fetchInspectionList() {
    loading.value = true
    try {
      const result = await opsApi.inspections.list(inspectionQuery)
      inspectionList.value = result.list
      inspectionTotal.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取巡检列表失败')
    } finally {
      loading.value = false
    }
  }

  async function startInspection(id: string) {
    try {
      await ElMessageBox.confirm('确定开始该巡检任务？', '确认开始', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info',
      })
      loading.value = true
      await opsApi.inspections.start(id)
      ElMessage.success('巡检已开始')
      await fetchInspectionList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '开始巡检失败')
      }
    } finally {
      loading.value = false
    }
  }

  async function completeInspection(id: string, remark: string) {
    loading.value = true
    try {
      await opsApi.inspections.complete(id, { remark })
      ElMessage.success('巡检已完成')
      await fetchInspectionList()
    } catch (error: any) {
      ElMessage.error(error.message || '完成巡检失败')
    } finally {
      loading.value = false
    }
  }

  function handleInspectionPageChange(page: number) {
    inspectionQuery.page = page
    fetchInspectionList()
  }

  function handleInspectionSizeChange(size: number) {
    inspectionQuery.size = size
    inspectionQuery.page = 1
    fetchInspectionList()
  }

  function handleInspectionSearch() {
    inspectionQuery.page = 1
    fetchInspectionList()
  }

  function handleInspectionReset() {
    inspectionQuery.keyword = ''
    inspectionQuery.status = undefined
    inspectionQuery.stationId = undefined
    inspectionQuery.page = 1
    fetchInspectionList()
  }

  // ==================== 备件操作 ====================
  async function fetchSparePartList() {
    loading.value = true
    try {
      const result = await opsApi.spareParts.list(sparePartQuery)
      sparePartList.value = result.list
      sparePartTotal.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取备件列表失败')
    } finally {
      loading.value = false
    }
  }

  async function deleteSparePart(id: string) {
    try {
      await ElMessageBox.confirm('确定要删除该备件吗？此操作不可恢复。', '确认删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
      loading.value = true
      await opsApi.spareParts.delete(id)
      ElMessage.success('删除成功')
      await fetchSparePartList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '删除失败')
      }
    } finally {
      loading.value = false
    }
  }

  async function inboundSparePart(id: string, quantity: number, remark: string) {
    loading.value = true
    try {
      await opsApi.spareParts.inbound(id, { quantity, remark })
      ElMessage.success('入库成功')
      await fetchSparePartList()
    } catch (error: any) {
      ElMessage.error(error.message || '入库失败')
    } finally {
      loading.value = false
    }
  }

  function handleSparePartPageChange(page: number) {
    sparePartQuery.page = page
    fetchSparePartList()
  }

  function handleSparePartSizeChange(size: number) {
    sparePartQuery.size = size
    sparePartQuery.page = 1
    fetchSparePartList()
  }

  function handleSparePartSearch() {
    sparePartQuery.page = 1
    fetchSparePartList()
  }

  function handleSparePartReset() {
    sparePartQuery.keyword = ''
    sparePartQuery.category = undefined
    sparePartQuery.stockWarning = undefined
    sparePartQuery.page = 1
    fetchSparePartList()
  }

  // ==================== 通用 ====================
  async function fetchStaffList() {
    try {
      staffOptions.value = await opsApi.staffList()
    } catch {
      staffOptions.value = []
    }
  }

  /** 根据当前 activeTab 拉取对应列表 */
  function fetchCurrentTabList() {
    switch (activeTab.value) {
      case 'workorders':
        return fetchWorkorderList()
      case 'inspections':
        return fetchInspectionList()
      case 'spareParts':
        return fetchSparePartList()
    }
  }

  return {
    // 通用
    activeTab, loading, staffOptions,
    fetchStaffList, fetchCurrentTabList,
    // 工单
    workorderList, workorderTotal, currentWorkorder, workorderQuery,
    fetchWorkorderList, fetchWorkorderDetail,
    acceptWorkorder, completeWorkorder, transferWorkorder,
    handleWorkorderPageChange, handleWorkorderSizeChange,
    handleWorkorderSearch, handleWorkorderReset,
    // 巡检
    inspectionList, inspectionTotal, inspectionQuery,
    fetchInspectionList, startInspection, completeInspection,
    handleInspectionPageChange, handleInspectionSizeChange,
    handleInspectionSearch, handleInspectionReset,
    // 备件
    sparePartList, sparePartTotal, sparePartQuery,
    fetchSparePartList, deleteSparePart, inboundSparePart,
    handleSparePartPageChange, handleSparePartSizeChange,
    handleSparePartSearch, handleSparePartReset,
  }
})
