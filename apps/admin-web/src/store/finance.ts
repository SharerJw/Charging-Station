import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { financeApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

// ==================== 类型定义 ====================

export interface FinanceSummary {
  totalRevenue: number
  totalElectricityFee: number
  totalServiceFee: number
  totalOrderCount: number
  totalEnergyWh: number
  avgOrderAmount: number
  refundAmount: number
  refundCount: number
}

export interface RevenueTrendItem {
  date: string
  electricityRevenue: number
  serviceRevenue: number
}

export interface PaymentChannelItem {
  channel: string
  name: string
  amount: number
  count: number
  percentage: number
}

export interface Bill {
  id: string
  orderNo: string
  userId: string
  userNickname: string
  stationId: string
  stationName: string
  energyWh: number
  electricityFee: number
  serviceFee: number
  totalAmount: number
  status: string
  payMethod: string
  payTime: string
  createTime: string
}

export interface Settlement {
  id: string
  settlementNo: string
  partyId: string
  partyName: string
  stationId: string
  stationName: string
  periodStart: string
  periodEnd: string
  totalAmount: number
  electricityAmount: number
  serviceAmount: number
  platformFee: number
  netAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'REJECTED'
  remark: string
  createTime: string
}

export interface Invoice {
  id: string
  invoiceNo: string
  settlementId: string
  settlementNo: string
  partyName: string
  amount: number
  taxRate: number
  taxAmount: number
  status: 'PENDING' | 'ISSUED' | 'SENT' | 'REVOKED'
  type: 'NORMAL' | 'SPECIAL'
  title: string
  taxNo: string
  issueTime: string
  createTime: string
}

export interface FundFlow {
  id: string
  flowNo: string
  type: 'INCOME' | 'REFUND' | 'SETTLEMENT' | 'PLATFORM_FEE' | 'WITHDRAWAL'
  typeName: string
  orderId?: string
  orderNo?: string
  amount: number
  direction: 'IN' | 'OUT'
  balanceAfter: number
  payMethod: string
  description: string
  createTime: string
}

export interface FinanceQuery {
  startTime?: string
  endTime?: string
  page: number
  size: number
}

export const useFinanceStore = defineStore('finance', () => {
  // ==================== 通用状态 ====================
  const activeTab = ref<'bills' | 'settlements' | 'invoices' | 'fundFlows'>('bills')
  const period = ref('month')

  const dateRange = ref<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ])

  // ==================== 汇总 ====================
  const summary = ref<FinanceSummary>({
    totalRevenue: 0,
    totalElectricityFee: 0,
    totalServiceFee: 0,
    totalOrderCount: 0,
    totalEnergyWh: 0,
    avgOrderAmount: 0,
    refundAmount: 0,
    refundCount: 0,
  })

  // ==================== 图表 ====================
  const revenueTrend = ref<RevenueTrendItem[]>([])
  const paymentChannels = ref<PaymentChannelItem[]>([])
  const loadingChart = ref(false)

  // ==================== 账单 ====================
  const bills = ref<Bill[]>([])
  const billsTotal = ref(0)
  const loadingBills = ref(false)
  const billsQuery = reactive<FinanceQuery>({
    startTime: dayjs().startOf('month').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    page: 1,
    size: 20,
  })

  // ==================== 结算 ====================
  const settlements = ref<Settlement[]>([])
  const settlementsTotal = ref(0)
  const loadingSettlements = ref(false)
  const settlementsQuery = reactive<FinanceQuery>({
    startTime: dayjs().startOf('month').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    page: 1,
    size: 20,
  })
  const selectedSettlementIds = ref<string[]>([])

  // ==================== 发票 ====================
  const invoices = ref<Invoice[]>([])
  const invoicesTotal = ref(0)
  const loadingInvoices = ref(false)
  const invoicesQuery = reactive<FinanceQuery>({
    startTime: dayjs().startOf('month').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    page: 1,
    size: 20,
  })

  // ==================== 资金流水 ====================
  const fundFlows = ref<FundFlow[]>([])
  const fundFlowsTotal = ref(0)
  const loadingFundFlows = ref(false)
  const fundFlowTypeFilter = ref<string>('')
  const fundFlowsQuery = reactive<FinanceQuery & { type?: string }>({
    startTime: dayjs().startOf('month').format('YYYY-MM-DD'),
    endTime: dayjs().format('YYYY-MM-DD'),
    page: 1,
    size: 20,
  })

  // ==================== Actions ====================

  function updateDateRange(newPeriod: string) {
    period.value = newPeriod
    let start: string
    let end: string
    if (newPeriod === 'today') {
      start = dayjs().format('YYYY-MM-DD')
      end = dayjs().format('YYYY-MM-DD')
    } else if (newPeriod === 'week') {
      start = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
      end = dayjs().format('YYYY-MM-DD')
    } else {
      start = dayjs().startOf('month').format('YYYY-MM-DD')
      end = dayjs().format('YYYY-MM-DD')
    }
    dateRange.value = [start, end]

    // Sync all queries
    const queries = [billsQuery, settlementsQuery, invoicesQuery, fundFlowsQuery]
    for (const q of queries) {
      q.startTime = start
      q.endTime = end
      q.page = 1
    }
  }

  async function fetchSummary() {
    try {
      const data = await financeApi.summary({
        startTime: dateRange.value[0],
        endTime: dateRange.value[1],
      })
      if (data) summary.value = { ...summary.value, ...data }
    } catch (error) {
      console.error('Failed to load finance summary:', error)
    }
  }

  async function fetchRevenueTrend() {
    loadingChart.value = true
    try {
      const data = await financeApi.revenueTrend({
        startTime: dateRange.value[0],
        endTime: dateRange.value[1],
      })
      revenueTrend.value = Array.isArray(data) ? data : (data?.list ?? [])
    } catch (error) {
      console.error('Failed to load revenue trend:', error)
    } finally {
      loadingChart.value = false
    }
  }

  async function fetchPaymentChannels() {
    try {
      const data = await financeApi.paymentChannelStats({
        startTime: dateRange.value[0],
        endTime: dateRange.value[1],
      })
      paymentChannels.value = Array.isArray(data) ? data : (data?.list ?? [])
    } catch (error) {
      console.error('Failed to load payment channel stats:', error)
    }
  }

  async function fetchBills() {
    loadingBills.value = true
    try {
      const result = await financeApi.bills(billsQuery)
      bills.value = result?.list ?? []
      billsTotal.value = result?.total ?? 0
    } catch (error: any) {
      ElMessage.error(error.message || '获取账单列表失败')
    } finally {
      loadingBills.value = false
    }
  }

  async function fetchSettlements() {
    loadingSettlements.value = true
    try {
      const result = await financeApi.settlements(settlementsQuery)
      settlements.value = result?.list ?? []
      settlementsTotal.value = result?.total ?? 0
    } catch (error: any) {
      ElMessage.error(error.message || '获取结算列表失败')
    } finally {
      loadingSettlements.value = false
    }
  }

  async function fetchInvoices() {
    loadingInvoices.value = true
    try {
      const result = await financeApi.invoices(invoicesQuery)
      invoices.value = result?.list ?? []
      invoicesTotal.value = result?.total ?? 0
    } catch (error: any) {
      ElMessage.error(error.message || '获取发票列表失败')
    } finally {
      loadingInvoices.value = false
    }
  }

  async function fetchFundFlows() {
    loadingFundFlows.value = true
    try {
      const params = { ...fundFlowsQuery }
      if (fundFlowTypeFilter.value) {
        params.type = fundFlowTypeFilter.value
      }
      const result = await financeApi.fundFlows(params)
      fundFlows.value = result?.list ?? []
      fundFlowsTotal.value = result?.total ?? 0
    } catch (error: any) {
      ElMessage.error(error.message || '获取资金流水失败')
    } finally {
      loadingFundFlows.value = false
    }
  }

  async function exportBills() {
    try {
      const blob = await financeApi.exportBills(billsQuery)
      downloadBlob(blob, `账单明细_${dayjs().format('YYYYMMDD')}.xlsx`)
      ElMessage.success('账单导出成功')
    } catch (error: any) {
      ElMessage.error(error.message || '账单导出失败')
    }
  }

  async function exportSettlements() {
    try {
      const blob = await financeApi.exportSettlements(settlementsQuery)
      downloadBlob(blob, `结算列表_${dayjs().format('YYYYMMDD')}.xlsx`)
      ElMessage.success('结算列表导出成功')
    } catch (error: any) {
      ElMessage.error(error.message || '结算列表导出失败')
    }
  }

  async function exportFundFlows() {
    try {
      const params: any = { ...fundFlowsQuery }
      if (fundFlowTypeFilter.value) params.type = fundFlowTypeFilter.value
      const blob = await financeApi.exportFundFlows(params)
      downloadBlob(blob, `资金流水_${dayjs().format('YYYYMMDD')}.xlsx`)
      ElMessage.success('资金流水导出成功')
    } catch (error: any) {
      ElMessage.error(error.message || '资金流水导出失败')
    }
  }

  async function batchInvoice() {
    if (!selectedSettlementIds.value.length) {
      ElMessage.warning('请先选择结算单')
      return
    }
    try {
      await financeApi.batchInvoice({ settlementIds: selectedSettlementIds.value })
      ElMessage.success('批量开票申请已提交')
      selectedSettlementIds.value = []
      await fetchInvoices()
    } catch (error: any) {
      ElMessage.error(error.message || '批量开票失败')
    }
  }

  async function confirmSettlement(id: string) {
    try {
      await financeApi.confirmSettlement(id)
      ElMessage.success('结算确认成功')
      await fetchSettlements()
    } catch (error: any) {
      ElMessage.error(error.message || '结算确认失败')
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Pagination helpers
  function handleBillsPageChange(page: number) {
    billsQuery.page = page
    fetchBills()
  }

  function handleBillsSizeChange(size: number) {
    billsQuery.size = size
    billsQuery.page = 1
    fetchBills()
  }

  function handleSettlementsPageChange(page: number) {
    settlementsQuery.page = page
    fetchSettlements()
  }

  function handleSettlementsSizeChange(size: number) {
    settlementsQuery.size = size
    settlementsQuery.page = 1
    fetchSettlements()
  }

  function handleInvoicesPageChange(page: number) {
    invoicesQuery.page = page
    fetchInvoices()
  }

  function handleInvoicesSizeChange(size: number) {
    invoicesQuery.size = size
    invoicesQuery.page = 1
    fetchInvoices()
  }

  function handleFundFlowsPageChange(page: number) {
    fundFlowsQuery.page = page
    fetchFundFlows()
  }

  function handleFundFlowsSizeChange(size: number) {
    fundFlowsQuery.size = size
    fundFlowsQuery.page = 1
    fetchFundFlows()
  }

  async function loadAll() {
    await Promise.all([
      fetchSummary(),
      fetchRevenueTrend(),
      fetchPaymentChannels(),
      fetchBills(),
      fetchSettlements(),
      fetchInvoices(),
      fetchFundFlows(),
    ])
  }

  return {
    // State
    activeTab, period, dateRange,
    summary,
    revenueTrend, paymentChannels, loadingChart,
    bills, billsTotal, loadingBills, billsQuery,
    settlements, settlementsTotal, loadingSettlements, settlementsQuery, selectedSettlementIds,
    invoices, invoicesTotal, loadingInvoices, invoicesQuery,
    fundFlows, fundFlowsTotal, loadingFundFlows, fundFlowsQuery, fundFlowTypeFilter,
    // Actions
    updateDateRange, fetchSummary, fetchRevenueTrend, fetchPaymentChannels,
    fetchBills, fetchSettlements, fetchInvoices, fetchFundFlows,
    exportBills, exportSettlements, exportFundFlows,
    batchInvoice, confirmSettlement,
    loadAll,
    // Pagination
    handleBillsPageChange, handleBillsSizeChange,
    handleSettlementsPageChange, handleSettlementsSizeChange,
    handleInvoicesPageChange, handleInvoicesSizeChange,
    handleFundFlowsPageChange, handleFundFlowsSizeChange,
  }
})
