import { test, expect } from '@playwright/test'
import { DevicePage } from '../fixtures/page-objects/DevicePage'

test.describe('Device 冒烟测试', () => {
  let devicePage: DevicePage

  test.beforeEach(async ({ page }) => {
    devicePage = new DevicePage(page)
    await devicePage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/设备管理/)
    await devicePage.waitForLoad()
  })

  test('设备列表显示', async ({ page }) => {
    await devicePage.waitForLoad()
    await expect(devicePage.deviceList).toBeVisible()
  })

  test('添加设备按钮', async ({ page }) => {
    await expect(devicePage.addButton).toBeVisible()
  })
})
