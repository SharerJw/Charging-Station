export const meta = {
  name: 'fix-critical-issues',
  description: '修复 JWT 安全、Charging 服务缺陷、CI/CD 缺失三大问题',
  phases: [
    { title: 'Phase 1: P0 安全修复', detail: 'JWT Secret 外部化 + RedisLock 安全加固 + 硬编码租户ID清理' },
    { title: 'Phase 2: Charging 服务修复', detail: 'DB配置修复 + WebSocket集成 + orderId + 硬编码清理' },
    { title: 'Phase 3: CI/CD 创建', detail: 'GitHub Actions 构建/测试/部署流水线' },
    { title: 'Phase 4: 验证', detail: '编译验证 + 文件完整性检查' },
  ],
};

// ============================================================
// Phase 1: P0 安全修复 — 3 个并行代理
// ============================================================
phase('Phase 1: P0 安全修复');

const securityResults = await parallel([
  // --- 1a: JWT Secret 外部化 ---
  () => agent(
    `你是 Java Spring Boot 安全专家。请修复 JWT Secret 硬编码的 P0 安全漏洞。

## 需要修改的文件

### 文件 1: JwtUtil.java
路径: D:/Agent/claude/demo07/backend/ev-common/ev-common-security/src/main/java/com/ev/common/security/util/JwtUtil.java

当前问题:
- Line 28: secret 硬编码为 "ev-charging-platform-jwt-secret-key-2026"
- Line 32: @Value 默认值也是硬编码的同一字符串
- 如果 @Value 注入失败，会静默使用硬编码值

修复方案:
1. 读取当前文件
2. 将 @Value 注解改为: @Value("\${jwt.secret}") （无默认值，强制要求配置）
3. 移除静态字段中的硬编码默认值，改为空字符串
4. 在 @PostConstruct init() 方法中添加校验：如果 secret 为空或长度 < 32 字符，抛出 IllegalStateException 强制要求配置
5. expireMs 和 refreshExpireMs 保留合理默认值（这些不是安全敏感项）

### 文件 2: 各服务的 application.yml
需要在以下文件中添加 jwt.secret 配置（如果还没有的话）:
- D:/Agent/claude/demo07/backend/ev-service/ev-service-identity/src/main/resources/application.yml
- D:/Agent/claude/demo07/backend/ev-service/ev-service-station/src/main/resources/application.yml
- D:/Agent/claude/demo07/backend/ev-service/ev-service-order/src/main/resources/application.yml
- D:/Agent/claude/demo07/backend/ev-service/ev-service-charging/src/main/resources/application.yml
- D:/Agent/claude/demo07/backend/ev-gateway/src/main/resources/application.yml

在每个文件的 spring 下添加:
jwt:
  secret: \${JWT_SECRET:ev-charging-platform-jwt-dev-secret-key-2026}

注意：开发环境可以有默认值，但生产环境通过环境变量覆盖。

### 文件 3: docker-compose.prod.yml
路径: D:/Agent/claude/demo07/docker/docker-compose.prod.yml

在所有使用 JwtUtil 的微服务（identity, station, order, charging）的 environment 中添加 JWT_SECRET 环境变量（参考 gateway 的配置）。

请先读取所有文件，然后逐一修改。确保 YAML 缩进正确。`,
    { label: 'fix:jwt-secret', phase: 'Phase 1: P0 安全修复', effort: 'high' }
  ),

  // --- 1b: RedisLock 安全加固 ---
  () => agent(
    `你是 Java 分布式系统专家。请修复 RedisLock 的并发安全问题。

## 需要修改的文件
路径: D:/Agent/claude/demo07/backend/ev-common/ev-common-redis/src/main/java/com/ev/common/redis/util/RedisLock.java

## 当前问题
1. unlock(String key) 方法（约 line 92-95）没有 owner 校验，直接调用 redisTemplate.delete(lockKey)
2. 任何线程都可以释放其他线程持有的锁
3. 缺少 lock watchdog/续期机制

## 修复方案

1. 读取当前文件完整内容
2. 修改 tryLock 方法:
   - 使用 UUID.randomUUID() 生成 owner 标识
   - 将 owner 存入 Redis value（而不是简单的 "1"）
   - 将 owner 存入 ThreadLocal 以便 unlock 时获取

3. 修改 unlock 方法:
   - 添加 owner 校验：先从 ThreadLocal 获取 owner
   - 使用 Redis Lua 脚本保证原子性: if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end
   - 清理 ThreadLocal（finally 块中）

4. 添加新的重载方法:
   - tryLock(String key, long timeoutSeconds, String owner) - 允许外部指定 owner
   - unlock(String key, String owner) - 允许外部指定 owner

5. 保留原有 tryLock(String key, long timeoutSeconds) 的向后兼容性

6. 添加 lock watchdog（可选但推荐）:
   - 使用 ScheduledExecutorService 定期检查锁是否仍被当前线程持有
   - 如果是，自动续期

请先读取当前文件，理解现有实现，然后进行修改。确保不破坏现有调用方。`,
    { label: 'fix:redis-lock', phase: 'Phase 1: P0 安全修复', effort: 'high' }
  ),

  // --- 1c: 清除硬编码租户ID ---
  () => agent(
    `你是 Java 代码审计专家。请清除 ev-common 模块中所有硬编码的租户ID 'T001'。

## 需要修改的文件（共 5 个）

1. D:/Agent/claude/demo07/backend/ev-common/ev-common-core/src/main/java/com/ev/common/core/constant/CommonConstants.java
2. D:/Agent/claude/demo07/backend/ev-common/ev-common-core/src/main/java/com/ev/common/core/event/ChargingStartedEvent.java
3. D:/Agent/claude/demo07/backend/ev-common/ev-common-core/src/main/java/com/ev/common/core/event/ChargingStoppedEvent.java
4. D:/Agent/claude/demo07/backend/ev-common/ev-common-mybatis/src/main/java/com/ev/common/mybatis/handler/AutoFillHandler.java
5. D:/Agent/claude/demo07/backend/ev-common/ev-common-mybatis/src/main/java/com/ev/common/mybatis/config/EvTenantLineHandler.java

## 修复方案

对于每个文件：
1. 读取当前内容
2. 搜索所有 'T001' 硬编码
3. 替换为从 TenantContext 获取（如果在请求上下文中）
4. 对于非请求上下文（如定时任务），使用配置值或抛出异常

具体修改：
- CommonConstants.java: DEFAULT_TENANT_ID 保留但添加注释说明仅用于测试/默认值
- ChargingStartedEvent/ChargingStoppedEvent: of() 方法中从 TenantContext.getTenantId() 获取
- AutoFillHandler: 从 TenantContext 获取，如果为空则跳过填充（不要用默认值）
- EvTenantLineHandler: 从 TenantContext 获取，如果为空则不添加租户条件（允许系统级查询）

请先读取每个文件，找到所有 T001 出现的位置，然后逐一修改。`,
    { label: 'fix:tenant-hardcode', phase: 'Phase 1: P0 安全修复', effort: 'high' }
  ),
]);

