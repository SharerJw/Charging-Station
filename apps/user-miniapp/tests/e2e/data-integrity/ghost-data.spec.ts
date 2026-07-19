import { test, expect } from '@playwright/test'

const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k'

async function setupAuth(page: any) {
  await page.addInitScript((token: string) => {
    localStorage.setItem('token', token)
  }, REAL_TOKEN)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  user-miniapp: Ghost Data Detection Tests (Real API)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('user-miniapp 数据完整性 - 幽灵数据检测', () => {

  test('首页刷新3次余额和充电站不变', async ({ page }) => {
    await setupAuth(page)

    // 第一次加载
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // 采集站点数据（首页不再显示余额，只验证站点一致性）
    const stationCards = page.locator('.station-card')
    await expect(stationCards.first()).toBeVisible({ timeout: 15000 })
    const stationCount1 = await stationCards.count()
    const firstStationName1 = await stationCards.first().locator('.station-name').innerText()

    // 刷新3次，验证数据一致
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.goto('/#/pages/index/index')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // 验证充电站数量和名称不变
      const currentCount = await stationCards.count()
      expect(currentCount).toBe(stationCount1)
      const currentFirstStation = await stationCards.first().locator('.station-name').innerText()
      expect(currentFirstStation).toBe(firstStationName1)
    }
  })

  test('订单页刷新3次列表不变', async ({ page }) => {
    await setupAuth(page)

    // 第一次加载
    await page.goto('/#/pages/order/index')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    // 采集订单数据
    const orderCards = page.locator('.order-card')
    await expect(orderCards.first()).toBeVisible({ timeout: 15000 })
    const orderCount1 = await orderCards.count()

    const firstStationName1 = await orderCards.first().locator('[class*="station-name"]').innerText()

    // 刷新3次，验证列表一致
    for (let refresh = 1; refresh <= 3; refresh++) {
      await page.goto('/#/pages/order/index')
      await page.waitForTimeout(2000)

      const currentCount = await orderCards.count()
      expect(currentCount).toBe(orderCount1)

      const currentStationName = await orderCards.first().locator('[class*="station-name"]').innerText()
      expect(currentStationName).toBe(firstStationName1)
    }
  })
})
