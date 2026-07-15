# 模拟器 Web E2E 测试实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为模拟器 Web 创建完整的 Playwright E2E 测试套件，覆盖冒烟、集成、性能、可访问性、数据核对、截图对比。

**Architecture:** 分层测试架构，使用 Page Object Pattern 封装页面交互，fixtures 管理测试数据，支持并行执行和 HTML 报告。

**Tech Stack:** Playwright + TypeScript + Vitest

## Global Constraints

- 测试目标：http://localhost:5177（模拟器 Web）
- API 代理：/api -> http://localhost:8080
- 深色主题背景色：#0B1120
- 截图阈值：maxDiffPixels: 1000
- 性能阈值：首屏 < 3s，API < 1s，内存 < 100MB
- 数据核对：连续刷新 5 次验证一致性

---

## 阶段一：基础设施搭建

### Task 1: 创建 Playwright 配置

**Files:**
- Create: `apps/simulator-web/tests/e2e/playwright.config.ts`
- Modify: `apps/simulator-web/package.json`

**Interfaces:**
- Produces: Playwright 配置，供所有测试使用

- [ ] **Step 1: 安装 Playwright 依赖**

```bash
cd apps/simulator-web
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: 创建 Playwright 配置文件**

```typescript
// apps/simulator-web/tests/e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5177',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'test-results/',
})
```

- [ ] **Step 3: 更新 package.json 添加测试脚本**

```json
{
  "scripts": {
    "test:e2e": "npx playwright test",
    "test:smoke": "npx playwright test tests/e2e/smoke/",
    "test:integration": "npx playwright test tests/e2e/integration/",
    "test:performance": "npx playwright test tests/e2e/performance/",
    "test:a11y": "npx playwright test tests/e2e/accessibility/",
    "test:screenshots": "npx playwright test tests/e2e/screenshots/",
    "test:data": "npx playwright test tests/e2e/data-integrity/",
    "test:report": "npx playwright show-report test-report"
  }
}
```

- [ ] **Step 4: 验证配置**

```bash
cd apps/simulator-web
npx playwright test --list
```

Expected: 显示测试文件列表

- [ ] **Step 5: 提交**

```bash
git add apps/simulator-web/tests/e2e/playwright.config.ts apps/simulator-web/package.json
git commit -m "test(simulator): add Playwright E2E test configuration"
```

---

### Task 2: 创建测试数据 Fixtures

**Files:**
- Create: `apps/simulator-web/tests/e2e/fixtures/test-data.ts`
- Create: `apps/simulator-web/tests/e2e/fixtures/helpers.ts`

**Interfaces:**
- Produces: `testData` 对象和 `helpers` 工具函数

- [ ] **Step 1: 创建测试数据文件**

```typescript
// apps/simulator-web/tests/e2e/fixtures/test-data.ts
export const testData = {
  device: {
    name: '测试充电桩-自动',
    ocppId: 'EVSE-AUTO-001',
    model: 'DC-120kW',
    power: 120,
  },
  scenario: {
    name: '自动测试场景',
    description: '自动化测试创建的场景',
    steps: [
      { action: 'startCharging', duration: 60 },
      { action: 'stopCharging', duration: 0 },
    ],
  },
  thresholds: {
    loadTime: 3000,
    chartRender: 2000,
    apiResponse: 1000,
    memoryLimit: 100 * 1024 * 1024,
    ghostDataRefreshCount: 5,
    screenshotDiff: 1000,
  },
  urls: {
    dashboard: '/dashboard',
    charging: '/charging',
    device: '/device',
    scenario: '/scenario',
    logs: '/logs',
  },
  colors: {
    background: 'rgb(11, 17, 32)', // #0B1120
    card: 'rgb(17, 24, 39)',       // #111827
    accent: 'rgb(59, 130, 246)',   // #3B82F6
    success: 'rgb(34, 197, 94)',   // #22C55E
    warning: 'rgb(234, 179, 8)',   // #EAB308
    error: 'rgb(239, 68, 68)',     // #EF4444
  },
}
```

- [ ] **Step 2: 创建工具函数文件**

```typescript
// apps/simulator-web/tests/e2e/fixtures/helpers.ts
import { type Page, type Locator } from '@playwright/test'

