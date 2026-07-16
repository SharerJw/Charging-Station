# 模拟器 Web P0 测试实施计划

> 设计文档：`docs/superpowers/specs/2026-07-16-simulator-p0-testing-design.md`
> 日期：2026-07-16

---

## 总览

分 4 个批次实施，每批次独立可验证。预计新增 ~99 用例。

| 批次 | 内容 | 新增用例 | 文件数 | 优先级 |
|------|------|---------|--------|--------|
| Batch 1 | API 层单元测试 | ~20 | 1 | 🔴 最高 |
| Batch 2 | 图表配置 + 充电逻辑 + SvgIcon 单元测试 | ~30 | 3 | 🔴 高 |
| Batch 3 | 冒烟测试完善（5 页面 + 导航） | ~16 | 6 | 🟡 中 |
| Batch 4 | 接口纵深测试（API 健壮性 + OCPP） | ~33 | 2 | 🟡 中 |

---

## Batch 1: API 层单元测试

### 文件：`src/api/index.test.ts`

### 前置依赖

无需额外依赖。使用 Vitest 内置的 `vi.mock()` mock axios。

### 实现模式

```typescript
// mock 策略：mock 整个 request 模块
vi.mock('./request', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}))
```

### 用例清单（20 个）

**deviceApi（9 个）：**

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | `list()` 正常返回 | 调用 `get('/simulator/devices')`，返回数据透传 |
| 2 | `list()` 空列表 | 返回 `[]` 不报错 |
| 3 | `list()` 网络错误 | 异常向上抛出 |
| 4 | `create()` 正常 | 调用 `post('/simulator/devices', data)` |
| 5 | `create()` 参数透传 | 验证 data 字段完整传递 |
| 6 | `update()` 正常 | URL 包含 id，data 透传 |
| 7 | `update()` 404 | 错误向上抛出 |
| 8 | `delete()` 正常 | URL 包含 id |
| 9 | `reset()` 正常 | URL 为 `/simulator/devices/${id}/reset` |

**chargingApi（7 个）：**

| # | 用例 | 验证点 |
|---|------|--------|
| 10 | `start()` 正常 | POST 到 `/simulator/charging/start` |
| 11 | `start()` 参数透传 | chargePointId/targetSoc/maxPower |
| 12 | `stop()` 正常 | POST 到 `/simulator/charging/${id}/stop` |
| 13 | `stop()` 不存在 ID | 错误抛出 |
| 14 | `status()` 正常 | GET 到 `/simulator/charging/${id}/status` |
| 15 | `status()` 不存在 | 错误抛出 |
| 16 | `status()` 连续查询 | 验证 URL 不变，可重复调用 |

**scenarioApi + systemApi（4 个）：**

| # | 用例 | 验证点 |
|---|------|--------|
| 17 | `scenarioApi.list()` | GET 到 `/simulator/scenarios` |
| 18 | `scenarioApi.execute()` | POST 到 `/simulator/scenarios/${id}/execute` |
| 19 | `systemApi.stats()` | GET 到 `/simulator/stats` |
| 20 | `systemApi.health()` | GET 到 `/simulator/health` |

### 验证命令

```bash
pnpm vitest run src/api/index.test.ts
```

---

## Batch 2: 图表配置 + 充电逻辑 + SvgIcon

### 2A: 图表配置测试

#### 文件：`src/views/dashboard/chart-config.test.ts`

#### 前置准备

需要从 `index.vue` 中提取图表配置计算函数为独立模块，以便隔离测试。

**重构步骤：**
1. 创建 `src/views/dashboard/useChartOptions.ts` — 提取 `realtimeChartOption`、`socChartOption`、`statusPieOption` 为独立 composable
2. `index.vue` 中 import 并使用 `useChartOptions()`
3. 测试文件直接测试 composable 函数

#### 用例清单（12 个）

**realtimeChartOption（5 个）：**

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 有数据时 series 数量 | `series.length === 3` |
| 2 | 有数据时 xAxis 匹配 | `xAxis.data.length === timeLabels.length` |
| 3 | 空数据不报错 | `series[0].data.length === 0` |
| 4 | yAxis 双轴配置 | `yAxis.length === 2`，左侧 kW/A 右侧 V |
| 5 | 颜色配置正确 | 蓝 `#3B82F6` / 黄 `#F59E0B` / 绿 `#10B981` |

**socChartOption（3 个）：**

| # | 用例 | 验证点 |
|---|------|--------|
| 6 | series 包含 SOC + 温度 | `series.length === 2` |
| 7 | yAxis 范围 0-100 | `yAxis.min === 0, max === 100` |
| 8 | SOC 面积渐变 | `series[0].areaStyle.color.type === 'linear'` |

**statusPieOption（4 个）：**

| # | 用例 | 验证点 |
|---|------|--------|
| 9 | 状态分组正确 | data 包含 online/charging/offline/fault |
| 10 | 值为 0 被过滤 | 非在线设备列表 → 对应状态不在 data 中 |
| 11 | 全 0 不报错 | 空设备列表 → data 为空数组 |
| 12 | 颜色映射正确 | online→绿, charging→黄, offline→红, fault→灰 |

