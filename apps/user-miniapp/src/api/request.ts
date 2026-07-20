/**
 * API 请求工具模块
 *
 * 提供统一的 HTTP 请求封装，包含 token 认证、超时处理、错误处理等。
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
const REQUEST_TIMEOUT = 15000 // 15秒请求超时

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const fullUrl = `${BASE_URL}${options.url}`
    console.log(`[api] ${options.method || 'GET'} ${fullUrl}`)
    uni.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      timeout: REQUEST_TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success: (res: any) => {
        console.log(`[api] ${options.url} → ${res.statusCode}`)
        const body = res.data
        if (res.statusCode === 200 && body && body.code === 0) {
          resolve(body.data as T)
        } else if (res.statusCode === 200 && body && body.code !== 0) {
          reject(new Error(body.message || '请求失败'))
        } else if (res.statusCode === 401) {
          // Token 过期或未登录，清除本地 token 并跳转到登录页
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          console.warn('[auth] Token 过期，跳转到登录页')

          // 获取当前页面路径，避免在登录页重复跳转
          const pages = getCurrentPages()
          const currentPage = pages[pages.length - 1]
          const currentPath = currentPage ? `/${currentPage.route}` : ''

          if (currentPath !== '/pages/login/index' && currentPath !== '/pages/login-sms/index') {
            // 显示提示并跳转到登录页
            uni.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none',
              duration: 2000,
            })
            // 延迟跳转，让用户看到提示
            setTimeout(() => {
              uni.reLaunch({
                url: '/pages/login/index',
              })
            }, 1500)
          }
          reject(new Error('未登录'))
        } else {
          reject(new Error(body?.message || `HTTP ${res.statusCode}`))
        }
      },
      fail: (err: any) => {
        console.error(`[request] ${options.method || 'GET'} ${options.url} failed:`, err)
        reject(new Error(err?.errMsg || err?.message || '网络请求失败'))
      },
    })
  })
}
