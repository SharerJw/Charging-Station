/**
 * 发票相关 API 模块
 *
 * 包含发票列表、创建、提交、发票抬头等接口。
 */

import { request } from './request'

/** 获取发票列表 */
export async function getInvoices(): Promise<any[]> {
  const data = await request<any>({ url: '/api/v1/invoices' })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map((inv: any) => ({
    id: String(inv.id || ''),
    title: inv.title || inv.invoiceTitle || '',
    amount: (inv.amount || 0) / 100,
    status: inv.status || 'pending',
    createTime: inv.createTime || inv.createdAt || '',
  }))
}

/** 创建发票 */
export async function createInvoice(data: {
  orderIds: string[]
  type: string
  email: string
  company?: any
}): Promise<any> {
  return request<any>({ url: '/api/v1/invoices', method: 'POST', data })
}

/** 提交发票 */
export async function submitInvoice(data: any): Promise<any> {
  return request<any>({ url: '/api/v1/invoices/submit', method: 'POST', data })
}

/** 获取发票抬头列表 */
export async function getInvoiceHeaders(): Promise<any[]> {
  const data = await request<any>({ url: '/api/v1/invoices/headers' })
  const list = Array.isArray(data) ? data : (data?.list || data?.records || [])
  return list.map((h: any) => ({
    id: String(h.id || ''),
    companyName: h.companyName || h.name || '',
    taxNumber: h.taxNumber || h.taxNo || '',
    address: h.address || '',
    phone: h.phone || '',
    bankName: h.bankName || h.bank || '',
    bankAccount: h.bankAccount || '',
  }))
}
