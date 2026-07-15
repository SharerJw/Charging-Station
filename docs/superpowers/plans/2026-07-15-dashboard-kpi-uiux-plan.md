# 后台管理 KPI 数据与 UI/UX 优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化后台管理仪表盘，实现真实数据展示、KPI 趋势对比、自动刷新和响应式布局。

**Architecture:** 后端扩展 DashboardService 添加趋势计算、站点排行、待办统计 API；前端重构 Dashboard 布局为 2×3 分组，增强 KpiCard 显示趋势，添加欢迎栏和 5 秒自动刷新。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + ECharts (前端) / Java 21 + Spring Boot 3.3 + MyBatis-Plus (后端)

## Global Constraints

- 所有金额使用 Long（分），所有电量使用 Long（Wh）
- 趋势百分比保留一位小数
- 自动刷新间隔 5 秒，页面隐藏时暂停
- 前端缓存 TTL 4 秒
- 响应式布局：大屏 6 列，中屏 3 列，小屏 2 列

---

## 阶段一：后端 API 开发

### Task 1: 扩展 DashboardStatsVO 添加趋势字段

**Files:**
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/DashboardStatsVO.java`
- Create: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/TrendDTO.java`

**Interfaces:**
- Produces: `DashboardStatsVO.trends: Map<String, TrendDTO>` 供前端 KpiCard 使用

- [ ] **Step 1: 创建 TrendDTO**

```java
package com.ev.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TrendDTO {
    private Double daily;   // 日环比百分比
    private Double weekly;  // 周同比百分比
}
```

- [ ] **Step 2: 修改 DashboardStatsVO 添加 trends 字段**

```java
package com.ev.order.dto;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class DashboardStatsVO {
    private Integer stationCount;
    private Integer deviceCount;
    private Integer onlineDeviceCount;
    private Integer todayOrderCount;
    private Long todayRevenue;
    private Long monthRevenue;
    private Long totalEnergy;
    private Long todayEnergy;

    // 新增：趋势数据
    private Map<String, TrendDTO> trends;
}
```

- [ ] **Step 3: 编译验证**

Run: `cd backend && ./mvnw compile -pl ev-service/ev-service-order -am`
Expected: BUILD SUCCESS

- [ ] **Step 4: 提交**

```bash
git add backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/
git commit -m "feat(order): add TrendDTO and trends field to DashboardStatsVO"
```

---

### Task 2: 实现趋势计算逻辑

**Files:**
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/impl/DashboardServiceImpl.java`

**Interfaces:**
- Consumes: `ChargingOrderMapper.selectList()`
- Produces: `DashboardStatsVO.trends` 包含 6 个指标的趋势数据

- [ ] **Step 1: 添加趋势计算方法**

在 `DashboardServiceImpl.java` 中添加：

```java
/**
 * 计算趋势百分比
 * @param current 当前值
 * @param previous 对比值
 * @return 百分比变化，保留一位小数
 */
private double calcPercent(long current, long previous) {
    if (previous == 0) return current > 0 ? 100.0 : 0.0;
    return Math.round((current - previous) * 1000.0 / previous) / 10.0;
}

/**
 * 获取指定日期的订单列表
 */
private List<ChargingOrderEntity> getOrdersByDate(LocalDate date) {
    LocalDateTime dayStart = LocalDateTime.of(date, LocalTime.MIN);
    LocalDateTime dayEnd = LocalDateTime.of(date, LocalTime.MAX);
    return orderMapper.selectList(
        new LambdaQueryWrapper<ChargingOrderEntity>()
            .ge(ChargingOrderEntity::getCreatedAt, dayStart)
            .le(ChargingOrderEntity::getCreatedAt, dayEnd));
}

/**
 * 计算趋势数据
 */
