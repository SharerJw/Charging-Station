import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'
import type { Transaction } from '@/types'

export const useWalletStore = defineStore('wallet', () => {
  // ==================== 状态 ====================
  const balance = ref(0)
  const couponCount = ref(0)
  const points = ref(0)
  const monthlySpend = ref(0)
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const balanceVisible = ref(false)

  // ==================== 计算属性 ====================

  /** 根据 visibility 控制余额显示 */
  const balanceDisplay = computed(() => {
    if (!balanceVisible.value) return '****'
    return balance.value.toFixed(2)
  })

  // ==================== Actions ====================

  /**
   * 加载钱包信息 + 最近交易记录
   */
  async function fetchWallet(): Promise<void> {
    loading.value = true
    try {
      const [walletData, txData] = await Promise.all([
        api.getWallet(),
        api.getTransactions({ size: 10 }),
      ])

      balance.value = (walletData.balance || 0) / (walletData.balance > 10000 ? 100 : 1)
      couponCount.value = walletData.couponCount || 0
      points.value = walletData.points || 0
      monthlySpend.value = (walletData.monthlySpend || 0) / (walletData.monthlySpend > 10000 ? 100 : 1)
      transactions.value = txData
    } catch (error) {
      console.error('[walletStore] 加载钱包信息失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新余额（轻量查询，不加载交易记录）
   */
  async function refreshBalance(): Promise<void> {
    try {
      const walletData = await api.getWallet()
      balance.value = (walletData.balance || 0) / (walletData.balance > 10000 ? 100 : 1)
      couponCount.value = walletData.couponCount || 0
      points.value = walletData.points || 0
      monthlySpend.value = (walletData.monthlySpend || 0) / (walletData.monthlySpend > 10000 ? 100 : 1)
    } catch (error) {
      console.error('[walletStore] 刷新余额失败:', error)
    }
  }

  /**
   * 充值
   */
  async function recharge(amount: number): Promise<any> {
    loading.value = true
    try {
      const result = await api.recharge({ amount })
      // 充值成功后刷新余额
      await refreshBalance()
      return result
    } catch (error) {
      console.error('[walletStore] 充值失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载交易记录
   */
  async function fetchTransactions(params?: { page?: number; size?: number }): Promise<void> {
    loading.value = true
    try {
      const data = await api.getTransactions(params)
      transactions.value = data
    } catch (error) {
      console.error('[walletStore] 加载交易记录失败:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换余额可见性
   */
  function toggleBalanceVisible(): void {
    balanceVisible.value = !balanceVisible.value
  }

  /**
   * 重置所有状态
   */
  function reset(): void {
    balance.value = 0
    couponCount.value = 0
    points.value = 0
    monthlySpend.value = 0
    transactions.value = []
    loading.value = false
    balanceVisible.value = false
  }

  return {
    // state
    balance,
    couponCount,
    points,
    monthlySpend,
    transactions,
    loading,
    balanceVisible,
    // computed
    balanceDisplay,
    // actions
    fetchWallet,
    refreshBalance,
    recharge,
    fetchTransactions,
    toggleBalanceVisible,
    reset,
  }
})
