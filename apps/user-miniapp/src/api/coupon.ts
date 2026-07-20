/**
 * 优惠券相关 API 模块
 *
 * 包含优惠券列表、兑换、可用优惠券等接口。
 */

import { request } from './request'

/** 获取优惠券列表 */
export async function getCoupons(status?: string): Promise<any[]> {
  const params: any = {}
  if (status) params.status = status
  const data = await request<any>({ url: '/api/v1/coupons', data: params })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map((c: any) => ({
    id: String(c.id || ''),
    name: c.name || '',
    description: c.description || '',
    type: c.type || 'fixed', // fixed | discount | energy
    amount: c.amount || 0,
    discount: c.discount || 0, // 折扣值（type=discount 时使用）
    energyKwh: c.energyKwh || 0, // 免费电量（type=energy 时使用）
    minAmount: c.minAmount || c.threshold || 0,
    scope: c.scope || '全场通用', // 适用范围
    startTime: c.startTime || c.beginTime || '',
    endTime: c.endTime || c.expireTime || '',
    status: c.status || 'available',
    usedTime: c.usedTime || '',
  }))
}

/** 兑换优惠券 */
export async function redeemCoupon(code: string): Promise<any> {
  return request<any>({ url: '/api/v1/coupons/redeem', method: 'POST', data: { code } })
}

/** 获取可用优惠券列表 */
export async function getAvailableCoupons(): Promise<any[]> {
  const data = await request<any>({ url: '/api/v1/coupons/available' })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map((c: any) => ({
    id: String(c.id || ''),
    name: c.name || '',
    amount: c.amount || 0,
    minAmount: c.minAmount || c.threshold || 0,
    expireDate: c.endTime || c.expireTime || '',
  }))
}
