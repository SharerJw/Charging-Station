import { test, expect } from '@playwright/test'

/**
 * 幽灵数据检测测试
 * 1. 刷新页面多次，数据必须保持一致（无幽灵数据）
 * 2. 同一查询多次执行，结果必须一致
 */

const REFRESH_COUNT = 3
const API_BASE = '/api'

// ---------- 工具函数 ----------

/** 从 Dashboard DOM 提取统计卡片数值 */
async function getDashboardStatValues(page: import('@playwright/test').Page): Promise<number[]> {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('.stat-card')
    return Array.from(cards).map(card => {
      const raw = card.querySelector('.stat-value')?.textContent || '0'
      return parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0
    })
  })
}

/** 从 Pinia store 提取设备 ID 列表 */
async function getStoreDeviceIds(page: import('@playwright/test').Page): Promise<string[]> {
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

/** 从 Device 页面提取设备卡片的 OCPP ID 列表 */
async function getDevicePageOcppIds(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const cards = document.querySelectorAll('.device-card')
    return Array.from(cards).map(card => {
      return card.querySelector('.device-id')?.textContent?.trim() || ''
    }).filter(Boolean)
  })
}

/** 从 Charging 页面提取设备 ID 列表 */
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

/** 调用 API 并返回设备 ID 列表 */
async function fetchDeviceIds(request: any): Promise<string[]> {
  const resp = await request.get(`${API_BASE}/simulator/devices`)
  const body = await resp.json()
  const devices = body?.data?.list || body?.data || body?.list || body || []
  return devices.map((d: any) => d.id)
}

/** 调用 API 并返回统计信息 */
async function fetchStats(request: any) {
  const resp = await request.get(`${API_BASE}/simulator/stats`)
  const body = await resp.json()
  return body?.data || body
}

// ==================== 测试套件 ====================

test.describe('幽灵数据检测 - Dashboard', () => {
  test('刷新 3 次，统计卡片数值不变', async ({ page }) => {
    const readings: number[][] = []

    for (let i = 0; i < REFRESH_COUNT; i++) {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.stat-card', { timeout: 10000 })
      await page.waitForTimeout(800)
      const values = await getDashboardStatValues(page)
      readings.push(values)
    }

    // 所有刷新的值必须完全一致
    for (let i = 1; i < readings.length; i++) {
      expect(readings[i]).toEqual(readings[0])
    }
  })

  test('刷新 3 次，设备列表不变', async ({ page }) => {
    const readings: string[][] = []

    for (let i = 0; i < REFRESH_COUNT; i++) {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.stat-card', { timeout: 10000 })
      await page.waitForTimeout(800)
      const ids = await getStoreDeviceIds(page)
      readings.push(ids)
    }

    for (let i = 1; i < readings.length; i++) {
      expect(readings[i]).toEqual(readings[0])
    }
  })

  test('刷新 3 次，设备状态分布不变', async ({ page }) => {
    const statusSnapshots: Array<Record<string, number>> = []

    for (let i = 0; i < REFRESH_COUNT; i++) {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.stat-card', { timeout: 10000 })
      await page.waitForTimeout(800)

      const devices = await page.evaluate(() => {
        const app = (document.querySelector('#app') as any)?.__vue_app__
        if (!app) return []
        const pinia = app.config.globalProperties.$pinia
        if (!pinia) return []
        const store = pinia.state.value?.simulator
        return store?.devices || []
      })

      const counts: Record<string, number> = { online: 0, offline: 0, charging: 0, fault: 0 }
      for (const d of devices) {
        if (counts[d.status] !== undefined) counts[d.status]++
      }
      statusSnapshots.push(counts)
    }

    for (let i = 1; i < statusSnapshots.length; i++) {
      expect(statusSnapshots[i]).toEqual(statusSnapshots[0])
    }
  })
})

test.describe('幽灵数据检测 - Charging 页面', () => {
  test('刷新 3 次，设备列表不变', async ({ page }) => {
    const readings: string[][] = []

    for (let i = 0; i < REFRESH_COUNT; i++) {
      await page.goto('/charging')
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.charging-page', { timeout: 10000 })
      await page.waitForTimeout(800)
      const ids = await getChargingDeviceIds(page)
      readings.push(ids)
    }

    for (let i = 1; i < readings.length; i++) {
      expect(readings[i]).toEqual(readings[0])
    }
  })
})

test.describe('幽灵数据检测 - Device 页面', () => {
  test('刷新 3 次，设备列表不变', async ({ page }) => {
    const readings: string[][] = []

    for (let i = 0; i < REFRESH_COUNT; i++) {
      await page.goto('/device')
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.device-card', { timeout: 10000 })
      await page.waitForTimeout(800)
      const ids = await getDevicePageOcppIds(page)
      readings.push(ids)
    }

    for (let i = 1; i < readings.length; i++) {
      expect(readings[i]).toEqual(readings[0])
    }
  })

  test('刷新 3 次，设备详情不变', async ({ page }) => {
    const snapshots: Array<Array<{ name: string; ocppId: string; model: string }>> = []

    for (let i = 0; i < REFRESH_COUNT; i++) {
      await page.goto('/device')
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.device-card', { timeout: 10000 })
      await page.waitForTimeout(800)

      const details = await page.evaluate(() => {
        const cards = document.querySelectorAll('.device-card')
        return Array.from(cards).map(card => ({
          name: card.querySelector('.device-name')?.textContent?.trim() || '',
          ocppId: card.querySelector('.device-id')?.textContent?.trim() || '',
          model: card.querySelector('.device-model .value')?.textContent?.trim() || '',
        }))
      })
      snapshots.push(details)
    }

    for (let i = 1; i < snapshots.length; i++) {
      expect(snapshots[i]).toEqual(snapshots[0])
    }
  })
})

test.describe('反复查询检测 - API 一致性', () => {
  test('同一 API 查询 3 次，结果一致 - devices', async ({ request }) => {
    const results: string[][] = []

    for (let i = 0; i < 3; i++) {
      const ids = await fetchDeviceIds(request)
      results.push(ids)
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0])
    }
  })

  test('同一 API 查询 3 次，结果一致 - stats', async ({ request }) => {
    const results: any[] = []

    for (let i = 0; i < 3; i++) {
      const stats = await fetchStats(request)
      results.push(stats)
    }

    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0])
    }
  })

  test('Dashboard UI 值与连续 3 次 API 调用结果一致', async ({ page, request }) => {
    // 3 次 API 调用
    const apiResults: any[] = []
    for (let i = 0; i < 3; i++) {
      apiResults.push(await fetchStats(request))
    }
    // 所有 API 结果一致
    for (let i = 1; i < apiResults.length; i++) {
      expect(apiResults[i]).toEqual(apiResults[0])
    }

    // UI 加载
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('.stat-card', { timeout: 10000 })
    await page.waitForTimeout(800)

    const uiValues = await getDashboardStatValues(page)
    expect(uiValues[0]).toBe(apiResults[0].totalDevices)
    expect(uiValues[1]).toBe(apiResults[0].onlineDevices)
  })
})
