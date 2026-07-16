import { test, expect } from '@playwright/test'

const API = '/api'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function ok(resp: any) {
  return expect(resp.ok()).toBeTruthy()
}

// ─── 用户端接口健壮性 ─────────────────────────────────────────────────────────────

test.describe('用户端接口健壮性', () => {
  test('POST /v1/auth/sms-code 发送验证码', async ({ request }) => {
    const resp = await request.post(`${API}/v1/auth/sms-code`, {
      data: { phone: '13800138000' },
    })
    expect([200, 201, 429]).toContain(resp.status())
    const body = await resp.json()
    // 成功或频率限制都应有响应体
    expect(body).toBeTruthy()
  })

  test('POST /v1/auth/login 手机号登录', async ({ request }) => {
    const resp = await request.post(`${API}/v1/auth/login`, {
      data: { phone: '13800138000', code: '123456' },
    })
    expect([200, 201, 400, 401]).toContain(resp.status())
    const body = await resp.json()
    expect(body).toBeTruthy()
  })

  test('GET /v1/stations 充电站列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/stations`)
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    const data = body.data ?? body
    expect(data).toBeTruthy()
  })

  test('GET /v1/stations 含必需字段', async ({ request }) => {
    const resp = await request.get(`${API}/v1/stations`)
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list) && list.length > 0) {
      const station = list[0]
      expect(station).toHaveProperty('id')
      // 充电站应有名称或地址
      const hasName = station.name || station.stationName || station.address
      expect(hasName).toBeTruthy()
    }
  })

  test('POST /v1/charging/start 启动充电', async ({ request }) => {
    const resp = await request.post(`${API}/v1/charging/start`, {
      data: { stationId: 'test-station', connectorId: 1 },
    })
    // 可能因设备不存在返回业务错误，但不应崩溃
    expect([200, 201, 400, 404]).toContain(resp.status())
    const body = await resp.json()
    expect(body).toBeTruthy()
  })

  test('POST /v1/charging/stop 停止充电', async ({ request }) => {
    const resp = await request.post(`${API}/v1/charging/stop`, {
      data: { transactionId: 'nonexistent-tx' },
    })
    // 无活跃交易时应返回业务错误或幂等成功
    expect([200, 204, 400, 404]).toContain(resp.status())
    const body = await resp.json()
    expect(body).toBeTruthy()
  })

  test('GET /v1/orders 用户订单列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/orders`)
    // 未登录可能返回 401
    const status = resp.status()
    if (status === 200) {
      const body = await resp.json()
      expect(body).toBeTruthy()
    } else {
      expect([401, 403]).toContain(status)
    }
  })

  test('GET /v1/user/info 用户信息', async ({ request }) => {
    const resp = await request.get(`${API}/v1/user/info`)
    const status = resp.status()
    if (status === 200) {
      const body = await resp.json()
      expect(body).toBeTruthy()
      const data = body.data ?? body
      // 用户信息应包含基本信息字段
      expect(data).toBeTruthy()
    } else {
      // 未登录应返回 401
      expect([401, 403]).toContain(status)
    }
  })

  test('GET /v1/alerts 告警列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/alerts`)
    // 用户端告警可能需要登录
    const status = resp.status()
    if (status === 200) {
      const body = await resp.json()
      expect(body).toBeTruthy()
    } else {
      expect([401, 403]).toContain(status)
    }
  })
})
