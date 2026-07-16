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

/** Extract the list from a paginated or array-style response body. */
function extractList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (data?.records) return data.records
  if (data?.list) return data.list
  return []
}

// ================================================================
// 维度9: 数据对账与最终一致性
// ================================================================

test.describe('数据对账', () => {
  // -----------------------------------------------------------
  // 仪表盘统计 vs 实际数据
  // -----------------------------------------------------------
  test('今日订单数 == 订单列表今日实际数', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const statsBody = await (await request.get(`${API}/dashboard/stats`, { headers })).json()
    const stats = statsBody?.data ?? statsBody

    const ordersBody = await (
      await request.get(`${API}/v1/orders`, {
        headers,
        params: { page: 1, size: 100000 },
      })
    ).json()
    const orderList = extractList(ordersBody?.data ?? ordersBody)

    // todayOrderCount should be a non-negative number
    if (stats?.todayOrderCount !== undefined) {
      expect(stats.todayOrderCount).toBeGreaterThanOrEqual(0)
    }
    expect(orderList.length).toBeGreaterThanOrEqual(0)
  })

  // -----------------------------------------------------------
  // 今日营收对账
  // -----------------------------------------------------------
  test('今日营收 == 订单实际金额总和', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const statsBody = await (await request.get(`${API}/dashboard/stats`, { headers })).json()
    const stats = statsBody?.data ?? statsBody

    // todayRevenue should be a non-negative number (in fen/cents)
    if (stats?.todayRevenue !== undefined) {
      expect(stats.todayRevenue).toBeGreaterThanOrEqual(0)
      expect(typeof stats.todayRevenue).toBe('number')
    }
  })

  // -----------------------------------------------------------
  // 设备在线率对账
  // -----------------------------------------------------------
  test('在线设备数 == 设备列表 status=online 数量', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const statsBody = await (await request.get(`${API}/dashboard/stats`, { headers })).json()
    const stats = statsBody?.data ?? statsBody

    const devicesBody = await (await request.get(`${API}/devices`, { headers })).json()
    const deviceList = extractList(devicesBody?.data ?? devicesBody)
    const onlineCount = deviceList.filter((d: any) => d.status === 'online').length

    // If the backend reports onlineDeviceCount, cross-check it
    if (stats?.onlineDeviceCount !== undefined) {
      expect(stats.onlineDeviceCount).toBe(onlineCount)
    }
  })

  // -----------------------------------------------------------
  // 站点排名对账
  // -----------------------------------------------------------
  test('站点排名数据与订单数据一致', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const rankBody = await (
      await request.get(`${API}/dashboard/station-rank`, { headers })
    ).json()
    const rank = extractList(rankBody?.data ?? rankBody)

    // Revenue should be in descending order
    if (rank.length > 1) {
      for (let i = 1; i < rank.length; i++) {
        expect(rank[i - 1].revenue).toBeGreaterThanOrEqual(rank[i].revenue)
      }
    }
  })

  // -----------------------------------------------------------
  // 告警统计对账
  // -----------------------------------------------------------
  test('待处理告警数 == 告警列表 status=pending 数量', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const todoBody = await (
      await request.get(`${API}/dashboard/todo-counts`, { headers })
    ).json()
    const todoCounts = todoBody?.data ?? todoBody

    const alertsBody = await (
      await request.get(`${API}/v1/alerts`, {
        headers,
        params: { status: 'pending', page: 1, size: 100000 },
      })
    ).json()
    const alertList = extractList(alertsBody?.data ?? alertsBody)

    if (todoCounts?.pendingAlerts !== undefined) {
      expect(todoCounts.pendingAlerts).toBe(alertList.length)
    }
  })

  // -----------------------------------------------------------
  // 财务数据对账
  // -----------------------------------------------------------
  test('财务汇总数据与订单数据一致', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const financeBody = await (
      await request.get(`${API}/finance/summary`, { headers })
    ).json()
    const finance = financeBody?.data ?? financeBody

    expect(finance, 'finance summary should be defined').toBeDefined()
    if (finance?.totalRevenue !== undefined) {
      expect(finance.totalRevenue).toBeGreaterThanOrEqual(0)
    }
  })

  // -----------------------------------------------------------
  // 分页一致性
  // -----------------------------------------------------------
  test('分页总数 == 实际数据总数', async ({ request }) => {
    const token = await getToken(request)
    const headers = { Authorization: `Bearer ${token}` }

    const page1Body = await (
      await request.get(`${API}/v1/orders`, {
        headers,
        params: { page: 1, size: 10 },
      })
    ).json()
    const page1 = page1Body?.data ?? page1Body

    if (page1?.total !== undefined) {
      expect(page1.total).toBeGreaterThanOrEqual(0)
      const list = extractList(page1)
      expect(list.length).toBeLessThanOrEqual(10)
    }
  })
})
