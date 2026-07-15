import { test, expect } from '@playwright/test'

test.describe('API 数据一致性', () => {
  test('API 返回值与 UI 显示值匹配', async ({ page }) => {
    // 拦截 API 响应
    const statsResponse = page.waitForResponse('**/api/simulator/stats')
    await page.goto('/dashboard')
    const response = await statsResponse
    const apiData = await response.json()

    // 等待 UI 渲染
    await page.waitForSelector('.stat-card')
    await page.waitForTimeout(500)

    // 获取 UI 显示值
    const uiValues = await page.evaluate(() => {
      const cards = document.querySelectorAll('.stat-card')
      return Array.from(cards).map(card => {
        const value = card.querySelector('.stat-value')?.textContent || '0'
        return parseInt(value.replace(/[^0-9]/g, ''), 10)
      })
    })

    // 验证一致性
    expect(uiValues[0]).toBe(apiData.data.totalDevices)
    expect(uiValues[1]).toBe(apiData.data.onlineDevices)
  })

  test('设备列表 API 与 UI 一致', async ({ page }) => {
    const devicesResponse = page.waitForResponse('**/api/simulator/devices')
    await page.goto('/device')
    const response = await devicesResponse
    const apiDevices = await response.json()

    await page.waitForSelector('.device-item')
    const uiCount = await page.locator('.device-item').count()

    expect(uiCount).toBe(apiDevices.data.length)
  })
})
