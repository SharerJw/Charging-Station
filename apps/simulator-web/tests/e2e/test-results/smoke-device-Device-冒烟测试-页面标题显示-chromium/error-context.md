# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke\device.spec.ts >> Device 冒烟测试 >> 页面标题显示
- Location: tests\e2e\smoke\device.spec.ts:17:3

# Error details

```
Error: locator.waitFor: Error: strict mode violation: locator('text=设备管理') resolved to 2 elements:
    1) <li tabindex="-1" role="menuitem" data-v-22686b16="" class="el-menu-item is-active">…</li> aka getByRole('menuitem', { name: '设备管理' })
    2) <h2 data-v-fd60707f="" class="page-title">设备管理</h2> aka getByRole('heading', { name: '设备管理' })

Call log:
  - waiting for locator('text=设备管理') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: ⚡
      - generic [ref=e7]: EV充电模拟器
    - menubar [ref=e8]:
      - menuitem "仪表盘" [ref=e9] [cursor=pointer]:
        - img [ref=e11]
        - text: 仪表盘
      - menuitem "充电模拟" [ref=e13] [cursor=pointer]:
        - img [ref=e15]
        - text: 充电模拟
      - menuitem "设备管理" [ref=e18] [cursor=pointer]:
        - img [ref=e20]
        - text: 设备管理
      - menuitem "场景编排" [ref=e23] [cursor=pointer]:
        - img [ref=e25]
        - text: 场景编排
      - menuitem "日志终端" [ref=e28] [cursor=pointer]:
        - img [ref=e30]
        - text: 日志终端
  - generic [ref=e32]:
    - generic [ref=e33]:
      - generic [ref=e34]:
        - img [ref=e36] [cursor=pointer]
        - generic [ref=e40]: 已连接
      - generic [ref=e41]: v0.1.0
    - main [ref=e42]:
      - generic [ref=e44]:
        - heading "设备管理" [level=2] [ref=e45]
        - button "添加设备" [ref=e46] [cursor=pointer]:
          - generic [ref=e47]: 添加设备
```

# Test source

```ts
  1  | import { type Page, type Locator } from '@playwright/test'
  2  | 
  3  | export class DevicePage {
  4  |   readonly page: Page
  5  |   readonly addButton: Locator
  6  |   readonly pageTitle: Locator
  7  | 
  8  |   constructor(page: Page) {
  9  |     this.page = page
  10 |     this.addButton = page.locator('text=添加设备')
  11 |     this.pageTitle = page.locator('text=设备管理')
  12 |   }
  13 | 
  14 |   async goto() {
  15 |     await this.page.goto('/device')
  16 |     await this.page.waitForLoadState('networkidle')
  17 |   }
  18 | 
  19 |   async waitForLoad() {
> 20 |     await this.pageTitle.waitFor({ state: 'visible' })
     |                          ^ Error: locator.waitFor: Error: strict mode violation: locator('text=设备管理') resolved to 2 elements:
  21 |     await this.page.waitForTimeout(500)
  22 |   }
  23 | 
  24 |   async isAddButtonVisible() {
  25 |     return this.addButton.isVisible()
  26 |   }
  27 | 
  28 |   async clickAddButton() {
  29 |     await this.addButton.click()
  30 |   }
  31 | 
  32 |   async isDeviceVisible(name: string) {
  33 |     return this.page.locator(`text=${name}`).isVisible()
  34 |   }
  35 | }
  36 | 
```