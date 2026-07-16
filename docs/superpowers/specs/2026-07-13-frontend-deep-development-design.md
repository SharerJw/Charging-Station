# EV充电平台 - 前端四端深度开发设计文档

**日期**: 2026-07-13
**策略**: 先框架后页面 — Phase 1 并行搭建统一基础层，Phase 2+ 逐端深度填充业务页面

---

## 1. 背景与目标

当前四端前端（admin-web、simulator-web、user-miniapp、ops-app）已完成项目脚手架和基础 Mock 数据层，但距离深度开发完成差距较大（约30%）。需要补齐：

- 全局 Layout 框架（多标签页、面包屑、导航）
- 统一 API 请求层 + Mock/真实 API 切换
- 状态管理规范层（useCrudStore 工厂）
- 路由 + RBAC 权限框架
- 所有业务页面的完整交互（列表、详情、弹窗、表单验证、按钮）

---

## 2. Phase 1：基础层设计

### 2.1 全局 Layout 框架

#### admin-web（后台管理系统）

```
┌─────────────────────────────────────────────────┐
│ Header (56px): 面包屑 | 全局搜索(Ctrl+K) | 通知 | 用户头像 │
├────────┬────────────────────────────────────────┤
│        │ TabBar: 首页 | 充电站管理 | 设备管理 | ...    │
│ 侧边栏  ├────────────────────────────────────────┤
│ 240px  │                                        │
│ 可折叠  │         内容区 (padding 24px)            │
│ 64px   │         路由出口 <router-view>           │
│        │                                        │
│ 菜单树  │                                        │
│ 带搜索  │                                        │
│ 最近访问 │                                        │
└────────┴────────────────────────────────────────┘
```

**核心组件**：
- `MainLayout.vue` — 主布局容器
- `Sidebar.vue` — 侧边栏菜单（支持折叠、搜索、最近访问）
- `Header.vue` — 顶部栏（面包屑、全局搜索、通知中心、用户下拉）
- `TabBar.vue` — 多标签页导航（右键菜单、固定标签、滚动）
- `Breadcrumb.vue` — 面包屑导航（从路由 meta 自动生成）
- `GlobalSearch.vue` — 全局命令面板（Ctrl+K，搜索站点/设备/用户/订单）

**菜单结构**（12个一级模块）：
1. 📊 工作台（Dashboard）
2. 🏢 站点管理（站点列表/详情）
3. 🔌 设备管理（设备台账/远程操控）
4. 📋 订单中心（充电订单/退款/异常）
5. 💰 财务管理（营收报表/分账）
6. 👥 用户管理（用户列表/会员）
7. 🎯 营销中心（优惠券/活动）
8. ⚡ 电价管理（电价策略/分时）
9. 🔔 告警中心（实时告警/规则）
10. 📦 运维管理（工单/巡检/备件）
11. 📈 数据分析（用户/站点/行为分析）
12. ⚙️ 系统管理（组织/角色/日志/配置）

#### simulator-web（产品模拟器）

暗黑主题（背景 #0B1120），左侧紧凑侧边栏（图标+文字），顶部显示 WebSocket 连接状态和版本号。

#### user-miniapp（用户端小程序）

标准 UniApp TabBar 4页：首页、找桩、订单、我的。自定义导航栏支持返回按钮和标题。

#### ops-app（运维App）

底部 TabBar 4页：工作台、告警、工单、我的。顶部状态栏显示在线设备数和待处理告警数。

---

### 2.2 API 请求层 + Mock 切换

**架构**：
```
src/api/
├── request.ts        # Axios 实例 + 拦截器封装
├── mock-switch.ts    # Mock/真实 API 切换逻辑
├── mock/
│   ├── station.ts    # 充电站 Mock 数据
│   ├── device.ts     # 设备 Mock 数据
│   ├── order.ts      # 订单 Mock 数据
│   └── ...
├── modules/
│   ├── station.ts    # 充电站真实 API
│   ├── device.ts     # 设备真实 API
│   ├── order.ts      # 订单真实 API
│   └── ...
└── composables/
    └── useRequest.ts # loading/error/data 状态封装
```

**request.ts 核心逻辑**：
- 请求拦截器：注入 Authorization Bearer Token、请求ID（幂等键）、租户ID
- 响应拦截器：统一错误处理（ElMessage）、401 跳登录、Token 过期自动刷新（并发请求队列）
- 超时：30s
- baseURL：从环境变量 VITE_API_BASE_URL 读取

**Mock 切换**：
```typescript
// .env.development
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:8080

// mock-switch.ts
const useMock = import.meta.env.VITE_USE_MOCK === 'true'
export const stationApi = useMock ? mockStationApi : realStationApi
```

**useRequest composable**：
```typescript
function useRequest<T>(apiFn: () => Promise<T>) {
  const data = ref<T>()
  const loading = ref(false)
  const error = ref<Error>()
  
  async function execute() {
    loading.value = true
    error.value = undefined
    try {
      data.value = await apiFn()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }
  
  return { data, loading, error, execute }
}
```

---

### 2.3 状态管理规范层（useCrudStore）

**工厂函数**：`createCrudStore(name, api, options)` 自动生成标准 CRUD Store。

**自动生成的状态**：
- `list: Ref<T[]>` — 列表数据
- `total: Ref<number>` — 总数
- `loading: Ref<boolean>` — 加载状态
- `query: Reactive` — 查询参数（含 page/size）
- `form: Reactive` — 表单数据
- `dialogVisible: Ref<boolean>` — 弹窗可见性
- `isEdit: Ref<boolean>` — 编辑模式
- `currentRow: Ref<T | null>` — 当前行

