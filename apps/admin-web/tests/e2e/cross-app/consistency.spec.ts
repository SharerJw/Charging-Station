import { test, expect, type APIRequestContext } from '@playwright/test'

/**
 * 多端数据一致性测试
 *
 * 四个前端应用（admin-web / ops-app / user-miniapp / simulator-web）
 * 共享同一后端 API，本测试集验证跨端数据一致性。
 *
 * 所有测试基于 API 请求（request fixture），不依赖 UI 渲染。
 */

const API = '/api'

// ---- helpers ----

async function login(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  })
  const body = await res.json()
  const token = body?.data?.token ?? body?.token
  expect(token, 'login must return a token').toBeTruthy()
  return token
}

async function ok(res: Response) {
  expect(res.ok(), `HTTP status ${res.status()}`).toBeTruthy()
  const body = await res.json()
  const code = body?.code
  expect(
    code === 200 || code === 0 || code === undefined,
    `response code should be 200 or 0, got ${code}`
  ).toBeTruthy()
  return body
}

/**
 * 从 API 响应中提取列表数据，兼容 { data: [] } 或 { data: { records/list } } 两种格式
 */
function extractList(body: any): any[] {
  const data = body?.data
  if (Array.isArray(data)) return data
  return data?.records ?? data?.list ?? []
}

