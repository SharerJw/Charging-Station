import { test, expect } from '@playwright/test'
import { StationPage } from '../fixtures/page-objects/StationPage'

let stationPage: StationPage

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'mock-token-for-test')
  })
  stationPage = new StationPage(page)
  await stationPage.goto()
})

test.describe('充电站管理冒烟测试', () => {
  test('页面加载成功', async ({ page }) => {
    await stationPage.waitForLoad()
    await expect(page).toHaveTitle(/站点管理/)
  })

  test('充电站表格渲染', async () => {
    await stationPage.waitForLoad()
    await expect(stationPage.table).toBeVisible({ timeout: 15000 })
  })

  test('搜索或添加按钮可见', async () => {
    await stationPage.waitForLoad()
    await expect(stationPage.searchInput).toBeVisible()
    await expect(stationPage.createButton).toBeVisible()
  })
})
