# EV充电平台后端微服务架构设计

> 状态：设计中 | 日期：2026-07-13

## 决策记录

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 架构风格 | 完整微服务 | 按规格实现15服务架构 |
| 基础设施 | Docker Compose 一键启动 | 开发便捷，环境一致 |
| 构建工具 | Gradle 9.6.1 + Kotlin DSL | 用户指定，构建快，多模块友好 |
| 主数据库 | PostgreSQL + PostGIS | 地理空间查询支持 |
| L1优先服务 | admin-web 相关 (auth/station/device/order/dashboard) | 功能最全，验证联调最快 |

## 第一节：项目结构与模块划分

```
demo07/
├── docker/                          # 基础设施
│   ├── docker-compose.yml           # PostgreSQL + Redis + Nacos + Kafka
│   └── init/                        # 数据库初始化脚本
│       └── postgres/
│           └── init.sql             # 建库建表
├── backend/                         # 后端根项目 (Gradle multi-module)
│   ├── build.gradle.kts             # 根构建脚本
│   ├── settings.gradle.kts          # 模块注册
│   ├── gradle.properties            # 全局版本号
│   ├── gradle/
│   │   └── libs.versions.toml       # Version Catalog
│   ├── ev-common/                   # 公共模块
│   │   ├── ev-common-core/          # 通用工具、异常、响应包装
│   │   ├── ev-common-mybatis/       # MyBatis-Plus 配置、多租户拦截器
│   │   ├── ev-common-redis/         # Redis 配置、缓存工具
│   │   └── ev-common-security/      # JWT、Sa-Token 集成
│   ├── ev-gateway/                  # API 网关 (Spring Cloud Gateway)
│   ├── ev-service-identity/         # 认证与用户管理服务
│   ├── ev-service-station/          # 充电站与设备服务
│   ├── ev-service-order/            # 订单与财务服务
│   ├── ev-service-charging/         # 充电控制服务 (L2-L3 扩展)
│   └── ev-service-simulator/        # 模拟器服务 (L3-L4 扩展)
└── apps/                            # 前端 (已有)
```

---

## 第二节：Docker Compose 基础设施

| 服务 | 镜像 | 端口 | 用途 |
|------|------|------|------|
| PostgreSQL 16 | `postgres:16-alpine` | 5432 | 主数据库，多库（identity/station/order） |
| Redis 7 | `redis:7-alpine` | 6379 | 缓存 + 分布式锁 + Session |
| Nacos 2.3 | `nacos/nacos-server:v2.3.2` | 8848/9848 | 服务注册 + 配置中心 |
| Kafka 3.7 | `bitnami/kafka:3.7` | 9092 | 事件总线 (L2+ 启用) |

- 网络：`ev-network` bridge，容器名互访
- 持久化：named volume，PostgreSQL 启动时执行 `init.sql` 建库建表
- Nacos：standalone 模式，内置 Derby

```yaml
# docker-compose.yml 核心结构
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_MULTIPLE_DATABASES: ev_identity,ev_station,ev_order
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./init/postgres:/docker-entrypoint-initdb.d
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  nacos:
    image: nacos/nacos-server:v2.3.2
    ports: ["8848:8848", "9848:9848"]
    environment:
      MODE: standalone
      SPRING_DATASOURCE_PLATFORM: ""
```

---

## 第三节：Gradle 构建体系与 ev-common 公共模块

### 3.1 Version Catalog (`gradle/libs.versions.toml`)

```toml
[versions]
spring-boot = "3.3.0"
spring-cloud = "2023.0.2"
spring-cloud-alibaba = "2023.0.2.0"
mybatis-plus = "3.5.7"
sa-token = "1.38.0"
redisson = "3.31.0"
hutool = "5.8.28"
mapstruct = "1.5.5.Final"
lombok = "1.18.32"
```

### 3.2 ev-common 四子模块

| 模块 | 职责 | 核心类 |
|------|------|--------|
| ev-common-core | 统一响应 R<T>、全局异常、枚举基类、分页DTO | R<T>, PageQuery, BizException, ErrorCode |
| ev-common-mybatis | MyBatis-Plus 配置、多租户拦截器、自动填充 | TenantInterceptor, AutoFillHandler |
| ev-common-redis | Redis 配置、分布式锁、缓存工具 | RedisLock, CacheUtil |
| ev-common-security | JWT 解析、Sa-Token 集成、权限注解 | JwtUtil, SecurityConfig |