export async function waitForDataLoad(page: Page, selector: string, timeout = 10000) {
  await page.waitForSelector(selector, { state: 'visible', timeout })
  await page.waitForTimeout(500) // 等待动画完成
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
```

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/fixtures/
git commit -m "test(simulator): add test data fixtures and helpers"
```

---

### Task 3: 创建页面对象

**Files:**
- Create: `apps/simulator-web/tests/e2e/fixtures/page-objects/DashboardPage.ts`
- Create: `apps/simulator-web/tests/e2e/fixtures/page-objects/ChargingPage.ts`
- Create: `apps/simulator-web/tests/e2e/fixtures/page-objects/DevicePage.ts`
- Create: `apps/simulator-web/tests/e2e/fixtures/page-objects/ScenarioPage.ts`
- Create: `apps/simulator-web/tests/e2e/fixtures/page-objects/LogsPage.ts`

**Interfaces:**
- Produces: 5 个页面对象类，封装各页面交互

- [ ] **Step 1: 创建 DashboardPage**

```typescript
// apps/simulator-web/tests/e2e/fixtures/page-objects/DashboardPage.ts
import { type Page, type Locator, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly statCards: Locator
  readonly deviceCards: Locator
  readonly controlBar: Locator
  readonly charts: Locator
  readonly liveIndicator: Locator

  constructor(page: Page) {
    this.page = page
    this.statCards = page.locator('.stat-card')
    this.deviceCards = page.locator('.device-card')
    this.controlBar = page.locator('.control-bar')
    this.charts = page.locator('canvas')
    this.liveIndicator = page.locator('text=LIVE')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.statCards.first().waitFor({ state: 'visible' })
    await this.page.waitForTimeout(500)
  }

  async getStatCardCount() {
    return this.statCards.count()
  }

  async getDeviceCardCount() {
    return this.deviceCards.count()
  }

  async getKpiValues() {
    const values = await this.page.evaluate(() => {
      const cards = document.querySelectorAll('.stat-card')
      return Array.from(cards).map(card => {
        const value = card.querySelector('.stat-value')?.textContent || '0'
        return parseInt(value.replace(/[^0-9]/g, ''), 10)
      })
    })
    return {
      totalDevices: values[0] || 0,
      onlineDevices: values[1] || 0,
      chargingDevices: values[2] || 0,
      totalEnergy: values[3] || 0,
    }
  }

  async clickDevice(index: number) {
    await this.deviceCards.nth(index).click()
  }

  async isLiveVisible() {
    return this.liveIndicator.isVisible()
  }
}
```

- [ ] **Step 2: 创建 ChargingPage**

```typescript
// apps/simulator-web/tests/e2e/fixtures/page-objects/ChargingPage.ts
import { type Page, type Locator } from '@playwright/test'

export class ChargingPage {
  readonly page: Page
  readonly socRing: Locator
  readonly metricCards: Locator
  readonly startButton: Locator
  readonly stopButton: Locator

  constructor(page: Page) {
    this.page = page
    this.socRing = page.locator('.soc-ring')
    this.metricCards = page.locator('.metric-card')
    this.startButton = page.locator('text=启动充电')
    this.stopButton = page.locator('text=停止充电')
  }

  async goto() {
    await this.page.goto('/charging')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.socRing.waitFor({ state: 'visible' })
  }

  async getSocValue() {
    const text = await this.page.locator('.soc-value').textContent()
    return parseInt(text || '0', 10)
  }

  async getMetricCardCount() {
    return this.metricCards.count()
  }

  async startCharging() {
    await this.startButton.click()
  }

  async stopCharging() {
    await this.stopButton.click()
  }
}
```

- [ ] **Step 3: 创建 DevicePage**

```typescript
// apps/simulator-web/tests/e2e/fixtures/page-objects/DevicePage.ts
import { type Page, type Locator } from '@playwright/test'

export class DevicePage {
  readonly page: Page
  readonly deviceList: Locator
  readonly addButton: Locator
  readonly nameInput: Locator
  readonly ocppIdInput: Locator
  readonly modelSelect: Locator
  readonly confirmButton: Locator

  constructor(page: Page) {
    this.page = page
    this.deviceList = page.locator('.device-list')
    this.addButton = page.locator('text=添加设备')
    this.nameInput = page.locator('[name="name"]')
    this.ocppIdInput = page.locator('[name="ocppId"]')
    this.modelSelect = page.locator('[name="model"]')
    this.confirmButton = page.locator('text=确定')
  }

  async goto() {
    await this.page.goto('/device')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.deviceList.waitFor({ state: 'visible' })
  }

  async addDevice(name: string, ocppId: string, model: string) {
    await this.addButton.click()
    await this.nameInput.fill(name)
    await this.ocppIdInput.fill(ocppId)
    await this.modelSelect.selectOption(model)
    await this.confirmButton.click()
  }

  async deleteDevice(name: string) {
    await this.page.locator(`text=${name}`).click()
    await this.page.locator('text=删除').click()
    await this.page.locator('text=确认').click()
  }

  async isDeviceVisible(name: string) {
    return this.page.locator(`text=${name}`).isVisible()
  }
}
```

- [ ] **Step 4: 创建 ScenarioPage**

```typescript
// apps/simulator-web/tests/e2e/fixtures/page-objects/ScenarioPage.ts
import { type Page, type Locator } from '@playwright/test'

export class ScenarioPage {
  readonly page: Page
  readonly scenarioList: Locator
  readonly createButton: Locator

  constructor(page: Page) {
    this.page = page
    this.scenarioList = page.locator('.scenario-list')
    this.createButton = page.locator('text=新建场景')
  }

  async goto() {
    await this.page.goto('/scenario')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.scenarioList.waitFor({ state: 'visible' })
  }

  async createScenario(name: string, description: string) {
    await this.createButton.click()
    await this.page.locator('[name="name"]').fill(name)
    await this.page.locator('[name="description"]').fill(description)
    await this.page.locator('text=保存').click()
  }

  async executeScenario(name: string) {
    await this.page.locator(`text=${name}`).click()
    await this.page.locator('text=执行').click()
  }

  async isScenarioVisible(name: string) {
    return this.page.locator(`text=${name}`).isVisible()
  }
}
```

- [ ] **Step 5: 创建 LogsPage**

```typescript
// apps/simulator-web/tests/e2e/fixtures/page-objects/LogsPage.ts
import { type Page, type Locator } from '@playwright/test'

export class LogsPage {
  readonly page: Page
  readonly terminal: Locator
  readonly messageLines: Locator

  constructor(page: Page) {
    this.page = page
    this.terminal = page.locator('.xterm')
    this.messageLines = page.locator('.message-line')
  }

  async goto() {
    await this.page.goto('/logs')
    await this.page.waitForLoadState('networkidle')
  }

  async waitForLoad() {
    await this.terminal.waitFor({ state: 'visible' })
  }

  async getMessageCount() {
    return this.messageLines.count()
  }

  async isTerminalVisible() {
    return this.terminal.isVisible()
  }
}
```

- [ ] **Step 6: 提交**

```bash
git add apps/simulator-web/tests/e2e/fixtures/page-objects/
git commit -m "test(simulator): add page objects for all pages"
```

---

## 阶段二：冒烟测试

### Task 4: Dashboard 冒烟测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/smoke/dashboard.spec.ts`

**Interfaces:**
- Consumes: `DashboardPage` 页面对象
- Produces: 4 个冒烟测试用例

- [ ] **Step 1: 创建 Dashboard 冒烟测试**

```typescript
// apps/simulator-web/tests/e2e/smoke/dashboard.spec.ts
import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'

test.describe('Dashboard 冒烟测试', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/仪表盘/)
    await dashboardPage.waitForLoad()
    const count = await dashboardPage.getStatCardCount()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('设备卡片显示', async ({ page }) => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.deviceCards.first()).toBeVisible()
  })

  test('图表渲染完成', async ({ page }) => {
    await dashboardPage.waitForLoad()
    const chartCount = await dashboardPage.charts.count()
    expect(chartCount).toBeGreaterThanOrEqual(3)
  })

  test('控制栏功能', async ({ page }) => {
    await dashboardPage.waitForLoad()
    await expect(dashboardPage.controlBar).toBeVisible()
    const isLive = await dashboardPage.isLiveVisible()
    expect(isLive).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
cd apps/simulator-web
npx playwright test tests/e2e/smoke/dashboard.spec.ts
```

Expected: 4 tests passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/smoke/dashboard.spec.ts
git commit -m "test(simulator): add Dashboard smoke tests"
```

---

### Task 5: Charging 冒烟测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/smoke/charging.spec.ts`

**Interfaces:**
- Consumes: `ChargingPage` 页面对象

- [ ] **Step 1: 创建 Charging 冒烟测试**

```typescript
// apps/simulator-web/tests/e2e/smoke/charging.spec.ts
import { test, expect } from '@playwright/test'
import { ChargingPage } from '../fixtures/page-objects/ChargingPage'

test.describe('Charging 冒烟测试', () => {
  let chargingPage: ChargingPage

  test.beforeEach(async ({ page }) => {
    chargingPage = new ChargingPage(page)
    await chargingPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/充电模拟/)
    await chargingPage.waitForLoad()
  })

  test('SOC 环形图显示', async ({ page }) => {
    await chargingPage.waitForLoad()
    await expect(chargingPage.socRing).toBeVisible()
  })

  test('指标卡片显示', async ({ page }) => {
    await chargingPage.waitForLoad()
    const count = await chargingPage.getMetricCardCount()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/smoke/charging.spec.ts
```

Expected: 3 tests passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/smoke/charging.spec.ts
git commit -m "test(simulator): add Charging smoke tests"
```

---

### Task 6: Device/Scenario/Logs 冒烟测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/smoke/device.spec.ts`
- Create: `apps/simulator-web/tests/e2e/smoke/scenario.spec.ts`
- Create: `apps/simulator-web/tests/e2e/smoke/logs.spec.ts`

- [ ] **Step 1: 创建 Device 冒烟测试**

```typescript
// apps/simulator-web/tests/e2e/smoke/device.spec.ts
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
```

- [ ] **Step 2: 创建 Scenario 冒烟测试**

```typescript
// apps/simulator-web/tests/e2e/smoke/scenario.spec.ts
import { test, expect } from '@playwright/test'
import { ScenarioPage } from '../fixtures/page-objects/ScenarioPage'

test.describe('Scenario 冒烟测试', () => {
  let scenarioPage: ScenarioPage

  test.beforeEach(async ({ page }) => {
    scenarioPage = new ScenarioPage(page)
    await scenarioPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/场景编排/)
    await scenarioPage.waitForLoad()
  })

  test('场景列表显示', async ({ page }) => {
    await scenarioPage.waitForLoad()
    await expect(scenarioPage.scenarioList).toBeVisible()
  })
})
```

- [ ] **Step 3: 创建 Logs 冒烟测试**

```typescript
// apps/simulator-web/tests/e2e/smoke/logs.spec.ts
import { test, expect } from '@playwright/test'
import { LogsPage } from '../fixtures/page-objects/LogsPage'

test.describe('Logs 冒烟测试', () => {
  let logsPage: LogsPage

  test.beforeEach(async ({ page }) => {
    logsPage = new LogsPage(page)
    await logsPage.goto()
  })

  test('页面加载成功', async ({ page }) => {
    await expect(page).toHaveTitle(/日志终端/)
    await logsPage.waitForLoad()
  })

  test('终端组件加载', async ({ page }) => {
    await logsPage.waitForLoad()
    const isVisible = await logsPage.isTerminalVisible()
    expect(isVisible).toBe(true)
  })
})
```

- [ ] **Step 4: 运行所有冒烟测试**

```bash
npx playwright test tests/e2e/smoke/
```

Expected: 14 tests passed

- [ ] **Step 5: 提交**

```bash
git add apps/simulator-web/tests/e2e/smoke/
git commit -m "test(simulator): add Device/Scenario/Logs smoke tests"
```

---

## 阶段三：集成测试

### Task 7: 设备生命周期集成测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/integration/device-lifecycle.spec.ts`

- [ ] **Step 1: 创建设备生命周期测试**

```typescript
// apps/simulator-web/tests/e2e/integration/device-lifecycle.spec.ts
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
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/integration/device-lifecycle.spec.ts
```

Expected: 1 test passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/integration/device-lifecycle.spec.ts
git commit -m "test(simulator): add device lifecycle integration test"
```

---

### Task 8: 充电流程集成测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/integration/charging-flow.spec.ts`

- [ ] **Step 1: 创建充电流程测试**

```typescript
// apps/simulator-web/tests/e2e/integration/charging-flow.spec.ts
import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'
import { ChargingPage } from '../fixtures/page-objects/ChargingPage'

test.describe('充电流程', () => {
  test('启动-监控-停止充电', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    const chargingPage = new ChargingPage(page)
    
    // 1. 选择设备
    await dashboardPage.goto()
    await dashboardPage.waitForLoad()
    await dashboardPage.clickDevice(0)
    
    // 2. 启动充电
    await chargingPage.startCharging()
    await expect(page.locator('text=充电中')).toBeVisible()
    
    // 3. 监控数据变化
    await page.waitForTimeout(2000)
    const soc = await chargingPage.getSocValue()
    expect(soc).toBeGreaterThan(0)
    
    // 4. 查看功率曲线
    await expect(page.locator('canvas')).toBeVisible()
    
    // 5. 停止充电
    await chargingPage.stopCharging()
    await page.locator('text=确认').click()
    await expect(page.locator('text=空闲')).toBeVisible()
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/integration/charging-flow.spec.ts
```

Expected: 1 test passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/integration/charging-flow.spec.ts
git commit -m "test(simulator): add charging flow integration test"
```

---

### Task 9: 场景执行集成测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/integration/scenario-execution.spec.ts`

- [ ] **Step 1: 创建场景执行测试**

```typescript
// apps/simulator-web/tests/e2e/integration/scenario-execution.spec.ts
import { test, expect } from '@playwright/test'
import { ScenarioPage } from '../fixtures/page-objects/ScenarioPage'
import { testData } from '../fixtures/test-data'

test.describe('场景执行', () => {
  test('创建并执行场景', async ({ page }) => {
    const scenarioPage = new ScenarioPage(page)
    
    // 1. 创建场景
    await scenarioPage.goto()
    await scenarioPage.createScenario(
      testData.scenario.name,
      testData.scenario.description
    )
    
    // 2. 配置场景步骤
    await page.locator('text=添加步骤').click()
    await page.locator('[name="action"]').selectOption('startCharging')
    await page.locator('[name="duration"]').fill('60')
    await page.locator('text=确定').click()
    
    // 3. 执行场景
    await scenarioPage.executeScenario(testData.scenario.name)
    await expect(page.locator('text=执行中')).toBeVisible()
    
    // 4. 等待执行完成
    await page.waitForSelector('text=已完成', { timeout: 120000 })
    
    // 5. 查看执行结果
    await expect(page.locator('.execution-log')).toBeVisible()
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/integration/scenario-execution.spec.ts
```

Expected: 1 test passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/integration/scenario-execution.spec.ts
git commit -m "test(simulator): add scenario execution integration test"
```

---

## 阶段四：性能测试

### Task 10: 页面加载性能测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/performance/load-time.spec.ts`

- [ ] **Step 1: 创建性能测试**

```typescript
// apps/simulator-web/tests/e2e/performance/load-time.spec.ts
import { test, expect } from '@playwright/test'
import { testData } from '../fixtures/test-data'
import { measureLoadTime, getMemoryUsage } from '../fixtures/helpers'

test.describe('性能测试', () => {
  test('Dashboard 首屏加载 < 3秒', async ({ page }) => {
    const loadTime = await measureLoadTime(page, '/dashboard')
    expect(loadTime).toBeLessThan(testData.thresholds.loadTime)
    console.log(`Dashboard 加载时间: ${loadTime}ms`)
  })

  test('图表渲染 < 2秒', async ({ page }) => {
    await page.goto('/dashboard')
    const start = Date.now()
    await page.waitForSelector('canvas')
    const renderTime = Date.now() - start
    expect(renderTime).toBeLessThan(testData.thresholds.chartRender)
  })

  test('API 响应 < 1秒', async ({ page }) => {
    const responsePromise = page.waitForResponse('**/api/simulator/stats')
    await page.goto('/dashboard')
    const response = await responsePromise
    expect(response.status()).toBe(200)
    const timing = response.timing()
    expect(timing.responseEnd - timing.requestStart).toBeLessThan(testData.thresholds.apiResponse)
  })

  test('内存使用 < 100MB', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(5000)
    const memory = await getMemoryUsage(page)
    expect(memory).toBeLessThan(testData.thresholds.memoryLimit)
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/performance/load-time.spec.ts
```

Expected: 4 tests passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/performance/load-time.spec.ts
git commit -m "test(simulator): add performance load time tests"
```

---

## 阶段五：可访问性测试

### Task 11: 可访问性测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/accessibility/a11y.spec.ts`

- [ ] **Step 1: 创建可访问性测试**

```typescript
// apps/simulator-web/tests/e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test'

test.describe('可访问性测试', () => {
  test('所有交互元素可键盘访问', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A', 'INPUT']).toContain(focused)
  })

  test('图片有 alt 属性', async ({ page }) => {
    await page.goto('/dashboard')
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })

  test('表单有 label 关联', async ({ page }) => {
    await page.goto('/device')
    await page.locator('text=添加设备').click()
    const inputs = await page.locator('input').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count()
        expect(label).toBeGreaterThan(0)
      }
    }
  })

  test('颜色对比度符合 WCAG AA', async ({ page }) => {
    await page.goto('/dashboard')
    const textColor = await page.evaluate(() => {
      const el = document.querySelector('.stat-value')
      return window.getComputedStyle(el!).color
    })
    const bgColor = await page.evaluate(() => {
      const el = document.querySelector('.stat-value')
      return window.getComputedStyle(el!).backgroundColor
    })
    expect(textColor).not.toBe(bgColor)
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/accessibility/a11y.spec.ts
```

Expected: 4 tests passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/accessibility/a11y.spec.ts
git commit -m "test(simulator): add accessibility tests"
```

---

## 阶段六：数据核对测试

### Task 12: 幽灵数据检测

**Files:**
- Create: `apps/simulator-web/tests/e2e/data-integrity/ghost-data.spec.ts`

- [ ] **Step 1: 创建幽灵数据检测测试**

```typescript
// apps/simulator-web/tests/e2e/data-integrity/ghost-data.spec.ts
import { test, expect } from '@playwright/test'
import { DashboardPage } from '../fixtures/page-objects/DashboardPage'
import { testData } from '../fixtures/test-data'

test.describe('幽灵数据检测', () => {
  test('仪表盘 KPI 数据无幽灵数据', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)
    const readings = []
    
    // 连续刷新 5 次
    for (let i = 0; i < testData.thresholds.ghostDataRefreshCount; i++) {
      await dashboardPage.goto()
      await dashboardPage.waitForLoad()
      readings.push(await dashboardPage.getKpiValues())
    }
    
    // 验证数据一致性
    for (let i = 1; i < readings.length; i++) {
      expect(readings[i].totalDevices).toBe(readings[0].totalDevices)
      expect(readings[i].onlineDevices).toBe(readings[0].onlineDevices)
    }
  })

  test('设备列表数据稳定', async ({ page }) => {
    const readings = []
    
    for (let i = 0; i < 3; i++) {
      await page.goto('/device')
      await page.waitForLoadState('networkidle')
      const count = await page.locator('.device-item').count()
      readings.push(count)
    }
    
    // 验证设备数量一致
    expect(readings.every(r => r === readings[0])).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/data-integrity/ghost-data.spec.ts
```

Expected: 2 tests passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/data-integrity/ghost-data.spec.ts
git commit -m "test(simulator): add ghost data detection tests"
```

---

### Task 13: API 数据一致性测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/data-integrity/api-consistency.spec.ts`

- [ ] **Step 1: 创建 API 一致性测试**

```typescript
// apps/simulator-web/tests/e2e/data-integrity/api-consistency.spec.ts
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
```

- [ ] **Step 2: 运行测试**

```bash
npx playwright test tests/e2e/data-integrity/api-consistency.spec.ts
```

Expected: 2 tests passed

- [ ] **Step 3: 提交**

```bash
git add apps/simulator-web/tests/e2e/data-integrity/api-consistency.spec.ts
git commit -m "test(simulator): add API consistency tests"
```

---

## 阶段七：截图对比测试

### Task 14: 截图对比测试

**Files:**
- Create: `apps/simulator-web/tests/e2e/screenshots/visual-regression.spec.ts`

- [ ] **Step 1: 创建截图对比测试**

```typescript
// apps/simulator-web/tests/e2e/screenshots/visual-regression.spec.ts
import { test, expect } from '@playwright/test'
import { testData } from '../fixtures/test-data'

test.describe('视觉回归测试', () => {
  test('Dashboard 完整截图', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await page.waitForTimeout(1000)
    
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      maxDiffPixels: testData.thresholds.screenshotDiff,
    })
  })

  test('深色主题一致性', async ({ page }) => {
    await page.goto('/dashboard')
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    expect(bgColor).toBe(testData.colors.background)
  })

  test('响应式布局截图 - 桌面端', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await expect(page).toHaveScreenshot('dashboard-desktop.png')
  })

  test('响应式布局截图 - 平板端', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await expect(page).toHaveScreenshot('dashboard-tablet.png')
  })

  test('响应式布局截图 - 移动端', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForSelector('.stat-card')
    await expect(page).toHaveScreenshot('dashboard-mobile.png')
  })
})
```

- [ ] **Step 2: 生成基线截图**

```bash
npx playwright test tests/e2e/screenshots/visual-regression.spec.ts --update-snapshots
```

- [ ] **Step 3: 运行截图对比**

```bash
npx playwright test tests/e2e/screenshots/visual-regression.spec.ts
```

Expected: 5 tests passed

- [ ] **Step 4: 提交**

```bash
git add apps/simulator-web/tests/e2e/screenshots/
git commit -m "test(simulator): add visual regression screenshot tests"
```

---

## 阶段八：测试报告与文档

### Task 15: 测试报告配置

**Files:**
- Create: `apps/simulator-web/tests/e2e/README.md`

- [ ] **Step 1: 创建测试文档**

```markdown
# 模拟器 Web E2E 测试

## 快速开始

```bash
# 安装依赖
npm install -D @playwright/test
npx playwright install chromium

# 运行所有测试
npm run test:e2e

# 运行特定测试
npm run test:smoke      # 冒烟测试
npm run test:integration # 集成测试
npm run test:performance # 性能测试
npm run test:a11y       # 可访问性测试
npm run test:screenshots # 截图对比
npm run test:data       # 数据核对

# 查看报告
npm run test:report
```

## 测试结构

```
tests/e2e/
├── fixtures/          # 测试数据和页面对象
├── smoke/             # 冒烟测试（14 项）
├── integration/       # 集成测试（3 个流程）
├── performance/       # 性能测试（4 项）
├── accessibility/     # 可访问性测试（4 项）
├── data-integrity/    # 数据核对（4 项）
└── screenshots/       # 截图对比（5 项）
```

## 测试矩阵

| 页面 | 冒烟 | 集成 | 性能 | 可访问性 | 截图 | 数据核对 |
|------|------|------|------|----------|------|----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Charging | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| Device | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| Scenario | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| Logs | ✅ | - | ✅ | ✅ | - | ✅ |

## 性能阈值

- 首屏加载：< 3 秒
- 图表渲染：< 2 秒
- API 响应：< 1 秒
- 内存使用：< 100MB

## 数据核对

- 连续刷新 5 次验证数据一致性
- API 返回值与 UI 显示值 100% 匹配
```

- [ ] **Step 2: 提交**

```bash
git add apps/simulator-web/tests/e2e/README.md
git commit -m "docs(simulator): add E2E testing documentation"
```

---

## 附录：测试覆盖总结

| 测试类型 | 测试项 | 执行时间 |
|----------|--------|----------|
| 冒烟测试 | 14 项 | < 30s |
| 集成测试 | 3 个流程 | < 2min |
| 性能测试 | 4 项 | < 1min |
| 可访问性测试 | 4 项 | < 30s |
| 数据核对 | 4 项 | < 1min |
| 截图对比 | 5 项 | < 1min |
| **总计** | **34 项** | **< 5min** |
