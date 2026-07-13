# 前端四端递进开发追踪表

**模式**: 骨架 → 模块 → 功能 → 组件/类 → 方法/函数
**状态**: 🔴未开始 🟡进行中 🟢已完成

---

## Layer 1: 骨架（Skeleton）

| 端 | 骨架状态 | 文件数 | 行数 |
|---|---------|--------|------|
| admin-web | 🟢 已完成 | 64 | 6,641 |
| simulator-web | 🟢 已完成 | 29 | 3,174 |
| user-miniapp | 🟢 已完成 | 15 | 1,886 |
| ops-app | 🟢 已完成 | 15 | 1,950 |

骨架包含: Layout / 路由 / Store / API / 权限 / 设计令牌 / 全局组件

---

## Layer 2: 模块（Module）

### admin-web（12模块）
| # | 模块 | 状态 | 行数 |
|---|------|------|------|
| 1 | Dashboard | 🟢 已完成 | 229 |
| 2 | 站点管理 | 🟢 已完成 | 419 |
| 3 | 设备管理 | 🟢 已完成 | 214 |
| 4 | 订单中心 | 🟢 已完成 | 274 |
| 5 | 用户管理 | 🟢 已完成 | 134 |
| 6 | 告警中心 | 🟢 已完成 | 218 |
| 7 | 财务管理 | 🟢 已完成 | 145 |
| 8 | 营销中心 | 🟢 已完成 | 146 |
| 9 | 电价管理 | 🟢 已完成 | 162 |
| 10 | 运维管理 | 🟢 已完成 | 191 |
| 11 | 数据分析 | 🟢 已完成 | 148 |
| 12 | 系统管理 | 🟢 已完成 | 193 |

### simulator-web（5模块）
| # | 模块 | 状态 | 行数 |
|---|------|------|------|
| 1 | 仪表盘 | 🟢 已完成 | 372 |
| 2 | 充电模拟 | 🟢 已完成 | 373 |
| 3 | 设备管理 | 🟢 已完成 | 247 |
| 4 | 场景编排 | 🟢 已完成 | 158 |
| 5 | OCPP终端 | 🟢 已完成 | 319 |

### user-miniapp（5模块）
| # | 模块 | 状态 | 行数 |
|---|------|------|------|
| 1 | 首页 | 🟢 已完成 | 322 |
| 2 | 找桩 | 🟢 已完成 | 314 |
| 3 | 充电 | 🟢 已完成 | 265 |
| 4 | 订单 | 🟢 已完成 | 222 |
| 5 | 个人 | 🟢 已完成 | 251 |

### ops-app（6模块）
| # | 模块 | 状态 | 行数 |
|---|------|------|------|
| 1 | 工作台 | 🟢 已完成 | 275 |
| 2 | 充电站 | 🟢 已完成 | 115 |
| 3 | 告警 | 🟢 已完成 | 282 |
| 4 | 工单 | 🟢 已完成 | 335 |
| 5 | 巡检 | 🟢 已完成 | 312 |
| 6 | 个人 | 🟢 已完成 | 133 |

---

## Layer 3-5: 功能 → 组件 → 方法

### admin-web 递进组件清单（20个组件）

| 模块 | 组件 | 行数 | 功能 | 状态 |
|------|------|------|------|------|
| Dashboard | KpiCard.vue | 91 | KPI指标卡片(值/趋势/图标) | 🟢 |
| Dashboard | RevenueChart.vue | 66 | 营收趋势图(堆叠柱+折线) | 🟢 |
| Dashboard | StationRankChart.vue | 33 | 站点营收排行 | 🟢 |
| Dashboard | RecentOrdersTable.vue | 59 | 最近订单表 | 🟢 |
| Dashboard | TodoList.vue | 43 | 待办事项列表 | 🟢 |
| 站点管理 | FormDialog.vue | 181 | 新增/编辑弹窗(14字段验证) | 🟢 |
| 站点管理 | DetailDrawer.vue | 103 | 详情抽屉(4个Descriptions) | 🟢 |
| 站点管理 | StatusTag.vue | 24 | 状态标签 | 🟢 |
| 设备管理 | DetailDialog.vue | 84 | 详情弹窗(接口列表+远程操作) | 🟢 |
| 设备管理 | StatusTag.vue | 26 | 设备状态标签 | 🟢 |
| 设备管理 | ConnectorStatusTag.vue | 26 | 接口状态标签 | 🟢 |
| 订单中心 | DetailDrawer.vue | 136 | 详情抽屉(费用+时间线) | 🟢 |
| 订单中心 | StatusTag.vue | 32 | 订单状态标签 | 🟢 |
| 用户管理 | DetailDialog.vue | 52 | 详情弹窗 | 🟢 |
| 用户管理 | StatusTag.vue | 20 | 用户状态标签 | 🟢 |
| 告警中心 | LevelTag.vue | 24 | 告警级别标签(P0-P3) | 🟢 |
| 告警中心 | StatusTag.vue | 24 | 告警状态标签 | 🟢 |
| 运维管理 | StatusTag.vue | 24 | 工单状态标签 | 🟢 |
| 运维管理 | PriorityTag.vue | 23 | 优先级标签 | 🟢 |
| 系统管理 | LogTypeTag.vue | 25 | 日志类型标签 | 🟢 |

