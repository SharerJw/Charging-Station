/**
 * 车辆相关 API 模块
 *
 * 包含车辆列表、添加、更新、删除等接口。
 */

import { request } from './request'

/** 获取车辆列表 */
export async function getVehicles(): Promise<any[]> {
  const data = await request<any>({ url: '/api/v1/vehicles' })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map((v: any) => ({
    id: String(v.id || ''),
    brand: v.brand || '',
    model: v.model || '',
    plateNumber: v.plateNumber || v.plate || '',
    batteryCapacity: v.batteryCapacity || 0,
    range: v.range || v.mileage || 0,
    type: v.type || '纯电动',
    isDefault: Boolean(v.isDefault || v.defaultFlag),
  }))
}

/** 添加车辆 */
export async function addVehicle(data: any): Promise<any> {
  return request<any>({ url: '/api/v1/vehicles', method: 'POST', data })
}

/** 更新车辆信息 */
export async function updateVehicle(id: string, data: any): Promise<any> {
  return request<any>({ url: `/api/v1/vehicles/${id}`, method: 'PUT', data })
}

/** 删除车辆 */
export async function deleteVehicle(id: string): Promise<void> {
  return request<void>({ url: `/api/v1/vehicles/${id}`, method: 'DELETE' })
}
