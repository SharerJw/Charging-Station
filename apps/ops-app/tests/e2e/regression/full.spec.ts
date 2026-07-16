import { test, expect } from '@playwright/test'

test.describe('全量回归测试', () => {
  const pages = [
    { name: '工作台', path: '/#/pages/index/index', selector: '.workbench-page' },
    { name: '告警', path: '/#/pages/alert/index', selector: '.alert-page' },
    { name: '工单', path: '/#/pages/workorder/index', selector: '.workorder-page' },
    { name: '站点', path: '/#/pages/station/index', selector: '.station-page' },
    { name: '设备', path: '/#/pages/device/index', selector: '.device-page' },
    { name: '巡检', path: '/#/pages/inspection/index', selector: '.inspection-page' },
    { name: '个人', path: '/#/pages/profile/index', selector: '.profile-page' },
  ]

  for (const p of pages) {
    test(`${p.name}页面加载不报错 (${p.path})`, async ({ page }) => {
      await page.goto(p.path, { waitUntil: 'networkidle' })
      // 页面容器应存在（允许有空状态）
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
