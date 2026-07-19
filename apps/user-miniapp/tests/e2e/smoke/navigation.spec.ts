import { test, expect } from '@playwright/test'

// Setup auth before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k')
  })
})

test.describe('底部导航', () => {
  test('底部导航栏各标签应可点击', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    const tabBar = page.locator('.uni-tabbar')
    await expect(tabBar).toBeVisible({ timeout: 10000 })

    // 确认所有 4 个 tab 存在
    const tabItems = tabBar.locator('.uni-tabbar__item')
    await expect(tabItems).toHaveCount(4)
  })

  test('点击不同 tab 应跳转到对应页面', async ({ page }) => {
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.index-page')).toBeVisible({ timeout: 10000 })

    // 点击"找桩" tab
    const tabBar = page.locator('.uni-tabbar')
    await tabBar.locator('.uni-tabbar__item').nth(1).click()
    await expect(page.locator('.map-page')).toBeVisible()

    // 点击"订单" tab
    await tabBar.locator('.uni-tabbar__item').nth(2).click()
    await expect(page.locator('.order-page')).toBeVisible()

    // 点击"我的" tab
    await tabBar.locator('.uni-tabbar__item').nth(3).click()
    await expect(page.locator('.profile-page')).toBeVisible()
  })
})