### simulator-web 递进组件清单（9个组件）

| 模块 | 组件 | 行数 | 功能 | 状态 |
|------|------|------|------|------|
| 仪表盘 | StatCard.vue | 33 | 统计卡片 | 🟢 |
| 仪表盘 | PowerChart.vue | 55 | 功率/电压/电流多线图 | 🟢 |
| 仪表盘 | StatusPieChart.vue | 33 | 设备状态饼图 | 🟢 |
| 仪表盘 | SocChart.vue | 38 | SOC/温度趋势图 | 🟢 |
| 仪表盘 | EventStream.vue | 48 | OCPP事件流 | 🟢 |
| 仪表盘 | DeviceCard.vue | 68 | 设备状态卡片 | 🟢 |
| 充电模拟 | SocRing.vue | 42 | SOC环形进度器 | 🟢 |
| 充电模拟 | MetricCard.vue | 30 | 充电指标卡片 | 🟢 |
| OCPP终端 | MessageLine.vue | 65 | OCPP消息行 | 🟢 |

### user-miniapp 递进组件清单（5个组件）

| 模块 | 组件 | 行数 | 功能 | 状态 |
|------|------|------|------|------|
| 全局 | Skeleton.vue | 28 | 骨架屏 | 🟢 |
| 全局 | EmptyState.vue | 22 | 空状态 | 🟢 |
| 首页 | QuickActions.vue | 26 | 快捷操作网格 | 🟢 |
| 找桩 | StationCard.vue | 44 | 充电站卡片 | 🟢 |
| 订单 | OrderCard.vue | 52 | 订单卡片 | 🟢 |

### ops-app 递进组件清单（4个组件）

| 模块 | 组件 | 行数 | 功能 | 状态 |
|------|------|------|------|------|
| 全局 | Skeleton.vue | 28 | 骨架屏 | 🟢 |
| 全局 | EmptyState.vue | 22 | 空状态 | 🟢 |
| 告警 | AlertCard.vue | 50 | 告警卡片 | 🟢 |
| 工单 | WorkorderCard.vue | 52 | 工单卡片 | 🟢 |

---

## 递进模式验证

每个模块按以下递进开发：
1. **功能列表** → 列表页 / 表单弹窗 / 详情弹窗 / 状态操作
2. **组件实现** → Template / Script / Style
3. **方法实现** → fetchList / handleSubmit / handleDelete / handleSearch

### 递进实例: admin-web / Dashboard / KPI卡片

| 层级 | 内容 | 文件 | 状态 |
|------|------|------|------|
| L1 骨架 | admin-web Layout + 路由 + Store + API | 多文件 | 🟢 |
| L2 模块 | Dashboard 模块 | views/dashboard/index.vue | 🟢 |
| L3 功能 | KPI卡片功能 | views/dashboard/components/KpiCard.vue | 🟢 |
| L4 组件 | KpiCard.vue (Props/Computed/Template/Style) | 92行 | 🟢 |
| L5 方法 | fetchStats (Store方法, 调用MockAPI, 更新响应式状态) | store/dashboard.ts:21-28 | 🟢 |

### 递进实例: admin-web / Dashboard / 营收趋势图

| 层级 | 内容 | 文件 | 状态 |
|------|------|------|------|
| L1 骨架 | admin-web Layout + 路由 + Store + API | 多文件 | 🟢 |
| L2 模块 | Dashboard 模块 | views/dashboard/index.vue | 🟢 |
| L3 功能 | 营收趋势图功能 | views/dashboard/components/RevenueChart.vue | 🟢 |
| L4 组件 | RevenueChart.vue (Props/Computed/Template) | 75行 | 🟢 |
| L5 方法 | chartOption computed (堆叠柱状+折线双Y轴) | RevenueChart.vue:30-55 | 🟢 |

验证命令:
```bash
# 验证骨架
find apps -name "*.vue" -o -name "*.ts" | grep -v node_modules | wc -l

# 验证模块完整性
for dir in alert analytics dashboard device finance login marketing ops order pricing station system user; do
  lines=$(find apps/admin-web/src/views/$dir -name "*.vue" -exec cat {} + | wc -l)
  echo "$dir: ${lines}行"
done

# 验证构建
cd apps/admin-web && pnpm build
cd apps/simulator-web && pnpm build
```
