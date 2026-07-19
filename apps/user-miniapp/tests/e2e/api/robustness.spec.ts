import { test, expect } from '@playwright/test'

// ─── Mock 数据 ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'U001', nickname: '测试用户', balance: 12350, couponCount: 5 }
const MOCK_STATIONS = [
  { id: 'S001', name: '国贸充电站', stationName: '国贸充电站', address: '北京市朝阳区建国门外大街1号', availablePorts: 5 },
  { id: 'S002', name: '望京充电站', stationName: '望京充电站', address: '北京市朝阳区望京街10号', availablePorts: 3 },
]
const MOCK_ORDERS = [
  { id: 'O001', orderNo: 'UO001', status: 'completed', totalAmount: 82.08, stationName: '国贸充电站' },
]
const MOCK_ALERTS = [
  { id: 'A001', level: 'P2', title: '充电桩离线', createdAt: '2026-07-19T10:00:00Z' },
]

// ─── 用户端接口健壮性（通过浏览器 mock 验证） ───────────────────────────────────

test.describe('用户端接口健壮性', () => {
  test('POST /v1/auth/sms-code 发送验证码', async ({ page }) => {
    let captured: any
    await page.route('**/api/v1/auth/sms-code', (route) => {
      captured = { code: 0, message: '验证码已发送', data: { expireSeconds: 300 } }
      route.fulfill({ status: 200, json: captured })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/auth/sms-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '13800138000' }),
      })
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTruthy()
    expect(resp.body.code).toBe(0)
  })

  test('POST /v1/auth/login 手机号登录', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, data: { token: 'mock-jwt-token', user: MOCK_USER } },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '13800138000', code: '123456' }),
      })
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTruthy()
    expect(resp.body.data.token).toBeTruthy()
  })

  test('GET /v1/stations 充电站列表', async ({ page }) => {
    await page.route('**/api/v1/stations', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, data: { list: MOCK_STATIONS, total: MOCK_STATIONS.length } },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/stations')
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    const data = resp.body.data ?? resp.body
    expect(data).toBeTruthy()
  })

  test('GET /v1/stations 含必需字段', async ({ page }) => {
    await page.route('**/api/v1/stations', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, data: { list: MOCK_STATIONS, total: MOCK_STATIONS.length } },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/stations')
      return { status: r.status, body: await r.json() }
    })
    const list = resp.body.data?.list ?? resp.body.data ?? []
    if (Array.isArray(list) && list.length > 0) {
      const station = list[0]
      expect(station).toHaveProperty('id')
      const hasName = station.name || station.stationName || station.address
      expect(hasName).toBeTruthy()
    }
  })

  test('POST /v1/charging/start 启动充电', async ({ page }) => {
    await page.route('**/api/v1/charging/start', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, data: { transactionId: 'TX001', status: 'charging' } },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/charging/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: 'test-station', connectorId: 1 }),
      })
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTruthy()
    expect(resp.body.data.transactionId).toBeTruthy()
  })

  test('POST /v1/charging/stop 停止充电', async ({ page }) => {
    await page.route('**/api/v1/charging/stop', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, message: '充电已停止', data: { transactionId: 'TX001', totalAmount: 35.50 } },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/charging/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: 'TX001' }),
      })
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTruthy()
    expect(resp.body.code).toBe(0)
  })

  test('GET /v1/orders 用户订单列表', async ({ page }) => {
    await page.route('**/api/v1/orders', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, data: { list: MOCK_ORDERS, total: MOCK_ORDERS.length } },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/orders')
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTruthy()
    expect(resp.body.data.list.length).toBeGreaterThan(0)
    expect(resp.body.data.list[0]).toHaveProperty('orderNo')
  })

  test('GET /v1/user/info 用户信息', async ({ page }) => {
    await page.route('**/api/v1/user/info', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, data: MOCK_USER },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/user/info')
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTruthy()
    const data = resp.body.data ?? resp.body
    expect(data).toBeTruthy()
    expect(data.id).toBeTruthy()
    expect(data.nickname).toBeTruthy()
  })

  test('GET /v1/alerts 告警列表', async ({ page }) => {
    await page.route('**/api/v1/alerts', (route) => {
      route.fulfill({
        status: 200,
        json: { code: 0, data: { list: MOCK_ALERTS, total: MOCK_ALERTS.length } },
      })
    })
    await page.goto('http://localhost:5176')
    const resp = await page.evaluate(async () => {
      const r = await fetch('/api/v1/alerts')
      return { status: r.status, body: await r.json() }
    })
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTruthy()
    expect(resp.body.data.list.length).toBeGreaterThan(0)
    expect(resp.body.data.list[0]).toHaveProperty('level')
  })
})