### 2B: 充电逻辑测试

#### 文件：`src/views/charging/charging-logic.test.ts`

#### 前置准备

从 `index.vue` 中提取核心逻辑函数为独立模块：

**重构步骤：**
1. 创建 `src/views/charging/useChargingLogic.ts` — 提取 `updateFromDevice`、`startCharging`、`stopCharging`、`startPolling` 为独立 composable
2. `index.vue` 中 import 并使用
3. 测试文件直接测试 composable

#### 用例清单（10 个）

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | `updateFromDevice()` 正常 | chargingData 的 soc/power/voltage/current/temperature 更新 |
| 2 | `updateFromDevice()` 缺失字段 | 默认值为 0 |
| 3 | `startCharging()` 未选设备 | 显示 ElMessage.warning，isCharging 不变 |
| 4 | `startCharging()` 正常启动 | isCharging = true，调用 chargingApi.start |
| 5 | `startCharging()` 启动失败 | ElMessage.error 被调用，isCharging 不变 |
| 6 | `stopCharging()` 正常 | isCharging = false，设备 status 恢复 online |
| 7 | `stopCharging()` 清除定时器 | clearInterval 被调用 |
| 8 | 轮询每秒更新 | `vi.advanceTimersByTime(1000)` → deviceApi.list 被调用 |
| 9 | 设备切换更新数据源 | 切换 selectedDevice → 下次轮询使用新设备数据 |
| 10 | 组件卸载清除定时器 | `onUnmounted` → clearInterval |

### 2C: SvgIcon 测试

#### 文件：`src/components/SvgIcon.test.ts`

#### 用例清单（8 个）

| # | 用例 | 验证点 |
|---|------|--------|
| 1 | 渲染指定 name | `wrapper.find('path')` 存在 |
| 2 | size 设置宽高 | `svg.attributes('width') === '24'` |
| 3 | color 设置 fill | `path.attributes('fill') === '#FF0000'` |
| 4 | 默认 size=20 | 不传 size → width=20 |
| 5 | 未知 name 渲染默认 | 渲染问号图标的 path |
| 6 | 所有图标名称有 path | 遍历 25+ name 渲染不报错 |
| 7 | 无 color 用 currentColor | fill="currentColor" |
| 8 | CSS class | `.svg-icon` class 存在 |

### 验证命令

```bash
pnpm vitest run src/views/dashboard/chart-config.test.ts
pnpm vitest run src/views/charging/charging-logic.test.ts
pnpm vitest run src/components/SvgIcon.test.ts
```

---

## Batch 3: 冒烟测试完善

### 3A: 增强现有冒烟测试

#### `smoke/dashboard.spec.ts`（+3 用例）

| # | 用例 | 实现 |
|---|------|------|
| 1 | 统计卡片数值 > 0 | `getKpiValues()` → `totalDevices > 0` |
| 2 | 事件流区域可见 | `page.locator('.events-section').isVisible()` |
| 3 | 刷新间隔切换 | 点击 `1s` 按钮 → 验证按钮高亮状态 |

#### `smoke/charging.spec.ts`（+2 用例）

| # | 用例 | 实现 |
|---|------|------|
| 1 | 设备选择器可交互 | 点击选择器 → 下拉列表出现 |
| 2 | 开始按钮初始 disabled | `startButton.isDisabled()` → true |

#### `smoke/device.spec.ts`（+1 用例）

| # | 用例 | 实现 |
|---|------|------|
| 1 | 设备列表渲染 | `page.locator('table')` 或设备卡片数量 > 0 |

### 3B: 新增页面冒烟测试

#### `smoke/scenario.spec.ts`（3 用例）

使用新 PageObject `ScenarioPage`：

```typescript
// fixtures/page-objects/ScenarioPage.ts
export class ScenarioPage {
  readonly page: Page
  readonly heading: Locator
  readonly addButton: Locator
  // ...
}
```

| # | 用例 |
|---|------|
| 1 | 页面加载（标题含"场景编排"） |
| 2 | 场景列表/表格渲染 |
| 3 | 创建按钮可见 |

#### `smoke/logs.spec.ts`（2 用例）

使用新 PageObject `LogsPage`：

| # | 用例 |
|---|------|
| 1 | 页面加载（标题含"日志终端"） |
| 2 | 终端区域可见 |

#### `smoke/navigation.spec.ts`（5 用例）

| # | 用例 | 实现 |
|---|------|------|
| 1 | 5 个菜单项均可跳转 | 遍历点击 → 验证 URL 变化 |
| 2 | 跳转后标题正确 | 每次跳转后验证 `page.title()` |
| 3 | 当前菜单高亮 | 点击后验证 `el-menu-item.is-active` |
| 4 | 侧边栏折叠 | 点击折叠按钮 → 侧边栏宽度变窄 |
| 5 | 侧边栏展开 | 再次点击 → 宽度恢复 |

### 验证命令

```bash
pnpm test:smoke
```

---

## Batch 4: 接口纵深测试

