/**
 * 钱包相关 API 模块
 *
 * 包含钱包信息、充值、交易记录等接口。
 */

import type { Transaction } from '@/types'
import { request } from './request'

/** 获取钱包信息 */
export async function getWallet(): Promise<any> {
  return request<any>({ url: '/api/v1/wallet' })
}

/** 充值 */
export async function recharge(data: { amount: number }): Promise<any> {
  return request<any>({
    url: '/api/v1/wallet/recharge',
    method: 'POST',
    data: { amount: Math.round(data.amount * 100) },
  })
}

/** 获取交易记录 */
export async function getTransactions(params?: { page?: number; size?: number }): Promise<Transaction[]> {
  const data = await request<any>({ url: '/api/v1/wallet/transactions', data: { page: 1, size: 5, ...params } })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map((t: any) => ({
    id: String(t.id || ''),
    type: (t.amount || t.amountYuan || 0) >= 0 ? 'income' : 'expense',
    category: t.category || t.type || '',
    icon: t.icon || '',
    description: t.description || t.title || t.remark || '',
    amount: Math.abs((t.amount || t.amountYuan || 0) / (t.amount > 100 ? 100 : 1)),
    time: t.time || t.createdAt || t.createTime || '',
  }))
}