// ============================================================
// Phase 2: Charging 服务修复 — 3 个并行代理
// ============================================================
phase('Phase 2: Charging 服务修复');

const chargingResults = await parallel([
  // --- 2a: DB 配置修复 + application.yml ---
  () => agent(
    `你是 Spring Boot 配置专家。请修复 ev-service-charging 的配置问题。

## 需要修改的文件

### 文件 1: charging 的 application.yml
路径: D:/Agent/claude/demo07/backend/ev-service/ev-service-charging/src/main/resources/application.yml

当前问题:
- Line 26: DB URL 硬编码为 ev_order（应该是 ev_charging）— 这是 copy-paste 错误！
- Line 37: Redis 密码未配置，生产环境会连接失败
- 缺少 jwt.secret 配置

修复方案:
1. 读取当前文件
2. 将数据库 URL 中的 ev_order 改为 ev_charging: \${DB_NAME:ev_charging}
3. 添加 Redis 密码配置: password: \${REDIS_PASSWORD:}
4. 添加 jwt.secret 配置（在 spring 下）:
   jwt:
     secret: \${JWT_SECRET:ev-charging-platform-jwt-dev-secret-key-2026}
5. 确保 YAML 缩进正确（2空格）

### 文件 2: 创建 ChargingServiceConfig.java
路径: D:/Agent/claude/demo07/backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/config/ChargingServiceConfig.java

创建一个配置类，包含:
- @Configuration 注解
- @Value 注入服务相关配置（如 station-service URL）
- 用于替代 ChargingServiceImpl 中的硬编码 URL

请先读取现有文件，然后进行修改/创建。`,
    { label: 'fix:charging-config', phase: 'Phase 2: Charging 服务修复', effort: 'high' }
  ),

  // --- 2b: WebSocket 集成 SOC 推送 ---
  () => agent(
    `你是 Java WebSocket 专家。请修复 ev-service-charging 的 WebSocket 集成问题。

## 需要修改的文件

### 文件 1: ChargingStatusHandler.java
路径: D:/Agent/claude/demo07/backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/ws/ChargingStatusHandler.java

当前问题:
- Line 30-32: ORDER_SESSIONS 和 USER_SESSIONS 存储在 JVM 本地 ConcurrentHashMap
- Line 100: extractPathParam 忽略了 index 参数
- 缺少消息序列化工具

修复方案:
1. 读取当前文件
2. 修复 extractPathParam 方法，正确使用 index 参数
3. 添加注入 ObjectMapper 用于 JSON 序列化
4. 添加 sendToOrder 和 sendToUser 方法，包含:
   - 从 ConcurrentHashMap 获取 session
   - 使用 ObjectMapper 序列化消息
   - 异步发送（避免阻塞）
   - 异常处理（session 关闭时清理 map）

### 文件 2: ChargingServiceImpl.java
路径: D:/Agent/claude/demo07/backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/service/impl/ChargingServiceImpl.java

当前问题:
- simulateSocProgress() 方法中 SOC 更新后没有调用 WebSocket 推送
- orderId 生成使用 UUID 截断（line 62），碰撞风险

修复方案:
1. 读取当前文件
2. 在 simulateSocProgress() 中，每次 SOC 更新后调用 ChargingStatusHandler.sendToOrder()
3. orderId 生成改为完整 UUID: UUID.randomUUID().toString().replace("-", "")
4. 注入 ChargingStatusHandler（@Autowired(required = false)）

### 文件 3: ChargingWebSocketConfig.java
路径: D:/Agent/claude/demo07/backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/ws/ChargingWebSocketConfig.java

当前问题:
- ALLOWED_ORIGINS 硬编码为 localhost（line 17-26）

修复方案:
1. 读取当前文件
2. 将 ALLOWED_ORIGINS 改为从配置读取: @Value("\${websocket.allowed-origins:...}")
3. 保留 localhost 作为开发默认值

请先读取所有文件，理解现有实现，然后进行修改。确保 WebSocket 推送是 fire-and-forget（不阻塞主流程）。`,
    { label: 'fix:charging-websocket', phase: 'Phase 2: Charging 服务修复', effort: 'high' }
  ),

  // --- 2c: 清除 Charging 硬编码数据 ---
  () => agent(
    `你是 Java 代码重构专家。请清除 ev-service-charging 中的硬编码数据和假数据。

## 需要修改的文件

### 文件 1: ChargingServiceImpl.java
路径: D:/Agent/claude/demo07/backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/service/impl/ChargingServiceImpl.java

当前问题:
- Line 57: DEFAULT_PRICE_PER_KWH = 175L 硬编码（应从配置读取）
- Line 73: stationName 硬编码为 "站点" + stationId
- Line 77: initial SOC 硬编码为 20 + random(10)
- stop() 方法中返回假数据（如果会话未找到）

修复方案:
1. 读取当前文件
2. 将 DEFAULT_PRICE_PER_KWH 改为 @Value("\${charging.price-per-kwh:175}") 注入
3. stationName: 添加 TODO 注释说明应从 station-service 获取，保留当前实现作为 fallback
4. initial SOC: 保留模拟逻辑但添加注释说明是模拟值
5. stop() 方法: 如果会话未找到，抛出业务异常而不是返回假数据

## 注意事项
- 不要破坏现有的业务逻辑
- 保留向后兼容性
- 添加清晰的注释说明哪些是模拟数据
- 确保异常处理正确（使用 BizException）

请先读取文件，找到所有硬编码位置，然后逐一修改。`,
    { label: 'fix:charging-hardcode', phase: 'Phase 2: Charging 服务修复', effort: 'high' }
  ),
]);

