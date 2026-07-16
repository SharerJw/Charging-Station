import { test, expect } from '@playwright/test'

const API = '/api'

test.describe('认证与权限穿透', () => {
  // 未认证访问
  test('无token访问受保护API返回401', async ({ request }) => {
    const resp = await request.get(`${API}/dashboard/stats`)
    // 应该返回 401 或重定向
    expect([401, 403, 302]).toContain(resp.status())
  })

  test('无效token访问受保护API返回401', async ({ request }) => {
    const resp = await request.get(`${API}/dashboard/stats`, {
      headers: { Authorization: 'Bearer invalid_token_xyz' }
    })
    expect([401, 403]).toContain(resp.status())
  })

  test('过期token返回401', async ({ request }) => {
    // 使用一个明显过期的token
    const expiredToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDAwMDAwMDB9.fake'
    const resp = await request.get(`${API}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    })
    expect([401, 403]).toContain(resp.status())
  })

  // SQL注入
  test('登录接口SQL注入防护', async ({ request }) => {
    const resp = await request.post(`${API}/auth/login`, {
      data: { username: "admin' OR '1'='1", password: "anything" }
    })
    // 不应该返回成功
    const body = await resp.json()
    expect(body.code).not.toBe(0)
    expect(body.code).not.toBe(200)
  })

  test('搜索接口SQL注入防护', async ({ request }) => {
    // 先登录
    const loginResp = await request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    })
    const { token } = (await loginResp.json()).data

    const resp = await request.get(`${API}/v1/stations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { keyword: "'; DROP TABLE stations; --" }
    })
    // 应该正常返回（不崩溃）
    expect(resp.ok()).toBeTruthy()
  })

  // XSS
  test('创建站点XSS防护', async ({ request }) => {
    const loginResp = await request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    })
    const { token } = (await loginResp.json()).data

    const resp = await request.post(`${API}/v1/stations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: '<script>alert("xss")</script>',
        address: 'test',
        latitude: 39.9,
        longitude: 116.4
      }
    })
    // 如果创建成功，返回的数据不应包含未转义的 script 标签
    if (resp.ok()) {
      const body = await resp.json()
      if (body.data?.name) {
        expect(body.data.name).not.toContain('<script>')
      }
    }
  })

  // 越权访问
  test('普通用户不能访问管理接口', async ({ request }) => {
    // 用普通用户登录
    const loginResp = await request.post(`${API}/v1/auth/login`, {
      data: { phone: '13800000001', code: '123456' }
    })
    const loginBody = await loginResp.json()
    if (loginBody.data?.token) {
      const token = loginBody.data.token
      // 尝试访问管理接口
      const resp = await request.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // 应该返回 403 或 401
      expect([401, 403]).toContain(resp.status())
    } else {
      // 普通用户登录失败 is also acceptable (endpoint may not support phone login)
      expect(loginBody.code).not.toBe(0)
    }
  })

  // 路径遍历
  test('路径遍历防护', async ({ request }) => {
    const loginResp = await request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    })
    const { token } = (await loginResp.json()).data

    const resp = await request.get(`${API}/v1/stations/../../etc/passwd`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    // 不应该返回文件内容
    expect(resp.status()).not.toBe(200)
  })

  // 请求体大小限制
  test('超大请求体拒绝', async ({ request }) => {
    const loginResp = await request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' }
    })
    const { token } = (await loginResp.json()).data

    const bigPayload = 'x'.repeat(10 * 1024 * 1024) // 10MB
    const resp = await request.post(`${API}/v1/stations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: bigPayload }
    })
    // Should not return 200 success; acceptable codes include 400, 405, 413, 414
    expect(resp.ok()).toBeFalsy()
  })
})