### 3.3 统一响应格式（对齐前端 R<T>）

```kotlin
data class R<T>(
    val code: Int = 0,        // 0=成功, 非0=错误码
    val message: String = "success",
    val data: T? = null,
    val traceId: String = ""
)
```

与前端4个App的 request.ts 解析格式一致，mock→real 只需替换调用源，响应处理不动。

### 3.4 统一错误码

| 范围 | 含义 |
|------|------|
| 0 | success |
| 1001-1099 | 参数/认证/权限 |
| 2001-2099 | 充电站/设备 |
| 3001-3099 | 订单/支付 |
| 9999 | 系统内部错误 |

---

## 第四节：API 网关 (ev-gateway)

### 4.1 路由规则

| 前端App | 请求前缀 | 路由目标 |
|---------|----------|----------|
| admin-web | `/api/` | identity / station / order |
| simulator-web | `/api/simulator/` | simulator |
| user-miniapp | `/api/v1/` | identity / station / charging / order |
| ops-app | `/api/v1/ops/` | identity / station / order |

网关统一暴露 8080 端口。

### 4.2 网关职责

CORS → JWT解析(白名单放行) → 路由转发(Nacos服务发现)

- CORS：允许 localhost:5173-5180
- JWT：解析 Authorization 注入 userId/roles/tenantId 到请求头
- 白名单：`/api/v1/auth/**`, `/api/simulator/**`

### 4.3 路由配置

```yaml
routes:
  - id: identity-service
    uri: lb://ev-service-identity
    predicates: [Path=/api/auth/**,/api/v1/auth/**,/api/v1/ops/auth/**,/api/v1/user/**,/api/users/**]
  - id: station-service
    uri: lb://ev-service-station
    predicates: [Path=/api/stations/**,/api/v1/stations/**,/api/v1/ops/stations/**,/api/devices/**]
  - id: order-service
    uri: lb://ev-service-order
    predicates: [Path=/api/orders/**,/api/v1/orders/**,/api/dashboard/**,/api/finance/**]
  - id: simulator-service
    uri: lb://ev-service-simulator
    predicates: [Path=/api/simulator/**]
```

### 4.4 端口分配

| 服务 | 端口 |
|------|------|
| ev-gateway | 8080 |
| ev-service-identity | 8081 |
| ev-service-station | 8082 |
| ev-service-order | 8083 |
| ev-service-charging | 8084 |
| ev-service-simulator | 8085 |

---

## 第五节：认证服务 (ev-service-identity)

### 5.1 API 端点 (8个)

| 端点 | HTTP | 路径 | 服务对象 |
|------|------|------|----------|
| 登录 | POST | /api/auth/login | admin-web |
| 登出 | POST | /api/auth/logout | admin-web |
| 用户信息 | GET | /api/auth/profile | admin-web |
| 刷新Token | POST | /api/auth/refresh | admin-web |
| 用户端登录 | POST | /api/v1/auth/login | user-miniapp (手机号+验证码) |
| 用户端信息 | GET | /api/v1/user/profile | user-miniapp |
| 运维登录 | POST | /api/v1/ops/auth/login | ops-app |
| 运维信息 | GET | /api/v1/ops/user/profile | ops-app |

### 5.2 数据库表 (ev_identity)

- sys_user：统一存储 admin/ops/app 用户，通过 role 区分
- sys_role：admin / ops / user
- sys_user_role：用户-角色多对多
- sys_permission：菜单+按钮权限
- sys_role_permission：角色-权限多对多

### 5.3 认证流程

- admin-web：username+password → BCrypt校验 → JWT(2h)
- user-miniapp：phone+code → Redis验证码校验 → 查找/创建用户 → JWT
- ops-app：username+password → BCrypt+角色校验 → JWT

### 5.4 JWT Payload

{ sub, username, roles[], tenantId, orgId, iat, exp }

### 5.5 L1 预置数据

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |
| ops1 | ops123 | ops |
| 13800138000 | 验证码123456 | user |

---

## 第六节：充电站服务 (ev-service-station)

### 6.1 API 端点 (18个)

充电站 admin：GET/POST/PUT/DELETE /api/stations + PUT status
充电站 user：GET /api/v1/stations + GET detail
充电站 ops：GET /api/v1/ops/stations + GET detail
设备：GET/PUT /api/devices + reset/unlock/firmware/telemetry

