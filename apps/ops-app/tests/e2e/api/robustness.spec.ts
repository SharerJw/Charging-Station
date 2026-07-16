import { test, expect } from '@playwright/test'

const API = '/api'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function ok(resp: any) {
  return expect(resp.ok()).toBeTruthy()
}

// ─── 运维端接口健壮性 ─────────────────────────────────────────────────────────────

test.describe('运维端接口健壮性', () => {
  test('POST /v1/ops/auth/login 正常登录', async ({ request }) => {
    const resp = await request.post(`${API}/v1/ops/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    })
    expect([200, 201]).toContain(resp.status())
    const body = await resp.json()
    expect(body.code ?? body.status).toBeDefined()
  })

  test('POST /v1/ops/auth/login 错误密码', async ({ request }) => {
    const resp = await request.post(`${API}/v1/ops/auth/login`, {
      data: { username: 'admin', password: 'wrong-password' },
    })
    // 错误密码应返回 401 或 400
    expect([400, 401, 403]).toContain(resp.status())
  })

  test('GET /v1/alerts 正常返回告警列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/alerts`)
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    // 兼容 { code:0, data:{...} } 或 { code:0, data:[...] }
    const data = body.data ?? body
    expect(data).toBeTruthy()
  })

  test('GET /v1/alerts 级别筛选 P0', async ({ request }) => {
    const resp = await request.get(`${API}/v1/alerts?level=P0`)
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P0')
      }
    }
  })

  test('GET /v1/alerts 级别筛选 P1', async ({ request }) => {
    const resp = await request.get(`${API}/v1/alerts?level=P1`)
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P1')
      }
    }
  })

  test('GET /v1/alerts 级别筛选 P2', async ({ request }) => {
    const resp = await request.get(`${API}/v1/alerts?level=P2`)
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P2')
      }
    }
  })

  test('GET /v1/alerts 级别筛选 P3', async ({ request }) => {
    const resp = await request.get(`${API}/v1/alerts?level=P3`)
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P3')
      }
    }
  })

  test('GET /v1/alerts 搜索关键字', async ({ request }) => {
    const resp = await request.get(`${API}/v1/alerts?keyword=test`)
    ok(resp)
    const body = await resp.json()
    expect(body).toBeTruthy()
  })

  test('GET /v1/workorders 正常返回工单列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/workorders`)
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    const data = body.data ?? body
    expect(data).toBeTruthy()
  })

  test('GET /v1/workorders 状态筛选', async ({ request }) => {
    const resp = await request.get(`${API}/v1/workorders?status=pending`)
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const order of list) {
        expect(order.status).toBe('pending')
      }
    }
  })

  test('GET /v1/ops/stations 正常返回站点列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/stations`)
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toBeTruthy()
  })

  test('POST /v1/alerts/{id}/handle 处理告警', async ({ request }) => {
    // 先获取告警列表，取第一条
    const listResp = await request.get(`${API}/v1/alerts`)
    if (!listResp.ok()) {
      test.skip(true, 'Cannot fetch alerts')
      return
    }
    const listBody = await listResp.json()
    const alerts = listBody.data?.list ?? listBody.data ?? []
    if (!Array.isArray(alerts) || alerts.length === 0) {
      test.skip(true, 'No alerts to handle')
      return
    }
    const alertId = alerts[0].id
    const resp = await request.post(`${API}/v1/alerts/${alertId}/handle`, {
      data: { remark: '自动化测试处理' },
    })
    expect([200, 204]).toContain(resp.status())
  })

  test('POST /v1/workorders 更新工单状态', async ({ request }) => {
    // 先获取工单列表，取第一条
    const listResp = await request.get(`${API}/v1/workorders`)
    if (!listResp.ok()) {
      test.skip(true, 'Cannot fetch workorders')
      return
    }
    const listBody = await listResp.json()
    const orders = listBody.data?.list ?? listBody.data ?? []
    if (!Array.isArray(orders) || orders.length === 0) {
      test.skip(true, 'No workorders to update')
      return
    }
    const orderId = orders[0].id
    const resp = await request.post(`${API}/v1/workorders/${orderId}`, {
      data: { status: 'in_progress', remark: '自动化测试更新' },
    })
    expect([200, 204]).toContain(resp.status())
  })
})