// ============================================================
// Phase 3: CI/CD 创建 — 1 个代理
// ============================================================
phase('Phase 3: CI/CD 创建');

const cicdResult = await agent(
  `你是 DevOps 专家。请为 EV 充电平台创建完整的 GitHub Actions CI/CD 工作流。

## 项目结构
- 后端: Java 21 + Spring Boot 3.3 + Gradle
- 前端: Vue 3 + TypeScript + pnpm (4个应用: admin-web, ops-app, user-miniapp, simulator-web)
- 基础设施: Docker Compose (PostgreSQL, Redis, Kafka, Nacos, MinIO)

## 需要创建的文件

### 文件 1: CI 主流水线
路径: D:/Agent/claude/demo07/.github/workflows/ci.yml

触发条件:
- push 到 main 分支
- pull_request 到 main 分支
- 手动触发 (workflow_dispatch)

Jobs:

#### Job 1: backend-build
- runs-on: ubuntu-latest
- services: postgres (用于集成测试)
- steps:
  1. actions/checkout@v4
  2. actions/setup-java@v4 (Java 21, temurin)
  3. 缓存 Gradle 依赖
  4. ./gradlew build -x test (编译)
  5. ./gradlew test (测试)
  6. 上传测试报告 (actions/upload-artifact)

#### Job 2: frontend-build
- runs-on: ubuntu-latest
- strategy:
    matrix:
      app: [admin-web, ops-app, user-miniapp, simulator-web]
- steps:
  1. actions/checkout@v4
  2. pnpm/action-setup@v4 (pnpm 9)
  3. actions/setup-node@v4 (Node 20)
  4. 缓存 pnpm 依赖
  5. pnpm install --frozen-lockfile
  6. pnpm --filter \${{ matrix.app }} build
  7. pnpm --filter \${{ matrix.app }} test (如果有的话)

#### Job 3: docker-build (仅 main 分支)
- needs: [backend-build, frontend-build]
- if: github.ref == 'refs/heads/main' && github.event_name == 'push'
- runs-on: ubuntu-latest
- steps:
  1. actions/checkout@v4
  2. docker/setup-buildx-action@v3
  3. 为每个后端服务构建 Docker 镜像（使用 matrix）
  4. 使用 docker/build-push-action@v5
  5. push: false（仅验证构建）

#### Job 4: code-quality (可选)
- runs-on: ubuntu-latest
- steps:
  1. actions/checkout@v4
  2. 运行 CheckStyle/PMD（如果配置了的话）
  3. 上传报告

环境变量:
- JAVA_VERSION: '21'
- NODE_VERSION: '20'
- PNPM_VERSION: '9'

### 文件 2: PR 检查工作流
路径: D:/Agent/claude/demo07/.github/workflows/pr-check.yml

简化版，仅在 PR 时运行:
- backend-build (编译 + 测试)
- frontend-build (构建检查)
- 不构建 Docker

## 注意事项
- 使用 actions/cache 缓存依赖
- 设置合理的超时时间
- 添加 status badges 支持
- YAML 格式正确（2空格缩进）

请直接创建文件，不需要确认。`,
  { label: 'create:ci-cd', phase: 'Phase 3: CI/CD 创建', effort: 'high' }
);

