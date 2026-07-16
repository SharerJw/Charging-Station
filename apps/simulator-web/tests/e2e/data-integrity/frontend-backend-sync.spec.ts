import { test, expect } from '@playwright/test'
import { testData } from '../fixtures/test-data'

/**
 * 前后端数据校验测试
 * 验证每个页面显示的数据与后端API返回的数据一致
 */

// API 响应基础路径 (axios baseURL = '/api', deviceApi.list → '/simulator/devices')
const API_BASE = '/api'

// ---------- 工具函数 ----------

/** 从 API 获取设备列表 */
async function fetchDevices(request: any) {
  const resp = await request.get(`${API_BASE}/simulator/devices`)
  const body = await resp.json()
  // axios interceptor 解包后返回 { code, message, data }, 前端拿 data
  // 但 Playwright request 不走 axios 拦截器，需兼容两种结构
  return body?.data?.list || body?.data || body?.list || body || []
}

/** 从 API 获取统计信息 */
async function fetchStats(request: any) {
  const resp = await request.get(`${API_BASE}/simulator/stats`)
  const body = await resp.json()
  return body?.data || body
}

/** 从 Dashboard DOM 提取 4 个统计卡片的数值 */
async function getDashboardStatValues(page: import('@playwright/test').Page): Promise<number[]> {
  // DOM 结构: div.stat-card > div.stat-info > div.stat-value.font-number
  return page.evaluate(() => {
    const cards = document.querySelectorAll('.stat-card')
    return Array.from(cards).map(card => {
      const raw = card.querySelector('.stat-value')?.textContent || '0'
      // 去除逗号和非数字字符 (累计电量可能有 toLocaleString 千位分隔符)
      return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0
    })
  })
}

/** 从 Dashboard DOM 提取设备选择器中的设备 ID 列表 */
async function getDashboardDeviceIds(page: import('@playwright/test').Page): Promise<string[]> {
  // DeviceSelect 组件基于 el-select, 选项在 el-select-dropdown__item 中
  // 但未展开时选项不在 DOM, 所以从 Pinia store 中取
  return page.evaluate(() => {
    // @ts-ignore - Pinia store 注入在 window 或 Vue app 上
    const app = (document.querySelector('#app') as any)?.__vue_app__
    if (!app) return []
    const pinia = app.config.globalProperties.$pinia
    if (!pinia) return []
    const store = pinia.state.value?.simulator
    if (!store?.devices) return []
    return store.devices.map((d: any) => d.id)
  })
}

/** 从 Charging 页面 DOM 提取设备选择器中的设备 ID 列表 */
async function getChargingDeviceIds(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const app = (document.querySelector('#app') as any)?.__vue_app__
    if (!app) return []
    const pinia = app.config.globalProperties.$pinia
    if (!pinia) return []
    const store = pinia.state.value?.simulator
    if (!store?.devices) return []
    return store.devices.map((d: any) => d.id)
  })
}

/** 从 Device 页面 DOM 提取设备卡片列表 */
async function getDevicePageCards(page: import('@playwright/test').Page): Promise<Array<{ id: string; name: string; ocppId: string; model: string; status: string }>> {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('.device-card')
    return Array.from(cards).map(card => {
      const name = card.querySelector('.device-name')?.textContent?.trim() || ''
      const ocppId = card.querySelector('.device-id')?.textContent?.trim() || ''
      const model = card.querySelector('.device-model .value')?.textContent?.trim() || ''
      const statusTag = card.querySelector('.el-tag')
      const status = statusTag?.textContent?.trim() || ''
      return { id: ocppId, name, ocppId, model, status }
    })
  })
}

/** 计算设备列表的状态分布 */
function computeStatusCounts(devices: Array<{ status: string }>) {
  const counts: Record<string, number> = { online: 0, offline: 0, charging: 0, fault: 0 }
  for (const d of devices) {
    if (counts[d.status] !== undefined) {
      counts[d.status]++
    }
  }
  return counts
}

// ==================== 测试套件 ====================

