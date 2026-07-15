# 模拟器 Web E2E 测试设计

**日期：** 2026-07-16
**状态：** 已批准
**方案：** 分层测试架构（方案 A）

---

## 1. 测试目标

从宏观到微观（骨架->模块->功能->组件->方法），覆盖模拟器 Web 所有功能，达到完整上线生产环境效果。

---

## 2. 测试架构

### 目录结构

```
apps/simulator-web/tests/e2e/
├── playwright.config.ts         # Playwright 配置
├── fixtures/
│   ├── test-data.ts             # 测试数据
│   ├── page-objects/            # 页面对象
│   │   ├── DashboardPage.ts
│   │   ├── ChargingPage.ts
│   │   ├── DevicePage.ts
│   │   ├── ScenarioPage.ts
│   │   └── LogsPage.ts
│   └── helpers.ts               # 工具函数
├── smoke/
│   ├── dashboard.spec.ts        # 仪表盘冒烟测试
│   ├── charging.spec.ts         # 充电模拟冒烟测试
│   ├── device.spec.ts           # 设备管理冒烟测试
│   ├── scenario.spec.ts         # 场景编排冒烟测试
│   └── logs.spec.ts             # 日志终端冒烟测试
├── integration/
│   ├── device-lifecycle.spec.ts # 设备生命周期流程
│   ├── charging-flow.spec.ts    # 完整充电流程
│   └── scenario-execution.spec.ts # 场景执行流程
├── performance/
│   └── load-time.spec.ts        # 页面加载性能
├── accessibility/
│   └── a11y.spec.ts             # 可访问性测试
├── data-integrity/
│   ├── ghost-data.spec.ts       # 幽灵数据检测
│   ├── api-consistency.spec.ts  # API 数据一致性
│   └── realtime-sync.spec.ts    # 实时数据同步验证
└── screenshots/
    ├── baseline/                # 基线截图
    └── actual/                  # 实际截图
```

### 测试分层策略

| 层级 | 目标 | 执行时间 | 覆盖率 |
|------|------|----------|--------|
| 冒烟测试 | 快速验证页面可用 | < 30s | 核心功能 |
| 集成测试 | 完整用户流程 | < 2min | 主要路径 |
| 性能测试 | 加载时间、响应速度 | < 1min | 关键指标 |
| 可访问性测试 | WCAG 合规性 | < 30s | 基本检查 |
| 数据核对 | 幽灵数据、API 一致性 | < 1min | 数据正确性 |
| 截图对比 | 视觉回归 | < 1min | UI 一致性 |

---

## 3. 冒烟测试设计

### Dashboard 仪表盘
- 页面加载成功
- 设备卡片显示
- 图表渲染完成
- 控制栏功能

### Charging 充电模拟
- 页面加载成功
- SOC 环形图显示
- 指标卡片显示

### Device 设备管理
- 页面加载成功
- 设备列表显示
- 添加设备按钮

### Scenario 场景编排
- 页面加载成功
- 场景列表显示

### Logs 日志终端
- 页面加载成功
- 终端组件加载

---

## 4. 集成测试设计

### 设备生命周期流程
1. 创建设备
2. 验证设备出现在列表
3. 修改设备状态
4. 重置设备
5. 删除设备

### 完整充电流程
1. 选择设备
2. 启动充电
3. 监控数据变化
4. 查看功率曲线
5. 停止充电

### 场景执行流程
1. 创建场景
2. 配置场景步骤
3. 执行场景
4. 等待执行完成
5. 查看执行结果

---

## 5. 性能测试设计

- Dashboard 首屏加载 < 3 秒
- 图表渲染 < 2 秒
- API 响应 < 1 秒
- 内存使用 < 100MB

---

## 6. 可访问性测试设计

- 所有交互元素可键盘访问
- 图片有 alt 属性
- 表单有 label 关联
- 颜色对比度符合 WCAG AA

---

## 7. 数据正确性核对设计

### 幽灵数据检测
- 连续刷新 5 次，对比数据一致性
- API 返回值与 UI 显示值核对
- 时间戳合理性检查
- 边界值检测（null、undefined、NaN、0）

### 检测指标

| 指标 | 说明 | 阈值 |
|------|------|------|
| 数据稳定性 | 连续刷新 N 次数据不变 | 100% 一致 |
| API 一致性 | API 返回值 = UI 显示值 | 100% 匹配 |
| 时序合理性 | 时间戳在合理范围内 | < 5 秒偏差 |
| 空值率 | null/undefined 占比 | < 5% |

---

## 8. 截图对比设计

- Dashboard 完整截图
- 设备卡片状态截图
- 深色主题一致性
- 响应式布局截图（桌面/平板/移动）

---

## 9. 测试矩阵

| 页面 | 冒烟 | 集成 | 性能 | 可访问性 | 截图 | 数据核对 |
|------|------|------|------|----------|------|----------|
| Dashboard | ✅ 4 项 | ✅ 设备生命周期 | ✅ 首屏 < 3s | ✅ 键盘/对比度 | ✅ 3 种尺寸 | ✅ 5 次刷新 |
| Charging | ✅ 3 项 | ✅ 充电流程 | ✅ 图表 < 2s | ✅ 表单标签 | ✅ SOC 环形图 | ✅ 实时数据 |
| Device | ✅ 3 项 | ✅ CRUD 流程 | ✅ 列表加载 | ✅ 表单标签 | ✅ 列表/详情 | ✅ 操作后刷新 |
| Scenario | ✅ 2 项 | ✅ 场景执行 | ✅ 列表加载 | ✅ 键盘导航 | ✅ 场景卡片 | ✅ 执行状态 |
| Logs | ✅ 2 项 | - | ✅ 终端加载 | ✅ 颜色对比 | ✅ 终端样式 | ✅ 消息流 |

---

## 10. 执行计划

```bash
# 完整测试套件
npx playwright test

# 仅冒烟测试
npx playwright test tests/e2e/smoke/

# 仅集成测试
npx playwright test tests/e2e/integration/

# 仅性能测试
npx playwright test tests/e2e/performance/

# 仅可访问性测试
npx playwright test tests/e2e/accessibility/

# 仅截图对比
npx playwright test tests/e2e/screenshots/

# 仅数据核对
npx playwright test tests/e2e/data-integrity/

# 生成 HTML 报告
npx playwright test --reporter=html
```
