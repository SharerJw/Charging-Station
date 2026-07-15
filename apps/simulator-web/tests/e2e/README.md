# 模拟器 Web E2E 测试

## 快速开始

```bash
# 安装依赖
pnpm add -D @playwright/test
npx playwright install chromium

# 运行所有测试
pnpm test:e2e

# 运行特定测试
pnpm test:smoke      # 冒烟测试
pnpm test:integration # 集成测试
pnpm test:performance # 性能测试
pnpm test:a11y       # 可访问性测试
pnpm test:screenshots # 截图对比
pnpm test:data       # 数据核对

# 查看报告
pnpm test:report
```

## 测试结构

```
tests/e2e/
├── fixtures/          # 测试数据和页面对象
│   ├── test-data.ts
│   ├── helpers.ts
│   └── page-objects/
│       ├── DashboardPage.ts
│       ├── ChargingPage.ts
│       ├── DevicePage.ts
│       ├── ScenarioPage.ts
│       └── LogsPage.ts
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

## 截图对比

- 基线截图保存在 `screenshots/baseline/`
- 测试截图保存在 `screenshots/actual/`
- 差异阈值：1000 像素
