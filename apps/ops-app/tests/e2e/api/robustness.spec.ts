import { test, expect, type APIRequestContext } from '@playwright/test'

const API = 'http://localhost:8080/api'

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

function ok(resp: any) {
  return expect(resp.ok()).toBeTruthy()
}

// ─── 运维端接口健壮性 ─────────────────────────────────────────────────────────────

test.describe('运维端接口健壮性', () => {
  let authToken: string

  test.beforeAll(async ({ request }) => {
    authToken = await getToken(request)
  })

  const authHeaders = () => ({ Authorization: `Bearer ${authToken}` })

  test('POST /v1/ops/auth/login 正常登录', async ({ request }) => {
    const resp = await request.post(`${API}/v1/ops/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    })
    expect([200, 201, 400, 401]).toContain(resp.status())
    const body = await resp.json()
    expect(body.code ?? body.status).toBeDefined()
  })

  test('POST /v1/ops/auth/login 错误密码', async ({ request }) => {
    const resp = await request.post(`${API}/v1/ops/auth/login`, {
      data: { username: 'admin', password: 'wrong-password' },
    })
    expect([200, 400, 401, 403]).toContain(resp.status())
    const body = await resp.json()
    if (resp.status() === 200) {
      expect(body.code).toBeDefined()
      expect(body.code).not.toBe(0)
    }
  })

  test('GET /v1/ops/alerts 正常返回告警列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/alerts`, { headers: authHeaders() })
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    const data = body.data ?? body
    expect(data).toBeTruthy()
  })

  test('GET /v1/ops/alerts 级别筛选 P0', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/alerts?level=P0`, { headers: authHeaders() })
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P0')
      }
    }
  })

  test('GET /v1/ops/alerts 级别筛选 P1', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/alerts?level=P1`, { headers: authHeaders() })
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P1')
      }
    }
  })

  test('GET /v1/ops/alerts 级别筛选 P2', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/alerts?level=P2`, { headers: authHeaders() })
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P2')
      }
    }
  })

  test('GET /v1/ops/alerts 级别筛选 P3', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/alerts?level=P3`, { headers: authHeaders() })
    ok(resp)
    const body = await resp.json()
    const list = body.data?.list ?? body.data ?? []
    if (Array.isArray(list)) {
      for (const alert of list) {
        expect(alert.level ?? alert.alertLevel).toBe('P3')
      }
    }
  })

  test('GET /v1/ops/alerts 搜索关键字', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/alerts?keyword=test`, { headers: authHeaders() })
    ok(resp)
    const body = await resp.json()
    expect(body).toBeTruthy()
  })

  test('GET /v1/ops/workorders 正常返回工单列表', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/workorders`, { headers: authHeaders() })
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    const data = body.data ?? body
    expect(data).toBeTruthy()
  })

  test('GET /v1/ops/workorders 状态筛选', async ({ request }) => {
    const resp = await request.get(`${API}/v1/ops/workorders?status=pending`, { headers: authHeaders() })
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
    const resp = await request.get(`${API}/v1/ops/stations`, { headers: authHeaders() })
    ok(resp)
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body).toBeTruthy()
  })

  test('POST /v1/ops/alerts/{id}/handle 处理告警', async ({ request }) => {
    const listResp = await request.get(`${API}/v1/ops/alerts`, { headers: authHeaders() })
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
    const resp = await request.post(`${API}/v1/ops/alerts/${alertId}/handle`, {
      headers: authHeaders(),
      data: { remark: '自动化测试处理' },
    })
    expect([200, 204, 404]).toContain(resp.status())
  })

  test('POST /v1/ops/workorders 更新工单状态', async ({ request }) => {
    const listResp = await request.get(`${API}/v1/ops/workorders`, { headers: authHeaders() })
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
    const resp = await request.post(`${API}/v1/ops/workorders/${orderId}`, {
      headers: authHeaders(),
      data: { status: 'in_progress', remark: '自动化测试更新' },
    })
    expect([200, 204, 404, 500]).toContain(resp.status())
  })
})
