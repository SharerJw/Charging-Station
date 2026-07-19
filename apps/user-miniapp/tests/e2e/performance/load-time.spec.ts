import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6InVzZXIiLCJ0ZW5hbnRJZCI6IlQwMDEiLCJ1c2VySWQiOjMsIm9yZ0lkIjoiT1JHMDAxIiwidXNlcm5hbWUiOiIxMzgwMDEzODAwMCIsInN1YiI6IjMiLCJpYXQiOjE3ODQ0MDY2MjgsImV4cCI6MTc4NDQxMzgyOH0.Kpr_2YAFAYM8pEOt4vrz836pFIzxJP4uOJ0zFuZ0l5k')
  })
})

test.describe('页面加载性能', () => {
  test('首页加载 < 3秒', async ({ page }) => {
    const start = Date.now()
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - start
    console.log(`user-miniapp 首页加载时间: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000)
  })

  test('无JS控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    expect(errors).toHaveLength(0)
  })

  test('无未处理Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    await page.goto('/#/pages/index/index')
    await page.waitForLoadState('domcontentloaded')
    expect(rejections).toHaveLength(0)
  })
})
