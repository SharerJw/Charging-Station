import { test, expect } from '@playwright/test'
import { OrderPage } from '../fixtures/page-objects/OrderPage'

let orderPage: OrderPage

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('admin_token', 'mock-token-for-test')
  })
  orderPage = new OrderPage(page)
  await orderPage.goto()
})

test.describe('订单管理冒烟测试', () => {
  test('页面加载成功', async ({ page }) => {
    await orderPage.waitForLoad()
    await expect(page).toHaveTitle(/订单中心/)
  })

  test('订单表格渲染', async () => {
    await orderPage.waitForLoad()
    await expect(orderPage.table).toBeVisible({ timeout: 15000 })
  })

  test('状态筛选器可见', async () => {
    await orderPage.waitForLoad()
    await expect(orderPage.statusSelect).toBeVisible()
  })
})
