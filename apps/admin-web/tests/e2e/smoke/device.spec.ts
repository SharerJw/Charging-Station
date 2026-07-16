import { test, expect } from '@playwright/test'
import { DevicePage } from '../fixtures/page-objects/DevicePage'

let devicePage: DevicePage

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'mock-token-for-test')
  })
  devicePage = new DevicePage(page)
  await devicePage.goto()
})

test.describe('设备管理冒烟测试', () => {
  test('页面加载成功', async ({ page }) => {
    await devicePage.waitForLoad()
    await expect(page).toHaveTitle(/设备管理/)
  })

  test('设备表格渲染', async () => {
    await devicePage.waitForLoad()
    await expect(devicePage.table).toBeVisible({ timeout: 15000 })
  })

  test('状态筛选器可见', async () => {
    await devicePage.waitForLoad()
    await expect(devicePage.statusSelect).toBeVisible()
  })
})
