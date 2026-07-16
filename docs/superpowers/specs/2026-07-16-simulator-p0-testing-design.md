# 模拟器 Web P0 基础质量测试设计

> 范围：apps/simulator-web 前端 + ev-service-simulator 后端联调
> 日期：2026-07-16
> 状态：Draft

---

## 1. 目标

为模拟器 Web 补全 P0 级别的基础质量保障，覆盖三个子维度：

1. **单元测试补充** — 补齐高风险未覆盖模块（API 层、充电流程、图表配置）
2. **冒烟测试完善** — 所有 5 个页面 + 页面间导航 + API 数据加载验证
3. **接口层纵深测试** — simulator-service 全部 API 的健壮性、边界值、错误处理

### 成功标准

- 单元测试覆盖率：核心模块 ≥ 80%（api、charging view、dashboard charts）
- 冒烟测试：5 个页面全部有冒烟 spec，通过率 100%
- 接口纵深：全部 12 个 API 端点有边界值 + 错误处理测试

---

## 2. 单元测试补充

### 2.1 API 层测试（高优先级）

文件：`src/api/index.test.ts`

测试对象：`deviceApi`、`chargingApi`、`scenarioApi`、`ocppApi`、`systemApi`

用例设计：

```
deviceApi
├── list() 正常返回设备列表
├── list() 空列表返回 []
├── list() 网络错误抛出异常
├── create() 传入完整参数返回新设备
├── create() 缺少必填字段返回 400
├── update() 更新存在的设备
├── update() 更新不存在的设备返回 404
├── delete() 删除存在的设备
├── reset() 重置设备状态

chargingApi
├── start() 正常启动充电
├── start() 重复启动同一设备（幂等性）
├── start() 无效设备ID返回错误
├── start() 目标SOC边界值（10/100/0/-1）
├── stop() 正常停止充电
├── stop() 不存在的交易ID
├── stop() 已停止的交易（幂等性）
├── status() 查询进行中的交易
├── status() 查询不存在的交易

scenarioApi
├── list() 正常返回场景列表
├── create() 创建场景
├── execute() 执行场景
├── stop() 停止场景

systemApi
├── stats() 正常返回统计数据
├── health() 健康检查
```

实现方式：
- 使用 Vitest + vi.mock() mock axios/request 模块
- 验证请求参数、URL 拼接、响应数据映射
- 验证错误处理（网络超时、4xx/5xx 响应）

### 2.2 图表配置测试（高优先级）

文件：`src/views/dashboard/chart-config.test.ts`

测试对象：`realtimeChartOption`、`socChartOption`、`statusPieOption` 的 computed 输出

用例设计：

```
realtimeChartOption
├── 有数据时：series 数量 = 3（功率/电流/电压）
├── 有数据时：xAxis.data 长度与 timeLabels 一致
├── 空数据时：series 数据为空数组，不报错
├── yAxis 配置：左侧 kW/A，右侧 V
├── 颜色配置：功率蓝/电流黄/电压绿

socChartOption
├── 有数据时：series 包含 SOC 和温度
├── yAxis 范围：0-100%
├── SOC 面积渐变色配置正确

statusPieOption
├── 设备状态分组正确（online/charging/offline/fault）
├── 值为 0 的状态被 filter 排除
├── 空设备列表不报错
```

实现方式：
- 隔离测试 computed 属性：构造 simulatorStore.devices 数据 → 验证输出
- 不需要 mount 组件，直接调用函数

### 2.3 充电流程测试（高优先级）

文件：`src/views/charging/charging-logic.test.ts`

测试对象：充电页面的核心逻辑函数

用例设计：

```
updateFromDevice()
├── 正常设备数据更新 chargingData
├── 缺失字段使用默认值 0

startCharging()
├── 未选择设备时显示警告
├── 正常启动后 isCharging = true
├── 启动失败显示错误消息

stopCharging()
├── 停止后 isCharging = false
├── 停止后设备状态恢复为 online
├── 清除轮询定时器

轮询逻辑
├── startPolling 每秒更新数据
├── 设备切换时更新数据源
├── 组件卸载时清除定时器（无内存泄漏）
```

实现方式：
- Mock deviceApi/chargingApi
- 使用 vi.useFakeTimers() 控制定时器
- 验证状态变更和 API 调用时序

### 2.4 SvgIcon 组件测试（低优先级）

文件：`src/components/SvgIcon.test.ts`

用例设计：
```
├── 渲染指定 name 的 SVG path
├── size 属性设置 width/height
├── color 属性设置 fill
├── 未知 name 渲染默认问号图标
├── 所有 25+ 图标名称均有对应 path
```

---

## 3. 冒烟测试完善

### 3.1 现有冒烟测试加固

**Dashboard（4 用例 → 7 用例）：**
- 新增：统计卡片数值 > 0（验证后端数据加载成功）
- 新增：事件流区域可见
- 新增：刷新间隔切换功能

**Charging（3 用例 → 5 用例）：**
- 新增：设备选择器可交互
- 新增：开始充电按钮状态（disabled when no device selected）

**Device（3 用例 → 4 用例）：**
- 新增：设备列表/表格渲染

### 3.2 新增冒烟测试

**Scenario 页面（新文件 `smoke/scenario.spec.ts`）：**
```
├── 页面加载成功（标题含"场景编排"）
├── 场景列表/表格渲染
├── 创建场景按钮可见
```

**Logs/OCPP Terminal 页面（新文件 `smoke/logs.spec.ts`）：**
```
├── 页面加载成功（标题含"日志终端"）
├── 终端区域可见
```

