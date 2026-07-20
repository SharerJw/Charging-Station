/**
 * 用户相关 API 模块
 *
 * 包含用户信息、更新资料、用户统计等接口。
 */

import type { UserInfo, UserStats } from '@/types'
import { request } from './request'

/** 获取用户信息 */
export async function getUserInfo(): Promise<UserInfo> {
  const data = await request<any>({ url: '/api/v1/user/profile' })
  return {
    id: String(data?.id || ''),
    nickname: data?.nickname || data?.username || '',
    phone: data?.phone || '',
    avatar: data?.avatar || '',
    balance: (data?.balance || 0) / 100, // 分转元
    couponCount: data?.couponCount || 0,
  }
}

/** 更新用户资料（昵称/头像） */
export async function updateProfile(data: { nickname?: string; avatar?: string }): Promise<void> {
  await request<void>({ url: '/api/v1/user/profile', method: 'PUT', data })
}

/** 获取会员信息 */
export async function getMembership(): Promise<any> {
  return request<any>({ url: '/api/v1/membership' })
}

/** 获取用户统计数据 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const data = await request<any>({ url: '/api/v1/user/stats' })
    return {
      chargeCount: data?.chargeCount || 0,
      totalEnergy: data?.totalEnergy || 0,
      totalSaved: data?.totalSaved || 0,
      carbonReduction: data?.carbonReduction || 0,
    }
  } catch {
    return { chargeCount: 0, totalEnergy: 0, totalSaved: 0, carbonReduction: 0 }
  }
}