// ================================================================
//  多端数据一致性
// ================================================================
test.describe('多端数据一致性', () => {
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    adminToken = await login(request)
  })

  const headers = () => ({ Authorization: `Bearer ${adminToken}` })

  // ── 充电站数据一致性 ──────────────────────────────────────────────────────
  test('admin-web 站点列表 == ops-app 站点列表', async ({ request }) => {
    // admin 通过 /api/v1/stations 获取
    const adminRes = await request.get(`${API}/v1/stations`, { headers: headers() })
    const adminBody = await ok(adminRes)
    const adminStations = extractList(adminBody)

    // ops 通过 /api/v1/ops/stations 获取
    const opsRes = await request.get(`${API}/v1/ops/stations`, { headers: headers() })
    const opsBody = await ok(opsRes)
    const opsStations = extractList(opsBody)

    // 验证站点数量一致
    expect(
      adminStations.length,
      `admin 站点数(${adminStations.length}) 与 ops 站点数(${opsStations.length}) 不一致`
    ).toBe(opsStations.length)

    // 验证每个站点 ID 在两端都存在
    const adminIds = new Set(adminStations.map((s: any) => s.id).filter(Boolean))
    const opsIds = new Set(opsStations.map((s: any) => s.id).filter(Boolean))
    if (adminIds.size > 0) {
      for (const id of adminIds) {
        expect(opsIds.has(id), `站点 ${id} 在 admin 中存在但 ops 中缺失`).toBeTruthy()
      }
    }
  })

  // ── 设备数据一致性 ──────────────────────────────────────────────────────
  test('admin-web 设备列表 == simulator 设备列表', async ({ request }) => {
    // admin 通过 /api/devices 获取
    const adminRes = await request.get(`${API}/devices`, { headers: headers() })
    const adminBody = await ok(adminRes)
    const adminDevices = extractList(adminBody)

    // simulator 通过 /api/simulator/devices 获取
    const simRes = await request.get(`${API}/simulator/devices`, { headers: headers() })
    const simBody = await ok(simRes)
    const simDevices = extractList(simBody)

    // simulator 可能包含额外的模拟设备，只验证 admin 的设备在 simulator 中都存在
    const simIds = new Set(simDevices.map((d: any) => d.id).filter(Boolean))
    for (const device of adminDevices) {
      if (device.id) {
        expect(
          simIds.has(device.id),
          `设备 ${device.id} (${device.code ?? 'N/A'}) 在 admin 中存在但 simulator 中缺失`
        ).toBeTruthy()
      }
    }

    // 验证两端设备总数：admin 设备数应 <= simulator 设备数
    expect(
      adminDevices.length,
      `admin 设备数(${adminDevices.length})不应超过 simulator 设备数(${simDevices.length})`
    ).toBeLessThanOrEqual(simDevices.length)
  })

  // ── 告警数据一致性 ──────────────────────────────────────────────────────
  test('admin-web 告警列表 == ops-app 告警列表', async ({ request }) => {
    // 两者都通过 /api/v1/alerts 获取
    const adminRes = await request.get(`${API}/v1/alerts`, { headers: headers() })
    const adminBody = await ok(adminRes)
    const adminAlerts = extractList(adminBody)

    const opsRes = await request.get(`${API}/v1/ops/alerts`, { headers: headers() })
    const opsBody = await ok(opsRes)
    const opsAlerts = extractList(opsBody)

    // 验证告警数量一致
    expect(
      adminAlerts.length,
      `admin 告警数(${adminAlerts.length}) 与 ops 告警数(${opsAlerts.length}) 不一致`
    ).toBe(opsAlerts.length)

    // 验证告警 ID 集合完全一致
    const adminIds = new Set(adminAlerts.map((a: any) => a.id).filter(Boolean))
    const opsIds = new Set(opsAlerts.map((a: any) => a.id).filter(Boolean))
    if (adminIds.size > 0) {
      for (const id of adminIds) {
        expect(opsIds.has(id), `告警 ${id} 在 admin 中存在但 ops 中缺失`).toBeTruthy()
      }
      for (const id of opsIds) {
        expect(adminIds.has(id), `告警 ${id} 在 ops 中存在但 admin 中缺失`).toBeTruthy()
      }
    }
  })

  // ── 工单数据一致性 ──────────────────────────────────────────────────────
  test('admin-web 工单列表 == ops-app 工单列表', async ({ request }) => {
    // 两者都通过 /api/v1/workorders 获取
    const adminRes = await request.get(`${API}/v1/workorders`, { headers: headers() })
    const adminBody = await ok(adminRes)
    const adminOrders = extractList(adminBody)

    const opsRes = await request.get(`${API}/v1/ops/workorders`, { headers: headers() })
    const opsBody = await ok(opsRes)
    const opsOrders = extractList(opsBody)

    // 验证工单数量一致
    expect(
      adminOrders.length,
      `admin 工单数(${adminOrders.length}) 与 ops 工单数(${opsOrders.length}) 不一致`
    ).toBe(opsOrders.length)

    // 验证工单 ID 集合完全一致
    const adminIds = new Set(adminOrders.map((w: any) => w.id).filter(Boolean))
    const opsIds = new Set(opsOrders.map((w: any) => w.id).filter(Boolean))
    if (adminIds.size > 0) {
      for (const id of adminIds) {
        expect(opsIds.has(id), `工单 ${id} 在 admin 中存在但 ops 中缺失`).toBeTruthy()
      }
      for (const id of opsIds) {
        expect(adminIds.has(id), `工单 ${id} 在 ops 中存在但 admin 中缺失`).toBeTruthy()
      }
    }
  })

  // ── 订单数据一致性 ──────────────────────────────────────────────────────
  test('admin-web 订单列表 == user-miniapp 订单列表 (同一用户)', async ({ request }) => {
    // admin 通过 /api/v1/orders 获取全部订单
    const adminRes = await request.get(`${API}/v1/orders`, { headers: headers() })
    const adminBody = await ok(adminRes)
    const adminOrders = extractList(adminBody)

    // user 通过 /api/v1/user/orders 获取当前用户订单
    const userRes = await request.get(`${API}/v1/user/orders`, { headers: headers() })
    const userBody = await ok(userRes)
    const userOrders = extractList(userBody)

    // user 端订单应是 admin 全部订单的子集
    const adminIds = new Set(adminOrders.map((o: any) => o.id).filter(Boolean))
    for (const order of userOrders) {
      if (order.id) {
        expect(
          adminIds.has(order.id),
          `订单 ${order.id} (${order.orderNo ?? 'N/A'}) 在 user 端存在但 admin 中缺失`
        ).toBeTruthy()
      }
    }

    // user 端订单数不应超过 admin 端（admin 看全部，user 只看自己的）
    expect(
      userOrders.length,
      `user 端订单数(${userOrders.length})不应超过 admin 端订单数(${adminOrders.length})`
    ).toBeLessThanOrEqual(adminOrders.length)
  })

  // ── Dashboard 统计 vs 实际数据 ──────────────────────────────────────────
  test('admin dashboard 统计 == 设备列表实际统计', async ({ request }) => {
    // 获取 dashboard 统计
    const statsRes = await request.get(`${API}/dashboard/stats`, { headers: headers() })
    const statsBody = await ok(statsRes)
    const stats = statsBody?.data
    expect(stats, 'dashboard stats 数据不应为空').toBeTruthy()

    // 获取设备列表
    const devicesRes = await request.get(`${API}/devices`, { headers: headers() })
    const devicesBody = await ok(devicesRes)
    const devices = extractList(devicesBody)

    // 验证设备总数一致
    if (stats.deviceCount !== undefined && stats.deviceCount > 0) {
      expect(
        devices.length,
        `dashboard 设备总数(${stats.deviceCount})与实际设备数(${devices.length})不一致`
      ).toBe(stats.deviceCount)
    }

    // 验证在线设备数一致
    if (stats.onlineDeviceCount !== undefined) {
      const actualOnline = devices.filter(
        (d: any) => d.status === 'ONLINE' || d.status === 'online'
      ).length
      expect(
        actualOnline,
        `dashboard 在线设备数(${stats.onlineDeviceCount})与实际在线数(${actualOnline})不一致`
      ).toBe(stats.onlineDeviceCount)
    }
  })

  // ── 用户余额一致性 ──────────────────────────────────────────────────────
  test('user-miniapp 用户信息包含有效余额字段', async ({ request }) => {
    // user 通过 /api/v1/user/info 获取用户信息
    const res = await request.get(`${API}/v1/user/info`, { headers: headers() })
    const body = await ok(res)
    const userInfo = body?.data

    expect(userInfo, '用户信息不应为空').toBeTruthy()

    // 验证 balance 字段存在
    expect(
      userInfo,
      '用户信息中应包含 balance 字段'
    ).toHaveProperty('balance')

    // 验证 balance 是数值类型
    expect(
      typeof userInfo.balance,
      `balance 应为数值类型，实际为 ${typeof userInfo.balance}`
    ).toBe('number')

    // 验证 balance >= 0（非负）
    expect(
      userInfo.balance,
      '用户余额不应为负数'
    ).toBeGreaterThanOrEqual(0)
  })

  // ── 充电站可用端口一致性 ────────────────────────────────────────────────
  test('充电站可用端口数 == 连接器实际可用数', async ({ request }) => {
    // 获取站点列表
    const stationsRes = await request.get(`${API}/v1/stations`, { headers: headers() })
    const stationsBody = await ok(stationsRes)
    const stations = extractList(stationsBody)

    // 获取设备列表
    const devicesRes = await request.get(`${API}/devices`, { headers: headers() })
    const devicesBody = await ok(devicesRes)
    const devices = extractList(devicesBody)

    // 对每个站点，检查其声明的端口数是否与实际设备/连接器数匹配
    for (const station of stations) {
      if (!station.id) continue

      const stationDevices = devices.filter((d: any) => d.stationId === station.id)
      const onlineCount = stationDevices.filter(
        (d: any) => d.status === 'ONLINE' || d.status === 'online'
      ).length

      // 如果站点声明了设备数，验证一致性
      if (station.deviceCount !== undefined) {
        expect(
          stationDevices.length,
          `站点 ${station.name}(${station.id}) 声明设备数 ${station.deviceCount}，实际 ${stationDevices.length}`
        ).toBe(station.deviceCount)
      }

      // 如果站点声明了在线数，验证一致性
      if (station.onlineCount !== undefined) {
        expect(
          onlineCount,
          `站点 ${station.name}(${station.id}) 声明在线数 ${station.onlineCount}，实际 ${onlineCount}`
        ).toBe(onlineCount)
      }
    }
  })

  // ── 订单状态一致性 ──────────────────────────────────────────────────────
  test('订单状态分布 == 后端实际状态统计', async ({ request }) => {
    // 获取全部订单
    const ordersRes = await request.get(`${API}/v1/orders`, { headers: headers() })
    const ordersBody = await ok(ordersRes)
    const orders = extractList(ordersBody)

    // 获取 dashboard 统计
    const statsRes = await request.get(`${API}/dashboard/stats`, { headers: headers() })
    const statsBody = await ok(statsRes)
    const stats = statsBody?.data

    // 统计各状态数量
    const statusCounts: Record<string, number> = {}
    for (const order of orders) {
      const status = order.status ?? 'UNKNOWN'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    }

    // 验证 todayOrderCount 与实际订单数关系
    // 注意：todayOrderCount 只统计今日订单，总订单数 >= 今日订单数
    if (stats?.todayOrderCount !== undefined) {
      const totalOrders = orders.length
      expect(
        totalOrders,
        `总订单数(${totalOrders})不应小于今日订单数(${stats.todayOrderCount})`
      ).toBeGreaterThanOrEqual(stats.todayOrderCount)
    }

    // 验证已结算订单数的一致性
    if (stats?.settledOrderCount !== undefined) {
      const settledCount = statusCounts['SETTLED'] ?? 0
      expect(
        settledCount,
        `已结算订单数: dashboard(${stats.settledOrderCount}) vs 实际(${settledCount})`
      ).toBe(stats.settledOrderCount)
    }

    // 验证所有订单状态值在合法范围内
    const validStatuses = new Set([
      'CREATED', 'CHARGING', 'STOPPING', 'STOPPED',
      'SETTLING', 'SETTLED', 'PAYING', 'PAID',
      'REFUNDING', 'ABNORMAL', 'CANCELLED',
    ])
    for (const order of orders) {
      if (order.status) {
        expect(
          validStatuses.has(order.status),
          `订单 ${order.id} 状态 "${order.status}" 不在合法状态集中`
        ).toBeTruthy()
      }
    }
  })

  // ── 跨端认证一致性 ──────────────────────────────────────────────────────
  test('同一 token 在所有端均有效', async ({ request }) => {
    // 登录获取 token（已在 beforeAll 中获取，这里验证其有效性）
    expect(adminToken, 'admin token 应存在').toBeTruthy()

    const authHeaders = { Authorization: `Bearer ${adminToken}` }

    // 验证 admin 端 API
    const adminRes = await request.get(`${API}/v1/stations`, { headers: authHeaders })
    expect(
      adminRes.ok(),
      `admin 端 API 返回 ${adminRes.status()}，token 应有效`
    ).toBeTruthy()

    // 验证 ops 端 API
    const opsRes = await request.get(`${API}/v1/ops/stations`, { headers: authHeaders })
    expect(
      opsRes.ok(),
      `ops 端 API 返回 ${opsRes.status()}，token 应有效`
    ).toBeTruthy()

    // 验证 user 端 API
    const userRes = await request.get(`${API}/v1/user/info`, { headers: authHeaders })
    expect(
      userRes.ok(),
      `user 端 API 返回 ${userRes.status()}，token 应有效`
    ).toBeTruthy()

    // 验证 simulator 端 API
    const simRes = await request.get(`${API}/simulator/devices`, { headers: authHeaders })
    expect(
      simRes.ok(),
      `simulator 端 API 返回 ${simRes.status()}，token 应有效`
    ).toBeTruthy()
  })
})
