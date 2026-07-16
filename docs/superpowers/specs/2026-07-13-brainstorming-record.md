# 前端四端开发 - 头脑风暴记录

**日期**: 2026-07-13
**参与者**: 用户 + Claude Code
**状态**: 已完成

---

## 1. 初始需求分析

### 用户需求
"全量初始化前端" —— 初始化 EV 充电平台的四个前端应用。

### 技术栈决策
基于 CLAUDE.md 规格文档，确定四端技术栈：

| 端 | 框架 | UI库 | 状态管理 | 特殊需求 |
|---|------|------|---------|---------|
| admin-web | Vue 3 + TypeScript | Element Plus + TailwindCSS | Pinia | 多标签页、RBAC权限 |
| simulator-web | Vue 3 + TypeScript | Element Plus + TailwindCSS (暗黑) | Pinia | WebSocket、OCPP协议、xterm.js |
| user-miniapp | UniApp + Vue 3 | 原生组件 | Pinia | 微信小程序、地图SDK |
| ops-app | UniApp + Vue 3 | 原生组件 | Pinia | 告警推送、工单流转 |

### 关键决策
1. **Mock 优先**: 所有项目配置 Mock API，可脱离后端独立运行
2. **const 对象替代 enum**: 兼容 TypeScript 7.0 的 `erasableSyntaxOnly`
3. **useCrudStore 工厂模式**: 统一 CRUD Store 生成，减少重复代码
4. **RBAC 权限框架**: admin-web 完整实现角色-菜单-按钮权限

---

## 2. 开发策略决策

### 策略选择: "先框架后页面"

**Phase 1: 基础层并行搭建**（4端统一）
- Layout 框架（侧边栏/TabBar/面包屑/导航）
- API 请求层 + Mock 切换开关
- 状态管理规范层（useCrudStore）
- 路由 + 权限框架（RBAC）

**Phase 2: 业务页面深度开发**
- 逐模块开发列表页、表单弹窗、详情弹窗/抽屉
- 表单验证、状态操作确认、空状态处理

### 为什么不选其他方案
- ❌ "一端做完再复制" — 耗时长，其他端等待
- ❌ "聚焦核心链路" — 会导致非核心页面缺失
- ✅ "先框架后页面" — 结构统一，后期维护方便

---

## 3. 模块优先级决策

### admin-web 12模块开发顺序
1. Dashboard（KPI + 图表 + 待办）
2. 站点管理（完整 CRUD + 表单验证）
3. 设备管理（详情弹窗 + 远程操作）
4. 订单中心（详情抽屉 + 退款流程）
5. 用户管理（详情弹窗 + 启禁操作）
6. 告警中心（处理弹窗 + 规则配置）
7. 财务管理（汇总 + 图表 + 流水）
8. 营销中心（优惠券 CRUD + 活动管理）
9. 电价管理（策略配置 + 分时电价）
10. 运维管理（工单 + 巡检 + 备件）
11. 数据分析（多维度图表）
12. 系统管理（组织树 + 角色 + 日志 + 配置）

### 为什么这个顺序
- Dashboard 优先：全局概览，快速验证整体架构
- 站点/设备/订单：核心业务链路，优先深度开发
- 告警/运维：运维侧核心，紧跟其后
- 财务/营销/电价：运营支撑模块
- 系统/分析：管理类模块，最后开发

---

## 4. 技术问题解决记录

### TypeScript 7.0 兼容性
**问题**: `enum` 语法在 `erasableSyntaxOnly` 模式下报错
**解决**: 使用 `const` 对象 + 联合类型替代
```typescript
// 之前
export enum StationStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }

// 之后
export const StationStatus = { ACTIVE: 'ACTIVE', INACTIVE: 'INACTIVE' } as const
export type StationStatus = typeof StationStatus[keyof typeof StationStatus]
```

### Element Plus 类型兼容性
**问题**: el-table 的 `DefaultRow` 类型不兼容自定义类型
**解决**: 使用 `as any` 类型断言
```typescript
@click="stationStore.openEditDialog(row as any)"
```

### pnpm 忽略构建脚本
**问题**: `vue-demi` 的 postinstall 被 pnpm 忽略
**解决**: `pnpm approve-builds vue-demi`

### baseUrl 弃用警告
**问题**: TypeScript 7.0 弃用 `baseUrl` 选项
**解决**: 添加 `"ignoreDeprecations": "6.0"` 到 tsconfig
