import { test, expect } from '@playwright/test'
import { DevicePage } from '../fixtures/page-objects/DevicePage'
import { testData } from '../fixtures/test-data'

test.describe('设备生命周期', () => {
  let devicePage: DevicePage

  test.beforeEach(async ({ page }) => {
    devicePage = new DevicePage(page)
    await devicePage.goto()
  })

  test('完整设备管理流程', async ({ page }) => {
    // 1. 创建设备
    await devicePage.addDevice(
      testData.device.name,
      testData.device.ocppId,
      testData.device.model
    )

    // 2. 验证设备出现在列表
    await expect(page.locator(`text=${testData.device.name}`)).toBeVisible()

    // 3. 修改设备状态
    await page.locator(`text=${testData.device.name}`).click()
    await page.locator('text=上线').click()
    await expect(page.locator('.status-online')).toBeVisible()

    // 4. 重置设备
    await page.locator('text=重置').click()
    await page.locator('text=确认').click()

    // 5. 删除设备
    await devicePage.deleteDevice(testData.device.name)
    await expect(page.locator(`text=${testData.device.name}`)).not.toBeVisible()
  })
})
