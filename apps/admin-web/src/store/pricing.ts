import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { pricingApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {
  PricingStrategy,
  PricingStrategyForm,
  PricingStrategyQuery,
  StationPricingOverride,
  StationPricingQuery,
  TimePeriod,
  MemberDiscount,
} from '@/types'
import { PricingStrategyType, PricingStrategyStatus, DeviceType } from '@/types'

export const usePricingStore = defineStore('pricing', () => {
  // ========== 策略列表状态 ==========
  const list = ref<PricingStrategy[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentStrategy = ref<PricingStrategy | null>(null)
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const isEdit = ref(false)

  const query = reactive<PricingStrategyQuery>({
    keyword: '',
    type: undefined,
    status: undefined,
    deviceType: undefined,
    page: 1,
    size: 10,
  })

  const defaultTimePeriod: () => TimePeriod = () => ({
    startTime: '00:00',
    endTime: '08:00',
    electricityFee: 0.35,
    serviceFee: 0.3,
    periodType: 'VALLEY',
  })

  const defaultMemberDiscount: () => MemberDiscount = () => ({
    level: '普通会员',
    discountRate: 0.95,
    description: '9.5折优惠',
  })

  const form = reactive<PricingStrategyForm>({
    name: '',
    type: PricingStrategyType.UNIFORM,
    deviceType: DeviceType.DC,
    status: PricingStrategyStatus.ACTIVE,
    electricityFee: 1.0,
    serviceFee: 0.5,
    timePeriods: [defaultTimePeriod()],
    memberDiscounts: [defaultMemberDiscount()],
  })

  // ========== 站点定价覆盖状态 ==========
  const stationList = ref<StationPricingOverride[]>([])
  const stationTotal = ref(0)
  const stationLoading = ref(false)
  const stationDialogVisible = ref(false)
  const currentStationPricing = ref<StationPricingOverride | null>(null)

  const stationQuery = reactive<StationPricingQuery>({
    keyword: '',
    strategyId: undefined,
    page: 1,
    size: 10,
  })

  const stationOverrideForm = reactive({
    overrideElectricityFee: 0,
    overrideServiceFee: 0,
  })

  // ========== 策略 CRUD ==========

  async function fetchList() {
    loading.value = true
    try {
      const result = await pricingApi.listStrategies(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取定价策略列表失败')
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id: string) {
    loading.value = true
    try {
      currentStrategy.value = await pricingApi.strategyDetail(id)
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取策略详情失败')
    } finally {
      loading.value = false
    }
  }

  function openCreateDialog() {
    isEdit.value = false
    resetForm()
    dialogVisible.value = true
  }

  function openEditDialog(strategy: PricingStrategy) {
    isEdit.value = true
    currentStrategy.value = strategy
    Object.assign(form, {
      name: strategy.name,
      type: strategy.type,
      deviceType: strategy.deviceType,
      status: strategy.status,
      electricityFee: strategy.electricityFee,
      serviceFee: strategy.serviceFee,
      timePeriods: strategy.timePeriods.length > 0
        ? strategy.timePeriods.map((p) => ({ ...p }))
        : [defaultTimePeriod()],
      memberDiscounts: strategy.memberDiscounts.length > 0
        ? strategy.memberDiscounts.map((d) => ({ ...d }))
        : [defaultMemberDiscount()],
    })
    dialogVisible.value = true
  }

  function resetForm() {
    Object.assign(form, {
      name: '',
      type: PricingStrategyType.UNIFORM,
      deviceType: DeviceType.DC,
      status: PricingStrategyStatus.ACTIVE,
      electricityFee: 1.0,
      serviceFee: 0.5,
      timePeriods: [defaultTimePeriod()],
      memberDiscounts: [defaultMemberDiscount()],
    })
  }

  async function handleSubmit() {
    loading.value = true
    try {
      if (isEdit.value && currentStrategy.value) {
        await pricingApi.updateStrategy(currentStrategy.value.id, form)
        ElMessage.success('策略更新成功')
      } else {
        await pricingApi.createStrategy(form)
        ElMessage.success('策略创建成功')
      }
      dialogVisible.value = false
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      loading.value = false
    }
  }

  async function handleDelete(id: string) {
    try {
      await ElMessageBox.confirm('确定要删除该定价策略吗？关联站点将恢复默认定价。', '确认删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
      loading.value = true
      await pricingApi.deleteStrategy(id)
      ElMessage.success('删除成功')
      await fetchList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || '删除失败')
      }
    } finally {
      loading.value = false
    }
  }

  async function handleToggleStatus(strategy: PricingStrategy) {
    const newStatus = strategy.status === PricingStrategyStatus.ACTIVE
      ? PricingStrategyStatus.INACTIVE
      : PricingStrategyStatus.ACTIVE
    const label = newStatus === PricingStrategyStatus.ACTIVE ? '启用' : '停用'
    try {
      await ElMessageBox.confirm(`确定要${label}该定价策略吗？`, '确认操作', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })
      await pricingApi.toggleStrategyStatus(strategy.id, newStatus)
      ElMessage.success(`${label}成功`)
      await fetchList()
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || `${label}失败`)
      }
    }
  }

  function handlePageChange(page: number) {
    query.page = page
    fetchList()
  }

  function handleSizeChange(size: number) {
    query.size = size
    query.page = 1
    fetchList()
  }

  function handleSearch() {
    query.page = 1
    fetchList()
  }

  function handleReset() {
    query.keyword = ''
    query.type = undefined
    query.status = undefined
    query.deviceType = undefined
    query.page = 1
    fetchList()
  }

  // ========== 分时电价行操作 ==========

  function addTimePeriod() {
    form.timePeriods.push(defaultTimePeriod())
  }

  function removeTimePeriod(index: number) {
    form.timePeriods.splice(index, 1)
  }

  // ========== 会员折扣行操作 ==========

  function addMemberDiscount() {
    form.memberDiscounts.push(defaultMemberDiscount())
  }

  function removeMemberDiscount(index: number) {
    form.memberDiscounts.splice(index, 1)
  }

  // ========== 站点定价覆盖 ==========

  async function fetchStationList() {
    stationLoading.value = true
    try {
      const result = await pricingApi.listStationPricing(stationQuery)
      stationList.value = result.list
      stationTotal.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取站点定价列表失败')
    } finally {
      stationLoading.value = false
    }
  }

  function openStationOverride(row: StationPricingOverride) {
    currentStationPricing.value = row
    stationOverrideForm.overrideElectricityFee = row.overrideElectricityFee ?? row.electricityFee
    stationOverrideForm.overrideServiceFee = row.overrideServiceFee ?? row.serviceFee
    stationDialogVisible.value = true
  }

  async function handleStationOverrideSubmit() {
    if (!currentStationPricing.value) return
    stationLoading.value = true
    try {
      await pricingApi.updateStationPricing(currentStationPricing.value.stationId, stationOverrideForm)
      ElMessage.success('站点定价覆盖更新成功')
      stationDialogVisible.value = false
      await fetchStationList()
    } catch (error: any) {
      ElMessage.error(error.message || '更新失败')
    } finally {
      stationLoading.value = false
    }
  }

  function handleStationPageChange(page: number) {
    stationQuery.page = page
    fetchStationList()
  }

  function handleStationSizeChange(size: number) {
    stationQuery.size = size
    stationQuery.page = 1
    fetchStationList()
  }

  function handleStationSearch() {
    stationQuery.page = 1
    fetchStationList()
  }

  function handleStationReset() {
    stationQuery.keyword = ''
    stationQuery.strategyId = undefined
    stationQuery.page = 1
    fetchStationList()
  }

  return {
    // 策略状态
    list, total, loading, currentStrategy, dialogVisible, detailVisible,
    isEdit, query, form,
    // 站点定价状态
    stationList, stationTotal, stationLoading, stationDialogVisible,
    currentStationPricing, stationQuery, stationOverrideForm,
    // 策略操作
    fetchList, fetchDetail, openCreateDialog, openEditDialog, handleSubmit,
    handleDelete, handleToggleStatus, handlePageChange, handleSizeChange,
    handleSearch, handleReset, resetForm,
    // 分时/折扣行操作
    addTimePeriod, removeTimePeriod, addMemberDiscount, removeMemberDiscount,
    // 站点定价操作
    fetchStationList, openStationOverride, handleStationOverrideSubmit,
    handleStationPageChange, handleStationSizeChange,
    handleStationSearch, handleStationReset,
  }
})