### 6.2 数据库表 (ev_station)

- station：code, name, type(PUBLIC/PRIVATE/DESTINATION), status, 省市区, 经纬度, 电价/服务费/停车费, tenant_id
- device：station_id, code, ocpp_id, type(AC/DC), model, vendor, rated_power, status(5种), lifecycle(6种)
- connector：device_id, connector_id, type(4种), status(9种OCPP状态), max_power, cumulative_energy

### 6.3 分页查询

对齐前端 PageResult<T>：{ list, total, page, size }

### 6.4 L1 预置数据

5个充电站（北京/上海/广州/深圳/杭州），每站2-4台设备，每台2个充电枪。与前端mock数据对齐。

---

## 第七节：订单服务 (ev-service-order)

### 7.1 API 端点 (14个)

订单：GET/POST /api/orders + export + refund
用户端订单：GET /api/v1/orders
仪表盘：GET /api/dashboard/stats + chart + recent-orders + alerts
财务：GET /api/finance/summary + bills + settlements + export

### 7.2 数据库表 (ev_order)

- charging_order：order_no, station/device/user关联, status(11种状态机), 计量(meter/energy/power/SOC), 费用(electricity/service/parking/discount/total, 分), 支付(pay_method/time), 时间戳, tenant_id, version乐观锁
- payment_record：payment_no, order_id, channel(WECHAT/ALIPAY/BALANCE), amount, status, channel_trade_no
- device_alert：device/station关联, level(P0-P3), title, status(pending/processing/resolved/ignored), handler, handle_result

### 7.3 仪表盘 stats

多表 COUNT/SUM 一次性查出 station_count, device_count, online_device_count, today_order_count, today_revenue, month_revenue
chart：按天 GROUP BY 近7/30天趋势

### 7.4 L1 预置数据

20条充电订单(覆盖各状态) + 5条支付记录 + 10条告警，与前端mock对齐。

---

## 第八节：前端 Mock → Real 数据迁移策略

### 8.1 核心思路：开关切换 + 渐进替换

通过 `VITE_USE_MOCK` 环境变量控制，不删除 mock 代码，默认 mock，后端就绪后切 false。

### 8.2 改造模式

每个 App 的 api/index.ts 中每个方法增加 if (USE_MOCK) 分支，走 mock 或走 request.get()。
页面代码（组件、store、视图）完全不动，只改 api/ 层。

### 8.3 响应拦截器统一解包 R<T>

响应拦截器解析 { code, message, data }，code≠0 拒绝，code=1002 清理 token 跳登录，成功返回 data 层。前端现有代码无需改动。

### 8.4 改造清单

| App | 改造端点数 |
|-----|-----------|
| admin-web | 30 |
| simulator-web | 17 |
| user-miniapp | 9 |
| ops-app | 15 |
| 合计 | 71 |

### 8.5 环境变量

```bash
# .env.development
VITE_USE_MOCK=true
VITE_API_BASE_URL=http://localhost:8080

# .env.production
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080
```

---

## 第九节：L1-L5 开发路线图

### L1 — 后端框架搭建 + admin-web 联调跑通
L1.1~L1.11：Docker基础设施 → Gradle脚手架 → ev-common四子模块 → gateway → identity/station/order三服务 → admin-web前端改造(30端点)
交付物：admin-web 完全接入真实后端

### L2 — 扩展 user-miniapp + ops-app
L2.1~L2.5：验证码登录 + 用户端/运维端API + 前端改造
交付物：三端全部接入

### L3 — 充电服务 + 实时通信
L3.1~L3.4：charging-service + OCPP模拟器 + WebSocket + simulator-web改造
交付物：四端全部接入，模拟器可控

### L4 — 消息总线 + 事件驱动
L4.1~L4.4：Kafka事件 → 订单结算/告警/通知自动流转

### L5 — 性能优化 + 可观测性
L5.1~L5.4：两级缓存 + OpenTelemetry + 索引优化 + 虚拟滚动

---

## 第十节：安全架构与多租户

### 10.1 认证链路

JWT(HMAC-SHA256, L1阶段) → gateway验签+注入X-User-Id/X-Roles/X-Tenant-Id → 下游Sa-Token校验 + MyBatis自动租户隔离

### 10.2 多租户数据隔离

