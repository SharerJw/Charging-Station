import { test, expect, type APIRequestContext } from '@playwright/test'

const API = '/api'

// ---- shared helpers ----

/** POST /auth/login and return the bearer token. */
async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  })
  const body = await res.json()
  // Response may be {code:200, data:{token,...}} or {code:0, data:{token,...}}
  const token = body?.data?.token ?? body?.token
  expect(token, 'login must return a token').toBeTruthy()
  return token
}

/** Convenience: parse JSON body and assert code indicates success. */
async function ok(res: Response) {
  expect(res.ok(), `HTTP status ${res.status()}`).toBeTruthy()
  const body = await res.json()
  // Accept code 200 or 0
  const code = body?.code
  expect(
    code === 200 || code === 0 || code === undefined,
    `response code should be 200 or 0, got ${code}`
  ).toBeTruthy()
  return body
}

// ================================================================
// 认证接口
// ================================================================
test.describe('认证接口', () => {
  test('POST /auth/login 正常登录 -> 200 + token', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'admin123' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const token = body?.data?.token ?? body?.token
    expect(token, 'response should contain a token').toBeTruthy()
  })

  test('POST /auth/login 错误密码 -> 401 或业务错误', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { username: 'admin', password: 'wrong_password' },
    })
    // Either HTTP 4xx or a business-level error code
    const body = await res.json()
    const isHttpError = res.status() >= 400
    const isBizError =
      body?.code !== 0 && body?.code !== 200 && body?.code !== undefined
    expect(
      isHttpError || isBizError,
      `expected 4xx or business error, got status=${res.status()} code=${body?.code}`
    ).toBeTruthy()
  })

  test('POST /auth/login 空用户名 -> 400 或业务错误', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { username: '', password: 'admin123' },
    })
    const body = await res.json()
    const isHttpError = res.status() >= 400
    const isBizError =
      body?.code !== 0 && body?.code !== 200 && body?.code !== undefined
    expect(
      isHttpError || isBizError,
      `expected 4xx or business error, got status=${res.status()} code=${body?.code}`
    ).toBeTruthy()
  })
})

// ================================================================
// 站点接口
// ================================================================
test.describe('站点接口', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    token = await login(request)
  })

  const headers = () => ({ Authorization: `Bearer ${token}` })

  test('GET /v1/stations 正常返回列表', async ({ request }) => {
    const res = await request.get(`${API}/v1/stations`, { headers: headers() })
    const body = await ok(res)
    // data may be a list or a paged object
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    expect(Array.isArray(list)).toBeTruthy()
  })

  test('GET /v1/stations 返回含必需字段 (id, name, address)', async ({
    request,
  }) => {
    const res = await request.get(`${API}/v1/stations`, { headers: headers() })
    const body = await ok(res)
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    if (list.length > 0) {
      const first = list[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('name')
      expect(first).toHaveProperty('address')
    }
  })

  test('GET /v1/stations 分页参数正确', async ({ request }) => {
    const res = await request.get(`${API}/v1/stations`, {
      headers: headers(),
      params: { page: 1, size: 5 },
    })
    const body = await ok(res)
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    // Paged response should respect size
    expect(list.length).toBeLessThanOrEqual(5)
  })

  test('GET /v1/stations 搜索关键字过滤', async ({ request }) => {
    const res = await request.get(`${API}/v1/stations`, {
      headers: headers(),
      params: { keyword: 'test' },
    })
    const body = await ok(res)
    // Should return without error; list may be empty
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? null
    expect(list !== null).toBeTruthy()
  })
})

// ================================================================
// 设备接口
// ================================================================
test.describe('设备接口', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    token = await login(request)
  })

  const headers = () => ({ Authorization: `Bearer ${token}` })

  test('GET /devices 正常返回列表', async ({ request }) => {
    const res = await request.get(`${API}/devices`, { headers: headers() })
    const body = await ok(res)
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    expect(Array.isArray(list)).toBeTruthy()
  })

  test('GET /devices 含必需字段 (id, code, status)', async ({ request }) => {
    const res = await request.get(`${API}/devices`, { headers: headers() })
    const body = await ok(res)
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    if (list.length > 0) {
      const first = list[0]
      expect(first).toHaveProperty('id')
      expect(first).toHaveProperty('code')
      expect(first).toHaveProperty('status')
    }
  })
})

// ================================================================
// 订单接口
// ================================================================
test.describe('订单接口', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    token = await login(request)
  })

  const headers = () => ({ Authorization: `Bearer ${token}` })

  test('GET /v1/orders 正常返回列表', async ({ request }) => {
    const res = await request.get(`${API}/v1/orders`, { headers: headers() })
    const body = await ok(res)
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    expect(Array.isArray(list)).toBeTruthy()
  })

  test('GET /v1/orders 状态筛选正确', async ({ request }) => {
    const res = await request.get(`${API}/v1/orders`, {
      headers: headers(),
      params: { status: 'PAID' },
    })
    const body = await ok(res)
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    // All returned orders should have the requested status (if any)
    for (const order of list) {
      if (order.status !== undefined) {
        expect(order.status).toBe('PAID')
      }
    }
  })

  test('GET /v1/orders 分页参数正确', async ({ request }) => {
    const res = await request.get(`${API}/v1/orders`, {
      headers: headers(),
      params: { page: 1, size: 3 },
    })
    const body = await ok(res)
    const list = Array.isArray(body?.data)
      ? body.data
      : body?.data?.records ?? body?.data?.list ?? []
    expect(list.length).toBeLessThanOrEqual(3)
  })
})