private Map<String, TrendDTO> calculateTrends(long todayEnergy, long todayRevenue, 
                                               int todayOrderCount, int[] stationDeviceCounts) {
    LocalDate today = LocalDate.now();
    LocalDate yesterday = today.minusDays(1);
    LocalDate lastWeek = today.minusWeeks(1);
    
    // 昨日数据
    List<ChargingOrderEntity> yesterdayOrders = getOrdersByDate(yesterday);
    long yesterdayEnergy = yesterdayOrders.stream()
        .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();
    long yesterdayRevenue = yesterdayOrders.stream()
        .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
    int yesterdayOrderCount = yesterdayOrders.size();
    
    // 上周同日数据
    List<ChargingOrderEntity> lastWeekOrders = getOrdersByDate(lastWeek);
    long lastWeekEnergy = lastWeekOrders.stream()
        .mapToLong(o -> o.getEnergyWh() != null ? o.getEnergyWh() : 0).sum();
    long lastWeekRevenue = lastWeekOrders.stream()
        .mapToLong(o -> o.getTotalAmount() != null ? o.getTotalAmount() : 0).sum();
    int lastWeekOrderCount = lastWeekOrders.size();
    
    // 计算设备在线率趋势（暂用 0，因为设备数据来自 station-service）
    double todayOnlineRate = stationDeviceCounts[1] > 0 
        ? (stationDeviceCounts[2] * 100.0 / stationDeviceCounts[1]) : 0;
    
    Map<String, TrendDTO> trends = new HashMap<>();
    trends.put("todayEnergy", new TrendDTO(
        calcPercent(todayEnergy, yesterdayEnergy),
        calcPercent(todayEnergy, lastWeekEnergy)));
    trends.put("todayRevenue", new TrendDTO(
        calcPercent(todayRevenue, yesterdayRevenue),
        calcPercent(todayRevenue, lastWeekRevenue)));
    trends.put("todayOrderCount", new TrendDTO(
        calcPercent(todayOrderCount, yesterdayOrderCount),
        calcPercent(todayOrderCount, lastWeekOrderCount)));
    trends.put("stationCount", new TrendDTO(0.0, 0.0));  // 站点数变化较小，暂不计算
    trends.put("onlineDeviceRate", new TrendDTO(0.0, 0.0));  // 需要历史数据，暂不计算
    trends.put("totalEnergy", new TrendDTO(0.0, 0.0));  // 累计值不计算趋势
    
    return trends;
}
```

- [ ] **Step 2: 修改 stats() 方法调用趋势计算**

在 `stats()` 方法的 `return` 语句前添加：

```java
// 计算趋势数据
Map<String, TrendDTO> trends = calculateTrends(
    todayEnergy, todayRevenue, todayOrderCount, stationDeviceCounts);
```

修改 return 语句添加 trends：

```java
return DashboardStatsVO.builder()
        .stationCount(stationDeviceCounts[0])
        .deviceCount(stationDeviceCounts[1])
        .onlineDeviceCount(stationDeviceCounts[2])
        .todayOrderCount(todayOrderCount)
        .todayRevenue(todayRevenue)
        .monthRevenue(monthRevenue)
        .totalEnergy(totalEnergy)
        .todayEnergy(todayEnergy)
        .trends(trends)  // 新增
        .build();