- 数据库行级：TenantLineInterceptor 自动 WHERE tenant_id = ?
- 写入自动填充：MetaObjectHandler
- 缓存隔离：Redis key 前缀 tenant:{tenantId}:
- 上下文传递：ThreadLocal + ScopedValue (Java 21虚拟线程安全)

### 10.3 RBAC 四级权限

菜单权限(页面可见) + 按钮权限(操作可用) + 数据权限(ALL/ORG_AND_CHILDREN/ORG_ONLY/SELF_ONLY) + 字段权限(L5扩展)

### 10.4 接口幂等性

请求头 Idempotency-Key + Redis SETNX，重复请求返回缓存结果。

### 10.5 审计日志

sys_audit_log 表：user_id, action(CRUD/LOGIN/EXPORT), resource, detail(JSONB变更对比), ip
独立表空间，append-only，3年保留。

---

## 第十一节：全局异常处理与容错

### 11.1 异常分层

BizException(业务) → NotLoginException(认证) → NotPermissionException(权限) → ValidationException(校验) → Exception(未知)
全部返回统一 R<T> 格式，前端无需特殊处理。

### 11.2 容错策略

| 策略 | 配置 |
|------|------|
| 超时 | connect=3s, read=5s |
| 重试 | 3次，指数退避(1s/2s/4s) |
| 熔断 | Sentinel: 慢调用>3s 或 异常率>50% |
| 限流 | 全局10K QPS, 单用户100 QPS |

### 11.3 参数校验

使用 Jakarta Validation 注解 + 自定义 BizException(1001) 返回。

### 11.4 TraceId 全链路

请求进入时生成/提取 X-Trace-Id，存入 MDC，日志自动携带，响应头返回前端。

---

## 第十二节：测试策略

### 12.1 测试金字塔

单元测试(JUnit5+Mockk, L1) → 集成测试(Testcontainers+真实PG/Redis, L2+) → API测试(MockMvc, L1+)

### 12.2 覆盖率目标

L1：Service≥80%, Controller≥90%
L3：全层≥70%, 核心链路100%
L5：全层≥80%, 核心链路100% + 边界用例

### 12.3 测试数据管理

L1: @Sql 注解加载测试 SQL
L3: Flyway 管理数据库版本迁移
每个测试前 TRUNCATE + 重新插入预置数据。

---

## 第十三节：API 文档与配置管理

### 13.1 API 文档

Knife4j (Swagger增强)，每个服务独立 /doc.html，网关聚合所有下游文档。
Controller 使用 @Tag/@Operation 注解，自动生成请求/响应 Schema。

### 13.2 网关聚合

gateway routes 配置 swagger 路由，knife4j.gateway.routes 列出所有服务文档源。

### 13.3 Nacos 配置中心

每个服务两份配置：基础配置(数据源/MyBatis/日志) + 业务配置(分页/TTL/开关)
Data ID 格式：ev-service-{name}.yml

### 13.4 配置热更新

@RefreshScope + @ConfigurationProperties + Nacos 长轮询，变更无需重启。

### 13.5 命名空间

dev(本地) / test(测试) / prod(生产)，L1 只用 dev。

---

## 第十四节：日志规范与可观测性

### 14.1 统一日志格式

JSON 结构化日志：timestamp, level, service, traceId, spanId, userId, tenantId, message
Logback + LogstashEncoder，traceId/ userId/tenantId 从 MDC 注入。

### 14.2 日志级别规范

请求入口/出口/业务关键节点=INFO, 外部慢调用>500ms=INFO, 业务异常=WARN, 系统异常=ERROR, 调试=DEBUG

### 14.3 请求日志 AOP

Controller 方法级耗时记录，>1s 自动 WARN 告警。

### 14.4 Metrics 指标

Micrometer + Prometheus：http请求耗时、charging_order_total(按状态)、energy_wh、station_available_ports、device_online_count、cache_hit_ratio
/actuator/prometheus 暴露端点。

### 14.5 Grafana 看板

API概览(QPS/延迟/错误率) + 充电业务(订单/收入/电量) + 设备健康(在线率/故障率) + 基础设施(JVM/DB/Redis)

### 14.6 日志存储策略

开发=控制台, 测试=Loki/7天, 生产=Loki+S3/INFO 30天+ERROR永久

---

## 第十五节：文件存储与数据库版本管理

### 15.1 MinIO 文件存储

6个 Bucket：ev-station(站点照片) / ev-device(设备图片) / ev-inspection(巡检照片) / ev-firmware(固件) / ev-export(导出) / ev-avatar(头像)
统一上传接口 FileService.upload() → 返回 { url, name, size }

