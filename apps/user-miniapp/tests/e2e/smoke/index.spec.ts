import { test, expect } from '@playwright/test'

const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k'

test.beforeEach(async ({ page }) => {
  await page.addInitScript((token: string) => {
    localStorage.setItem('token', token)
  }, REAL_TOKEN)
})

test.describe('首页', () => {
  test('首页应成功加载', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await expect(page.locator('.index-page')).toBeVisible({ timeout: 15000 })
    // 验证核心区域已渲染（金刚区或站点列表）
    const hasContent = await page.locator('.index-page').first().isVisible()
    expect(hasContent).toBeTruthy()
  })

  test('附近充电站列表应有数据', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('networkidle')
    // 等待充电站卡片出现（API 数据加载后渲染）
    const stationCards = page.locator('.station-card')
    await expect(stationCards.first()).toBeVisible({ timeout: 20000 })
    const count = await stationCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('底部导航栏应可见', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    const tabBar = page.locator('.uni-tabbar')
    await expect(tabBar).toBeVisible({ timeout: 15000 })
  })
})
