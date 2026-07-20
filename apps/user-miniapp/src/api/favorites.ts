/**
 * 收藏相关 API 模块
 *
 * 包含收藏列表、添加/取消收藏、收藏排序等接口。
 */

import type { Station } from '@/types'
import { request } from './request'
import { mapStation } from './station'

/** 获取收藏列表 */
export async function getFavorites(): Promise<Station[]> {
  const data = await request<any>({ url: '/api/v1/favorites' })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map(mapStation)
}

/** 切换收藏状态 */
export async function toggleFavorite(stationId: string): Promise<void> {
  return request<void>({ url: `/api/v1/favorites/${stationId}/toggle`, method: 'POST' })
}

/** 移除收藏 */
export async function removeFavorite(stationId: string): Promise<void> {
  return request<void>({ url: `/api/v1/favorites/${stationId}`, method: 'DELETE' })
}

/** 重新排序收藏 */
export async function reorderFavorites(stationIds: string[]): Promise<void> {
  return request<void>({ url: '/api/v1/favorites/reorder', method: 'PUT', data: { stationIds } })
}
