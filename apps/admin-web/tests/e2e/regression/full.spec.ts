import { test, expect } from '@playwright/test'
import { setupApiMocks } from '../fixtures/api-mocks'

test.describe('全量回归 - 所有页面可访问', () => {
  const PAGES = [
    { path: '/dashboard', title: '工作台' },
    { path: '/station', title: '充电站' },
    { path: '/device', title: '设备' },
    { path: '/order', title: '订单' },
    { path: '/alert', title: '告警' },
    { path: '/ops', title: '工单' },
    { path: '/finance', title: '财务' },
    { path: '/pricing', title: '定价' },
    { path: '/marketing', title: '营销' },
    { path: '/analytics', title: '分析' },
    { path: '/user', title: '用户' },
    { path: '/system', title: '系统' },
  ]

  for (const pg of PAGES) {
    test(`${pg.path} 页面可正常访问`, async ({ page }) => {
      await setupApiMocks(page)
      await page.addInitScript(() => {
        localStorage.setItem('admin_token', 'mock-token-for-test')
      })
      const errors: string[] = []
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
      await page.goto(pg.path)
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(1000)
      // 页面不为空白
      const bodyText = await page.locator('body').textContent()
      expect(bodyText?.length).toBeGreaterThan(0)
    })
  }
})
