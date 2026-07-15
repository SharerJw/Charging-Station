# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\e2e\smoke\dashboard.spec.ts >> Dashboard 冒烟测试 >> 图表渲染完成
- Location: tests\e2e\smoke\dashboard.spec.ts:24:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/dashboard", waiting until "load"

```

# Test source

```ts
  1  | import { type Page, type Locator } from '@playwright/test'
  2  | 
  3  | export class DashboardPage {
  4  |   readonly page: Page
  5  |   readonly statCards: Locator
  6  |   readonly deviceCards: Locator
  7  |   readonly controlBar: Locator
  8  |   readonly charts: Locator
  9  |   readonly liveIndicator: Locator
  10 | 
  11 |   constructor(page: Page) {
  12 |     this.page = page
  13 |     this.statCards = page.locator('.stat-card')
  14 |     this.deviceCards = page.locator('.device-card')
  15 |     this.controlBar = page.locator('.control-bar')
  16 |     this.charts = page.locator('canvas')
  17 |     this.liveIndicator = page.locator('text=LIVE')
  18 |   }
  19 | 
  20 |   async goto() {
> 21 |     await this.page.goto('/dashboard')
     |                     ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  22 |     await this.page.waitForLoadState('networkidle')
  23 |   }
  24 | 
  25 |   async waitForLoad() {
  26 |     await this.statCards.first().waitFor({ state: 'visible' })
  27 |     await this.page.waitForTimeout(500)
  28 |   }
  29 | 
  30 |   async getStatCardCount() {
  31 |     return this.statCards.count()
  32 |   }
  33 | 
  34 |   async getDeviceCardCount() {
  35 |     return this.deviceCards.count()
  36 |   }
  37 | 
  38 |   async getKpiValues() {
  39 |     const values = await this.page.evaluate(() => {
  40 |       const cards = document.querySelectorAll('.stat-card')
  41 |       return Array.from(cards).map(card => {
  42 |         const value = card.querySelector('.stat-value')?.textContent || '0'
  43 |         return parseInt(value.replace(/[^0-9]/g, ''), 10)
  44 |       })
  45 |     })
  46 |     return {
  47 |       totalDevices: values[0] || 0,
  48 |       onlineDevices: values[1] || 0,
  49 |       chargingDevices: values[2] || 0,
  50 |       totalEnergy: values[3] || 0,
  51 |     }
  52 |   }
  53 | 
  54 |   async clickDevice(index: number) {
  55 |     await this.deviceCards.nth(index).click()
  56 |   }
  57 | 
  58 |   async isLiveVisible() {
  59 |     return this.liveIndicator.isVisible()
  60 |   }
  61 | }
  62 | 
```