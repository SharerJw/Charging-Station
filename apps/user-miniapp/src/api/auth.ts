/**
 * 认证相关 API 模块
 *
 * 包含登录、短信验证码、微信登录、手机号登录等认证接口。
 */

import { request } from './request'

/** 登录请求参数 */
export interface LoginParams {
  phone: string
  code: string
}

/** 登录响应 */
export interface LoginResult {
  token: string
  user: any
  isNewUser?: boolean
}

/** 发送短信验证码 */
export function sendSmsCode(phone: string): Promise<void> {
  return request<void>({ url: '/api/v1/auth/sms-code', method: 'POST', data: { phone } })
}

/** 手机号+验证码登录 */
export function loginByPhone(data: LoginParams): Promise<LoginResult> {
  return request<LoginResult>({ url: '/api/v1/auth/login', method: 'POST', data })
}

/** 微信登录 */
export function loginByWechat(data: { code: string; userInfo?: any }): Promise<LoginResult> {
  return request<LoginResult>({ url: '/api/v1/auth/wechat-login', method: 'POST', data })
}

/** 手机号快捷登录（微信获取手机号） */
export function getPhoneNumber(code: string): Promise<LoginResult> {
  return request<LoginResult>({ url: '/api/v1/auth/phone-number-login', method: 'POST', data: { code } })
}

/** 登录（兼容旧接口） */
export function login(data: LoginParams): Promise<{ token: string; user: any }> {
  return request<{ token: string; user: any }>({ url: '/api/v1/auth/login', method: 'POST', data })
}
