import { test, expect } from '@playwright/test'

test.describe('全量回归测试', () => {
  const pages = [
    { name: '仪表盘', path: '/dashboard', selector: '.dashboard-page' },
    { name: '充电模拟', path: '/charging', selector: '.charging-page' },
    { name: '设备管理', path: '/device', selector: '.device-page' },
    { name: '场景编排', path: '/scenario', selector: '.scenario-page' },
    { name: '日志终端', path: '/logs', selector: '.logs-page' },
  ]

  for (const p of pages) {
    test(`${p.name}页面加载不报错 (${p.path})`, async ({ page }) => {
      await page.goto(p.path, { waitUntil: 'networkidle' })
      const container = page.locator(p.selector).or(page.locator('[class*="page"]'))
      await expect(container).toBeVisible({ timeout: 10000 })
    })
  }

  test('所有页面无JS控制台错误', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    for (const p of pages) {
      await page.goto(p.path, { waitUntil: 'networkidle' })
    }
    expect(errors).toHaveLength(0)
  })

  test('所有页面无未处理Promise rejection', async ({ page }) => {
    const rejections: string[] = []
    page.on('pageerror', err => rejections.push(err.message))
    for (const p of pages) {
      await page.goto(p.path, { waitUntil: 'networkidle' })
    }
    expect(rejections).toHaveLength(0)
  })
})