test.describe('前后端数据校验 - Dashboard', () => {
  test('Dashboard 统计卡片数值与 /api/simulator/stats 一致', async ({ page, request }) => {
    const apiStats = await fetchStats(request)

    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    // 等待 Vue 渲染完成
    await page.waitForTimeout(800)

    const uiValues = await getDashboardStatValues(page)

    // 至少有 4 个统计卡片
    expect(uiValues.length).toBeGreaterThanOrEqual(4)

    // 设备总数
    expect(uiValues[0]).toBe(apiStats.totalDevices)
    // 在线设备
    expect(uiValues[1]).toBe(apiStats.onlineDevices)
    // 充电中
    expect(uiValues[2]).toBe(apiStats.chargingDevices)
    // 累计电量
    expect(uiValues[3]).toBe(apiStats.totalEnergy)
  })

  test('Dashboard 设备选择器列表与 /api/simulator/devices 一致', async ({ page, request }) => {
    const apiDevices = await fetchDevices(request)

    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const uiDeviceIds = await getDashboardDeviceIds(page)

    // 数量一致
    expect(uiDeviceIds.length).toBe(apiDevices.length)

    // 每个设备 ID 都在 API 结果中
    const apiDeviceIds = apiDevices.map((d: any) => d.id)
    for (const id of uiDeviceIds) {
      expect(apiDeviceIds).toContain(id)
    }
  })

  test('Dashboard 设备状态分布与设备列表统计一致', async ({ page, request }) => {
    const apiDevices = await fetchDevices(request)

    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const uiDeviceIds = await getDashboardDeviceIds(page)

    // 从 Pinia store 获取完整设备对象以检查状态
    const uiDevices = await page.evaluate(() => {
      const app = (document.querySelector('#app') as any)?.__vue_app__
      if (!app) return []
      const pinia = app.config.globalProperties.$pinia
      if (!pinia) return []
      const store = pinia.state.value?.simulator
      return store?.devices || []
    })

    const apiStatusCounts = computeStatusCounts(apiDevices)
    const uiStatusCounts = computeStatusCounts(uiDevices)

    expect(uiStatusCounts.online).toBe(apiStatusCounts.online)
    expect(uiStatusCounts.offline).toBe(apiStatusCounts.offline)
    expect(uiStatusCounts.charging).toBe(apiStatusCounts.charging)
    expect(uiStatusCounts.fault).toBe(apiStatusCounts.fault)
  })

  test('Dashboard 统计卡片数值与设备列表计算值一致', async ({ page, request }) => {
    const apiDevices = await fetchDevices(request)

    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const uiValues = await getDashboardStatValues(page)
    const statusCounts = computeStatusCounts(apiDevices)

    // 设备总数 = 设备列表长度
    expect(uiValues[0]).toBe(apiDevices.length)
    // 在线设备 = online 状态数量
    expect(uiValues[1]).toBe(statusCounts.online)
    // 充电中 = charging 状态数量
    expect(uiValues[2]).toBe(statusCounts.charging)
  })
})

test.describe('前后端数据校验 - Charging 页面', () => {
  test('Charging 设备选择器列表与 /api/simulator/devices 一致', async ({ page, request }) => {
    const apiDevices = await fetchDevices(request)

    await page.goto('/charging')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.charging-page', { timeout: 10000 })
    await page.waitForTimeout(800)

    const uiDeviceIds = await getChargingDeviceIds(page)

    expect(uiDeviceIds.length).toBe(apiDevices.length)

    const apiDeviceIds = apiDevices.map((d: any) => d.id)
    for (const id of uiDeviceIds) {
      expect(apiDeviceIds).toContain(id)
    }
  })

  test('Charging 选择设备后显示的设备信息与 API 一致', async ({ page, request }) => {
    const apiDevices = await fetchDevices(request)
    if (apiDevices.length === 0) {
      test.skip()
      return
    }

    await page.goto('/charging')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.charging-page', { timeout: 10000 })
    await page.waitForTimeout(800)

    // 确保选中了设备 (页面会自动选中 charging 设备或第一个设备)
    const selectedDeviceInfo = await page.evaluate(() => {
      const app = (document.querySelector('#app') as any)?.__vue_app__
      if (!app) return null
      const pinia = app.config.globalProperties.$pinia
      if (!pinia) return null
      const store = pinia.state.value?.simulator
      return store?.devices?.[0] || null
    })

    if (!selectedDeviceInfo) return

    // 查找对应的 API 设备
    const apiDevice = apiDevices.find((d: any) => d.id === selectedDeviceInfo.id)
    if (!apiDevice) return

    // 检查 DOM 中显示的设备信息
    const deviceInfoVisible = await page.locator('.device-info').isVisible()
    if (!deviceInfoVisible) return

    const ocppIdText = await page.locator('.device-info .info-row:nth-child(1) span:last-child').textContent()
    const modelText = await page.locator('.device-info .info-row:nth-child(2) span:last-child').textContent()

    expect(ocppIdText?.trim()).toBe(apiDevice.ocppId)
    expect(modelText?.trim()).toBe(apiDevice.model)
  })
})

test.describe('前后端数据校验 - Device 页面', () => {
  test('Device 页面设备列表与 /api/simulator/devices 一致', async ({ page, request }) => {
    const apiDevices = await fetchDevices(request)

    await page.goto('/device')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.device-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const uiCards = await getDevicePageCards(page)

    // 设备卡片数量与 API 返回的设备数量一致 (默认分页 10)
    const expectedCount = Math.min(apiDevices.length, 10) // 默认 pageSize = 10
    expect(uiCards.length).toBe(expectedCount)

    // 每个卡片的 OCPP ID 都在 API 结果中
    const apiOcppIds = apiDevices.map((d: any) => d.ocppId)
    for (const card of uiCards) {
      expect(apiOcppIds).toContain(card.ocppId)
    }
  })

  test('Device 页面设备详情（名称、型号、状态）与 API 一致', async ({ page, request }) => {
    const apiDevices = await fetchDevices(request)
    if (apiDevices.length === 0) {
      test.skip()
      return
    }

    await page.goto('/device')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('.device-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const uiCards = await getDevicePageCards(page)

    const statusLabels: Record<string, string> = {
      online: '在线',
      offline: '离线',
      charging: '充电中',
      fault: '故障',
    }

    // 检查前 3 个设备卡片的详细信息
    for (const card of uiCards.slice(0, 3)) {
      const apiDevice = apiDevices.find((d: any) => d.ocppId === card.ocppId)
      if (!apiDevice) continue

      expect(card.name).toBe(apiDevice.name)
      expect(card.model).toBe(apiDevice.model)
      expect(card.status).toBe(statusLabels[apiDevice.status] || apiDevice.status)
    }
  })
})
