# 后台管理 KPI 数据与 UI/UX 优化设计

**日期：** 2026-07-15  
**状态：** 已批准  
**方案：** 渐进式优化（方案 A）

---

## 1. 背景与目标

### 1.1 当前问题

| 问题 | 状态 |
|------|------|
| KPI 趋势数据缺失 | trend 字段为空，无环比对比 |
| 站点营收排行硬编码 | 假数据，未连接真实 API |
| 待办事项数量硬编码 | 假数据，未从后端获取 |
| 电费/服务费比例硬编码 | 固定 70/30，未按实际计算 |
| KPI 卡片布局拥挤 | 6 列单行，小屏显示问题 |
| 无响应式布局 | 缺少媒体查询断点 |
| 无自动刷新 | 手动刷新，实时性差 |
| 无欢迎信息 | 缺少时间和问候语 |

### 1.2 优化目标

1. **数据真实性**：所有 KPI、趋势、排行、待办数据从真实 API 获取
2. **UI/UX 体验**：响应式布局、趋势显示、自动刷新、欢迎信息
3. **性能优化**：缓存策略、防抖节流、错误重试

---

## 2. 设计方案

### 2.1 整体布局

```
┌─────────────────────────────────────────────────────────┐
│  👋 下午好，管理员                    2026-07-15 14:30  │
├─────────────────────────────────────────────────────────┤
│  运营指标                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │今日充电量 │ │今日营收   │ │今日订单数 │                │
│  │ 1,234 kWh│ │ ¥5.6万   │ │   89 笔  │                │
│  │ ↑12.5%   │ │ ↑8.3%    │ │ ↓2.1%    │                │
│  │ 日环比   │ │ 日环比   │ │ 日环比   │                │
│  └──────────┘ └──────────┘ └──────────┘                │
├─────────────────────────────────────────────────────────┤
│  设备指标                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │站点总数   │ │设备在线率 │ │累计电量   │                │
│  │   12 个  │ │  85.3%   │ │ 45.6万kWh│                │
│  │ ↑0       │ │ ↑5.2%    │ │ ↑1234    │                │
│  │ 日环比   │ │ 日环比   │ │ 日环比   │                │
│  └──────────┘ └──────────┘ └──────────┘                │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐ ┌───────────────────────┐   │
│  │  营收趋势              │ │  站点营收排行 Top5     │   │
│  │  [7天] [30天]          │ │  1. 杭州西湖  ¥4.5万  │   │
│  │  📈 ECharts 图表       │ │  2. 深圳南山  ¥3.9万  │   │
│  │                       │ │  3. 上海浦东  ¥3.2万  │   │
│  └───────────────────────┘ └───────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐ ┌───────────────────────┐   │
│  │  最近订单              │ │  待办事项              │   │
│  │  订单号 | 用户 | 金额 │ │  🔴 待处理告警    5   │   │
│  │  ...                  │ │  🟡 待办工单      3   │   │
│  │  [查看全部]            │ │  🔵 待结算订单   12   │   │
│  └───────────────────────┘ └───────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 KPI 分组方案

**第一行：运营指标**
- 今日充电量 (kWh)
- 今日营收 (¥)
- 今日订单数 (笔)

**第二行：设备指标**
- 站点总数 (个)
- 设备在线率 (%)
- 累计电量 (kWh)

### 2.3 趋势显示

每个 KPI 卡片显示两个趋势指标：
- **日环比**：与昨日同期对比
- **周同比**：与上周同期对比

显示格式：`↑12.5% 日环比` 或 `↓2.1% 周同比`

颜色规则：
- 正数（上升）：绿色 `#52C41A`
- 负数（下降）：红色 `#FF4D4F`
- 零：灰色 `#999`

---

## 3. 组件设计

### 3.1 KpiCard 组件

**Props：**
```typescript
interface KpiCardProps {
  title: string           // 标题
  value: string           // 格式化值
  unit: string            // 单位
  icon: string            // 图标
  color: string           // 主题色
  dailyTrend: number      // 日环比百分比
  weeklyTrend: number     // 周同比百分比
  loading: boolean        // 加载状态
}
```

**模板结构：**
```vue
<template>
  <div class="kpi-card" :class="{ 'is-loading': loading }">
    <div class="kpi-icon" :style="{ background: color + '15', color }">
      {{ icon }}
    </div>
    <div class="kpi-body">
      <div class="kpi-value">
        {{ displayValue }}
        <span class="kpi-unit">{{ unit }}</span>
      </div>
      <div class="kpi-title">{{ title }}</div>
      <div class="kpi-trends">
        <span class="trend-item" :style="{ color: getTrendColor(dailyTrend) }">
          {{ getTrendIcon(dailyTrend) }} {{ formatTrend(dailyTrend) }}
          <span class="trend-label">日环比</span>
        </span>
        <span class="trend-item" :style="{ color: getTrendColor(weeklyTrend) }">
          {{ getTrendIcon(weeklyTrend) }} {{ formatTrend(weeklyTrend) }}
          <span class="trend-label">周同比</span>
        </span>
      </div>
    </div>
  </div>
</template>
```

### 3.2 欢迎栏组件

**功能：**
- 显示时间问候语（早上好/下午好/晚上好）
- 显示当前用户名
- 显示当前日期时间
- 显示刷新状态

**样式：**
- 渐变背景：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 白色文字
- 圆角 8px

---

## 4. 自动刷新机制

### 4.1 刷新策略

- **刷新间隔**：5 秒
- **页面可见性**：页面隐藏时暂停，显示时恢复
- **防抖优化**：避免快速切换导致多次请求

### 4.2 实现逻辑

