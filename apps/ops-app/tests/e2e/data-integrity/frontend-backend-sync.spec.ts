import { test, expect } from '@playwright/test'

// ── Mock data for ops-app API endpoints ────────────────────────────────────────
const MOCK_OPS_STATS = {
  onlineDevices: 85,
  pendingAlerts: 12,
  pendingWorkorders: 7,
  todayInspections: 10,
  completedInspections: 6,
}

const MOCK_ALERTS = {
  list: [
    { id: 'A001', level: 'P0', title: '设备通信中断', description: 'OCPP心跳超时30分钟', stationName: '国贸中心充电站', deviceCode: 'DC-001', status: 'pending', createTime: '2024-07-01T10:00:00' },
    { id: 'A002', level: 'P1', title: '充电功率异常', description: '输出功率低于额定值50%', stationName: '望京SOHO充电站', deviceCode: 'AC-001', status: 'processing', createTime: '2024-07-01T11:30:00' },
    { id: 'A003', level: 'P2', title: '环境温度过高', description: '设备柜内温度超过60°C', stationName: '中关村科技园充电站', deviceCode: 'DC-005', status: 'resolved', createTime: '2024-07-01T14:00:00' },
  ],
}

const MOCK_WORKORDERS = {
  list: [
    { id: 'W001', orderNo: 'WO-20240701-001', type: 'repair', title: 'DC-001通信模块故障', description: '设备频繁掉线', stationName: '国贸中心充电站', deviceCode: 'DC-001', priority: 'high', status: 'pending', creator: '系统', createTime: '2024-07-01 10:00' },
    { id: 'W002', orderNo: 'WO-20240701-002', type: 'maintenance', title: 'AC-001定期保养', description: '季度保养检查', stationName: '望京SOHO充电站', deviceCode: 'AC-001', priority: 'medium', status: 'accepted', creator: '管理员', assignee: '张运维', createTime: '2024-07-01 09:00' },
    { id: 'W003', orderNo: 'WO-20240701-003', type: 'inspection', title: '中关村站点巡检', description: '例行巡检', stationName: '中关村科技园充电站', deviceCode: 'DC-005', priority: 'low', status: 'completed', creator: '管理员', assignee: '李运维', result: '巡检正常', createTime: '2024-07-01 08:00' },
  ],
}

// ── Setup mock routes for ops-app ──────────────────────────────────────────────
async function setupOpsMockRoutes(page: any, apiData: Record<string, any> = {}) {
  const data = { stats: MOCK_OPS_STATS, alerts: MOCK_ALERTS, workorders: MOCK_WORKORDERS, ...apiData }

  // Single handler with URL-based dispatch
  await page.route('**/ops/**', (route: any) => {
    const url = route.request().url()
    if (url.includes('/alerts')) {
      return route.fulfill({ json: { code: 0, data: apiData.alerts ?? data.alerts } })
    }
    if (url.includes('/workorders')) {
      return route.fulfill({ json: { code: 0, data: apiData.workorders ?? data.workorders } })
    }
    if (url.includes('/inspections')) {
      return route.fulfill({ json: { code: 0, data: apiData.inspections ?? { list: [] } } })
    }
    if (url.includes('/stations')) {
      return route.fulfill({ json: { code: 0, data: apiData.stations ?? { list: [] } } })
    }
    route.fulfill({ json: { code: 0, data: { list: [], total: 0 } } })
  })
  await page.route('**/internal/**', (route: any) => {
    const url = route.request().url()
    if (url.includes('/stats')) {
      return route.fulfill({ json: { code: 0, data: { onlineDeviceCount: data.stats.onlineDevices } } })
    }
    route.fulfill({ json: { code: 0, data: {} } })
  })
  // Block WebSocket
  await page.route('ws://**', (route: any) => route.abort('blockedbyclient'))
}

async function setupOpsAuth(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('ops_token', 'mock-ops-token')
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ops-app: Frontend-Backend Data Sync Tests
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('ops-app 数据完整性 - 前后端同步', () => {

  test('工作台统计与 API 一致', async ({ page }) => {
    await setupOpsMockRoutes(page)
    await setupOpsAuth(page)

    await page.goto('/#/pages/index/index')
    await page.waitForTimeout(2000)

    // 验证统计卡片数据与 API 返回一致
    const statCards = page.locator('.stat-card')
    await expect(statCards).toHaveCount(3, { timeout: 10000 })

    // 在线设备
    await expect(statCards.nth(0).locator('.stat-value')).toContainText(
      String(MOCK_OPS_STATS.onlineDevices)
    )
    await expect(statCards.nth(0).locator('.stat-label')).toContainText('在线设备')

    // 待处理告警 (calculated from alerts list, not stats mock)
    await expect(statCards.nth(1).locator('.stat-value')).toContainText(
      String(MOCK_ALERTS.list.length)
    )
    await expect(statCards.nth(1).locator('.stat-label')).toContainText('待处理告警')

    // 待办工单 (calculated from workorders list with status 'pending')
    await expect(statCards.nth(2).locator('.stat-value')).toContainText(
      String(MOCK_WORKORDERS.list.filter((w: any) => w.status === 'pending').length)
    )
    await expect(statCards.nth(2).locator('.stat-label')).toContainText('待办工单')
  })

  test('告警列表与 /api/v1/alerts 一致', async ({ page }) => {
    await setupOpsMockRoutes(page)
    await setupOpsAuth(page)

    await page.goto('/#/pages/alert/index')
    await page.waitForTimeout(2000)

    const alertCards = page.locator('.alert-card')
    await expect(alertCards).toHaveCount(MOCK_ALERTS.list.length, { timeout: 10000 })

    // 验证第一条告警
    const firstAlert = alertCards.first()
    await expect(firstAlert.locator('.alert-title')).toContainText(MOCK_ALERTS.list[0].title)
    await expect(firstAlert.locator('.alert-level')).toContainText(MOCK_ALERTS.list[0].level)
  })

  test('工单列表与 /api/v1/workorders 一致', async ({ page }) => {
    await setupOpsMockRoutes(page)
    await setupOpsAuth(page)

    await page.goto('/#/pages/workorder/index')
    await page.waitForTimeout(2000)

    const workorderCards = page.locator('.workorder-card')
    await expect(workorderCards).toHaveCount(MOCK_WORKORDERS.list.length, { timeout: 10000 })

    // 验证第一条工单
    const firstOrder = workorderCards.first()
    await expect(firstOrder.locator('.workorder-id')).toContainText(MOCK_WORKORDERS.list[0].orderNo)
    await expect(firstOrder.locator('.workorder-title')).toContainText(MOCK_WORKORDERS.list[0].title)
  })
})
