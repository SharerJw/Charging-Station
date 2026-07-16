# EV充电平台后端实施计划

> 对应设计文档：`docs/superpowers/specs/2026-07-13-backend-microservices-design.md`
> 日期：2026-07-13

---

## 阶段一：L1 基础设施与框架搭建

### Plan §1 — 项目结构与 Gradle 多模块脚手架

**对应设计**：第一节（项目结构）+ 第三节（Gradle构建）+ 第十八节（构建脚本）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 1.1 | 创建 `backend/` 根目录 | 目录 | 存在 |
| 1.2 | 编写 `gradle/libs.versions.toml` (Version Catalog) | libs.versions.toml | 语法正确 |
| 1.3 | 编写根 `settings.gradle.kts` (10个子模块注册) | settings.gradle.kts | 10个 include |
| 1.4 | 编写根 `build.gradle.kts` (Java 21 + Lombok 全局) | build.gradle.kts | - |
| 1.5 | 创建 `gradle.properties` (org.gradle.jvmargs 等) | gradle.properties | - |
| 1.6 | 创建 Gradle Wrapper (gradle 9.6.1) | gradlew / gradlew.bat | `./gradlew --version` = 9.6.1 |
| 1.7 | 创建所有子模块空目录 + build.gradle.kts | 10个模块目录 | `./gradlew build` 编译通过(空模块) |
| 1.8 | 创建各服务 bootstrap.yml (Nacos 连接配置) | 5个 bootstrap.yml | - |

**关键文件清单**：
```
backend/
├── gradle/libs.versions.toml
├── gradle.properties
├── settings.gradle.kts
├── build.gradle.kts
├── gradlew / gradlew.bat
├── ev-common/ev-common-core/build.gradle.kts
├── ev-common/ev-common-mybatis/build.gradle.kts
├── ev-common/ev-common-redis/build.gradle.kts
├── ev-common/ev-common-security/build.gradle.kts
├── ev-gateway/build.gradle.kts
├── ev-service/ev-service-identity/build.gradle.kts
├── ev-service/ev-service-station/build.gradle.kts
├── ev-service/ev-service-order/build.gradle.kts
├── ev-service/ev-service-charging/build.gradle.kts
├── ev-service/ev-service-simulator/build.gradle.kts
```

---

### Plan §2 — Docker Compose 基础设施

