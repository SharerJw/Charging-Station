/**
 * 设置相关 API 模块
 *
 * 包含用户设置查询和更新接口。
 */

import { request } from './request'

/** 获取用户设置 */
export async function getSettings(): Promise<any> {
  return request<any>({ url: '/api/v1/user/settings' })
}

/** 更新用户设置 */
export async function updateSettings(data: any): Promise<void> {
  return request<void>({ url: '/api/v1/user/settings', method: 'PUT', data })
}
