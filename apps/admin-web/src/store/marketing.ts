import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { marketingApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

// ==================== Types ====================

export interface Coupon {
  id: string
  name: string
  type: 'FIXED' | 'PERCENT'
  value: number
  minAmount: number
  total: number
  usedCount: number
  status: 'ACTIVE' | 'DISABLED' | 'EXPIRED'
  validStart: string
  validEnd: string
  description: string
  createdAt: string
}

export interface CouponForm {
  name: string
  type: 'FIXED' | 'PERCENT'
  value: number
  minAmount: number
  total: number
  validStart: string
  validEnd: string
  description: string
}

export interface Activity {
  id: string
  name: string
  type: 'FIRST_CHARGE' | 'LIMITED_TIME' | 'RED_ENVELOPE' | 'OTHER'
  status: 'ACTIVE' | 'DISABLED' | 'EXPIRED'
  startTime: string
  endTime: string
  participantCount: number
  description: string
  rules: string
  createdAt: string
}

export interface ActivityForm {
  name: string
  type: 'FIRST_CHARGE' | 'LIMITED_TIME' | 'RED_ENVELOPE' | 'OTHER'
  startTime: string
  endTime: string
  description: string
  rules: string
}

export interface RechargePackage {
  id: string
  name: string
  amount: number
  giftAmount: number
  giftCouponId: string
  status: 'ACTIVE' | 'DISABLED'
  sort: number
  soldCount: number
  description: string
  createdAt: string
}

export interface RechargePackageForm {
  name: string
  amount: number
  giftAmount: number
  giftCouponId: string
  sort: number
  description: string
}

// ==================== Coupon Store ====================

export const useCouponStore = defineStore('coupon', () => {
  const list = ref<Coupon[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentRow = ref<Coupon | null>(null)
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const isEdit = ref(false)

  const query = reactive({
    keyword: '',
    status: undefined as string | undefined,
    type: undefined as string | undefined,
    page: 1,
    size: 10,
  })

  const form = reactive<CouponForm>({
    name: '',
    type: 'FIXED',
    value: 0,
    minAmount: 0,
    total: 100,
    validStart: '',
    validEnd: '',
    description: '',
  })

  function resetForm() {
    Object.assign(form, {
      name: '', type: 'FIXED', value: 0, minAmount: 0,
      total: 100, validStart: '', validEnd: '', description: '',
    })
  }

  async function fetchList() {
    loading.value = true
    try {
      const result = await marketingApi.couponList(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取优惠券列表失败')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    query.page = 1
    fetchList()
  }

  function handleReset() {
    query.keyword = ''
    query.status = undefined
    query.type = undefined
    query.page = 1
    fetchList()
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

  function openCreateDialog() {
    isEdit.value = false
    currentRow.value = null
    resetForm()
    dialogVisible.value = true
  }

  function openEditDialog(row: Coupon) {
    isEdit.value = true
    currentRow.value = row
    Object.assign(form, {
      name: row.name,
      type: row.type,
      value: row.value,
      minAmount: row.minAmount,
      total: row.total,
      validStart: row.validStart,
      validEnd: row.validEnd,
      description: row.description,
    })
    dialogVisible.value = true
  }

  async function viewDetail(row: Coupon) {
    loading.value = true
    try {
      currentRow.value = await marketingApi.couponDetail(row.id)
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取详情失败')
    } finally {
      loading.value = false
    }
  }

  async function handleSubmit() {
    loading.value = true
    try {
      if (isEdit.value && currentRow.value) {
        await marketingApi.couponUpdate(currentRow.value.id, { ...form })
        ElMessage.success('更新成功')
      } else {
        await marketingApi.couponCreate({ ...form })
        ElMessage.success('创建成功')
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
      await ElMessageBox.confirm('确定要删除该优惠券吗？此操作不可恢复。', '确认删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
      loading.value = true
      await marketingApi.couponDelete(id)
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

  async function handleToggle(id: string, status: string) {
    try {
      await marketingApi.couponToggle(id, status)
      ElMessage.success('状态更新成功')
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '状态更新失败')
    }
  }

  return {
    list, total, loading, currentRow, dialogVisible, detailVisible, isEdit,
    query, form,
    fetchList, handleSearch, handleReset, handlePageChange, handleSizeChange,
    openCreateDialog, openEditDialog, viewDetail, handleSubmit, handleDelete,
    handleToggle, resetForm,
  }
})

// ==================== Activity Store ====================

export const useActivityStore = defineStore('activity', () => {
  const list = ref<Activity[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentRow = ref<Activity | null>(null)
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const isEdit = ref(false)

  const query = reactive({
    keyword: '',
    status: undefined as string | undefined,
    type: undefined as string | undefined,
    page: 1,
    size: 10,
  })

  const form = reactive<ActivityForm>({
    name: '',
    type: 'FIRST_CHARGE',
    startTime: '',
    endTime: '',
    description: '',
    rules: '',
  })

  function resetForm() {
    Object.assign(form, {
      name: '', type: 'FIRST_CHARGE', startTime: '', endTime: '',
      description: '', rules: '',
    })
  }

  async function fetchList() {
    loading.value = true
    try {
      const result = await marketingApi.activityList(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取活动列表失败')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    query.page = 1
    fetchList()
  }

  function handleReset() {
    query.keyword = ''
    query.status = undefined
    query.type = undefined
    query.page = 1
    fetchList()
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

  function openCreateDialog() {
    isEdit.value = false
    currentRow.value = null
    resetForm()
    dialogVisible.value = true
  }

  function openEditDialog(row: Activity) {
    isEdit.value = true
    currentRow.value = row
    Object.assign(form, {
      name: row.name,
      type: row.type,
      startTime: row.startTime,
      endTime: row.endTime,
      description: row.description,
      rules: row.rules,
    })
    dialogVisible.value = true
  }

  async function viewDetail(row: Activity) {
    loading.value = true
    try {
      currentRow.value = await marketingApi.activityDetail(row.id)
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取详情失败')
    } finally {
      loading.value = false
    }
  }

  async function handleSubmit() {
    loading.value = true
    try {
      if (isEdit.value && currentRow.value) {
        await marketingApi.activityUpdate(currentRow.value.id, { ...form })
        ElMessage.success('更新成功')
      } else {
        await marketingApi.activityCreate({ ...form })
        ElMessage.success('创建成功')
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
      await ElMessageBox.confirm('确定要删除该活动吗？此操作不可恢复。', '确认删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
      loading.value = true
      await marketingApi.activityDelete(id)
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

  async function handleToggle(id: string, status: string) {
    try {
      await marketingApi.activityToggle(id, status)
      ElMessage.success('状态更新成功')
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '状态更新失败')
    }
  }

  return {
    list, total, loading, currentRow, dialogVisible, detailVisible, isEdit,
    query, form,
    fetchList, handleSearch, handleReset, handlePageChange, handleSizeChange,
    openCreateDialog, openEditDialog, viewDetail, handleSubmit, handleDelete,
    handleToggle, resetForm,
  }
})

// ==================== Recharge Package Store ====================

export const useRechargePackageStore = defineStore('rechargePackage', () => {
  const list = ref<RechargePackage[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentRow = ref<RechargePackage | null>(null)
  const dialogVisible = ref(false)
  const detailVisible = ref(false)
  const isEdit = ref(false)

  const query = reactive({
    keyword: '',
    status: undefined as string | undefined,
    page: 1,
    size: 10,
  })

  const form = reactive<RechargePackageForm>({
    name: '',
    amount: 0,
    giftAmount: 0,
    giftCouponId: '',
    sort: 0,
    description: '',
  })

  function resetForm() {
    Object.assign(form, {
      name: '', amount: 0, giftAmount: 0, giftCouponId: '',
      sort: 0, description: '',
    })
  }

  async function fetchList() {
    loading.value = true
    try {
      const result = await marketingApi.rechargePackageList(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取充值套餐列表失败')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    query.page = 1
    fetchList()
  }

  function handleReset() {
    query.keyword = ''
    query.status = undefined
    query.page = 1
    fetchList()
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

  function openCreateDialog() {
    isEdit.value = false
    currentRow.value = null
    resetForm()
    dialogVisible.value = true
  }

  function openEditDialog(row: RechargePackage) {
    isEdit.value = true
    currentRow.value = row
    Object.assign(form, {
      name: row.name,
      amount: row.amount,
      giftAmount: row.giftAmount,
      giftCouponId: row.giftCouponId,
      sort: row.sort,
      description: row.description,
    })
    dialogVisible.value = true
  }

  async function viewDetail(row: RechargePackage) {
    loading.value = true
    try {
      currentRow.value = await marketingApi.rechargePackageDetail(row.id)
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取详情失败')
    } finally {
      loading.value = false
    }
  }

  async function handleSubmit() {
    loading.value = true
    try {
      if (isEdit.value && currentRow.value) {
        await marketingApi.rechargePackageUpdate(currentRow.value.id, { ...form })
        ElMessage.success('更新成功')
      } else {
        await marketingApi.rechargePackageCreate({ ...form })
        ElMessage.success('创建成功')
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
      await ElMessageBox.confirm('确定要删除该充值套餐吗？此操作不可恢复。', '确认删除', {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
      loading.value = true
      await marketingApi.rechargePackageDelete(id)
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

  async function handleToggle(id: string, status: string) {
    try {
      await marketingApi.rechargePackageToggle(id, status)
      ElMessage.success('状态更新成功')
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '状态更新失败')
    }
  }

  return {
    list, total, loading, currentRow, dialogVisible, detailVisible, isEdit,
    query, form,
    fetchList, handleSearch, handleReset, handlePageChange, handleSizeChange,
    openCreateDialog, openEditDialog, viewDetail, handleSubmit, handleDelete,
    handleToggle, resetForm,
  }
})