**对应设计**：第二节（Docker Compose）+ 第十五节（MinIO）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 2.1 | 创建 `docker/docker-compose.yml` (PG + Redis + Nacos + MinIO) | docker-compose.yml | `docker compose config` 无报错 |
| 2.2 | 创建 `docker/init/postgres/init.sql` (创建 ev_station / ev_order 库) | init.sql | - |
| 2.3 | `docker compose up -d` 启动所有容器 | 4个容器 | `docker compose ps` → 全部 healthy |
| 2.4 | 验证 PostgreSQL 连接 (psql 连3个库) | - | 连接成功 |
| 2.5 | 验证 Redis (redis-cli ping) | - | PONG |
| 2.6 | 验证 Nacos 控制台 (http://localhost:8848/nacos) | - | 页面可访问 |
| 2.7 | 验证 MinIO 控制台 (http://localhost:9001) | - | 登录成功 |
| 2.8 | 创建 MinIO 6个 Bucket (ev-station/device/inspection/firmware/export/avatar) | 6个 bucket | 列表可见 |

---

### Plan §3 — ev-common-core 公共基础模块

**对应设计**：第三节（公共模块）+ 第十一节（异常处理）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 3.1 | 编写 `R<T>` 统一响应类 | R.java | code/message/data/traceId 字段 |
| 3.2 | 编写 `PageQuery` 分页查询基类 | PageQuery.java | page/size/sortBy/sortOrder |
| 3.3 | 编写 `PageResult<T>` 分页结果 | PageResult.java | list/total/page/size |
| 3.4 | 编写 `BizException` 业务异常 | BizException.java | code + message |
| 3.5 | 编写 `ErrorCode` 错误码枚举 | ErrorCode.java | 1001-9999 全部错误码 |
| 3.6 | 编写 `GlobalExceptionHandler` 全局异常处理 | GlobalExceptionHandler.java | 6种异常类型 |
| 3.7 | 编写 `TraceFilter` TraceId 过滤器 | TraceFilter.java | X-Trace-Id 注入 MDC |
| 3.8 | 编写 `TenantContext` 租户上下文 (ScopedValue) | TenantContext.java | get/set/clear |
| 3.9 | 编写通用工具类 (DateUtil, StringUtil, MoneyUtil) | 3个 Util | - |
| 3.10 | 单元测试 R/PageResult/BizException | CoreTest.java | 全部通过 |

---

### Plan §4 — ev-common-mybatis 数据访问模块

**对应设计**：第三节 + 第十节（多租户）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 4.1 | 编写 MyBatis-Plus 全局配置 (分页插件、乐观锁插件) | MybatisPlusConfig.java | 分页查询生效 |
| 4.2 | 编写 `TenantLineHandler` 多租户拦截器 | TenantLineHandler.java | 自动拼接 WHERE tenant_id |
| 4.3 | 编写 `AutoFillHandler` 自动填充 (tenant_id, created_at, updated_at) | AutoFillHandler.java | INSERT 自动填充 |
| 4.4 | 编写 BaseEntity 基类 (id, tenantId, createdAt, updatedAt) | BaseEntity.java | - |

---

### Plan §5 — ev-common-redis 缓存模块

**对应设计**：第三节 + 第十节（幂等性）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 5.1 | 编写 Redis 配置 (RedisTemplate 序列化) | RedisConfig.java | - |
| 5.2 | 编写 `RedisLock` 分布式锁 | RedisLock.java | lock/unlock/tryLock |
| 5.3 | 编写 `IdempotentAspect` 幂等性切面 | IdempotentAspect.java | Redis SETNX |
| 5.4 | 编写 `CacheUtil` 缓存工具 | CacheUtil.java | get/set/evict |

---

### Plan §6 — ev-common-security 认证模块

**对应设计**：第三节 + 第五节（JWT）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 6.1 | 编写 `JwtUtil` JWT 工具 (HMAC-SHA256) | JwtUtil.java | generate/parse/validate |
| 6.2 | 编写 Sa-Token 配置 (拦截器、白名单) | SaTokenConfig.java | - |
| 6.3 | 编写 `SecurityUtils` 获取当前用户 | SecurityUtils.java | getUserId/getRoles/getTenantId |
| 6.4 | 编写 `AuditLog` 审计日志注解 + AOP | AuditLogAspect.java | 方法执行后记录 |
| 6.5 | 单元测试 JWT 生成/解析/过期 | JwtTest.java | 全部通过 |

---

### Plan §7 — ev-gateway API 网关

**对应设计**：第四节（网关）+ 第十节（认证链路）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 7.1 | 编写 Gateway Application 启动类 | GatewayApplication.java | 启动无报错 |
| 7.2 | 编写路由配置 (4个路由规则) | application.yml | 4条 routes |
| 7.3 | 编写 CORS 全局配置 (localhost:5173-5180) | CorsConfig.java | 前端无 CORS 报错 |
| 7.4 | 编写 JWT 认证过滤器 (白名单放行) | AuthFilter.java | 白名单直接通过 |
| 7.5 | 编写用户上下文注入过滤器 (X-User-Id/X-Roles/X-Tenant-Id) | UserContextFilter.java | 请求头注入 |
| 7.6 | 启动网关，curl 验证路由转发 | - | `/api/auth/login` → identity |

---

### Plan §8 — ev-service-identity 认证服务

**对应设计**：第五节（认证服务）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 8.1 | 编写 Application 启动类 + application.yml | IdentityApplication.java | 启动注册 Nacos |
| 8.2 | 编写 Flyway 迁移脚本 `V1__init_identity.sql` (5表) | V1__init_identity.sql | Flyway 执行成功 |
| 8.3 | 编写种子数据 `V2__seed_identity.sql` (3用户+3角色+权限) | V2__seed_identity.sql | 数据库有数据 |
| 8.4 | 编写 Entity (SysUser, SysRole, SysUserRole, SysPermission, SysRolePermission) | 5个 Entity | - |
| 8.5 | 编写 Mapper (5个 BaseMapper) | 5个 Mapper | - |
| 8.6 | 编写 DTO (LoginReq, LoginResp, UserVO, SmsLoginReq) | 6个 DTO | - |
| 8.7 | 编写 AuthService 接口 + Impl | AuthService.java + Impl | - |
| 8.8 | 编写 AuthController (login/logout/profile/refresh) | AuthController.java | 4个端点 |
| 8.9 | 编写 UserController (user-miniapp profile) | UserController.java | 2个端点 |
| 8.10 | 编写 OpsAuthController (ops-app login/profile) | OpsAuthController.java | 2个端点 |
| 8.11 | 编写 UserService (验证码生成+校验) | UserService.java | Redis 存储验证码 |
| 8.12 | 单元测试 AuthService (登录成功/密码错/用户不存在) | AuthServiceTest.java | 3个用例通过 |
| 8.13 | API 测试 AuthController (curl 验证4端点) | - | 全部返回 R<T> |

---

### Plan §9 — ev-service-station 充电站服务

**对应设计**：第六节（充电站服务）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 9.1 | 编写 Application + application.yml (端口8082) | StationApplication.java | 注册 Nacos |
| 9.2 | 编写 Flyway `V1__init_station.sql` (station + device + connector) | 3表 DDL + 索引 | Flyway 成功 |
| 9.3 | 编写种子数据 `V2__seed_station.sql` (5站+12设备+24枪) | 种子 SQL | 数据库有数据 |
| 9.4 | 编写 Entity (StationEntity, DeviceEntity, ConnectorEntity) | 3个 Entity | - |
| 9.5 | 编写 Mapper (3个 BaseMapper + StationMapper.xml 复杂查询) | 3个 Mapper + XML | - |
| 9.6 | 编写 DTO (StationQuery, StationCreateReq, StationUpdateReq, StationVO, DeviceVO, ConnectorVO) | 8个 DTO | - |
| 9.7 | 编写 StationService 接口 + Impl (CRUD + 分页 + 状态管理) | StationService + Impl | - |
| 9.8 | 编写 DeviceService 接口 + Impl (列表 + 详情 + reset/unlock/firmware) | DeviceService + Impl | - |
| 9.9 | 编写 StationController (6端点: list/detail/create/update/delete/updateStatus) | StationController.java | 6端点 |
| 9.10 | 编写 DeviceController (8端点: list/detail/update/reset/unlock/firmware/telemetry/stationDevices) | DeviceController.java | 8端点 |
| 9.11 | 编写 StationInternalController (2端点: /internal/stations/{id} + /internal/devices/{id}) | InternalController | Feign 调用 |
| 9.12 | 编写用户端 StationController (2端点: /api/v1/stations + detail) | UserStationController | 2端点 |
| 9.13 | 编写运维端 OpsStationController (2端点: /api/v1/ops/stations + detail) | OpsStationController | 2端点 |
| 9.14 | 单元测试 StationService (创建/重复编码/分页/状态变更) | StationServiceTest.java | 4用例 |
| 9.15 | 单元测试 DeviceService (列表/详情/重置) | DeviceServiceTest.java | 3用例 |
| 9.16 | API 测试全部 20 端点 (curl) | - | 全部返回 R<T> |

---

### Plan §10 — ev-service-order 订单服务

**对应设计**：第七节（订单服务）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 10.1 | 编写 Application + application.yml (端口8083) | OrderApplication.java | 注册 Nacos |
| 10.2 | 编写 Flyway `V1__init_order.sql` (charging_order + payment_record + device_alert) | 3表 DDL + 索引 | Flyway 成功 |
| 10.3 | 编写种子数据 `V2__seed_order.sql` (20订单+5支付+10告警) | 种子 SQL | 数据库有数据 |
| 10.4 | 编写 Entity (ChargingOrderEntity, PaymentRecordEntity, DeviceAlertEntity) | 3个 Entity | - |
| 10.5 | 编写 Mapper (3个 BaseMapper + OrderMapper.xml 统计查询) | 3个 Mapper + XML | - |
| 10.6 | 编写 DTO (OrderQuery, OrderVO, DashboardStatsVO, ChartDataVO, FinanceSummaryVO, BillVO) | 8个 DTO | - |
| 10.7 | 编写 OrderService (分页查询 + 详情 + 退款) | OrderService + Impl | - |
| 10.8 | 编写 DashboardService (stats + chart + recentOrders + alerts) | DashboardService + Impl | - |
| 10.9 | 编写 FinanceService (summary + bills + settlements + export) | FinanceService + Impl | - |
| 10.10 | 编写 OrderController (4端点: list/detail/refund/export) | OrderController.java | 4端点 |
| 10.11 | 编写 DashboardController (4端点: stats/chart/recentOrders/alerts) | DashboardController.java | 4端点 |
| 10.12 | 编写 FinanceController (4端点: summary/bills/settlements/export) | FinanceController.java | 4端点 |
| 10.13 | 编写用户端 UserOrderController (2端点: list/detail) | UserOrderController | 2端点 |
| 10.14 | 单元测试 OrderService + DashboardService | OrderServiceTest.java | 6用例 |
| 10.15 | API 测试全部 14 端点 (curl) | - | 全部返回 R<T> |

---

### Plan §11 — 前端 Mock → Real 迁移

**对应设计**：第八节（迁移策略）

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 11.1 | admin-web: 新增 `.env.development` + `.env.production` | 2个 .env 文件 | - |
| 11.2 | admin-web: 修改 `api/request.ts` (USE_MOCK + 响应拦截器解包 R<T>) | request.ts | mock 模式正常 |
| 11.3 | admin-web: 修改 `api/index.ts` Auth 模块 (4端点) | index.ts | 登录联调通过 |
| 11.4 | admin-web: 修改 `api/index.ts` Station 模块 (6端点) | index.ts | 充电站页联调通过 |
| 11.5 | admin-web: 修改 `api/index.ts` Device 模块 (6端点) | index.ts | 设备页联调通过 |
| 11.6 | admin-web: 修改 `api/index.ts` Order 模块 (4端点) | index.ts | 订单页联调通过 |
| 11.7 | admin-web: 修改 `api/index.ts` Dashboard 模块 (4端点) | index.ts | 仪表盘联调通过 |
| 11.8 | admin-web: 修改 `api/index.ts` Finance 模块 (4端点) | index.ts | 财务页联调通过 |
| 11.9 | admin-web: 修改 `store/user.ts` login() 使用真实 API | user.ts | 登录流程完整 |
| 11.10 | admin-web: 全量 E2E 测试 (登录→仪表盘→充电站→设备→订单→财务) | - | 全部页面正常 |

---

## 阶段二：L2 扩展 user-miniapp + ops-app

### Plan §12 — user-miniapp 后端 + 前端迁移

**对应设计**：第五节(验证码登录) + 第六节(用户端站点) + 第七节(用户端订单) + 第八节(迁移)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 12.1 | identity-service: 完善手机号+验证码登录逻辑 (Redis存验证码) | SmsLoginService | POST /api/v1/auth/login |
| 12.2 | identity-service: 完善 UserProfile 返回 (balance/couponCount/pointBalance) | UserVO 扩展 | GET /api/v1/user/profile |
| 12.3 | station-service: 完善用户端搜索 (keyword + 距离排序) | UserStationService | GET /api/v1/stations |
| 12.4 | order-service: 完善用户端订单列表 (userId 过滤) | UserOrderService | GET /api/v1/orders |
| 12.5 | user-miniapp: 新增 .env 文件 | .env.development | - |
| 12.6 | user-miniapp: 修改 api/request.ts (USE_MOCK + 解包) | request.ts | - |
| 12.7 | user-miniapp: 修改 api/index.ts 全部9端点 | index.ts | 9端点联调通过 |
| 12.8 | user-miniapp: E2E 测试 (登录→搜索→充电→订单) | - | 全部页面正常 |

---

### Plan §13 — ops-app 后端 + 前端迁移

**对应设计**：第五节(运维登录) + 第六节(运维站点) + 第七节(告警) + 第八节(迁移)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 13.1 | identity-service: 完善运维登录 (角色校验 ops) | OpsAuthService | POST /api/v1/ops/auth/login |
| 13.2 | station-service: 完善运维站点列表 (含 faultCount/alerts/workorders) | OpsStationService | GET /api/v1/ops/stations |
| 13.3 | order-service: 完善告警列表 + 处理 + 忽略 | AlertService | 3端点 |
| 13.4 | 新建工单表 + 工单 CRUD + 接单 + 完成 | WorkOrderService | 3端点 |
| 13.5 | 新建巡检表 + 巡检列表 + 提交 | InspectionService | 2端点 |
| 13.6 | ops-app: 新增 .env 文件 + request.ts 改造 | .env + request.ts | - |
| 13.7 | ops-app: 修改 api/index.ts 全部15端点 | index.ts | 15端点联调通过 |
| 13.8 | ops-app: E2E 测试 (登录→站点→告警→工单→巡检) | - | 全部页面正常 |

---

## 阶段三：L3 充电服务 + 模拟器

### Plan §14 — ev-service-charging 充电控制服务

**对应设计**：第十六节(WebSocket) + 第二十节(charging API)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 14.1 | 编写 Application + application.yml (端口8084) | ChargingApplication.java | 注册 Nacos |
| 14.2 | 编写充电状态机 (CREATED→CHARGING→STOPPING→STOPPED→SETTLED→PAID) | ChargingStateMachine.java | 状态转换正确 |
| 14.3 | 编写 ChargingService (start/stop/status) | ChargingService + Impl | - |
| 14.4 | 编写 ChargingController (3端点: start/stop/status) | ChargingController.java | 3端点 |
| 14.5 | 编写 WebSocket 配置 + ChargingStatusHandler (实时推送) | WebSocketConfig + Handler | WS 连接成功 |
| 14.6 | 编写定时任务：每5秒推送充电状态给 WS 客户端 | ChargingPushTask.java | WS 收到数据 |
| 14.7 | 编写充电→结算→通知事件发布 (Kafka, L2+启用) | ChargingEventPublisher | - |
| 14.8 | 单元测试充电状态机 (全流程 + 异常路径) | ChargingStateMachineTest.java | 8用例 |
| 14.9 | API 测试 3端点 + WebSocket | - | 全部通过 |

---

### Plan §15 — ev-service-simulator 模拟器服务

**对应设计**：simulator 规格 + 第二十节(simulator API)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 15.1 | 编写 Application + application.yml (端口8085) | SimulatorApplication.java | 注册 Nacos |
| 15.2 | 编写虚拟设备管理 (CRUD + 状态模拟) | SimulatorDeviceService | - |
| 15.3 | 编写充电模拟引擎 (CC/CV 充电曲线) | ChargingSimulator.java | SOC 从0→80% |
| 15.4 | 编写场景管理 (CRUD + 执行 + 停止) | ScenarioService | - |
| 15.5 | 编写 OCPP 消息模拟 (BootNotification/Heartbeat/StatusNotification) | OcppSimulator.java | - |
| 15.6 | 编写统计服务 (stats + health) | StatsService | - |
| 15.7 | 编写 SimulatorDeviceController (5端点) | Controller | 5端点 |
| 15.8 | 编写 ScenarioController (6端点) | Controller | 6端点 |
| 15.9 | 编写 OcppController (2端点: send/history) | Controller | 2端点 |
| 15.10 | 编写 StatsController (2端点: stats/health) | Controller | 2端点 |
| 15.11 | 编写设备状态 WebSocket 推送 | DeviceStatusWsHandler | - |
| 15.12 | 单元测试充电模拟引擎 | ChargingSimulatorTest.java | 4用例 |
| 15.13 | API 测试全部 17 端点 | - | 全部通过 |

---

### Plan §16 — simulator-web 前端迁移

**对应设计**：第八节(simulator 迁移)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 16.1 | simulator-web: 新增 .env 文件 | .env.development | - |
| 16.2 | simulator-web: 修改 api/request.ts (USE_MOCK + 解包) | request.ts | - |
| 16.3 | simulator-web: 修改 api/index.ts 全部17端点 | index.ts | - |
| 16.4 | simulator-web: WebSocket 对接 (设备状态 + OCPP 消息流) | store 更新 | 实时数据更新 |
| 16.5 | simulator-web: E2E 测试 (设备→充电→场景→OCPP→统计) | - | 全部页面正常 |

---

## 阶段四：L4 消息总线 + 事件驱动

### Plan §17 — Kafka 集成与事件驱动

**对应设计**：第十六节(Kafka事件)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 17.1 | docker-compose 启用 Kafka 容器 | docker-compose.yml 更新 | kafka healthy |
| 17.2 | 编写 Kafka 配置 (producer/consumer) | KafkaConfig.java | 连接成功 |
| 17.3 | 编写 5个 Topic 事件定义 | 5个 Event 类 | - |
| 17.4 | charging-service: 发布 charging.started / charging.stopped | EventPublisher | 消息到达 Kafka |
| 17.5 | station-service: 发布 device.status.changed / alert.created | EventPublisher | 消息到达 Kafka |
| 17.6 | order-service: 消费 charging.stopped → 自动结算 | SettleConsumer | 订单状态→SETTLED |
| 17.7 | order-service: 发布 order.settled | EventPublisher | - |
| 17.8 | 新建 notification-service: 消费 order.settled + alert.created → 通知 | NotificationConsumer | 控制台打印通知 |
| 17.9 | 集成测试：启动充电→停止→结算→通知 全链路 | - | 自动流转 |

---

## 阶段五：L5 性能优化 + 可观测性

### Plan §18 — 两级缓存

**对应设计**：设计规格中的缓存策略

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 18.1 | 集成 Caffeine L1 缓存 (10K keys, 5min TTL) | CaffeineConfig.java | 命中率 > 95% |
| 18.2 | Redis L2 缓存 (station/device/order 热数据) | @Cacheable 注解 | - |
| 18.3 | 缓存一致性：Cache-Aside + 延迟双删 | CacheEvictAspect.java | 写后读一致 |
| 18.4 | 缓存命中率 Metrics 埋点 | CacheMetrics.java | Prometheus 可见 |

---

### Plan §19 — 可观测性

**对应设计**：第十四节(日志+Metrics)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 19.1 | Logback JSON 结构化日志配置 (所有服务) | logback-spring.xml | JSON 输出 |
| 19.2 | 请求日志 AOP (耗时记录 + 慢请求 WARN) | RequestLogAspect.java | 日志有请求记录 |
| 19.3 | Micrometer Metrics 埋点 (自定义业务指标) | BusinessMetrics.java | /actuator/prometheus |
| 19.4 | Grafana 看板 JSON (API概览+充电业务+设备健康) | dashboards/*.json | 导入可见 |
| 19.5 | OpenTelemetry 链路追踪配置 | otel-config.yml | traceId 跨服务串联 |

---

### Plan §20 — 数据库性能优化

**对应设计**：第二十一节(索引策略)

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 20.1 | 审查所有 SQL EXPLAIN，确认索引命中 | EXPLAIN 输出 | 无全表扫描 |
| 20.2 | 实现 keyset 分页 (深分页优化) | PageHelper 扩展 | >10000条查询 < 100ms |
| 20.3 | Dashboard stats 覆盖索引验证 | 索引 DDL | stats 查询 < 50ms |
| 20.4 | 慢查询日志配置 (long_query_time = 0.5s) | postgresql.conf | 慢查询可见 |
| 20.5 | 压力测试：10000 订单 + 50 并发查询 | JMeter 脚本 | P99 < 300ms |

---

### Plan §21 — 前端优化

| # | 任务 | 产出物 | 验证 |
|---|------|--------|------|
| 21.1 | admin-web: 大表格虚拟滚动 (>100行) | VirtualTable 组件 | 万级数据流畅 |
| 21.2 | admin-web: ECharts 数据懒加载 | 图表组件更新 | 首屏 < 2s |
| 21.3 | user-miniapp: 地图标记点聚合 | Amap MarkerCluster | 大量标记不卡顿 |
| 21.4 | 四端: 请求缓存 + 防抖 | useDebounce hook | 重复请求消除 |

---

## 总计

| 阶段 | Plan 编号 | 任务数 | 对应设计节 |
|------|-----------|--------|-----------|
| L1 | §1~§11 | 112 | §1-§8,§10-§11,§13,§15,§17-§21 |
| L2 | §12~§13 | 16 | §5-§8 |
| L3 | §14~§16 | 28 | §16,§20 |
| L4 | §17 | 9 | §16 |
| L5 | §18~§21 | 18 | §14,§21 |
| **总计** | **21个Plan** | **183个任务** | **覆盖全部21节设计** |
