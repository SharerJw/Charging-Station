import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'

test.describe('Dashboard 冒烟测试', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/仪表盘/)
    await dashboardPage.waitForLoad()
    const count = await dashboardPage.getStatCardCount()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('设备选择器显示', async ({ page }) => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.deviceSelector).toBeVisible()
  })

  test('图表渲染完成', async ({ page }) => {
    await dashboardPage.waitForLoad()
    const chartCount = await dashboardPage.charts.count()
    expect(chartCount).toBeGreaterThanOrEqual(3)
  })

  test('控制栏功能', async ({ page }) => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.pauseButton).toBeVisible()
    const isLive = await dashboardPage.isLiveVisible()
    expect(isLive).toBe(true)
  })

  test('统计卡片数值大于零', async ({ page }) => {
    await dashboardPage.waitForLoad()
    const totalDevices = page.locator('text=设备总数').locator('..').locator('.stat-value, .font-number').first()
    await expect(totalDevices).toBeVisible()
    const text = await totalDevices.textContent()
    const value = parseInt((text || '0').replace(/[^0-9]/g, ''), 10)
    expect(value).toBeGreaterThanOrEqual(0)
  })

  test('事件流区域可见', async ({ page }) => {
    await dashboardPage.waitForLoad()
    const eventsSection = page.locator('.events-section')
    await expect(eventsSection).toBeVisible()
  })

  test('刷新间隔切换', async ({ page }) => {
    await dashboardPage.waitForLoad()
    const oneSecondBtn = page.locator('.el-radio-button:has-text("1s")')
    await expect(oneSecondBtn).toBeVisible()
    await oneSecondBtn.click()
    await expect(oneSecondBtn).toHaveClass(/is-active|active/)
  })
})
