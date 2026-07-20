# 🤖 AI 工作指南

> 此文件指导 AI 工具如何理解和操作此项目

---

## 📋 项目概述

**项目名称：** EV 充电平台 (EV Charging Platform)

**项目类型：** 多租户 SaaS 充电站运营管理平台

**技术栈：**
- **前端**：Vue 3 + TypeScript + Element Plus + Pinia + TailwindCSS
- **后端**：Java 21 + Spring Boot 3.3 + Spring Cloud Alibaba 2023
- **数据库**：PostgreSQL + Redis + Kafka
- **容器化**：Docker Compose

---

## 🏗 项目结构

```
Charging-Station/
├── apps/                          # 前端四端应用
│   ├── admin-web/                 # 后台管理系统 Web (Vue 3 + Element Plus, :5173)
│   ├── ops-app/                   # 运维移动端 (UniApp + Vue 3, :5175)
│   ├── user-miniapp/              # 用户微信小程序 (UniApp + Vue 3, :5176)
│   └── simulator-web/             # 产品模拟器 Web (Vue 3 + Element Plus, :5177)
│
├── backend/                       # 后端微服务 (Java 21 + Spring Boot 3.3)
│   ├── ev-common/                 # 公共模块（核心、数据库、缓存、安全）
│   ├── ev-gateway/                # API 网关 (:8080)
│   └── ev-service/                # 业务服务
│       ├── ev-service-identity/   #   认证服务 (:8081)
│       ├── ev-service-station/    #   站点服务 (:8082)
│       ├── ev-service-charging/   #   充电服务 (:8084)
│       ├── ev-service-order/      #   订单服务 (:8083)
│       └── ev-service-simulator/  #   模拟服务 (:8085)
│
├── docker/                        # Docker 基础设施
│   ├── docker-compose.yml         # PostgreSQL + Redis + Kafka + Nacos + MinIO
│   └── init/postgres/init.sql     # 数据库初始化脚本
│
├── .github/                       # GitHub 配置
│   ├── CODEOWNERS                 # 代码审查分配
│   ├── ISSUE_TEMPLATE/            # Issue 模板
│   ├── pull_request_template.md   # PR 模板
│   └── SETUP.md                   # 仓库配置指南
│
├── package.json                   # pnpm workspace 配置
├── pnpm-lock.yaml                 # 依赖锁文件
├── start.ps1                      # Windows 启动脚本
├── stop.ps1                       # Windows 停止脚本
├── reset.ps1                      # 数据库重置脚本
├── README.md                      # 项目说明
├── CONTRIBUTING.md                # 贡献指南
├── SECURITY.md                    # 安全策略
└── LICENSE                        # MIT 许可证
```

---

## 🎯 AI 工作原则

### 1. 代码风格

**前端（Vue 3 + TypeScript）：**
- 使用 Composition API（setup 语法糖）
- 使用 TypeScript 严格类型
- 使用 Pinia 进行状态管理
- 使用 TailwindCSS 进行样式
- 组件命名使用 PascalCase
- 文件命名使用 kebab-case

**后端（Java 21 + Spring Boot）：**
- 使用 Java 21 特性（虚拟线程、Record、Pattern Matching）
- 使用 Spring Boot 3.3 特性
- 使用 MyBatis-Plus 进行 ORM
- 使用 Lombok 减少样板代码
- 类命名使用 PascalCase
- 方法命名使用 camelCase

### 2. 设计规范

**色系：**
- 管理后台/运维：品牌蓝 `#1677FF`，背景 `#F0F2F5`
- 用户小程序：充电绿 `#07C160`，背景 `#F6F7FB`
- 模拟器：深色科技风，背景 `#0B1120`，卡片 `#111827`，强调蓝 `#3B82F6`
- 状态色：成功 `#52C41A`，警告 `#FAAD14`，错误 `#FF4D4F`

**字体：** PingFang SC / Microsoft YaHei（Web）、系统默认（移动端）、DIN Alternate（数字）
**间距：** 8px 栅格（Web）、12px（App/小程序），最小触控区域 44×44pt

### 3. 开发规范

**通用规范：**
- 所有金额使用 `BigDecimal` 或 `Long`（以分为单位）——**严禁**使用 `double`/`float`
- 所有时间戳使用 `java.time` 包——**严禁**使用 `Date`/`Calendar`
- 所有写入 API 必须幂等（幂等键 + Redis SETNX）
- 所有敏感操作需记录审计日志（仅追加，不可修改）
- 表格/列表超过 100 条时必须使用虚拟滚动
- 限流策略：基于 Redis Lua 脚本的令牌桶算法
- 缓存策略：Cache-Aside + 延迟双删保证一致性