### 3.3 页面间导航测试（新文件 `smoke/navigation.spec.ts`）：

```
├── 侧边栏 5 个菜单项均可点击跳转
├── 跳转后页面标题正确
├── 当前菜单高亮状态正确
├── 侧边栏折叠/展开功能
```

---

## 4. 接口层纵深测试

### 4.1 API 健壮性测试（新文件 `tests/e2e/api/robustness.spec.ts`）

使用 Playwright 的 `page.request` 直接调用后端 API，不经过 UI。

**设备接口：**
```
GET /api/simulator/devices
├── 正常返回 200 + 数组
├── 返回数据包含必需字段（id, name, ocppId, model, status）

POST /api/simulator/devices
├── 正常创建 → 200/201
├── 空 body → 400
├── 重复 ocppId → 409 或合理错误码

DELETE /api/simulator/devices/{id}
├── 删除存在设备 → 200
├── 删除不存在设备 → 404
├── 删除正在充电的设备 → 409 或合理错误码
```

**充电接口：**
```
POST /api/simulator/charging/start
├── 正常启动 → 200 + transaction 对象
├── chargePointId 为空 → 400
├── targetSoc = 0 → 400 或使用默认值
├── targetSoc = 101 → 400
├── maxPower = -1 → 400
├── 不存在的 chargePointId → 404

POST /api/simulator/charging/{id}/stop
├── 正常停止 → 200
├── 不存在的 id → 404
├── 已停止的交易 → 幂等返回 200

GET /api/simulator/charging/{id}/status
├── 正常查询 → 200 + 状态数据
├── 不存在的 id → 404 或空数据
```

**场景接口：**
```
POST /api/simulator/scenarios
├── 正常创建 → 200/201
├── 空名称 → 400
├── 超长名称（>200字符）→ 400

POST /api/simulator/scenarios/{id}/execute
├── 正常执行 → 200
├── 不存在的场景 → 404
├── 重复执行 → 幂等或 409

POST /api/simulator/scenarios/{id}/stop
├── 正常停止 → 200
├── 未运行的场景 → 幂等返回 200
```

**系统接口：**
```
GET /api/simulator/stats
├── 正常返回 → 200 + 统计数据结构
├── 返回字段：totalDevices, onlineDevices, chargingDevices, totalEnergy

GET /api/simulator/health
├── 正常返回 → 200
```

### 4.2 OCPP 协议测试（新文件 `tests/e2e/api/ocpp-protocol.spec.ts`）

```
POST /api/simulator/ocpp/send
├── 正常发送 Heartbeat → 200
├── 正常发送 BootNotification → 200
├── 无效 action → 400
├── 空 payload → 合理处理

GET /api/simulator/ocpp/history
├── 正常返回消息历史 → 200 + 数组
├── 带分页参数 → 正确分页
├── 带设备过滤 → 仅返回该设备消息
```

---

## 5. 测试基础设施

### 5.1 Mock 策略

**单元测试（Vitest）：**
- `vi.mock('@/api')` — mock 所有 API 调用
- `vi.useFakeTimers()` — 控制定时器（轮询逻辑）
- `vi.spyOn(ElMessage)` — 验证消息提示

**接口测试（Playwright）：**
- 直接调用后端 API（`page.request.get/post`）
- 不 mock，验证真实后端行为
- 使用 test fixture 准备测试数据

### 5.2 测试数据

- 后端种子数据已包含 200 站点、1000 设备
- 接口测试使用已知设备 ID（从 `/api/simulator/devices` 动态获取）
- 充电测试使用独立设备避免冲突

### 5.3 CI 集成

```bash
# 单元测试
pnpm vitest run

# 冒烟测试
pnpm test:smoke

# 接口纵深
pnpm test:integration
```

---

## 6. 文件清单

| 文件 | 类型 | 用例数（估） |
|------|------|-------------|
| `src/api/index.test.ts` | 单元测试（新增） | ~20 |
| `src/views/dashboard/chart-config.test.ts` | 单元测试（新增） | ~12 |
| `src/views/charging/charging-logic.test.ts` | 单元测试（新增） | ~10 |
| `src/components/SvgIcon.test.ts` | 单元测试（新增） | ~8 |
| `tests/e2e/smoke/scenario.spec.ts` | 冒烟测试（新增） | ~3 |
| `tests/e2e/smoke/logs.spec.ts` | 冒烟测试（新增） | ~2 |
| `tests/e2e/smoke/navigation.spec.ts` | 冒烟测试（新增） | ~5 |
| `tests/e2e/smoke/dashboard.spec.ts` | 冒烟测试（增强） | +3 |
| `tests/e2e/smoke/charging.spec.ts` | 冒烟测试（增强） | +2 |
| `tests/e2e/smoke/device.spec.ts` | 冒烟测试（增强） | +1 |
| `tests/e2e/api/robustness.spec.ts` | 接口测试（新增） | ~25 |
| `tests/e2e/api/ocpp-protocol.spec.ts` | 接口测试（新增） | ~8 |

**总计：约 99 个新增用例，现有 58 + 新增 99 = 157 用例**

---

## 7. 不在范围内

以下维度属于 P1-P3，本次不实现：

- P1: 完整 E2E 流程（启动充电→轮询→停止→验证订单）
- P1: 数据对账（前端显示 vs 后端数据精确匹配）
- P2: 性能压测、弱网模拟
- P2: 安全穿透测试（XSS/CSRF/注入）
- P3: 红蓝对抗、全量回归 CI、监控告警
