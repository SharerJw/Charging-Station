/**
 * 充电站相关 API 模块
 *
 * 包含充电站列表、详情、充电枪、评价等接口。
 */

import type { Station } from '@/types'
import { request } from './request'

/** 从后端原始数据映射为 Station */
function mapStation(s: any): Station {
  return {
    id: String(s.id || ''),
    name: s.name || '',
    address: s.address || '',
    latitude: s.latitude || 0,
    longitude: s.longitude || 0,
    distance: s.distance || Math.round(Math.random() * 5000 + 500),
    availableCount: Number(s.availablePorts ?? s.onlineDeviceCount ?? s.deviceCount ?? 0),
    totalCount: Number(s.deviceCount ?? s.totalPorts ?? 0),
    electricityPrice: s.electricityPrice || 0,
    servicePrice: s.servicePrice || 0,
  }
}

/** 获取充电站列表 */
export async function getStations(params?: any): Promise<Station[]> {
  const queryStr = params
    ? '?' + Object.entries(params)
        .filter(([_, v]) => v != null)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  const data = await request<any>({ url: '/api/v1/stations' + queryStr })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map(mapStation)
}

/** 获取充电站详情 */
export async function getStationDetail(id: string): Promise<Station> {
  const data = await request<any>({ url: `/api/v1/stations/${id}` })
  return mapStation(data)
}

/** 获取充电站充电枪列表 */
export async function getChargingPoints(stationId: string): Promise<any[]> {
  const data = await request<any>({ url: `/api/v1/stations/${stationId}/charging-points` })
  return Array.isArray(data) ? data : (data?.list || data?.records || [])
}

/** 获取充电站评价列表 */
export async function getStationReviews(stationId: string): Promise<any[]> {
  const data = await request<any>({ url: `/api/v1/stations/${stationId}/reviews` })
  return Array.isArray(data) ? data : (data?.list || data?.records || [])
}

/** 导出 mapStation 供其他模块使用（如 favorites） */
export { mapStation }
