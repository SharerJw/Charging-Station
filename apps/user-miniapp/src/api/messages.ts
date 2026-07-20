/**
 * 消息中心 API 模块
 *
 * 包含消息列表、标记已读、全部已读、删除消息等接口。
 */

import { request } from './request'

/** 获取消息列表 */
export async function getMessages(params?: any): Promise<any> {
  return request<any>({ url: '/api/v1/messages', data: params })
}

/** 标记消息已读 */
export async function markMessageRead(messageId: string): Promise<void> {
  return request<void>({ url: `/api/v1/messages/${messageId}/read`, method: 'POST' })
}

/** 标记消息已读（兼容别名） */
export async function markAsRead(messageId: string): Promise<void> {
  return request<void>({ url: `/api/v1/messages/${messageId}/read`, method: 'POST' })
}

/** 全部标记已读 */
export async function markAllAsRead(category?: string): Promise<void> {
  return request<void>({ url: '/api/v1/messages/read-all', method: 'POST', data: { category } })
}

/** 删除消息 */
export async function deleteMessage(messageId: string): Promise<void> {
  return request<void>({ url: `/api/v1/messages/${messageId}`, method: 'DELETE' })
}
