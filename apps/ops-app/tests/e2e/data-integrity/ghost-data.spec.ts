import { test, expect } from '@playwright/test'

// ── Stable mock data for ghost data detection ──────────────────────────────────
const STABLE_OPS_STATS = {
  onlineDevices: 85,
  pendingAlerts: 12,
  pendingWorkorders: 7,
  todayInspections: 10,
  completedInspections: 6,
}

const STABLE_ALERTS = {
  list: [
    { id: 'A001', level: 'P0', title: '设备通信中断', description: 'OCPP心跳超时30分钟', stationName: '国贸中心充电站', deviceCode: 'DC-001', status: 'pending', createTime: '2024-07-01 10:00' },
    { id: 'A002', level: 'P1', title: '充电功率异常', description: '输出功率低于额定值50%', stationName: '望京SOHO充电站', deviceCode: 'AC-001', status: 'processing', createTime: '2024-07-01 11:30' },
    { id: 'A003', level: 'P2', title: '环境温度过高', description: '设备柜内温度超过60度', stationName: '中关村科技园充电站', deviceCode: 'DC-005', status: 'resolved', createTime: '2024-07-01 14:00' },
  ],
}

// ── Setup mock routes returning stable data ────────────────────────────────────
async function setupStableMockRoutes(page: any) {
  // Catch-all for ops API calls (Playwright uses last matching route)
  await page.route('**/ops/**', (route: any) =>
    route.fulfill({ json: { code: 0, data: { list: [], total: 0 } } })
  )
  await page.route('**/internal/**', (route: any) =>
    route.fulfill({ json: { code: 0, data: { onlineDeviceCount: STABLE_OPS_STATS.onlineDevices } } })
  )
  // Specific routes (registered after catch-all, so they WIN)
  await page.route('**/ops/alerts**', (route: any) =>
    route.fulfill({ json: { code: 0, data: STABLE_ALERTS } })
  )
  await page.route('**/ops/workorders**', (route: any) =>
    route.fulfill({ json: { code: 0, data: { list: [] } } })
  )
  await page.route('**/ops/inspections**', (route: any) =>
    route.fulfill({ json: { code: 0, data: { list: [] } } })
  )
  await page.route('**/ops/stations**', (route: any) =>
    route.fulfill({ json: { code: 0, data: { list: [] } } })
  )
  // Block WebSocket
  await page.route('ws://**', (route: any) => route.abort('blockedbyclient'))
}

async function setupOpsAuth(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('ops_token', 'mock-ops-token')
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ops-app: Ghost Data Detection Tests
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('ops-app 数据完整性 - 幽灵数据检测', () => {

  test('工作台刷新3次统计数据不变', async ({ page }) => {
    await setupStableMockRoutes(page)
    await setupOpsAuth(page)

    // 第一次加载
    await page.goto('/#/pages/index/index')
    await page.waitForTimeout(2000)

    const statCards = page.locator('.stat-card')
    await expect(statCards).toHaveCount(3, { timeout: 10000 })

    // 采集第一轮数据
    const round1Values: string[] = []
    for (let i = 0; i < 3; i++) {
      const value = await statCards.nth(i).locator('.stat-value').innerText()
      round1Values.push(value)
    }

    // 刷新3次，每次都对比第一轮
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.goto('/#/pages/index/index')
      await page.waitForTimeout(2000)

      for (let i = 0; i < 3; i++) {
        const currentValue = await statCards.nth(i).locator('.stat-value').innerText()
        expect(currentValue).toBe(round1Values[i])
      }
    }
  })

  test('告警页刷新3次列表不变', async ({ page }) => {
    await setupStableMockRoutes(page)
    await setupOpsAuth(page)

    // 第一次加载
    await page.goto('/#/pages/alert/index')
    await page.waitForTimeout(2000)

    const alertCards = page.locator('.alert-card')
    await expect(alertCards).toHaveCount(STABLE_ALERTS.list.length, { timeout: 10000 })

    // 采集第一轮第一条告警标题
    const firstTitle1 = await alertCards.first().locator('.alert-title').innerText()
    const count1 = await alertCards.count()

    // 刷新3次，验证列表一致
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.goto('/#/pages/alert/index')
      await page.waitForTimeout(2000)

      const currentCount = await alertCards.count()
      expect(currentCount).toBe(count1)

      const currentTitle = await alertCards.first().locator('.alert-title').innerText()
      expect(currentTitle).toBe(firstTitle1)
    }
  })
})