**前端规范：**
- 组件 props 必须定义类型
- 使用 `defineProps` 和 `defineEmits`
- 避免使用 `any` 类型
- 使用 `ref` 和 `reactive` 管理状态
- 使用 `computed` 和 `watch` 处理副作用

**后端规范：**
- 使用 `@RestController` 和 `@RequestMapping`
- 使用 `@Validated` 进行参数校验
- 使用 `@Transactional` 管理事务
- 使用 `@Cacheable` 和 `@CacheEvict` 管理缓存
- 使用 `@Async` 处理异步任务

---

## 🔧 常用操作

### 启动项目

```powershell
# 1. 启动基础设施
cd docker && docker compose up -d

# 2. 构建并启动后端
cd backend && ./gradlew build -x test
./gradlew :ev-gateway:bootRun
./gradlew :ev-service:ev-service-identity:bootRun
./gradlew :ev-service:ev-service-station:bootRun
./gradlew :ev-service:ev-service-charging:bootRun
./gradlew :ev-service:ev-service-order:bootRun
./gradlew :ev-service:ev-service-simulator:bootRun

# 3. 启动前端
cd apps/admin-web && pnpm install && pnpm dev
cd apps/ops-app && pnpm install && pnpm dev:h5
cd apps/user-miniapp && pnpm install && pnpm dev:h5
cd apps/simulator-web && pnpm install && pnpm dev

# 或使用一键启动脚本
.\start.ps1
```

### 数据库操作

```powershell
# 重置数据库
.\reset.ps1

# 手动连接数据库
psql -h localhost -U postgres -d ev_identity
psql -h localhost -U postgres -d ev_station
psql -h localhost -U postgres -d ev_order
```

### 测试

```powershell
# 前端单元测试
cd apps/admin-web && pnpm test

# 前端 E2E 测试
cd apps/admin-web && pnpm test:e2e

# 后端测试
cd backend && ./gradlew test
```

---

## 📡 API 端点

所有 API 通过 Gateway (`:8080`) 统一路由：

| 服务 | 路径前缀 | 说明 |
|------|---------|------|
| 认证服务 | `/api/auth/*`, `/api/v1/auth/*` | 登录、注册、验证码 |
| 站点服务 | `/api/stations/*`, `/api/v1/stations/*` | 充电站、设备、连接器 |
| 充电服务 | `/api/v1/charging/*` | 启动/停止/状态查询 |
| 订单服务 | `/api/v1/orders/*`, `/api/dashboard/*` | 订单、告警、工单、财务 |
| 模拟器 | `/api/simulator/*` | 设备仿真、场景编排、OCPP |

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

## 🔑 演示账号

| 端 | 用户名 | 密码 | 说明 |
|----|--------|------|------|
| 后台管理 Web | `admin` | `admin123` | 管理员，全部权限 |
| 运维 App/H5 | `ops1` | `ops123` | 运维工程师 |
| 用户端小程序 | `13800000001` | `123456` | 普通用户（验证码自动填充） |

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

---

## 🎯 AI 工作流程

### 1. 理解需求

- 阅读相关代码和文档
- 理解业务逻辑和技术实现
- 确认需求边界和约束条件

### 2. 设计方案

- 分析现有代码结构
- 设计符合项目规范的方案
- 考虑性能、安全、可维护性

### 3. 实现代码

- 遵循项目代码风格
- 使用项目已有的工具和库
- 编写清晰的注释和文档

### 4. 测试验证

- 运行单元测试
- 进行功能测试
- 验证性能和安全

### 5. 提交代码

- 使用清晰的提交信息
- 遵循 Git 提交规范
- 更新相关文档

---

## ⚠️ 注意事项

### 禁止操作

- ❌ 使用 `double`/`float` 处理金额
- ❌ 使用 `Date`/`Calendar` 处理时间
- ❌ 使用 `any` 类型
- ❌ 跳过参数校验
- ❌ 忽略事务管理
- ❌ 硬编码配置信息

### 必须操作

- ✅ 使用 `BigDecimal`/`Long` 处理金额
- ✅ 使用 `java.time` 处理时间
- ✅ 定义明确的 TypeScript 类型
- ✅ 使用 `@Validated` 进行参数校验
- ✅ 使用 `@Transactional` 管理事务
- ✅ 使用配置文件管理配置信息

---

## 📚 参考文档

- **README.md**：项目说明和快速启动
- **CONTRIBUTING.md**：贡献指南和代码规范
- **SECURITY.md**：安全策略和漏洞报告
- **.github/SETUP.md**：GitHub 仓库配置指南