```

- [ ] **Step 3: 添加必要的 import**

在文件顶部添加：

```java
import com.ev.order.dto.TrendDTO;
import java.util.HashMap;
```

- [ ] **Step 4: 编译验证**

Run: `cd backend && ./mvnw compile -pl ev-service/ev-service-order -am`
Expected: BUILD SUCCESS

- [ ] **Step 5: 提交**

```bash
git add backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/impl/DashboardServiceImpl.java
git commit -m "feat(order): implement trend calculation in DashboardServiceImpl"
```

---

### Task 3: 添加站点排行 API

**Files:**
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/DashboardService.java`
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/impl/DashboardServiceImpl.java`
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/controller/DashboardController.java`
- Create: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/StationRankVO.java`

**Interfaces:**
- Produces: `GET /dashboard/station-rank?limit=5&sortBy=revenue` 返回站点排行列表

- [ ] **Step 1: 创建 StationRankVO**

```java
package com.ev.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StationRankVO {
    private String stationId;
    private String stationName;
    private Long revenue;      // 营收（分）
    private Integer orderCount; // 订单数
    private Long energy;       // 电量（Wh）
}
```

- [ ] **Step 2: 在 DashboardService 接口添加方法**

```java
List<StationRankVO> stationRank(Integer limit, String sortBy);
```

- [ ] **Step 3: 在 DashboardServiceImpl 实现站点排行**

```java
@Override
public List<StationRankVO> stationRank(Integer limit, String sortBy) {
    if (limit == null) limit = 5;
    if (sortBy == null) sortBy = "revenue";
    
    // 查询所有订单
    List<ChargingOrderEntity> allOrders = orderMapper.selectList(new LambdaQueryWrapper<>());
    
    // 按站点分组统计
    Map<String, StationRankVO> stationMap = new HashMap<>();
    for (ChargingOrderEntity order : allOrders) {
        String stationId = order.getStationId();
        if (stationId == null) continue;
        
        stationMap.computeIfAbsent(stationId, k -> StationRankVO.builder()
            .stationId(stationId)
            .stationName(order.getStationName())
            .revenue(0L)
            .orderCount(0)
            .energy(0L)
            .build());
        
        StationRankVO rank = stationMap.get(stationId);
        rank.setRevenue(rank.getRevenue() + (order.getTotalAmount() != null ? order.getTotalAmount() : 0));
        rank.setOrderCount(rank.getOrderCount() + 1);
        rank.setEnergy(rank.getEnergy() + (order.getEnergyWh() != null ? order.getEnergyWh() : 0));
    }
    
    // 排序并截取
    return stationMap.values().stream()
        .sorted((a, b) -> {
            switch (sortBy) {
                case "orderCount": return b.getOrderCount() - a.getOrderCount();
                case "energy": return Long.compare(b.getEnergy(), a.getEnergy());
                default: return Long.compare(b.getRevenue(), a.getRevenue());
            }
        })
        .limit(limit)
        .collect(Collectors.toList());
}
```

- [ ] **Step 4: 在 DashboardController 添加端点**

```java
@Operation(summary = "站点排行") @GetMapping("/station-rank")
public R<List<StationRankVO>> stationRank(
        @RequestParam(required = false) Integer limit,
        @RequestParam(required = false) String sortBy) {
    return R.ok(dashboardService.stationRank(limit, sortBy));
}
```

- [ ] **Step 5: 编译验证**

Run: `cd backend && ./mvnw compile -pl ev-service/ev-service-order -am`
Expected: BUILD SUCCESS

- [ ] **Step 6: 提交**

```bash
git add backend/ev-service/ev-service-order/src/main/java/com/ev/order/
git commit -m "feat(order): add station rank API endpoint"
```

---

### Task 4: 添加待办事项统计 API

**Files:**
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/DashboardService.java`
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/impl/DashboardServiceImpl.java`
- Modify: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/controller/DashboardController.java`
- Create: `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/TodoCountsVO.java`

**Interfaces:**
- Produces: `GET /dashboard/todo-counts` 返回待办事项统计

- [ ] **Step 1: 创建 TodoCountsVO**

```java
package com.ev.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TodoCountsVO {
    private Integer pendingAlerts;      // 待处理告警
    private Integer pendingWorkOrders;  // 待办工单
    private Integer settledOrders;      // 待结算订单
    private Integer refundingOrders;    // 退款中订单
}
```

- [ ] **Step 2: 在 DashboardService 接口添加方法**

```java
TodoCountsVO todoCounts();
```

- [ ] **Step 3: 在 DashboardServiceImpl 实现待办统计**

