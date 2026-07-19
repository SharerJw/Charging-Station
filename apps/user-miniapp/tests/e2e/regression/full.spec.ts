import { test, expect } from '@playwright/test'

const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k')
  })
})

test.describe('全量回归测试', () => {
  const pages = [
    { name: '首页', path: '/#/pages/index/index', selector: '.index-page' },
    { name: '找桩', path: '/#/pages/map/index', selector: '.map-page' },
    { name: '充电', path: '/#/pages/charging/index', selector: '.charging-page' },
    { name: '订单', path: '/#/pages/order/index', selector: '.order-page' },
    { name: '我的', path: '/#/pages/profile/index', selector: '.profile-page' },
  ]

  for (const p of pages) {
    test(`${p.name}页面加载不报错 (${p.path})`, async ({ page }) => {
      await page.goto(p.path)
      await page.waitForLoadState('domcontentloaded')
      // 页面容器应存在（允许有空状态）
      const container = page.locator(p.selector).first()
      await expect(container).toBeVisible({ timeout: 10000 })
    })
  }

  test('所有页面无JS控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    for (const p of pages) {
      await page.goto(p.path)
      await page.waitForLoadState('domcontentloaded')
    }
    expect(errors).toHaveLength(0)
  })

  test('所有页面无未处理Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    for (const p of pages) {
      await page.goto(p.path)
      await page.waitForLoadState('domcontentloaded')
    }
    expect(rejections).toHaveLength(0)
  })
})
