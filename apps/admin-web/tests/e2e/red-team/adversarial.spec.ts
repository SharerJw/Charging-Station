import { test, expect, type APIRequestContext } from '@playwright/test'

const API = '/api'

// ---- shared helpers ----

/** POST /auth/login and return the bearer token. */
async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  })
  const body = await res.json()
  const token = body?.data?.token ?? body?.token
  expect(token, 'login must return a token').toBeTruthy()
  return token
}

// ================================================================
// 维度10: 红蓝对抗 - 异常场景
// ================================================================

test.describe('红蓝对抗 - 异常场景', () => {
  // -----------------------------------------------------------
  // 并发登录
  // -----------------------------------------------------------
  test('快速连续登录10次不崩溃', async ({ request }) => {
    const promises = Array.from({ length: 10 }, () =>
      request.post(`${API}/auth/login`, {
        data: { username: 'admin', password: 'admin123' },
      })
    )
    const results = await Promise.all(promises)
    // At least one request should succeed
    const successCount = results.filter((r) => r.ok()).length
    expect(successCount).toBeGreaterThan(0)
  })

  // -----------------------------------------------------------
  // 并发请求
  // -----------------------------------------------------------
  test('并发50个API请求不崩溃', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const promises = Array.from({ length: 50 }, () =>
      request.get(`${API}/dashboard/stats`, { headers })
    )
    const results = await Promise.all(promises)
    // All 50 requests should return (no timeout, no crash)
    expect(results.length).toBe(50)
    const okCount = results.filter((r) => r.ok()).length
    expect(okCount).toBeGreaterThan(0)
  })

  // -----------------------------------------------------------
  // 畸形数据
  // -----------------------------------------------------------
  test('畸形JSON请求体', async ({ request }) => {
    const token = await getToken(request)
    const resp = await request.post(`${API}/v1/stations`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: '{"name": "test", invalid json',
    })
    // Should return 4xx, not 500
    expect(resp.status()).toBeLessThan(500)
  })

  // -----------------------------------------------------------
  // 超长URL
  // -----------------------------------------------------------
  test('超长URL路径不崩溃', async ({ request }) => {
    const token = await getToken(request)
    const longPath = 'a'.repeat(8000)
    const resp = await request.get(`${API}/v1/stations/${longPath}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    // Should return 400/404/414, not 500
    expect(resp.status()).toBeLessThan(500)
  })

  // -----------------------------------------------------------
  // 空Content-Type
  // -----------------------------------------------------------
  test('空Content-Type请求', async ({ request }) => {
    const token = await getToken(request)
    const resp = await request.post(`${API}/v1/stations`, {
      headers: { Authorization: `Bearer ${token}` },
      data: '',
    })
    expect(resp.status()).toBeLessThan(500)
  })

  // -----------------------------------------------------------
  // 特殊字符输入
  // -----------------------------------------------------------
  test('特殊字符不导致崩溃', async ({ request }) => {
    const token = await getToken(request)
    const specialChars = "!@#$%^&*()_+-=[]{}|;:'\",.<>?/~`"
    const resp = await request.get(`${API}/v1/stations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { keyword: specialChars },
    })
    expect(resp.ok()).toBeTruthy()
  })

  // -----------------------------------------------------------
  // 大分页
  // -----------------------------------------------------------
  test('请求10万条数据不崩溃', async ({ request }) => {
    const token = await getToken(request)
    const resp = await request.get(`${API}/v1/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, size: 100000 },
    })
    // Should return normally or cap the size, never 500
    expect(resp.status()).toBeLessThan(500)
  })
})