### 15.2 Flyway 数据库版本迁移

每个服务独立 migration 脚本：V1__init_schema → V2__seed_data
dev profile 下执行种子数据，prod profile 不执行。

### 15.3 种子数据

identity：3用户+3角色(对齐前端登录账号)
station：5站+12设备+24枪(对齐前端mock)
order：20订单+5支付+10告警(对齐前端mock)

### 15.4 启动顺序

docker-compose up → PG创建3库 → 各服务启动 → Flyway迁移 → seed → 注册Nacos → 就绪

---

## 第十六节：服务间通信与实时推送

### 16.1 同步调用 (OpenFeign)

order→station(查电价/设备) / order→identity(查余额) / station→identity(校验权限)
内部接口前缀 /internal/ 区分对外 /api/，Feign 拦截器自动传递租户上下文。
Fallback 降级返回 R(code=9998, message=服务暂不可用)

### 16.2 异步事件 (Kafka)

| Topic | 生产者 | 消费者 |
|-------|--------|--------|
| charging.started | charging | order, analytics |
| charging.stopped | charging | order, notification |
| device.status.changed | station | order, analytics |
| alert.created | station | notification |
| order.settled | order | notification, analytics |

### 16.3 WebSocket 实时推送

/ ws/charging/{orderId}：充电实时数据(SOC/功率/电量/时长/费用) → user-miniapp 充电页
/ws/device/{deviceId}/status：设备状态 → simulator-web
JwtHandshakeInterceptor 在握手时校验 token。

---

## 第十七节：服务模块内部架构（分层规范）

### 17.1 分层结构

controller(参数校验+响应封装) → service(业务逻辑+事务+事件) → mapper(数据访问)
entity(数据库映射) / dto/request / dto/response / enums / config / event

### 17.2 关键规则

- Controller 不写业务逻辑，只校验+调用+封装
- Service 之间通过接口注入，不直接依赖实现类
- Entity 只用于数据库层，对外暴露 VO/DTO
- 复杂 SQL 放 MyBatis XML

### 17.3 Controller 模板

@RestController + @Tag(Swagger) + @SaCheckPermission(权限) + @AuditLog(审计)
方法返回 R<T>，参数用 @Valid 校验。

### 17.4 服务 API 映射

| 服务 | Controller | 端点数 |
|------|-----------|--------|
| identity | Auth + User | 8 |
| station | Station + Device + Internal | 20 |
| order | Order + Dashboard + Finance | 14 |
| charging | Charging + WebSocket | 4+WS |
| simulator | Device + Scenario + Ocpp + Stats | 17 |

---

## 第十八节：基础设施完整配置与构建脚本

### 18.1 docker-compose.yml

5个容器：postgres(16-alpine, 5432, 多库) + redis(7-alpine, 6379) + nacos(v2.3.2, 8848, standalone) + minio(9000/9001) + kafka(3.7, L2+启用)
所有容器 ev-network bridge 网络，healthcheck 就绪检测。

### 18.2 PostgreSQL init.sql

CREATE DATABASE ev_station / ev_order，ev_identity 由 POSTGRES_DB 环境变量创建。

### 18.3 Gradle 构建脚本

settings.gradle.kts：rootProject.name = ev-charging-platform，include 4个 common + 1个 gateway + 5个 service
build.gradle.kts(根)：Java 21 + Lombok 全局
libs.versions.toml：Spring Boot 3.3 + Spring Cloud Alibaba 2023 + MyBatis-Plus 3.5.7 + Sa-Token 1.38.0

### 18.4 业务服务 build.gradle.kts

依赖：ev-common 四子模块 + spring-boot-starter-web/data-redis/validation + mybatis-plus + postgresql + flyway + nacos + knife4j + mapstruct + mockk(测试)

### 18.5 bootstrap.yml

Nacos 连接配置：server-addr, namespace=dev, file-extension=yml

---

## 第十九节：开发工作流与快速启动指南

### 19.1 一键启动

docker compose up -d(4容器) → gateway:bootRun → identity:bootRun → station:bootRun → order:bootRun
Nacos 控制台验证4服务注册 → curl 验证登录API → 前端 VITE_USE_MOCK=false 切换

### 19.2 前端迁移步骤