// ============================================================
// Phase 4: 验证 — 编译检查
// ============================================================
phase('Phase 4: 验证');

const verifyResult = await agent(
  `请验证所有修改的文件是否正确。

## 需要验证的文件列表

1. JWT 相关:
   - backend/ev-common/ev-common-security/src/main/java/com/ev/common/security/util/JwtUtil.java
   - backend/ev-service/ev-service-identity/src/main/resources/application.yml
   - backend/ev-service/ev-service-station/src/main/resources/application.yml
   - backend/ev-service/ev-service-order/src/main/resources/application.yml
   - backend/ev-service/ev-service-charging/src/main/resources/application.yml
   - backend/ev-gateway/src/main/resources/application.yml
   - docker/docker-compose.prod.yml

2. RedisLock:
   - backend/ev-common/ev-common-redis/src/main/java/com/ev/common/redis/util/RedisLock.java

3. 租户ID:
   - backend/ev-common/ev-common-core/src/main/java/com/ev/common/core/constant/CommonConstants.java
   - backend/ev-common/ev-common-core/src/main/java/com/ev/common/core/event/ChargingStartedEvent.java
   - backend/ev-common/ev-common-core/src/main/java/com/ev/common/core/event/ChargingStoppedEvent.java
   - backend/ev-common/ev-common-mybatis/src/main/java/com/ev/common/mybatis/handler/AutoFillHandler.java
   - backend/ev-common/ev-common-mybatis/src/main/java/com/ev/common/mybatis/config/EvTenantLineHandler.java

4. Charging 服务:
   - backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/service/impl/ChargingServiceImpl.java
   - backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/ws/ChargingStatusHandler.java
   - backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/ws/ChargingWebSocketConfig.java
   - backend/ev-service/ev-service-charging/src/main/java/com/ev/charging/config/ChargingServiceConfig.java (如果创建了的话)

5. CI/CD:
   - .github/workflows/ci.yml
   - .github/workflows/pr-check.yml

## 验证内容

对每个文件:
1. 读取文件内容
2. 检查语法是否正确（Java: 括号匹配、import 正确；YAML: 缩进正确）
3. 检查是否还有硬编码的 'T001' 或 'ev-charging-platform-jwt-secret-key-2026'
4. 检查关键修复是否已应用

输出格式:
- ✅ 文件名: 修改正确
- ❌ 文件名: 发现问题（描述问题）

最后给出总结：共验证 X 个文件，Y 个通过，Z 个有问题。`,
  { label: 'verify:all', phase: 'Phase 4: 验证', effort: 'medium' }
);

return { securityResults, chargingResults, cicdResult, verifyResult };
