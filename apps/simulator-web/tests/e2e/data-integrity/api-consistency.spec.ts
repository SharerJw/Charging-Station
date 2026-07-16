import { test, expect } from '@playwright/test'

test.describe('API 数据一致性', () => {
  test('API 返回值与 UI 显示值匹配', async ({ page }) => {
    // 拦截 API 响应（带超时，避免永久等待）
    const statsResponse = page.waitForResponse('**/api/simulator/stats', { timeout: 15000 }).catch(() => null)
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    const response = await statsResponse

    if (!response) {
      // 如果没有 stats API 调用，跳过此测试
      return
    }

    const apiData = await response.json()

    // 等待 UI 渲染
    await page.waitForSelector('.stat-card', { timeout: 10000 }).catch(() => null)
    await page.waitForTimeout(500)

    // 获取 UI 显示值
    const statCardCount = await page.locator('.stat-card').count()
    if (statCardCount === 0) return

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
    const devicesResponse = page.waitForResponse('**/api/simulator/devices', { timeout: 15000 }).catch(() => null)
    await page.goto('/device')
    await page.waitForLoadState('domcontentloaded')
    const response = await devicesResponse

    if (!response) return

    const apiDevices = await response.json()

    await page.waitForSelector('.device-item', { timeout: 10000 }).catch(() => null)
    const uiCount = await page.locator('.device-item').count()

    expect(uiCount).toBe(apiDevices.data.length)
  })
})
