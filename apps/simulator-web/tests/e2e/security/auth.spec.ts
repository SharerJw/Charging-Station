import { test, expect } from '@playwright/test'

const API = '/api/simulator'

test.describe('模拟器安全测试', () => {
  test('无token访问受保护API返回401', async ({ request }) => {
    const resp = await request.get(`${API}/devices`, {
      headers: { Authorization: '' },
    })
    // 无 token 时应返回 401 Unauthorized
    expect([401, 403]).toContain(resp.status())
  })

  test('无效token返回401', async ({ request }) => {
    const resp = await request.get(`${API}/devices`, {
      headers: { Authorization: 'Bearer invalid-token-12345' },
    })
    expect([401, 403]).toContain(resp.status())
  })

  test('SQL注入防护', async ({ request }) => {
    const payload = "'; DROP TABLE devices; --"
    const resp = await request.get(`${API}/devices?keyword=${encodeURIComponent(payload)}`)
    // SQL 注入不应导致 500 服务器错误
    expect(resp.status()).not.toBe(500)
    // 服务应仍然正常响应
    expect([200, 400, 422]).toContain(resp.status())
  })

  test('特殊字符输入不崩溃', async ({ request }) => {
    const specialChars = '<script>alert(1)</script>&"\'\\0'
    const resp = await request.get(`${API}/devices?keyword=${encodeURIComponent(specialChars)}`)
    // 特殊字符不应导致服务崩溃
    expect(resp.status()).not.toBe(500)
    expect([200, 400, 422]).toContain(resp.status())
  })

  test('并发请求不崩溃', async ({ request }) => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      request.get(`${API}/devices?page=${i + 1}`),
    )
    const responses = await Promise.all(promises)
    for (const resp of responses) {
      // 并发请求不应导致任何 5xx 错误
      expect(resp.status()).toBeLessThan(500)
    }
  })
})