### 4A: API 健壮性测试

#### 文件：`tests/e2e/api/robustness.spec.ts`

#### 前置准备

需要创建 `tests/e2e/api/` 目录。Playwright config 已配置 `baseURL: http://localhost:5177`，API 通过 Gateway 路由。

#### 实现模式

```typescript
import { test, expect } from '@playwright/test'

const API_BASE = '/api/simulator'

test.describe('设备接口健壮性', () => {
  let createdDeviceId: string

  test('GET /devices 正常返回', async ({ request }) => {
    const resp = await request.get(`${API_BASE}/devices`)
    expect(resp.ok()).toBeTruthy()
    const data = await resp.json()
    expect(Array.isArray(data.data || data)).toBeTruthy()
  })
  // ...
})
```

#### 用例清单（25 个）

**设备接口（7 个）：**

| # | 用例 | 方法 | 验证 |
|---|------|------|------|
| 1 | 列表正常返回 | GET | 200, 数据为数组 |
| 2 | 列表含必需字段 | GET | 每项有 id/ocppId/model/status |
| 3 | 创建正常 | POST | 200/201 |
| 4 | 创建空 body | POST | 400 |
| 5 | 创建重复 ocppId | POST | 409 或错误码 |
| 6 | 删除存在设备 | DELETE | 200 |
| 7 | 删除不存在设备 | DELETE | 404 |

**充电接口（9 个）：**

| # | 用例 | 方法 | 验证 |
|---|------|------|------|
| 8 | 正常启动 | POST /start | 200 + transaction |
| 9 | 空 chargePointId | POST /start | 400 |
| 10 | targetSoc=0 | POST /start | 400 或默认值 |
| 11 | targetSoc=101 | POST /start | 400 |
| 12 | maxPower=-1 | POST /start | 400 |
| 13 | 不存在的设备 | POST /start | 404 |
| 14 | 正常停止 | POST /stop | 200 |
| 15 | 不存在的交易 | POST /stop | 404 |
| 16 | 查询不存在交易 | GET /status | 404 或空 |

**场景接口（6 个）：**

| # | 用例 | 方法 | 验证 |
|---|------|------|------|
| 17 | 创建正常 | POST | 200/201 |
| 18 | 空名称 | POST | 400 |
| 19 | 超长名称 | POST | 400 |
| 20 | 执行正常 | POST /execute | 200 |
| 21 | 执行不存在 | POST /execute | 404 |
| 22 | 停止未运行 | POST /stop | 200（幂等） |

**系统接口（3 个）：**

| # | 用例 | 方法 | 验证 |
|---|------|------|------|
| 23 | stats 正常 | GET | 200 + totalDevices 字段 |
| 24 | health 正常 | GET | 200 |
| 25 | stats 字段完整 | GET | 含 onlineDevices/chargingDevices/totalEnergy |

### 4B: OCPP 协议测试

#### 文件：`tests/e2e/api/ocpp-protocol.spec.ts`

#### 用例清单（8 个）

| # | 用例 | 方法 | 验证 |
|---|------|------|------|
| 1 | 发送 Heartbeat | POST /ocpp/send | 200 |
| 2 | 发送 BootNotification | POST /ocpp/send | 200 |
| 3 | 无效 action | POST /ocpp/send | 400 |
| 4 | 空 payload | POST /ocpp/send | 合理处理 |
| 5 | 历史查询正常 | GET /ocpp/history | 200 + 数组 |
| 6 | 分页参数 | GET /ocpp/history?page=1&size=5 | 正确分页 |
| 7 | 设备过滤 | GET /ocpp/history?device=CP001 | 仅返回该设备 |
| 8 | 空结果 | GET /ocpp/history?device=NONEXIST | 200 + 空数组 |

### 验证命令

```bash
pnpm test:integration
```

---

## 新增 PageObject 文件

| 文件 | 用于 |
|------|------|
| `fixtures/page-objects/ScenarioPage.ts` | 场景编排页面 |
| `fixtures/page-objects/LogsPage.ts` | 日志终端页面 |
| `fixtures/page-objects/NavigationHelper.ts` | 侧边栏导航辅助 |

---

## 执行顺序

```
Batch 1 → pnpm vitest run src/api/index.test.ts
           ↓ 通过
Batch 2 → 重构提取 composable → pnpm vitest run
           ↓ 通过
Batch 3 → pnpm test:smoke
           ↓ 通过
Batch 4 → pnpm test:integration
           ↓ 通过
提交 → git commit + push
```

每批次完成后运行 `pnpm vitest run` 确认所有旧用例不被破坏。

---

## 风险与注意事项

1. **Batch 2 需要重构**：从 index.vue 提取 composable 是前提，需确保重构不改变运行时行为
2. **接口测试依赖后端运行**：`tests/e2e/api/` 需要 simulator-service (8085) + Gateway (8080) 在线
3. **Playwright config**：接口测试可能需要单独的 config（不需要浏览器），或使用 `request` fixture
4. **测试隔离**：充电接口测试需使用不同设备避免冲突，从设备列表动态获取可用设备
