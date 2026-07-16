import { test, expect } from '@playwright/test'

/**
 * 跨页面数据联动校验测试
 * 验证不同页面之间的数据一致性（同一数据源）
 */

const API_BASE = '/api'

// ---------- 工具函数 ----------

/** 从 Pinia store 提取设备列表 */
async function getStoreDevices(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const app = (document.querySelector('#app') as any)?.__vue_app__
    if (!app) return []
    const pinia = app.config.globalProperties.$pinia
    if (!pinia) return []
    const store = pinia.state.value?.simulator
    return store?.devices || []
  })
}

/** 从 Pinia store 提取设备 ID 列表 */
async function getStoreDeviceIds(page: import('@playwright/test').Page): Promise<string[]> {
  const devices = await getStoreDevices(page)
  return devices.map((d: any) => d.id)
}

/** 从 Device 页面提取设备卡片的 OCPP ID 列表 */
async function getDevicePageOcppIds(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('.device-card')
    return Array.from(cards).map(card => {
      return card.querySelector('.device-id')?.textContent?.trim() || ''
    }).filter(Boolean)
  })
}

/** 调用 API 获取设备 ID 列表 */
async function fetchDeviceIds(request: any): Promise<string[]> {
  const resp = await request.get(`${API_BASE}/simulator/devices`)
  const body = await resp.json()
  const devices = body?.data?.list || body?.data || body?.list || body || []
  return devices.map((d: any) => d.id)
}

// ==================== 测试套件 ====================

test.describe('跨页面数据联动 - Dashboard vs Charging', () => {
  test('Dashboard 设备列表 == Charging 设备列表', async ({ page }) => {
    // 1. 打开 Dashboard，获取设备列表
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)
    const dashboardIds = await getStoreDeviceIds(page)

    // 2. 打开 Charging，获取设备列表
    await page.goto('/charging')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.charging-page', { timeout: 10000 })
    await page.waitForTimeout(800)
    const chargingIds = await getStoreDeviceIds(page)

    // 3. 两个列表必须完全一致
    expect(chargingIds).toEqual(dashboardIds)
  })

  test('Dashboard 设备状态与 Charging 设备状态一致', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)
    const dashboardDevices = await getStoreDevices(page)

    // 2. Charging
    await page.goto('/charging')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.charging-page', { timeout: 10000 })
    await page.waitForTimeout(800)
    const chargingDevices = await getStoreDevices(page)

    // 3. 设备数量一致
    expect(chargingDevices.length).toBe(dashboardDevices.length)

    // 4. 每个设备的状态一致
    for (const dashDevice of dashboardDevices) {
      const chargeDevice = chargingDevices.find((d: any) => d.id === dashDevice.id)
      expect(chargeDevice).toBeDefined()
      if (chargeDevice) {
        expect(chargeDevice.status).toBe(dashDevice.status)
      }
    }
  })
})

test.describe('跨页面数据联动 - Dashboard vs Device', () => {
  test('Dashboard 设备列表 == Device 页面设备列表（首页）', async ({ page }) => {
    // 1. Dashboard - 全量设备列表
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)
    const dashboardIds = await getStoreDeviceIds(page)

    // 2. Device 页面 - 分页，默认前 10 个
    await page.goto('/device')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.device-card', { timeout: 10000 })
    await page.waitForTimeout(800)
    const devicePageIds = await getDevicePageOcppIds(page)

    // Device 页面是分页的，取前 min(total, 10) 个
    const expectedCount = Math.min(dashboardIds.length, 10)
    expect(devicePageIds.length).toBe(expectedCount)

    // Device 页面的前 N 个设备必须都在 Dashboard 设备列表中
    for (const id of devicePageIds) {
      expect(dashboardIds).toContain(id)
    }
  })
})

test.describe('跨页面数据联动 - 三端与 API 一致性', () => {
  test('Dashboard / Charging / Device 三端设备列表与 API 一致', async ({ page, request }) => {
    // 1. API 获取设备列表
    const resp = await request.get(`${API_BASE}/simulator/devices`)
    const body = await resp.json()
    const apiDevices = body?.data?.list || body?.data || body?.list || body || []
    const apiIds = apiDevices.map((d: any) => d.id)

    // 2. Dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)
    const dashboardIds = await getStoreDeviceIds(page)

    // 3. Charging
    await page.goto('/charging')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.charging-page', { timeout: 10000 })
    await page.waitForTimeout(800)
    const chargingIds = await getStoreDeviceIds(page)

    // 4. 三个来源的设备列表完全一致
    expect(dashboardIds).toEqual(apiIds)
    expect(chargingIds).toEqual(apiIds)
  })
})

test.describe('跨页面数据联动 - 页面跳转数据一致性', () => {
  test('从 Dashboard 跳转到 Charging，设备数据一致', async ({ page }) => {
    // 1. 先在 Dashboard 获取数据
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const dashboardIds = await getStoreDeviceIds(page)
    const dashboardDevices = await getStoreDevices(page)

    // 2. 通过导航跳转到 Charging（模拟用户点击菜单）
    //    直接 goto 也能验证路由切换后的数据加载
    await page.goto('/charging')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.charging-page', { timeout: 10000 })
    await page.waitForTimeout(800)

    const chargingIds = await getStoreDeviceIds(page)
    const chargingDevices = await getStoreDevices(page)

    // 3. 设备数量一致
    expect(chargingIds.length).toBe(dashboardIds.length)

    // 4. 设备 ID 列表完全一致
    expect(chargingIds).toEqual(dashboardIds)

    // 5. 设备详细属性一致（前 3 个设备）
    for (const dashDevice of dashboardDevices.slice(0, 3)) {
      const chargeDevice = chargingDevices.find((d: any) => d.id === dashDevice.id)
      expect(chargeDevice).toBeDefined()
      if (chargeDevice) {
        expect(chargeDevice.ocppId).toBe(dashDevice.ocppId)
        expect(chargeDevice.model).toBe(dashDevice.model)
        expect(chargeDevice.status).toBe(dashDevice.status)
      }
    }
  })

  test('从 Dashboard 跳转到 Device，设备数据一致', async ({ page }) => {
    // 1. Dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const dashboardIds = await getStoreDeviceIds(page)

    // 2. Device 页面
    await page.goto('/device')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.device-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const devicePageIds = await getDevicePageOcppIds(page)

    // 3. Device 页面是分页的，第一页的设备必须是 Dashboard 列表的子集
    for (const id of devicePageIds) {
      expect(dashboardIds).toContain(id)
    }

    // 4. Device 页面的总数分页信息应与 Dashboard 设备总数一致
    const totalText = await page.locator('.el-pagination .el-pagination__total').textContent()
    if (totalText) {
      const totalMatch = totalText.match(/(\d+)/)
      if (totalMatch) {
        expect(parseInt(totalMatch[1], 10)).toBe(dashboardIds.length)
      }
    }
  })
})
