/**
 * API 统一入口模块
 *
 * 按业务域拆分为独立模块，同时保留兼容旧代码的 api 对象导出。
 *
 * 模块划分：
 * - auth: 认证相关（登录、验证码、微信登录）
 * - station: 充电站相关（列表、详情、充电枪、评价）
 * - charging: 充电相关（启动、停止、状态、结算）
 * - order: 订单相关（列表、详情、支付、退款）
 * - wallet: 钱包相关（钱包信息、充值、交易记录）
 * - coupon: 优惠券相关（列表、兑换、可用优惠券）
 * - vehicle: 车辆相关（列表、添加、更新、删除）
 * - points: 积分相关（积分查询、商品、兑换、历史）
 * - favorites: 收藏相关（列表、切换、移除、排序）
 * - invoice: 发票相关（列表、创建、提交、抬头）
 * - messages: 消息中心（列表、已读、删除）
 * - user: 用户相关（信息、资料、统计、会员）
 * - settings: 设置相关（查询、更新）
 */

// 类型重导出
export type { Station, UserInfo, Order, ChargingSession, Transaction, UserStats } from '@/types'

// 按模块导出所有 API 方法
export * from './auth'
export * from './station'
export * from './charging'
export * from './order'
export * from './wallet'
export * from './coupon'
export * from './vehicle'
export * from './points'
export * from './favorites'
export * from './invoice'
export * from './messages'
export * from './user'
export * from './settings'

// 兼容旧代码的 api 对象导出
import * as auth from './auth'
import * as station from './station'
import * as charging from './charging'
import * as order from './order'
import * as wallet from './wallet'
import * as coupon from './coupon'
import * as vehicle from './vehicle'
import * as points from './points'
import * as favorites from './favorites'
import * as invoice from './invoice'
import * as messages from './messages'
import * as user from './user'
import * as settings from './settings'

export const api = {
  ...auth,
  ...station,
  ...charging,
  ...order,
  ...wallet,
  ...coupon,
  ...vehicle,
  ...points,
  ...favorites,
  ...invoice,
  ...messages,
  ...user,
  ...settings,
}
