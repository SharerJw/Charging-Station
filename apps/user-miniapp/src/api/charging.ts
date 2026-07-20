/**
 * 充电相关 API 模块
 *
 * 包含启动充电、停止充电、充电状态查询、结算等接口。
 */

import type { ChargingSession } from '@/types'
import { request } from './request'

/** 启动充电 */
export function startCharging(data: any): Promise<ChargingSession> {
  return request<ChargingSession>({ url: '/api/v1/charging/start', method: 'POST', data })
}

/** 启动充电（带选项） */
export function startChargingWithOptions(data: any): Promise<any> {
  return request<any>({ url: '/api/v1/charging/start-with-options', method: 'POST', data })
}

/** 停止充电 */
export async function stopCharging(orderId: string): Promise<ChargingSession> {
  return request<ChargingSession>({ url: `/api/v1/charging/${orderId}/stop`, method: 'POST' })
}

/** 获取充电状态 */
export async function getChargingStatus(orderId: string): Promise<ChargingSession | null> {
  try {
    return await request<ChargingSession>({ url: `/api/v1/charging/${orderId}/status` })
  } catch (e) {
    return null
  }
}

/** 获取充电结算信息 */
export async function getChargingSettlement(orderId: string): Promise<any> {
  return request<any>({ url: `/api/v1/charging/${orderId}/settlement` })
}