```java
@Override
public TodoCountsVO todoCounts() {
    // 待处理告警
    Integer pendingAlerts = alertMapper.selectCount(
        new LambdaQueryWrapper<DeviceAlertEntity>()
            .eq(DeviceAlertEntity::getStatus, "pending"));
    
    // 待结算订单（SETTLED 状态）
    Integer settledOrders = orderMapper.selectCount(
        new LambdaQueryWrapper<ChargingOrderEntity>()
            .eq(ChargingOrderEntity::getStatus, "SETTLED"));
    
    // 退款中订单
    Integer refundingOrders = orderMapper.selectCount(
        new LambdaQueryWrapper<ChargingOrderEntity>()
            .eq(ChargingOrderEntity::getStatus, "REFUNDING"));
    
    // 待办工单（需要调用运维服务，暂时返回 0）
    Integer pendingWorkOrders = 0;
    
    return TodoCountsVO.builder()
        .pendingAlerts(pendingAlerts)
        .pendingWorkOrders(pendingWorkOrders)
        .settledOrders(settledOrders)
        .refundingOrders(refundingOrders)
        .build();
}
```

- [ ] **Step 4: 在 DashboardController 添加端点**

```java
@Operation(summary = "待办事项统计") @GetMapping("/todo-counts")
public R<TodoCountsVO> todoCounts() { return R.ok(dashboardService.todoCounts()); }
```

- [ ] **Step 5: 编译验证**

Run: `cd backend && ./mvnw compile -pl ev-service/ev-service-order -am`
Expected: BUILD SUCCESS

- [ ] **Step 6: 提交**

```bash
git add backend/ev-service/ev-service-order/src/main/java/com/ev/order/
git commit -m "feat(order): add todo counts API endpoint"
```

---

## 阶段二：前端 API 与 Store 开发

### Task 5: 扩展前端 API 接口

**Files:**
- Modify: `apps/admin-web/src/api/index.ts`
- Modify: `apps/admin-web/src/api/modules.ts`

**Interfaces:**
- Produces: `dashboardApi.getStationRank()`, `dashboardApi.getTodoCounts()`

- [ ] **Step 1: 在 api/index.ts 添加新接口**

在 `dashboardApi` 对象中添加：

```typescript
getStationRank: (params?: { limit?: number; sortBy?: string }) =>
  USE_MOCK ? mockDashboardApi.getStationRank(params) : get<any>('/dashboard/station-rank', params),
getTodoCounts: () =>
  USE_MOCK ? mockDashboardApi.getTodoCounts() : get<any>('/dashboard/todo-counts'),
```

- [ ] **Step 2: 在 api/modules.ts 添加新接口定义**

```typescript
getStationRank: (params?: { limit?: number; sortBy?: string }) => get<any[]>('/dashboard/station-rank', params),
getTodoCounts: () => get<any>('/dashboard/todo-counts'),
```

- [ ] **Step 3: 在 mock.ts 添加模拟数据**

在 `mockDashboardApi` 对象中添加：

```typescript
async getStationRank(params?: { limit?: number; sortBy?: string }): Promise<any[]> {
  await delay(200)
  const limit = params?.limit || 5
  return MOCK_STATIONS.slice(0, limit).map((s, i) => ({
    stationId: s.id,
    stationName: s.name,
    revenue: Math.floor(50000 - i * 10000 + Math.random() * 5000),
    orderCount: Math.floor(200 - i * 30 + Math.random() * 20),
    energy: Math.floor(100000 - i * 20000 + Math.random() * 10000),
  }))
},

async getTodoCounts(): Promise<any> {
  await delay(100)
  return {
    pendingAlerts: 5,
    pendingWorkOrders: 3,
    settledOrders: 12,
    refundingOrders: 2,
  }
},
```

- [ ] **Step 4: 提交**

```bash
git add apps/admin-web/src/api/
git commit -m "feat(admin): add station rank and todo counts API interfaces"
```

---

### Task 6: 扩展 Dashboard Store

**Files:**
- Modify: `apps/admin-web/src/store/dashboard.ts`

