/**
 * 订单相关 API 模块
 *
 * 包含订单列表、详情、支付、退款等接口。
 */

import type { Order } from '@/types'
import { request } from './request'

/** 获取订单列表 */
export async function getOrders(params?: any): Promise<Order[]> {
  try {
    const data = await request<any>({ url: '/api/v1/orders', data: params })
    const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
    return list.map((o: any) => ({
      id: String(o.id || ''),
      orderNo: o.orderNo || '',
      stationName: o.stationName || '',
      status: o.status || '',
      startTime: o.startTime || o.createdAt || '',
      consumedEnergy: o.consumedEnergy || o.energy || 0,
      totalAmount: o.totalAmount || o.amount || 0,
    }))
  } catch (e) {
    return []
  }
}

/** 获取订单详情 */
export async function getOrderDetail(orderId: string): Promise<any> {
  return request<any>({ url: `/api/v1/orders/${orderId}` })
}

/** 支付订单 */
export async function payOrder(orderId: string): Promise<any> {
  return request<any>({ url: `/api/v1/orders/${orderId}/pay`, method: 'POST' })
}

/** 申请退款 */
export async function requestRefund(orderId: string): Promise<any> {
  return request<any>({ url: `/api/v1/orders/${orderId}/refund`, method: 'POST' })
}

/** 提交退款申请（带详细信息） */
export async function applyRefund(data: {
  orderId: string
  amount: number
  reason: string
  notes?: string
  photos?: string[]
}): Promise<any> {
  return request<any>({
    url: '/api/v1/refunds',
    method: 'POST',
    data: { ...data, amount: Math.round(data.amount * 100) },
  })
}
