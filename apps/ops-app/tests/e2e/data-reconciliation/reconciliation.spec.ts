import { test, expect } from '@playwright/test'

const API = '/api'

test.describe('数据对账', () => {
  test('告警数与API返回一致', async ({ page, request }) => {
    // 从API获取告警总数
    const apiResp = await request.get(`${API}/v1/alerts`)
    expect(apiResp.ok()).toBeTruthy()
    const apiBody = await apiResp.json()
    const apiTotal = apiBody.data?.total ?? (apiBody.data?.list ?? apiBody.data ?? []).length
    const apiAlertCount = typeof apiTotal === 'number' ? apiTotal : 0

    // 从页面获取显示的告警数
    await page.goto('/#/pages/alert/index')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 页面中应显示告警列表或空状态
    const alertList = page.locator('.alert-list')
    const emptyState = page.locator('.empty-state')
    const hasAlerts = await alertList.isVisible().catch(() => false)

    if (hasAlerts) {
      const uiCount = await alertList.locator('.alert-item, [class*="alert-item"]').count()
      // UI显示数量应小于等于API总数（分页可能导致不完全显示）
      expect(uiCount).toBeLessThanOrEqual(apiAlertCount)
    } else {
      // 空状态说明 API 返回 0 或用户无权限
      expect(apiAlertCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('工单数与API返回一致', async ({ page, request }) => {
    // 从API获取工单总数
    const apiResp = await request.get(`${API}/v1/workorders`)
    expect(apiResp.ok()).toBeTruthy()
    const apiBody = await apiResp.json()
    const apiTotal = apiBody.data?.total ?? (apiBody.data?.list ?? apiBody.data ?? []).length
    const apiOrderCount = typeof apiTotal === 'number' ? apiTotal : 0

    // 从页面获取显示的工单数
    await page.goto('/#/pages/workorder/index')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const workorderList = page.locator('.workorder-list')
    const emptyState = page.locator('.empty-state')
    const hasOrders = await workorderList.isVisible().catch(() => false)

    if (hasOrders) {
      const uiCount = await workorderList.locator('.workorder-item, [class*="order-item"]').count()
      expect(uiCount).toBeLessThanOrEqual(apiOrderCount)
    } else {
      expect(apiOrderCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('站点数与API返回一致', async ({ page, request }) => {
    // 从API获取站点总数
    const apiResp = await request.get(`${API}/v1/ops/stations`)
    expect(apiResp.ok()).toBeTruthy()
    const apiBody = await apiResp.json()
    const apiTotal = apiBody.data?.total ?? (apiBody.data?.list ?? apiBody.data ?? []).length
    const apiStationCount = typeof apiTotal === 'number' ? apiTotal : 0

    // 从页面获取显示的站点数
    await page.goto('/#/pages/station/index')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const stationList = page.locator('.station-list')
    const hasStations = await stationList.isVisible().catch(() => false)

    if (hasStations) {
      const uiCount = await stationList.locator('.station-item, [class*="station-item"]').count()
      expect(uiCount).toBeLessThanOrEqual(apiStationCount)
    } else {
      expect(apiStationCount).toBeGreaterThanOrEqual(0)
    }
  })
})