```typescript
const REFRESH_INTERVAL = 5000

function startAutoRefresh() {
  stopAutoRefresh()
  refreshInterval.value = setInterval(async () => {
    isRefreshing.value = true
    try {
      await dashboardStore.fetchAll()
    } finally {
      isRefreshing.value = false
    }
  }, REFRESH_INTERVAL)
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopAutoRefresh()
  } else {
    startAutoRefresh()
  }
}
```

---

## 5. 后端 API 设计

### 5.1 GET /dashboard/overview（修改）

**响应结构：**
```json
{
  "code": 200,
  "data": {
    "stationCount": 12,
    "deviceCount": 45,
    "onlineDeviceCount": 38,
    "todayOrderCount": 89,
    "todayRevenue": 567800,
    "monthRevenue": 12345678,
    "totalEnergy": 456789000,
    "todayEnergy": 1234567,
    "trends": {
      "todayEnergy": { "daily": 12.5, "weekly": 8.3 },
      "todayRevenue": { "daily": 8.3, "weekly": 15.2 },
      "todayOrderCount": { "daily": -2.1, "weekly": 5.7 },
      "stationCount": { "daily": 0, "weekly": 0 },
      "onlineDeviceRate": { "daily": 5.2, "weekly": 3.1 },
      "totalEnergy": { "daily": 0.5, "weekly": 2.3 }
    }
  }
}
```

### 5.2 GET /dashboard/station-rank（新增）

**响应结构：**
```json
{
  "code": 200,
  "data": [
    {
      "stationId": "ST001",
      "stationName": "杭州西湖慢充站",
      "revenue": 4567800,
      "orderCount": 234,
      "energy": 12345678
    }
  ]
}
```

**查询参数：**
- `limit`：返回数量，默认 5
- `sortBy`：排序字段，可选 `revenue`/`orderCount`/`energy`，默认 `revenue`

### 5.3 GET /dashboard/todo-counts（新增）

**响应结构：**
```json
{
  "code": 200,
  "data": {
    "pendingAlerts": 5,
    "pendingWorkOrders": 3,
    "settledOrders": 12,
    "refundingOrders": 2
  }
}
```

---

## 6. 趋势计算逻辑

### 6.1 计算公式

```
趋势百分比 = (当前值 - 对比值) / 对比值 × 100
```

特殊情况：
- 对比值为 0 且当前值 > 0：返回 100%
- 对比值为 0 且当前值 = 0：返回 0%

### 6.2 后端实现

```java
private double calcPercent(long current, long previous) {
    if (previous == 0) return current > 0 ? 100.0 : 0.0;
    return Math.round((current - previous) * 1000.0 / previous) / 10.0;
}
```

---

## 7. 错误处理

### 7.1 前端错误处理

- 网络请求失败：最多重试 3 次，指数退避
- 数据为空：显示占位符（`--`）
- 加载中：显示骨架屏或 loading 状态

### 7.2 后端错误处理

- 数据库查询失败：返回默认值，记录日志
- 趋势计算异常：返回 0，不影响主数据

---

## 8. 性能优化

### 8.1 缓存策略

- 前端缓存：4 秒 TTL，避免重复请求
- 后端缓存：可选 Redis 缓存热点数据

### 8.2 防抖节流

- 图表数据更新：防抖 300ms
- 趋势切换：节流 500ms

---

## 9. 测试策略

### 9.1 单元测试

- KpiCard 组件：值格式化、趋势颜色、加载状态
- 欢迎栏组件：时间问候、用户名显示
- Store：缓存逻辑、错误处理

### 9.2 集成测试

- Dashboard 页面：数据加载、自动刷新、错误重试
- API 调用：参数传递、响应处理

---

## 10. 改动范围

| 组件 | 改动类型 | 说明 |
|------|----------|------|
| **Dashboard.vue** | 重构 | 添加欢迎栏、自动刷新、错误处理 |
| **KpiCard.vue** | 增强 | 添加日环比/周同比趋势显示 |
| **dashboard.ts (store)** | 增强 | 添加缓存、防抖、错误重试 |
| **dashboard.ts (api)** | 新增 | 添加 station-rank、todo-counts 接口 |
| **DashboardServiceImpl.java** | 重构 | 添加趋势计算、站点排行查询 |
| **DashboardController.java** | 增强 | 添加新接口端点 |

---

## 11. 预估工作量

| 阶段 | 预估时间 | 说明 |
|------|----------|------|
| 后端 API 开发 | 2-3 小时 | 趋势计算、排行查询、待办统计 |
| 前端组件开发 | 2-3 小时 | 欢迎栏、KpiCard 增强、自动刷新 |
| 集成测试 | 1 小时 | 数据流验证、错误处理测试 |
| UI 调试优化 | 1 小时 | 响应式布局、样式微调 |
| **总计** | **6-8 小时** | |

---

## 12. 关键技术点

1. **趋势计算**：后端聚合查询昨日/上周数据，计算百分比变化
2. **自动刷新**：前端 setInterval 5 秒轮询，页面隐藏时暂停
3. **缓存策略**：前端 4 秒 TTL 缓存，避免重复请求
4. **错误重试**：最多 3 次重试，指数退避
5. **响应式布局**：CSS Grid + 媒体查询，支持 2×3 分组

---

## 附录：相关文件

### 前端文件
- `apps/admin-web/src/views/dashboard/index.vue`
- `apps/admin-web/src/views/dashboard/components/KpiCard.vue`
- `apps/admin-web/src/store/dashboard.ts`
- `apps/admin-web/src/api/index.ts`

### 后端文件
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/controller/DashboardController.java`
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/impl/DashboardServiceImpl.java`
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/DashboardService.java`
