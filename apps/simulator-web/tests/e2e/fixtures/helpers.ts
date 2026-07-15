import { type Page, type Locator } from '@playwright/test'

export async function waitForDataLoad(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout })
  await page.waitForTimeout(500)
}

export async function getElementText(locator: Locator): Promise<string> {
  return (await locator.textContent()) || ''
}

export async function getElementCount(locator: Locator): Promise<number> {
  return locator.count()
}

export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({ path: `test-results/${name}-${timestamp}.png` })
}

export async function measureLoadTime(page: Page, url: string): Promise<number> {
  const start = Date.now()
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  return Date.now() - start
}

export async function getMemoryUsage(page: Page): Promise<number> {
  return page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0
  })
}
