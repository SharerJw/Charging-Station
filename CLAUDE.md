## 项目概述

这是一个**基于提示词驱动的电动汽车充电平台**——一套完整、详尽的 AI 代码生成提示词（中文），涵盖多租户电动汽车充电站管理平台的全栈开发。本仓库**不包含任何源代码**，而是按系统层次组织的深度提示词规范集合。

平台涵盖“四端”（四种客户端）及其后端服务，基于 OCPP（开放充电点协议）协议实现充电桩通信。

## 仓库结构

```
前端/                          # 前端提示词规范
  产品模拟器Web.md              # 充电桩模拟器 Web（Vue 3 + Element Plus）
  四端页面.md                   # 四端界面概览
  产品运维App.md                # 运维移动端（UniApp + Vue 3）
  后台管理系统Web.md             # 管理后台 Web（Vue 3 + Element Plus）
  用户端小程序.md               # 用户微信小程序（UniApp + Vue 3）

后端/                          # 后端提示词规范
  后端服务.md                   # 核心后端架构（Java 21 + Spring Boot 3.3）
  产品模拟器.md                 # 模拟器后端（Netty WebSocket + BMS 仿真）
  产品运维.md                   # 运维后端（告警、工单、巡检）
  后台管理.md                   # 管理后端（RBAC、站点、财务、营销）
  用户端.md                     # 用户后端（认证、充电流程、支付）
```

## 技术栈（所有提示词统一参考）

**前端：**
- Vue 3（组合式 API）+ TypeScript + Element Plus + Pinia + TailwindCSS
- 微信小程序：UniApp + Vue 3 + Pinia
- 图表：ECharts 5｜地图：腾讯/高德 SDK｜终端：xterm.js｜代码编辑器：Monaco Editor
- 流程编辑器：Vue Flow / LogicFlow（场景编排）

**后端：**
- Java 21（虚拟线程）+ Spring Boot 3.3 + Spring Cloud Alibaba 2023
- API 网关：Apache APISIX / Spring Cloud Gateway
- 服务注册/配置中心：Nacos 2.3
- 限流降级：Sentinel 1.8
- 数据库：PostgreSQL（PostGIS）+ MySQL 8.0（ShardingSphere 分库分表）
- 缓存：Caffeine（一级）+ Redis 集群（二级）
- 消息队列：Kafka / RocketMQ（事务消息）
- 时序数据库：TDengine / InfluxDB
- 搜索引擎：Elasticsearch
- OLAP 引擎：ClickHouse
- 对象存储：MinIO / OSS
- 工作流引擎：Flowable（BPMN）
- 复杂事件处理：Flink CEP / Drools
- 可观测性：OpenTelemetry + Prometheus + Grafana + Loki + Tempo

**通信协议：** OCPP 1.6J / OCPP 2.0.1（基于 WebSocket 的 JSON 报文）

## 关键领域概念

- **OCPP 消息类型**：Type 2（Call）、Type 3（CallResult）、Type 4（CallError）
- **核心动作**：BootNotification、Heartbeat、StatusNotification、StartTransaction、StopTransaction、MeterValues、RemoteStartTransaction、RemoteStopTransaction、Reset、UnlockConnector、ChangeConfiguration
- **订单状态机**：CREATED → CHARGING → STOPPING → STOPPED → SETTLING → SETTLED → PAYING → PAID（另有 REFUNDING / ABNORMAL / CANCELLED 等异常状态）
- **多租户隔离**：共享数据库 + tenant_id 字段实现租户隔离，数据权限支持 ALL / ORG_AND_CHILDREN / ORG_ONLY / SELF_ONLY 四级范围
- **告警级别**：P0（严重，电话+短信）、P1（高危，短信+推送）、P2（警告，推送+IM）、P3（提示，仅推送）
- **设备生命周期**：已采购 → 入库 → 安装中 → 在线 ↔ 维护中 → 退役 → 报废

## 提示词文件——使用方法

每个 `.md` 文件包含 6～10 个编号提示块，可直接输入 AI 编码工具（如 Cursor、v0、Bolt.new 等）。每个提示块均为独立完整规格，包含：

1. UI/UX 规格（精确布局、颜色、交互）
2. 业务逻辑细节（状态机、算法、计算公式）
3. API 契约（请求/响应 JSON 示例）
4. 技术约束（性能指标、数据模型）

**每个文件底部的** `💡 给 AI 编码工具的附加系统级指令` 包含该层特有的关键编码约束——生成代码时务必一并包含这些指令。

## 设计规范

**色系：**
- 管理后台/运维：品牌蓝 `#1677FF`，背景 `#F0F2F5`
- 用户小程序：充电绿 `#07C160`，背景 `#F6F7FB`
- 模拟器：深色科技风，背景 `#0B1120`，卡片 `#111827`，强调蓝 `#3B82F6`
- 状态色：成功 `#52C41A`，警告 `#FAAD14`，错误 `#FF4D4F`

**字体：** PingFang SC / Microsoft YaHei（Web）、系统默认（移动端）、DIN Alternate（数字）
**间距：** 8px 栅格（Web）、12px（App/小程序），最小触控区域 44×44pt

## 通用开发规范

- 所有金额使用 `BigDecimal` 或 `Long`（以分为单位）——**严禁**使用 `double`/`float`
- 所有时间戳使用 `java.time` 包——**严禁**使用 `Date`/`Calendar`
- 所有写入 API 必须幂等（幂等键 + Redis SETNX）
- 所有敏感操作需记录审计日志（仅追加，不可修改）
- 表格/列表超过 100 条时必须使用虚拟滚动
- 限流策略：基于 Redis Lua 脚本的令牌桶算法
- 缓存策略：Cache-Aside + 延迟双删保证一致性

## 版本控制规范

- **任何代码或文档更新完成后，必须立即提交 Git**，提交信息应遵循“类型(范围): 简短描述”格式（如 `feat(用户端): 增加充电订单取消功能`）
- 提交前需确保本地所有测试通过，并完成必要的自测
- 主干分支（main/master）仅允许通过 Pull Request 合并，且需要至少一名 reviewer 批准
- 提交频率建议：每完成一个功能点或修复一个缺陷即提交，避免大量改动堆积