**自动生成的方法**：
- `fetchList()` — 获取列表
- `handleSearch()` — 搜索（重置页码）
- `handleReset()` — 重置查询
- `handlePageChange(page)` — 翻页
- `handleSizeChange(size)` — 每页条数
- `openCreateDialog()` — 打开新增弹窗
- `openEditDialog(row)` — 打开编辑弹窗
- `handleSubmit()` — 提交表单（新增/编辑）
- `handleDelete(id)` — 删除确认

**业务 Store 使用方式**：
```typescript
export const useStationStore = createCrudStore('station', stationApi, {
  defaultForm: { name: '', code: '', address: '', ... },
  searchFields: ['keyword', 'status'],
  beforeSubmit: (form) => { /* 验证逻辑 */ },
  afterSubmit: () => { /* 刷新列表 */ },
})
```

---

### 2.4 路由 + RBAC 权限框架

**路由守卫流程**：
```
router.beforeEach(to, from, next)
  ├── 1. 检查 to.meta.requiresAuth
  │     └── false → 直接放行（登录页等）
  ├── 2. 检查 Token
  │     └── 无 Token → 跳转 /login
  ├── 3. 检查用户信息是否已拉取
  │     └── 未拉取 → 调用 authApi.profile() 获取用户信息+角色+权限
  ├── 4. 检查路由权限
  │     └── to.meta.roles 不包含当前角色 → 跳转 403
  ├── 5. 设置面包屑路径
  └── 6. 添加标签页（TabBar）
```

**权限指令**：
```typescript
// v-permission="station:create"
app.directive('permission', {
  mounted(el, binding) {
    const userStore = useUserStore()
    if (!userStore.permissions.includes(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  }
})
```

**角色-菜单映射**：
| 角色 | 可见菜单 |
|------|---------|
| admin（超级管理员） | 全部 12 个模块 |
| operator（运营） | 工作台 + 站点 + 设备 + 订单 + 用户 + 营销 + 电价 |
| finance（财务） | 工作台 + 订单 + 财务 |
| ops（运维） | 工作台 + 设备 + 告警 + 运维 |

**数据权限范围**：
- `ALL` — 全部数据
- `ORG_AND_CHILDREN` — 本组织及下级
- `ORG_ONLY` — 仅本组织
- `SELF_ONLY` — 仅本人

---

## 3. Phase 2+：业务页面深度开发规划

### 3.1 admin-web（12个模块）

每个模块标准包含：
- 列表页（搜索栏 + 数据表格 + 分页 + 批量操作 + 导出）
- 详情弹窗/抽屉（Descriptions 展示）
- 新增/编辑弹窗（表单验证）
- 操作按钮（按权限显示/隐藏）

**模块清单**：
1. Dashboard — KPI 卡片 + 趋势图表 + 最近订单 + 告警
2. 站点管理 — CRUD + 状态切换 + 设备列表
3. 设备管理 — 列表 + 详情 + 远程重置/解锁 + 接口状态
4. 订单中心 — 列表 + 详情 + 退款 + 异常处理 + 导出
5. 财务管理 — 营收汇总 + 账单列表 + 趋势图表
6. 用户管理 — 列表 + 详情 + 启用/禁用 + 余额充值
7. 营销中心 — 优惠券 CRUD + 活动管理
8. 电价管理 — 电价策略配置 + 分时电价
9. 告警中心 — 实时告警列表 + 处理 + 规则配置
10. 运维管理 — 工单 CRUD + 巡检任务 + 备件
11. 数据分析 — 多维度图表（用户/站点/充电行为）
12. 系统管理 — 组织树 + 角色权限 + 操作日志 + 系统配置

### 3.2 simulator-web（5个模块）

1. 仪表盘 — 实时统计 + 功率曲线 + 设备状态卡片
2. 充电模拟 — 设备选择 + 参数配置 + SOC 环形图 + 实时指标
3. 设备管理 — 设备卡片 + 添加/删除/重置 + 状态监控
4. 场景编排 — 场景列表 + 执行/停止 + 步骤配置
5. OCPP 终端 — 实时消息流 + 级别筛选 + 动作筛选 + 导出

### 3.3 user-miniapp（完整充电链路）

1. 首页 — 快捷操作 + 附近充电站 + 账户余额
2. 找桩 — 搜索 + 地图 + 充电站列表 + 筛选 + 详情 + 导航
3. 充电 — 扫码启动 + 实时监控（SOC/功率/电量/费用）+ 停止充电
4. 订单 — 列表（筛选标签） + 详情 + 退款申请
5. 我的 — 用户信息 + 钱包 + 优惠券 + 车辆 + 设置

### 3.4 ops-app（6个模块）

1. 工作台 — 统计卡片 + 巡检进度 + 最近告警 + 快捷操作
2. 充电站 — 设备列表 + 状态监控 + 快速操作
3. 告警中心 — 级别筛选 + 处理/忽略 + 处理结果记录
4. 工单管理 — 状态筛选 + 接单/完成 + 优先级 + 处理结果
5. 巡检任务 — 进度条 + 开始/完成 + 巡检项检查
6. 个人中心 — 工作统计 + 巡检记录 + 设置

---

## 4. 技术约束

- TypeScript strict 模式，使用 `const` 对象替代 `enum`（兼容 TS 7.0 erasableSyntaxOnly）
- 所有金额使用 `number`（分）或 `string`（元，保留2位小数）
- 所有时间使用 ISO 8601 字符串
- 表单验证使用 Element Plus 内置 rules 或 UniApp 表单验证
- 大列表使用 el-table 虚拟滚动（>100 条）
- Mock 数据包含足够多样的场景（正常/异常/边界）
- 每个页面都有 loading 状态和空状态处理
- 错误统一通过 ElMessage / uni.showToast 展示