admin-web(30端点)：环境准备 → Auth → Station → Order → Dashboard+Finance
user-miniapp(9端点)：Auth → Station → Charging → Order
ops-app(15端点)：Auth → Station → Alert → WorkOrder → Inspection
simulator-web(17端点)：Device → Charging → Scenario → OCPP → Stats

### 19.3 常见问题排查

CORS→gateway配置 / 401→token格式 / 空白→USE_MOCK+后端未启动 / DB→PG容器就绪 / Flyway→SQL语法 / Nacos→端口

---

## 第二十节：完整 API 契约（请求/响应示例）

### 20.1 identity (8端点)

POST /api/auth/login：{username,password} → {token,user:{id,username,nickname,avatar,roles}}
GET /api/auth/profile：→ {id,username,nickname,roles,permissions,tenantId,orgId}
POST /api/v1/auth/login：{phone,code} → {token,user:{id,nickname,phone,balance,couponCount}}
POST /api/v1/ops/auth/login：{username,password} → {token,user:{id,username,nickname,roles,phone}}

### 20.2 station (20端点)

GET /api/stations：分页+筛选 → PageResult<StationVO>(含todayOrderCount/todayRevenue/deviceCount)
POST/PUT/DELETE /api/stations：CRUD
GET /api/v1/stations：用户端搜索 → {id,name,address,distance,availableCount,prices,lng,lat}
GET /api/stations/{stationId}/devices：→ DeviceVO(含connectors[])
PUT /api/devices/{id}/status | reset | unlock | firmware | telemetry

### 20.3 order (14端点)

GET /api/dashboard/stats：→ {stationCount,deviceCount,onlineDeviceCount,todayOrderCount,todayRevenue,monthRevenue,totalEnergy,todayEnergy}
GET /api/dashboard/chart：→ {dates[],orderCounts[],revenues[],energies[]}
GET /api/orders：分页 → PageResult<OrderVO>(含energyWh/费用分/payMethod)
GET /api/finance/summary：→ {totalRevenue,feeBreakdown,refundAmount,...}

### 20.4 simulator (17端点)

GET /api/simulator/stats：→ {totalDevices,onlineDevices,chargingDevices,faultDevices,...}
POST /api/simulator/charging/start：{chargePointId,connectorId,idTag,targetSoc} → TransactionVO
POST /api/simulator/scenarios/{id}/execute：执行场景

### 20.5 charging (4端点+WebSocket)

POST /api/v1/charging/start：{stationId,deviceCode,connectorId} → ChargingSession
GET /api/v1/charging/{orderId}/status：→ {currentSoc,power,energy,duration,cost}
WebSocket /ws/charging/{orderId}：每5秒推送 {soc,power,energy,duration,cost,status}

### 20.6 ops特殊端点

GET /api/v1/ops/stations：→ 含faultCount/todayAlerts/pendingWorkorders
GET /api/v1/ops/alerts：→ AlertVO(含level/title/stationName/handleTime)
GET /api/v1/ops/workorders：→ WorkOrderVO(含type/priority/status/assignee)
GET /api/v1/ops/inspections：→ InspectionTaskVO(含deviceCount/itemCount/status)

---

## 第二十一节：数据库 ER 关系与索引策略

### 21.1 ER 关系

station 1:N device 1:N connector 1:1 charging_order 1:N payment_record
station 1:N device_alert
sys_user N:M sys_role N:M sys_permission
charging_order.user_id → sys_user.id

### 21.2 索引策略

charging_order（最频繁查询）：
- idx_order_user(user_id, created_at DESC)
- idx_order_station(station_id, created_at DESC)
- idx_order_status(status, created_at DESC)
- idx_order_dashboard(tenant_id, created_at, status) INCLUDE(total_amount, energy_wh) 覆盖索引

station：status + city + tenant_id
device：station_id + status + ocpp_id + tenant_id
connector：(device_id, connector_id) + status
alert：(station_id, created_at DESC) + (status, level, created_at DESC)

### 21.3 分页优化

深分页(>10000条)使用 keyset 分页 WHERE id < lastId 替代 OFFSET
Dashboard stats 的 total 缓存5分钟避免每次 COUNT(*)

### 21.4 L1 预置数据量级

sys_user:3 / sys_role:3 / sys_permission:20 / station:5 / device:12 / connector:24 / charging_order:20 / payment_record:5 / device_alert:10

L3 阶段扩展到 station=50, device=200, order=10000 用于性能测试。