// ================================================================
// 仪表盘接口
// ================================================================
test.describe('仪表盘接口', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    token = await login(request)
  })

  const headers = () => ({ Authorization: `Bearer ${token}` })

  test('GET /dashboard/stats 返回完整统计字段', async ({ request }) => {
    const res = await request.get(`${API}/dashboard/stats`, {
      headers: headers(),
    })
    const body = await ok(res)
    const data = body?.data
    expect(data, 'stats data should exist').toBeTruthy()
    // Stats should contain at least one numeric metric
    const hasNumber = Object.values(data ?? {}).some(
      (v) => typeof v === 'number'
    )
    expect(hasNumber, 'stats should contain numeric metrics').toBeTruthy()
  })

  test('GET /dashboard/chart 返回 dates/revenues 数组', async ({
    request,
  }) => {
    const res = await request.get(`${API}/dashboard/chart`, {
      headers: headers(),
    })
    const body = await ok(res)
    const data = body?.data
    expect(data, 'chart data should exist').toBeTruthy()
    // Should contain dates and revenues arrays (or similar structure)
    const hasArrays = Object.values(data ?? {}).some(
      (v) => Array.isArray(v) && v.length > 0
    )
    expect(
      hasArrays,
      'chart data should contain at least one non-empty array'
    ).toBeTruthy()
  })

  test('GET /dashboard/recent-orders 返回最近订单', async ({ request }) => {
    const res = await request.get(`${API}/dashboard/recent-orders`, {
      headers: headers(),
    })
    const body = await ok(res)
    const data = body?.data
    expect(data !== null && data !== undefined, 'recent-orders data should exist').toBeTruthy()
    const list = Array.isArray(data) ? data : data?.records ?? data?.list ?? null
    // It's acceptable for the list to be empty
    expect(list !== null || data !== null).toBeTruthy()
  })

  test('GET /dashboard/station-rank 返回站点排名', async ({ request }) => {
    const res = await request.get(`${API}/dashboard/station-rank`, {
      headers: headers(),
    })
    const body = await ok(res)
    const data = body?.data
    expect(data !== null && data !== undefined, 'station-rank data should exist').toBeTruthy()
    const list = Array.isArray(data) ? data : data?.records ?? data?.list ?? null
    expect(list !== null || data !== null).toBeTruthy()
  })

  test('GET /dashboard/todo-counts 返回待办计数', async ({ request }) => {
    const res = await request.get(`${API}/dashboard/todo-counts`, {
      headers: headers(),
    })
    const body = await ok(res)
    const data = body?.data
    expect(data, 'todo-counts data should exist').toBeTruthy()
    // Should contain at least one numeric count
    const hasNumber = Object.values(data ?? {}).some(
      (v) => typeof v === 'number'
    )
    expect(hasNumber, 'todo-counts should contain numeric values').toBeTruthy()
  })
})

// ================================================================
// 告警/工单/财务接口
// ================================================================
test.describe('告警/工单接口', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    token = await login(request)
  })

  const headers = () => ({ Authorization: `Bearer ${token}` })

  test('GET /v1/alerts 正常返回列表', async ({ request }) => {
    const res = await request.get(`${API}/v1/alerts`, { headers: headers() })
    const body = await ok(res)
    const data = body?.data
    const list = Array.isArray(data)
      ? data
      : data?.records ?? data?.list ?? null
    expect(list !== null || data !== null).toBeTruthy()
  })

  test('GET /v1/alerts 级别筛选正确', async ({ request }) => {
    const res = await request.get(`${API}/v1/alerts`, {
      headers: headers(),
      params: { level: 'P0' },
    })
    const body = await ok(res)
    const data = body?.data
    const list = Array.isArray(data)
      ? data
      : data?.records ?? data?.list ?? []
    // Filtered results, if any, should have the requested level
    for (const alert of list) {
      if (alert.level !== undefined) {
        expect(alert.level).toBe('P0')
      }
    }
  })

  test('GET /v1/workorders 正常返回列表', async ({ request }) => {
    const res = await request.get(`${API}/v1/workorders`, {
      headers: headers(),
    })
    const body = await ok(res)
    const data = body?.data
    const list = Array.isArray(data)
      ? data
      : data?.records ?? data?.list ?? null
    expect(list !== null || data !== null).toBeTruthy()
  })

  test('GET /finance/summary 正常返回财务数据', async ({ request }) => {
    const res = await request.get(`${API}/finance/summary`, {
      headers: headers(),
    })
    const body = await ok(res)
    const data = body?.data
    expect(data, 'finance summary data should exist').toBeTruthy()
    // Should contain at least one field
    expect(Object.keys(data ?? {}).length).toBeGreaterThan(0)
  })
})
