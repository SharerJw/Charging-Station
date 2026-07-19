# ⚡ EV充电平台 (EV Charging Platform)

> 多租户电动汽车充电站运营管理 SaaS 平台 — 全栈四端 + 微服务后端

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-green.svg)](https://spring.io/projects/spring-boot)
[![Vue](https://img.shields.io/badge/Vue-3-brightgreen.svg)](https://vuejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 项目简介

面向电动汽车充电运营领域的多租户 SaaS 平台，覆盖**充电站管理、设备监控、订单结算、告警运维、用户充电全流程**。后端采用 Spring Cloud 微服务架构（5 个业务服务 + 1 个网关），前端四端并行开发，支撑 **200+ 充电站、1000+ 设备、10 万+ 订单**的运营规模。

### 四端应用预览

<table>
<tr>
<td align="center"><b>后台管理系统 Web</b></td>
<td align="center"><b>OCPP 充电模拟器</b></td>
</tr>
<tr>
<td><img src="后台管理Web.png" width="100%"></td>
<td><img src="模拟器Web.png" width="100%"></td>
</tr>
<tr>
<td align="center"><b>用户端小程序 / H5</b></td>
<td align="center"><b>运维 APP / H5</b></td>
</tr>
<tr>
<td><img src="用户小程序_H5_1.png" width="50%"> <img src="用户小程序_H5_2.png" width="50%"></td>
<td><img src="运维APP_H5.png" width="50%"></td>
</tr>
</table>

---

## 🏗 技术架构

### 后端技术栈

| 层级 | 技术选型 | 用途 |
|------|---------|------|
| **语言** | Java 21 (Virtual Threads) | 高并发轻量级线程 |
| **框架** | Spring Boot 3.3 + Spring Cloud Alibaba 2023 | 微服务基座 |
| **网关** | Spring Cloud Gateway | 统一入口、路由、限流、安全 |
| **注册中心** | Nacos 2.3 | 服务发现 + 配置中心 |
| **限流熔断** | Sentinel 1.8 | 流量控制、熔断降级 |
| **ORM** | MyBatis-Plus | CRUD 增强、多租户拦截器、自动填充 |
| **数据库** | PostgreSQL 16 (PostGIS) | 主数据存储、地理空间查询 |
| **缓存** | Caffeine (L1) + Redis Cluster (L2) | 两级缓存、分布式锁、会话管理 |
| **消息队列** | Kafka | 事件驱动、订单状态异步同步 |
| **实时通信** | WebSocket (STOMP) | 充电状态推送、大盘实时更新 |
| **数据库迁移** | Flyway | Schema 版本化管理 |
| **可观测性** | OpenTelemetry + Prometheus + Grafana | 链路追踪 + 指标监控 |

### 前端技术栈

| 层级 | 技术选型 | 用途 |
|------|---------|------|
| **框架** | Vue 3 + TypeScript + Composition API | 四端统一前端技术栈 |
| **UI 组件** | Element Plus | 管理后台 / 模拟器 |
| **跨端方案** | UniApp + Vue 3 | 用户小程序 + 运维 App（H5/小程序） |
| **状态管理** | Pinia | 全局状态管理 |
| **样式** | TailwindCSS | 原子化 CSS |
| **可视化** | ECharts 5 | 数据看板、趋势图、实时曲线 |
| **地图** | 腾讯地图 SDK | 充电站定位、地图选点 |
| **终端模拟** | xterm.js 风格 | OCPP 协议事件流 |
| **工程化** | pnpm workspace + Vite | Monorepo 统一构建 |

### 系统架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                        客户端层（四端）                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │
│  │ admin-web│  │  ops-app │  │user-mini │  │ simulator-web│     │
│  │ Vue3+EP  │  │ UniApp   │  │ UniApp   │  │ Vue3+EP      │     │
│  │ :5173    │  │ :5175    │  │ :5176    │  │ :5177        │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘     │
└───────┼──────────────┼─────────────┼───────────────┼─────────────┘
        │              │             │               │
┌───────┴──────────────┴─────────────┴───────────────┴─────────────┐
│                   Spring Cloud Gateway (:8080)                    │
│            JWT解析 / 路由转发 / 限流 / 安全头 / CORS               │
└───────┬──────────────┬─────────────┬───────────────┬─────────────┘
        │              │             │               │
┌───────┴───┐  ┌───────┴───┐  ┌─────┴─────┐  ┌─────┴─────┐  ┌─────┴─────┐
│ identity  │  │  station  │  │ charging  │  │   order   │  │ simulator │
│ 认证服务   │  │  站点服务  │  │  充电服务  │  │  订单服务  │  │  模拟服务  │
│  :8081    │  │  :8082    │  │  :8083    │  │  :8084    │  │  :8085    │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │              │              │
┌─────┴──────────────┴──────────────┴──────────────┴──────────────┴─────┐
│                           基础设施层                                    │
│    PostgreSQL │ Redis Cluster │ Kafka │ Nacos │ Sentinel │ MinIO     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
Charging-Station/
├── apps/                                  # 前端四端应用
│   ├── admin-web/                         # 后台管理系统 (Vue 3 + Element Plus, :5173)
│   │   └── src/
│   │       ├── api/                       #   API 请求封装
│   │       ├── components/                #   公共组件（EmptyState, Header, Sidebar, Skeleton 等）
│   │       ├── composables/               #   组合式函数（useDebounce 等）
│   │       ├── directives/                #   自定义指令（permission 权限指令）
│   │       ├── layouts/                   #   布局组件（MainLayout）
│   │       ├── router/                    #   路由配置
│   │       ├── store/                     #   Pinia 状态管理（15 个模块）
│   │       ├── types/                     #   TypeScript 类型定义
│   │       └── views/                     #   页面视图
│   │           ├── dashboard/             #     数据看板（KPI 卡片、营收趋势、站点排名）
│   │           ├── station/               #     充电站管理（CRUD、地图选点）
│   │           ├── device/                #     设备管理（状态监控、详情弹窗）
│   │           ├── order/                 #     订单管理（状态筛选、详情抽屉）
│   │           ├── alert/                 #     告警管理（P0~P3 分级）
│   │           ├── ops/                   #     工单管理
│   │           ├── finance/               #     财务结算
│   │           ├── pricing/               #     定价策略
│   │           ├── marketing/             #     营销活动
│   │           ├── analytics/             #     数据分析
│   │           ├── system/                #     系统管理
│   │           ├── user/                  #     用户管理
│   │           ├── login/                 #     登录页
│   │           └── error/                 #     错误页面（403/404）
│   │
│   ├── ops-app/                           # 运维 App (UniApp + Vue 3, :5175)
│   │   └── src/pages/
│   │       ├── index/                     #   工作台（待办、快捷操作、告警列表）
│   │       ├── station/                   #   站点巡检
│   │       ├── device/                    #   设备管理
│   │       ├── alert/                     #   告警处理
│   │       ├── alert-detail/              #   告警详情
│   │       ├── alert-stats/               #   告警统计
│   │       ├── workorder/                 #   工单管理
│   │       ├── workorder-detail/          #   工单详情
│   │       ├── workorder-process/         #   工单处理
│   │       ├── workorder-stats/           #   工单统计
│   │       ├── inspection/                #   巡检任务
│   │       ├── inspection-exec/           #   巡检执行
│   │       ├── inspection-report/         #   巡检报告
│   │       ├── dispatch/                  #   调度
│   │       ├── knowledge/                 #   知识库
│   │       ├── messages-ops/              #   消息
│   │       ├── remote-control/            #   远程控制
│   │       ├── shift-handover/            #   交接班
│   │       ├── spare-parts/               #   备件管理
│   │       ├── profile/                   #   个人中心
│   │       └── login/                     #   登录
│   │
│   ├── user-miniapp/                      # 用户小程序 (UniApp + Vue 3, :5176)
│   │   └── src/pages/
│   │       ├── index/                     #   首页（余额、充电状态、附近站点）
│   │       ├── map/                       #   找桩地图（60:40 地图/列表、无限滚动）
│   │       ├── charging/                  #   充电监控（SOC 进度、功率/电压/电流/温度）
│   │       ├── charging-settings/         #   充电设置
│   │       ├── station-detail/            #   站点详情
│   │       ├── orders/                    #   我的订单
│   │       ├── order-detail/              #   订单详情
│   │       ├── profile/                   #   个人中心（编辑资料、余额充值）
│   │       ├── login/                     #   登录（手机号+验证码）
│   │       ├── login-sms/                 #   短信登录
│   │       ├── wallet/                    #   钱包
│   │       ├── recharge/                  #   充值
│   │       ├── vehicles/                  #   我的车辆
│   │       ├── favorites/                 #   收藏站点
│   │       ├── search/                    #   搜索
│   │       ├── scan/                      #   扫码充电
│   │       ├── coupon/                    #   优惠券
│   │       ├── membership/                #   会员中心
│   │       ├── points/                    #   积分
│   │       ├── messages/                  #   消息中心
│   │       ├── invoice/                   #   发票
│   │       ├── refund/                    #   退款
│   │       ├── settlement/                #   结算
│   │       └── settings/                  #   设置
│   │
│   └── simulator-web/                     # OCPP 模拟器 (Vue 3 + Element Plus, :5177)
│       └── src/views/
│           ├── dashboard/                 #   仪表盘（实时指标、SOC/功率趋势、设备分布）
│           ├── charging/                  #   充电仿真（4 通道实时曲线、OCPP 消息）
│           ├── device/                    #   设备管理
│           ├── scenario/                  #   场景编排
│           └── logs/                      #   日志
│
├── backend/                               # 后端微服务 (Java 21 + Spring Boot 3.3)
│   ├── ev-common/                         # 公共模块
│   │   ├── ev-common-core/                #   核心：统一响应 R<T>、分页、异常体系、事件定义
│   │   ├── ev-common-mybatis/             #   数据库：BaseEntity、多租户拦截、自动填充
│   │   ├── ev-common-redis/               #   缓存：TwoLevelCache、IdempotentAspect、RedisLock
│   │   └── ev-common-security/            #   安全：JWT 工具、AuthInterceptor、审计日志 AOP
│   ├── ev-gateway/                        # API 网关 (:8080)
│   │   └── filter/
│   │       ├── AuthGlobalFilter           #   JWT 解析 + 用户上下文注入
│   │       ├── PathTraversalFilter        #   防路径穿越攻击
│   │       └── SecurityHeadersFilter      #   安全响应头注入
│   └── ev-service/                        # 业务服务
│       ├── ev-service-identity/           #   认证服务 (:8081) — 登录/RBAC/用户管理/短信验证
│       ├── ev-service-station/            #   站点服务 (:8082) — 充电站/设备/连接器/地理查询
│       ├── ev-service-charging/           #   充电服务 (:8083) — 会话管理/SOC 算法/WebSocket 推送
│       ├── ev-service-order/              #   订单服务 (:8084) — 订单/告警/工单/巡检/财务/看板
│       └── ev-service-simulator/          #   模拟服务 (:8085) — OCPP 协议/充电仿真/场景编排
│
├── docker/                                # Docker 基础设施
│   ├── docker-compose.yml                 #   PostgreSQL + Redis + Kafka + Nacos + MinIO
│   └── init/postgres/init.sql             #   数据库初始化脚本（3 个库：ev_identity, ev_station, ev_order）
│
├── docs/                                  # 项目文档
│   ├── README.md                          #   文档目录说明
│   └── seed-data-guide.md                 #   种子数据指南
│
├── 前端/                                  # AI 提示词规范（前端）
│   ├── 产品模拟器Web.md
│   ├── 四端页面.md
│   ├── 产品运维App.md
│   ├── 后台管理系统Web.md
│   └── 用户端小程序.md
│
├── 后端/                                  # AI 提示词规范（后端）
│   ├── 产品模拟器.md
│   ├── 产品运维.md
│   ├── 后台管理.md
│   ├── 后端服务.md
│   └── 用户端.md
│
├── .github/                               # GitHub 配置
│   ├── CODEOWNERS                         #   代码审查分配
│   ├── ISSUE_TEMPLATE/                    #   Issue 模板（Bug/功能/问题）
│   ├── pull_request_template.md           #   PR 模板
│   └── SETUP.md                           #   仓库配置指南
│
├── package.json                           # pnpm workspace 配置
├── pnpm-lock.yaml                         # 依赖锁文件
├── start.ps1                              # Windows 启动脚本
├── stop.ps1                               # Windows 停止脚本
├── reset.ps1                              # 数据库重置脚本
└── CLAUDE.md                              # Claude Code 配置
```

---

## 🚀 快速启动

### 前置要求

| 工具 | 版本 | 用途 |
|------|------|------|
| Docker Desktop | 最新版 | 基础设施容器 |
| JDK | 21+ | 后端编译运行 |
| Node.js | 18+ | 前端构建运行 |
| pnpm | 8+ | 前端包管理 |

### 一键启动（推荐）

```powershell
# 克隆仓库
git clone https://github.com/SharerJw/Charging-Station.git
cd Charging-Station

# Windows PowerShell
.\start.ps1

# 停止所有服务
.\stop.ps1

# 重置数据库（重新填充种子数据）
.\reset.ps1
```

脚本自动执行：启动 Docker 容器 → 构建后端 → 启动 6 个服务 → 安装前端依赖 → 启动 4 个前端 App

### 手动启动

<details>
<summary>点击展开详细步骤</summary>

#### 1. 启动基础设施
```bash
cd docker && docker compose up -d
```

#### 2. 构建并启动后端
```bash
cd backend
./gradlew build -x test

# 分别在 6 个终端启动
./gradlew :ev-gateway:bootRun
./gradlew :ev-service:ev-service-identity:bootRun
./gradlew :ev-service:ev-service-station:bootRun
./gradlew :ev-service:ev-service-order:bootRun
./gradlew :ev-service:ev-service-charging:bootRun
./gradlew :ev-service:ev-service-simulator:bootRun
```

#### 3. 启动前端
```bash
# 后台管理系统 (:5173)
cd apps/admin-web && pnpm install && pnpm dev

# 运维 App H5 (:5175)
cd apps/ops-app && pnpm install && pnpm dev:h5

# 用户小程序 H5 (:5176)
cd apps/user-miniapp && pnpm install && pnpm dev:h5

# OCPP 模拟器 (:5177)
cd apps/simulator-web && pnpm install && pnpm dev
```

</details>

---

## 🔑 演示账号

| 端 | 用户名 | 密码 | 说明 |
|----|--------|------|------|
| 后台管理 Web | `admin` | `admin123` | 管理员，全部权限 |
| 运维 App/H5 | `ops1` | `ops123` | 运维工程师 |
| 用户端小程序 | `13800000001` | `123456` | 普通用户（验证码自动填充） |

> 登录页已预填默认账号密码，直接点击登录即可体验。

---

## 🏛 核心业务模块

### 订单状态机

```
CREATED → CHARGING → STOPPING → STOPPED → SETTLING → SETTLED → PAYING → PAID
                                                     ↘ REFUNDING → REFUNDED
         → CANCELLED（未开始充电可取消）
         → ABNORMAL（充电异常中断）
```

### 充电实时会话管理

- **ConcurrentHashMap 会话池**：维护活跃充电会话，支持毫秒级读写
- **Redis 用户会话追踪**：`charging:current:{userId}` 跨页面状态查询
- **SOC 平滑递增算法**：<80% 阶段 +1~3%/s（快充），≥80% 阶段 +0~1%/s（涓流）
- **WebSocket 实时推送**：充电状态变更毫秒级通知前端

### 两级缓存架构

```
读路径: L1 (Caffeine, 纳秒级) → L2 (Redis, 毫秒级) → DB
写路径: 删除 L1 → 写 DB → 延迟 500ms 删除 L2 (延迟双删)
命中率: L1 90%+ | L2 99%+
```

### 安全体系（七层防护）

1. **JWT 认证**：Gateway 统一解析，X-Token 头注入下游
2. **RBAC 权限**：用户 → 角色 → 菜单三级模型
3. **数据权限**：四级作用域（全部/本机构及下级/仅本机构/仅本人）
4. **多租户隔离**：MyBatis 拦截器自动注入 tenant_id
5. **审计日志**：AOP 切面记录操作人、IP、URI、耗时
6. **接口幂等**：Redis SETNX + Idempotency-Key，防重复提交
7. **登录限流**：Redis 滑动窗口，防暴力破解

---

## 📡 API 端点

所有 API 通过 Gateway (`:8080`) 统一路由：

| 服务 | 路径前缀 | 说明 |
|------|---------|------|
| 认证服务 | `/api/auth/*`, `/api/v1/auth/*`, `/api/v1/ops/auth/*` | 登录、注册、验证码 |
| 站点服务 | `/api/stations/*`, `/api/v1/stations/*`, `/api/devices/*` | 充电站、设备、连接器 |
| 充电服务 | `/api/v1/charging/*` | 启动/停止/状态查询 |
| 订单服务 | `/api/v1/orders/*`, `/api/dashboard/*`, `/api/finance/*` | 订单、告警、工单、财务 |
| 模拟器 | `/api/simulator/*` | 设备仿真、场景编排、OCPP |

---

## 📊 数据规模

| 维度 | 数量 | 说明 |
|------|------|------|
| 充电站 | 200+ | 覆盖全国主要城市 |
| 充电设备 | 1,000+ | 直流快充 + 交流慢充 |
| 充电订单 | 100,000+ | 含各种状态（已支付、充电中、退款等） |
| 设备告警 | 1,000+ | P0~P3 四级告警 |
| 运维工单 | 500+ | 含巡检任务 |
| 支付记录 | 50,000+ | 微信/支付宝/余额 |

> 所有种子数据通过 Flyway 迁移脚本自动化初始化，支持一键重置。

---

## 📂 代码规模

| 类型 | 数量 | 说明 |
|------|------|------|
| Vue 组件 (.vue) | 128 | 四端前端页面和组件 |
| TypeScript (.ts) | 158 | 前端逻辑、状态管理、API |
| Java 源文件 (.java) | 148 | 后端微服务、过滤器、拦截器 |
| 配置文件 | 37 | package.json, build.gradle.kts, vite.config.ts 等 |
| SQL 种子脚本 | 6 | Flyway 数据库迁移 |
| Docker 配置 | 2 | docker-compose.yml, init.sql |

---

## 🔧 开发指南

### 切换 Mock / 真实数据

```bash
# .env.development 中设置
VITE_USE_MOCK=false   # 使用真实后端（默认）
VITE_USE_MOCK=true    # 使用 Mock 数据（无需后端）
```

### 数据库重置

```powershell
# 重置数据库并重新填充种子数据
.\reset.ps1
```

### Git 提交规则

本仓库仅提交**可构建的源代码和配置文件**，确保拉取后执行构建命令即可启动：

**✅ 应该提交：**
- 源代码（.vue, .ts, .java）
- 配置文件（package.json, build.gradle.kts, vite.config.ts, application.yml）
- 构建脚本（start.ps1, stop.ps1, reset.ps1）
- 文档（README.md, CLAUDE.md, CONTRIBUTING.md）
- Docker 配置（docker-compose.yml, init.sql）
- 路由/页面配置（pages.json）

**❌ 不应该提交：**
- 依赖目录（node_modules/）
- 构建产物（dist/, build/, .gradle/）
- 测试产物（test-screenshots/, coverage/）
- 任务报告（output/）
- AI 分析文档（docs/superpowers/, docs/test/）
- 调试脚本（debug-test.mts, visual-test.mts）
- IDE 配置（.idea/, .vscode/）
- 环境变量覆盖（.env.local）

### 核心设计规范

- 金额统一使用 `BigDecimal` 或 `Long`（分），禁止 `double`/`float`
- 时间统一使用 `java.time`，禁止 `Date`/`Calendar`
- 所有写接口必须幂等（Idempotency-Key + Redis SETNX）
- 敏感操作必须审计日志（@AuditLog 注解）
- 列表超 100 条启用虚拟滚动

---

## 📄 许可证

[MIT License](LICENSE)
