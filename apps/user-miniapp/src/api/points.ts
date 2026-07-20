/**
 * 积分相关 API 模块
 *
 * 包含积分查询、积分商品、兑换、积分历史等接口。
 */

import { request } from './request'

/** 获取积分信息 */
export async function getPoints(): Promise<any> {
  return request<any>({ url: '/api/v1/points' })
}

/** 获取积分商品列表 */
export async function getPointItems(): Promise<any[]> {
  const data = await request<any>({ url: '/api/v1/points/items' })
  return Array.isArray(data) ? data : (data?.list || data?.records || [])
}

/** 兑换积分商品 */
export async function redeemPoint(data: { itemId: string; points: number }): Promise<any> {
  return request<any>({ url: '/api/v1/points/redeem', method: 'POST', data })
}

/** 获取积分商品列表（带筛选） */
export async function getPointsProducts(params?: { category?: string; keyword?: string }): Promise<any[]> {
  const data = await request<any>({ url: '/api/v1/points/products', data: params })
  return Array.isArray(data) ? data : (data?.list || data?.records || [])
}

/** 积分兑换 */
export async function redeemPoints(data: { itemId: string; quantity?: number; points: number }): Promise<any> {
  return request<any>({ url: '/api/v1/points/redeem', method: 'POST', data })
}

/** 获取积分历史记录 */
export async function getPointsHistory(params?: { status?: string; page?: number; size?: number }): Promise<any[]> {
  const data = await request<any>({ url: '/api/v1/points/history', data: params })
  return Array.isArray(data) ? data : (data?.list || data?.records || [])
}