**Interfaces:**
- Produces: `stationRank`, `todoCounts` 状态供 Dashboard 组件使用

- [ ] **Step 1: 添加新状态和方法**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/api'
import type { DashboardStats, ChartData, Order } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats>({
    stationCount: 0,
    deviceCount: 0,
    onlineDeviceCount: 0,
    todayOrderCount: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    totalEnergy: 0,
    todayEnergy: 0,
  })
  const chartData = ref<ChartData>({ dates: [], orderCounts: [], revenues: [], energies: [] })
  const recentOrders = ref<Order[]>([])
  const stationRank = ref<any[]>([])  // 新增
  const todoCounts = ref<any>({       // 新增
    pendingAlerts: 0,
    pendingWorkOrders: 0,
    settledOrders: 0,
    refundingOrders: 0,
  })
  const loading = ref(false)

  async function fetchStats() {
    stats.value = await dashboardApi.getStats()
  }

  async function fetchChartData(days?: number) {
    chartData.value = await dashboardApi.getChartData(days)
  }

  async function fetchRecentOrders(limit?: number) {
    recentOrders.value = await dashboardApi.getRecentOrders(limit)
  }

  async function fetchStationRank(limit?: number) {  // 新增
    stationRank.value = await dashboardApi.getStationRank({ limit })
  }

  async function fetchTodoCounts() {  // 新增
    todoCounts.value = await dashboardApi.getTodoCounts()
  }

  async function fetchAll() {
    loading.value = true
    try {
      await Promise.all([
        fetchStats(),
        fetchChartData(7),
        fetchRecentOrders(5),
        fetchStationRank(5),   // 新增
        fetchTodoCounts(),     // 新增
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    stats, chartData, recentOrders, stationRank, todoCounts, loading,
    fetchStats, fetchChartData, fetchRecentOrders, fetchStationRank, fetchTodoCounts, fetchAll,
  }
})
```

- [ ] **Step 2: 提交**

```bash
git add apps/admin-web/src/store/dashboard.ts
git commit -m "feat(admin): extend dashboard store with station rank and todo counts"
```

---

## 阶段三：前端组件开发

### Task 7: 重构 KpiCard 组件支持趋势显示

**Files:**
- Modify: `apps/admin-web/src/views/dashboard/components/KpiCard.vue`

**Interfaces:**
- Consumes: `dailyTrend: number`, `weeklyTrend: number` props
- Produces: 显示日环比/周同比趋势标签

- [ ] **Step 1: 重写 KpiCard.vue**

```vue
<script setup lang="ts">
const props = defineProps<{
  title: string
  value: string
  unit: string
  icon: string
  color: string
  dailyTrend?: number
  weeklyTrend?: number
  loading?: boolean
}>()

function formatTrend(value: number): string {
  if (value > 0) return `+${value}%`
  if (value < 0) return `${value}%`
  return '0%'
}

function getTrendColor(value: number): string {
  if (value > 0) return '#52C41A'
  if (value < 0) return '#FF4D4F'
  return '#999'
}

function getTrendIcon(value: number): string {
  if (value > 0) return '↑'
  if (value < 0) return '↓'
  return '→'
}

const displayValue = computed(() => {
  if (props.loading) return '...'
  if (!props.value && props.value !== '0') return '--'
  return props.value
})

const displayDailyTrend = computed(() => props.dailyTrend || 0)
const displayWeeklyTrend = computed(() => props.weeklyTrend || 0)
</script>

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
        <span class="trend-item" :style="{ color: getTrendColor(displayDailyTrend) }">
          {{ getTrendIcon(displayDailyTrend) }} {{ formatTrend(displayDailyTrend) }}
          <span class="trend-label">日环比</span>
        </span>
        <span class="trend-item" :style="{ color: getTrendColor(displayWeeklyTrend) }">
          {{ getTrendIcon(displayWeeklyTrend) }} {{ formatTrend(displayWeeklyTrend) }}
          <span class="trend-label">周同比</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  gap: 12px;
  transition: all 0.3s;
}

