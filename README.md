# ⚡ EV充电平台 (EV Charging Platform)

全栈电动汽车充电站管理平台，覆盖后台管理、用户端小程序、运维App、模拟器四端应用。

## 🏗 技术栈

### 后端
- **Java 21** + **Spring Boot 3.3** + **Spring Cloud Alibaba 2023**
- **PostgreSQL 16** + **Redis 7** + **Kafka** (ZooKeeper模式)
- **Nacos 2.3** 服务注册/发现
- **MyBatis-Plus** + **Flyway** 数据库迁移
- **Sa-Token** JWT认证

### 前端
- **Vue 3** + **TypeScript** + **Element Plus** + **Pinia**
- **UniApp** (用户小程序 + 运维App)
- **ECharts 5** 图表 | **高德地图** 定位

## 📁 项目结构

```
├── apps/                          # 前端应用
│   ├── admin-web/                 # 后台管理系统 (Vue 3 + Element Plus)
│   ├── user-miniapp/              # 用户端小程序 (UniApp + Vue 3)
│   ├── ops-app/                   # 运维App (UniApp + Vue 3)
│   └── simulator-web/             # 充电桩模拟器 (Vue 3 + ECharts)
├── backend/                       # 后端微服务
│   ├── ev-common/                 # 公共模块
│   │   ├── ev-common-core/        #   核心工具 (R<T>, 异常处理)
│   │   ├── ev-common-mybatis/     #   数据库 (多租户, 自动填充)
│   │   ├── ev-common-redis/       #   缓存 (Redisson)
│   │   └── ev-common-security/    #   安全 (JWT, 鉴权拦截器)
│   ├── ev-gateway/                # API网关 (Spring Cloud Gateway)
│   └── ev-service/                # 业务服务
│       ├── ev-service-identity/   #   认证服务 (8081)
│       ├── ev-service-station/    #   站点服务 (8082)
│       ├── ev-service-order/      #   订单服务 (8083)
│       ├── ev-service-charging/   #   充电服务 (8084)
│       └── ev-service-simulator/  #   模拟器服务 (8085)
└── docker/                        # Docker基础设施
    ├── docker-compose.yml
    └── init/                      # 数据库初始化脚本
```

## 🚀 快速启动

### 前置要求
- **Docker Desktop** (基础设施)
- **JDK 21** (后端编译)
- **Node.js 18+** (前端运行)

### 一键启动（推荐）

```bash
# 克隆仓库
git clone https://github.com/SharerJw/Charging-Station.git
cd Charging-Station

# Linux/Mac
chmod +x start.sh && ./start.sh

# Windows
start.bat
```

脚本会自动：启动Docker容器 → 构建后端 → 启动6个服务 → 安装前端依赖 → 启动4个前端App

### 手动启动

#### 步骤1: 启动基础设施
```bash
cd docker && docker compose up -d
```

#### 步骤2: 构建并启动后端
```bash
cd backend
./gradlew build -x test          # 构建
./gradlew :ev-gateway:bootRun    # 分别在6个终端启动
./gradlew :ev-service:ev-service-identity:bootRun
./gradlew :ev-service:ev-service-station:bootRun
./gradlew :ev-service:ev-service-order:bootRun
./gradlew :ev-service:ev-service-charging:bootRun
./gradlew :ev-service:ev-service-simulator:bootRun
```

#### 步骤3: 启动前端
```bash
cd apps/admin-web && npm install && npm run dev          # :5173
cd apps/ops-app && npm install && npm run dev:h5         # :5175
cd apps/user-miniapp && npm install && npm run dev:h5    # :5176
cd apps/simulator-web && npm install && npm run dev      # :5177
```

### 切换Mock/真实数据
```bash
# .env.development 中设置
VITE_USE_MOCK=false   # 使用真实后端 (默认)
VITE_USE_MOCK=true    # 使用Mock数据 (无需后端)
```

## 🔑 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 运维员 | ops1 | ops123 |

## 📡 API端点

所有API通过Gateway (`:8080`) 路由：

| 服务 | 路径前缀 | 端点数 |
|------|----------|--------|
| 认证 | `/api/auth/*`, `/api/v1/ops/auth/*` | 9 |
| 站点 | `/api/stations/*`, `/api/v1/stations/*` | 8 |
| 订单 | `/api/v1/orders/*`, `/api/dashboard/*`, `/api/finance/*` | 12 |
| 充电 | `/api/v1/charging/*` | 3 |
| 模拟器 | `/api/simulator/*` | 12 |

## 🏛 核心业务

- **OCPP协议**: 支持OCPP 1.6J，充电桩通过WebSocket通信
- **充电流程**: 启动→充电→停止→结算→支付，完整状态机
- **Kafka事件驱动**: 充电停止事件自动触发订单结算
- **多租户**: 基于tenant_id的数据隔离
- **告警系统**: P0-P3四级告警，支持处理/忽略

## 📄 许可证

MIT License
