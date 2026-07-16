import { test, expect } from '@playwright/test'

test.describe('导航冒烟测试', () => {
  const menuItems = [
    { title: '仪表盘', path: '/dashboard' },
    { title: '充电模拟', path: '/charging' },
    { title: '设备管理', path: '/device' },
    { title: '场景编排', path: '/scenario' },
    { title: '日志终端', path: '/logs' },
  ]

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
  })

  for (const item of menuItems) {
    test(`菜单「${item.title}」点击跳转`, async ({ page }) => {
      const menuItem = page.locator(`.el-menu-item:has-text("${item.title}")`)
      await expect(menuItem).toBeVisible()
      await menuItem.click()
      await expect(page).toHaveURL(new RegExp(item.path))
      await page.waitForLoadState('domcontentloaded')
    })
  }

  test('侧边栏折叠功能', async ({ page }) => {
    const aside = page.locator('.el-aside')
    const initialWidth = await aside.evaluate(el => el.getBoundingClientRect().width)
    const collapseBtn = page.locator('.collapse-btn')
    await expect(collapseBtn).toBeVisible()
    await collapseBtn.click()
    await page.waitForTimeout(500)
    const collapsedWidth = await aside.evaluate(el => el.getBoundingClientRect().width)
    expect(collapsedWidth).toBeLessThan(initialWidth)
  })
})