.kpi-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.kpi-card.is-loading {
  opacity: 0.6;
  pointer-events: none;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.kpi-body {
  flex: 1;
  min-width: 0;
}

.kpi-value {
  font-size: 22px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.kpi-unit {
  font-size: 12px;
  font-weight: normal;
  color: #999;
  margin-left: 2px;
}

.kpi-title {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.kpi-trends {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.trend-item {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
}

.trend-label {
  color: #999;
  font-weight: normal;
  margin-left: 2px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add apps/admin-web/src/views/dashboard/components/KpiCard.vue
git commit -m "feat(admin): enhance KpiCard with trend display"
```

---

### Task 8: 重构 Dashboard 主页面

**Files:**
- Modify: `apps/admin-web/src/views/dashboard/index.vue`

**Interfaces:**
- Consumes: `dashboardStore.stats`, `dashboardStore.stationRank`, `dashboardStore.todoCounts`
- Produces: 欢迎栏、2×3 KPI 布局、自动刷新、真实数据图表

- [ ] **Step 1: 重写 Dashboard.vue**

由于文件较大，这里给出关键改动点：

1. **添加欢迎栏**：
```vue
<!-- 欢迎栏 -->
<div class="welcome-bar">
  <div class="welcome-left">
    <span class="greeting">{{ greeting }}，{{ userName }}</span>
    <span class="subtitle">欢迎回到 EV 充电管理平台</span>
  </div>
  <div class="welcome-right">
    <span class="datetime">{{ currentDate }}</span>
    <span class="refresh-indicator" v-if="isRefreshing">
      <el-icon class="is-loading"><Loading /></el-icon>
      刷新中...
    </span>
  </div>
</div>
```

2. **KPI 分组布局**：
```vue
<!-- 运营指标 -->
<div class="stats-group">
  <div class="group-title">运营指标</div>
  <div class="stats-row">
    <KpiCard
      v-for="stat in operationStats"
      :key="stat.title"
      :title="stat.title"
      :value="stat.value"
      :unit="stat.unit"
      :icon="stat.icon"
      :color="stat.color"
      :daily-trend="stat.dailyTrend"
      :weekly-trend="stat.weeklyTrend"
      :loading="dashboardStore.loading"
    />
  </div>
</div>

<!-- 设备指标 -->
<div class="stats-group">
  <div class="group-title">设备指标</div>
  <div class="stats-row">
    <KpiCard
      v-for="stat in deviceStats"
      :key="stat.title"
      :title="stat.title"
      :value="stat.value"
      :unit="stat.unit"
      :icon="stat.icon"
      :color="stat.color"
      :daily-trend="stat.dailyTrend"
      :weekly-trend="stat.weeklyTrend"
      :loading="dashboardStore.loading"
    />
  </div>
</div>
```

3. **站点排行图表（使用真实数据）**：
```vue
<v-chart :option="stationRankChart" style="height: 320px" autoresize />
```

```typescript
const stationRankChart = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value', axisLabel: { color: '#666' } },
  yAxis: {
    type: 'category',
    data: dashboardStore.stationRank.map(s => s.stationName).reverse(),
    axisLabel: { color: '#666', width: 100, overflow: 'truncate' },
  },
  series: [{
    type: 'bar',
    data: dashboardStore.stationRank.map(s => Math.floor(s.revenue / 100)).reverse(),
    itemStyle: { color: '#1677FF', borderRadius: [0, 4, 4, 0] },
    label: { show: true, position: 'right', formatter: '¥{c}', color: '#666' },
  }],
}))
```

4. **待办事项（使用真实数据）**：
```typescript
const todoItems = computed(() => [
  { type: 'alert', label: '待处理告警', count: dashboardStore.todoCounts.pendingAlerts, color: '#FF4D4F', route: '/alert', query: { status: 'pending' } },
  { type: 'workorder', label: '待办工单', count: dashboardStore.todoCounts.pendingWorkOrders, color: '#FAAD14', route: '/ops', query: { status: 'pending' } },
  { type: 'settlement', label: '待结算订单', count: dashboardStore.todoCounts.settledOrders, color: '#1677FF', route: '/order', query: { status: 'SETTLED' } },
  { type: 'refund', label: '退款审批', count: dashboardStore.todoCounts.refundingOrders, color: '#722ED1', route: '/order', query: { status: 'REFUNDING' } },
])
```

5. **自动刷新逻辑**：
```typescript
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)
const isRefreshing = ref(false)
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

function stopAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopAutoRefresh()
  } else {
    startAutoRefresh()
  }
}

