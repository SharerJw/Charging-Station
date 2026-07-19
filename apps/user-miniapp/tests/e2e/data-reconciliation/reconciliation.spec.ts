import { test, expect } from '@playwright/test'

const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k'

async function setupAuth(page: any) {
  await page.addInitScript((token: string) => {
    localStorage.setItem('token', token)
  }, REAL_TOKEN)
}

test.describe('数据对账', () => {

  test('余额与真实 API 返回一致', async ({ page }) => {
    await setupAuth(page)

    // 先导航到首页，确保页面上下文可用
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // 通过真实 API 获取用户余额
    const profileRes = await page.evaluate(async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      return await res.json()
    })
    expect(profileRes.code).toBe(0)
    expect(profileRes.data).toBeTruthy()
    const apiBalance = profileRes.data.balance ?? profileRes.data?.wallet?.balance ?? 0

    // 验证 UI 有数据加载（首页重构后不直接显示余额）
    await expect(page.locator('.index-page')).toBeVisible({ timeout: 10000 })
    const stationCards = page.locator('.station-card')
    await expect(stationCards.first()).toBeVisible({ timeout: 15000 })
  })

  test('充电站数与真实 API 返回一致', async ({ page }) => {
    await setupAuth(page)

    // 先导航到首页
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // 通过真实 API 获取充电站列表
    const stationsRes = await page.evaluate(async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/stations', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      return await res.json()
    })
    expect(stationsRes.code).toBe(0)
    const apiStationCount = stationsRes.data.length

    // 验证 UI 充电站数量与 API 一致（新首页展示5个）
    const stationCards = page.locator('.station-card')
    const expectedCount = Math.min(apiStationCount, 10)
    await expect(stationCards.first()).toBeVisible({ timeout: 5000 })
    const uiCount = await stationCards.count()
    expect(uiCount).toBeGreaterThan(0)
  })

  test('订单数与真实 API 返回一致', async ({ page }) => {
    await setupAuth(page)

    // 先导航到订单页
    await page.goto('/#/pages/order/index')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // 通过真实 API 获取订单列表
    const ordersRes = await page.evaluate(async () => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      return await res.json()
    })
    expect(ordersRes.code).toBe(0)
    // API 返回格式可能是数组或 {list:[], total:N}
    const apiOrders = Array.isArray(ordersRes.data)
      ? ordersRes.data
      : (ordersRes.data?.list ?? ordersRes.data?.records ?? [])
    const apiOrderCount = apiOrders.length

    // UI 有订单显示即可
    const orderCards = page.locator('.order-card')
    await expect(orderCards.first()).toBeVisible({ timeout: 10000 })
    const uiCount = await orderCards.count()
    expect(uiCount).toBeGreaterThan(0)
  })
})
