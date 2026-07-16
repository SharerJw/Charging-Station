import type { Page } from '@playwright/test'

/** Set up API route mocks for smoke tests so they don't depend on a running backend. */
export async function setupApiMocks(page: Page) {
  // Station list
  await page.route('**/api/stations?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'success', data: { list: [], total: 0 } }),
    }),
  )
  // Station detail
  await page.route('**/api/stations/[!\\?]*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'success', data: null }),
    }),
  )
  // Device list
  await page.route('**/api/devices?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'success', data: { list: [], total: 0 } }),
    }),
  )
  // Device detail
  await page.route('**/api/devices/[!\\?]*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'success', data: null }),
    }),
  )
  // Order list
  await page.route('**/api/orders?**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: 'success', data: { list: [], total: 0 } }),
    }),
  )
  // Dashboard APIs
  await page.route('**/api/dashboard/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 0,
        message: 'success',
        data: {
          stationCount: 0, deviceCount: 0, onlineDeviceCount: 0,
          todayOrderCount: 0, todayRevenue: 0, monthRevenue: 0,
          totalEnergy: 0, todayEnergy: 0,
          dates: [], orderCounts: [], revenues: [], energies: [],
          recentOrders: [], stationRank: [],
          pendingAlerts: 0, pendingWorkOrders: 0, settledOrders: 0, refundingOrders: 0,
        },
      }),
    }),
  )
  // Block WebSocket to avoid connection errors
  await page.route('ws://**', route => route.abort('blockedbyclient'))
}