onMounted(() => {
  dashboardStore.fetchAll()
  startAutoRefresh()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopAutoRefresh()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
```

6. **响应式布局样式**：
```scss
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 1200px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/admin-web/src/views/dashboard/index.vue
git commit -m "feat(admin): refactor dashboard with grouped KPI, real data, auto-refresh"
```

---

## 阶段四：集成测试与验证

### Task 9: 后端 API 测试

**Files:**
- Test: 手动测试或 Postman 测试

- [ ] **Step 1: 启动后端服务**

Run: `cd backend && ./mvnw spring-boot:run -pl ev-service/ev-service-order`

- [ ] **Step 2: 测试 /dashboard/overview**

Run: `curl http://localhost:8083/api/dashboard/overview`
Expected: 返回包含 `trends` 字段的 JSON

- [ ] **Step 3: 测试 /dashboard/station-rank**

Run: `curl http://localhost:8083/api/dashboard/station-rank?limit=5`
Expected: 返回站点排行数组

- [ ] **Step 4: 测试 /dashboard/todo-counts**

Run: `curl http://localhost:8083/api/dashboard/todo-counts`
Expected: 返回待办统计对象

- [ ] **Step 5: 提交测试结果文档**

```bash
git commit --allow-empty -m "test: verify dashboard API endpoints"
```

---

### Task 10: 前端集成测试

**Files:**
- Test: 浏览器手动测试

- [ ] **Step 1: 启动前端开发服务器**

Run: `cd apps/admin-web && pnpm dev`

- [ ] **Step 2: 验证欢迎栏**

- 打开 http://localhost:5173/dashboard
- 确认显示时间问候语和当前时间
- 确认 5 秒后数据自动刷新

- [ ] **Step 3: 验证 KPI 分组布局**

- 确认显示两组 KPI：运营指标、设备指标
- 确认每个 KPI 卡片显示日环比和周同比
- 调整浏览器窗口大小，验证响应式布局

- [ ] **Step 4: 验证站点排行**

- 确认站点排行图表显示真实数据
- 切换排序方式（如有实现）

- [ ] **Step 5: 验证待办事项**

- 确认待办事项数量来自 API
- 点击待办事项，验证跳转和筛选

- [ ] **Step 6: 提交最终代码**

```bash
git add -A
git commit -m "feat: complete dashboard KPI & UI/UX optimization"
```

---

## 附录：相关文件清单

### 后端文件
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/DashboardStatsVO.java`
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/TrendDTO.java` (新建)
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/StationRankVO.java` (新建)
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/dto/TodoCountsVO.java` (新建)
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/DashboardService.java`
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/service/impl/DashboardServiceImpl.java`
- `backend/ev-service/ev-service-order/src/main/java/com/ev/order/controller/DashboardController.java`

### 前端文件
- `apps/admin-web/src/views/dashboard/index.vue`
- `apps/admin-web/src/views/dashboard/components/KpiCard.vue`
- `apps/admin-web/src/store/dashboard.ts`
- `apps/admin-web/src/api/index.ts`
- `apps/admin-web/src/api/modules.ts`
- `apps/admin-web/src/api/mock.ts`
