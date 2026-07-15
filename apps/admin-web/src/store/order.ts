import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { orderApi } from '@/api'
import { ElMessage } from 'element-plus'
import type { Order, OrderQuery } from '@/types'
import { OrderStatus } from '@/types'
import dayjs from 'dayjs'

export const useOrderStore = defineStore('order', () => {
  const list = ref<Order[]>([])
  const total = ref(0)
  const loading = ref(false)
  const currentOrder = ref<Order | null>(null)
  const detailVisible = ref(false)
  const refundDialogVisible = ref(false)
  const refundForm = reactive({ amount: 0, reason: '' })

  // 默认筛选近一周数据
  const query = reactive<OrderQuery>({
    orderNo: '',
    status: undefined,
    stationId: '',
    startTime: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    page: 1,
    size: 10,
  })

  const statusOptions = [
    { label: '全部', value: undefined },
    { label: '充电中', value: OrderStatus.CHARGING },
    { label: '已完成', value: OrderStatus.PAID },
    { label: '退款中', value: OrderStatus.REFUNDING },
    { label: '异常', value: OrderStatus.ABNORMAL },
    { label: '已取消', value: OrderStatus.CANCELLED },
  ]

  async function fetchList() {
    loading.value = true
    try {
      const result = await orderApi.list(query)
      list.value = result.list
      total.value = result.total
    } catch (error: any) {
      ElMessage.error(error.message || '获取订单列表失败')
    } finally {
      loading.value = false
    }
  }

  async function viewDetail(id: string) {
    loading.value = true
    try {
      currentOrder.value = await orderApi.detail(id)
      detailVisible.value = true
    } catch (error: any) {
      ElMessage.error(error.message || '获取订单详情失败')
    } finally {
      loading.value = false
    }
  }

  function openRefundDialog(order: Order) {
    currentOrder.value = order
    refundForm.amount = order.payableAmount
    refundForm.reason = ''
    refundDialogVisible.value = true
  }

  async function handleRefund() {
    if (!currentOrder.value) return
    if (refundForm.amount <= 0 || refundForm.amount > currentOrder.value.payableAmount) {
      ElMessage.warning('退款金额不合法')
      return
    }
    if (!refundForm.reason.trim()) {
      ElMessage.warning('请填写退款原因')
      return
    }
    loading.value = true
    try {
      await orderApi.refund(currentOrder.value.id, refundForm.amount, refundForm.reason)
      ElMessage.success('退款申请已提交')
      refundDialogVisible.value = false
      await fetchList()
    } catch (error: any) {
      ElMessage.error(error.message || '退款失败')
    } finally {
      loading.value = false
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

  return {
    list, total, loading, currentOrder, detailVisible, refundDialogVisible,
    refundForm, query, statusOptions,
    fetchList, viewDetail, openRefundDialog, handleRefund,
    handlePageChange, handleSizeChange, handleSearch,
  }
})
