# EV充电平台 - 前端项目

本目录包含EV充电平台的四个前端应用程序。

## 项目结构

```
apps/
├── admin-web/          # 后台管理系统 Web
├── simulator-web/      # 产品模拟器 Web
├── user-miniapp/       # 用户端小程序
└── ops_flutter/        # 产品运维 App (Flutter)
```

## 技术栈

### Web 项目 (admin-web, simulator-web)
- Vue 3 + TypeScript
- Vite
- Element Plus
- TailwindCSS
- Pinia
- Vue Router
- ECharts

### 小程序项目 (user-miniapp)
- UniApp + Vue 3
- Pinia

### 运维 App (ops_flutter)
- Flutter + Dart
- Provider
- GoRouter

## 快速开始

### 后台管理系统 Web
```bash
cd admin-web
pnpm install
pnpm dev
# 访问 http://localhost:3000
```

### 产品模拟器 Web
```bash
cd simulator-web
pnpm install
pnpm dev
# 访问 http://localhost:3001
```

### 用户端小程序
```bash
cd user-miniapp
pnpm install
pnpm dev:mp-weixin
# 使用微信开发者工具打开 dist/dev/mp-weixin 目录
```

### 产品运维 App (Flutter)
```bash
cd ops_flutter
flutter pub get
flutter run -d chrome --web-port 5175
# 或构建 APK
flutter build apk --release
```

## 项目说明

### 后台管理系统 Web
- 充电站管理
- 设备管理
- 订单管理
- 用户管理
- 财务管理
- 营销管理
- 系统管理

### 产品模拟器 Web
- 设备模拟
- 充电流程模拟
- OCPP消息模拟
- 场景编排
- 实时日志

### 用户端小程序
- 扫码充电
- 充电站地图
- 充电状态监控
- 订单管理
- 个人中心

### 产品运维 App
- 工作台
- 告警管理
- 工单管理
- 巡检任务
- 设备管理

## 开发规范

1. 所有金额使用 `BigDecimal` 或 `Long`（分）
2. 所有时间使用 `java.time`
3. 所有写API必须幂等
4. 敏感操作需要审计日志
5. 大列表使用虚拟滚动
6. 限流使用令牌桶算法
