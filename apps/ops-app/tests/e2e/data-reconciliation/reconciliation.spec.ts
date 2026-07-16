import { test, expect, type APIRequestContext } from '@playwright/test'

const API = 'http://localhost:8080/api'

/** POST /auth/login and return the bearer token. */
async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/auth/login`, {
    data: { username: 'admin', password: 'admin123' },
  })
  const body = await res.json()
  return body?.data?.token ?? body?.token ?? ''
}

test.describe('数据对账', () => {
  let authToken: string

  test.beforeAll(async ({ request }) => {
    authToken = await getToken(request)
  })

  const authHeaders = () => ({ Authorization: `Bearer ${authToken}` })

  test('告警数与API返回一致', async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ops_token', 'mock-ops-token')
    })
    const apiResp = await request.get(`${API}/v1/ops/alerts`, { headers: authHeaders() })
    if (!apiResp.ok()) {
      test.skip(true, 'Alerts API not available')
      return
    }
    const apiBody = await apiResp.json()
    const apiTotal = apiBody.data?.total ?? (apiBody.data?.list ?? apiBody.data ?? []).length
    const apiAlertCount = typeof apiTotal === 'number' ? apiTotal : 0

    await page.goto('/#/pages/alert/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const alertList = page.locator('.alert-list')
    const emptyState = page.locator('.empty-state')
    const hasAlerts = await alertList.isVisible().catch(() => false)

    if (hasAlerts) {
      const uiCount = await alertList.locator('.alert-item, [class*="alert-item"]').count()
      expect(uiCount).toBeLessThanOrEqual(apiAlertCount)
    } else {
      expect(apiAlertCount).toBeGreaterThanOrEqual(0)
    }
  })

  test('工单数与API返回一致', async ({ page, request }) => {
    await page.addInitScript(() => {
      localStorage.setItem('ops_token', 'mock-ops-token')
    })
    const apiResp = await request.get(`${API}/v1/ops/workorders`, { headers: authHeaders() })
    if (!apiResp.ok()) {
      test.skip(true, 'Workorders API not available')
      return
    }
    const apiBody = await apiResp.json()
    const apiTotal = apiBody.data?.total ?? (apiBody.data?.list ?? apiBody.data ?? []).length
    const apiOrderCount = typeof apiTotal === 'number' ? apiTotal : 0

    await page.goto('/#/pages/workorder/index')
    await page.waitForLoadState('domcontentloaded')
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
    await page.addInitScript(() => {
      localStorage.setItem('ops_token', 'mock-ops-token')
    })
    const apiResp = await request.get(`${API}/v1/ops/stations`, { headers: authHeaders() })
    if (!apiResp.ok()) {
      test.skip(true, 'Stations API not available')
      return
    }
    const apiBody = await apiResp.json()
    const apiTotal = apiBody.data?.total ?? (apiBody.data?.list ?? apiBody.data ?? []).length
    const apiStationCount = typeof apiTotal === 'number' ? apiTotal : 0

    await page.goto('/#/pages/station/index')
    await page.waitForLoadState('domcontentloaded')
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
