import { test, expect } from '@playwright/test'
import { LogsPage } from '../fixtures/page-objects/LogsPage'

test.describe('Logs 冒烟测试', () => {
  let logsPage: LogsPage

  test.beforeEach(async ({ page }) => {
    logsPage = new LogsPage(page)
    await logsPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/日志终端/)
    await logsPage.waitForLoad()
  })

  test('页面标题显示', async ({ page }) => {
    await logsPage.waitForLoad()
    const isLoaded = await logsPage.isPageLoaded()
    expect(isLoaded).toBe(true)
  })
})
