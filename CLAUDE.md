# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **prompt-driven EV (Electric Vehicle) Charging Platform** — a comprehensive set of detailed AI code-generation prompts (in Chinese) covering the full stack of a multi-tenant EV charging station management platform. The repository contains **no source code**; it is a structured collection of deep-dived prompt specifications organized by system layer.

The platform covers four client applications (四端) and their backend services, built around the OCPP (Open Charge Point Protocol) standard for EV charger communication.

## Repository Structure

```
前端/                          # Frontend prompt specifications
  产品模拟器Web.md              # EVSE Simulator Web (Vue 3 + Element Plus)
  四端页面.md                   # Cross-platform overview of all 4 client UIs
  产品运维App.md                # Operations mobile app (UniApp + Vue 3)
  后台管理系统Web.md             # Admin dashboard Web (Vue 3 + Element Plus)
  用户端小程序.md               # End-user WeChat Mini Program (UniApp + Vue 3)

后端/                          # Backend prompt specifications
  后端服务.md                   # Core backend architecture (Java 21 + Spring Boot 3.3)
  产品模拟器.md                 # Simulator backend (Netty WebSocket + BMS simulation)
  产品运维.md                   # Operations backend (alerts, work orders, inspections)
  后台管理.md                   # Admin backend (RBAC, stations, finance, marketing)
  用户端.md                     # User-facing backend (auth, charging flow, payments)
```

## Technology Stack (Referenced Across All Prompts)

**Frontend:**
- Vue 3 (Composition API) + TypeScript + Element Plus + Pinia + TailwindCSS
- WeChat Mini Program: UniApp + Vue 3 + Pinia
- Charts: ECharts 5 | Map: Tencent/Amap SDK | Terminal: xterm.js | Code Editor: Monaco Editor
- Flow editor: Vue Flow / LogicFlow (scenario orchestration)

**Backend:**
- Java 21 (Virtual Threads) + Spring Boot 3.3 + Spring Cloud Alibaba 2023
- API Gateway: Apache APISIX / Spring Cloud Gateway
- Service registry/config: Nacos 2.3
- Rate limiting: Sentinel 1.8
- Database: PostgreSQL (PostGIS) + MySQL 8.0 (ShardingSphere sharding)
- Cache: Caffeine (L1) + Redis Cluster (L2)
- Message queue: Kafka / RocketMQ (transactional messages)
- Time-series: TDengine / InfluxDB
- Search: Elasticsearch
- OLAP: ClickHouse
- Object storage: MinIO / OSS
- Workflow: Flowable (BPMN)
- CEP: Flink CEP / Drools
- Observability: OpenTelemetry + Prometheus + Grafana + Loki + Tempo

**Protocol:** OCPP 1.6J / OCPP 2.0.1 (JSON over WebSocket)

## Key Domain Concepts

- **OCPP Message Types**: Type 2 (Call), Type 3 (CallResult), Type 4 (CallError)
- **Core Actions**: BootNotification, Heartbeat, StatusNotification, StartTransaction, StopTransaction, MeterValues, RemoteStartTransaction, RemoteStopTransaction, Reset, UnlockConnector, ChangeConfiguration
- **Order State Machine**: CREATED → CHARGING → STOPPING → STOPPED → SETTLING → SETTLED → PAYING → PAID (+ REFUNDING/ABNORMAL/CANCELLED)
- **Multi-tenancy**: Tenant isolation via shared DB + tenant_id field, with scoped data permissions (ALL/ORG_AND_CHILDREN/ORG_ONLY/SELF_ONLY)
- **Alert Levels**: P0 (critical, phone+SMS), P1 (severe, SMS+push), P2 (warning, push+IM), P3 (info, push only)
- **Device Lifecycle**: PURCHASED → IN_WAREHOUSE → INSTALLING → ONLINE ↔ MAINTENANCE → RETIRED → SCRAPPED

## Prompt Files — How to Use

Each `.md` file contains 6–10 numbered prompt blocks designed to be fed directly into AI coding tools (Cursor, v0, Bolt.new, etc.). Each prompt is self-contained with:

1. UI/UX specifications (exact layout, colors, interactions)
2. Business logic details (state machines, algorithms, formulas)
3. API contracts (request/response JSON examples)
4. Technical constraints (performance targets, data models)

**The prompts at the bottom of each file** (`💡 给 AI 编码工具的附加系统级指令`) contain critical coding constraints specific to that system layer — always include them when generating code.

## Design Specifications

**Color System:**
- Admin/Ops: Brand blue `#1677FF`, background `#F0F2F5`
- User Mini Program: Charging green `#07C160`, background `#F6F7FB`
- Simulator: Dark tech theme, background `#0B1120`, card `#111827`, accent blue `#3B82F6`
- Status colors: Success `#52C41A`, Warning `#FAAD14`, Error `#FF4D4F`

**Typography:** PingFang SC / Microsoft YaHei (Web), system default (App), DIN Alternate (numbers)
**Spacing:** 8px grid (Web), 12px (App/Mini Program), minimum touch target 44×44pt

## Common Development Patterns

- All money uses `BigDecimal` or `Long` (cents) — never `double`/`float`
- All timestamps use `java.time` — never `Date`/`Calendar`
- All write APIs must be idempotent (idempotency key + Redis SETNX)
- All sensitive operations require audit logging (append-only)
- Virtual scrolling required for tables/lists > 100 items
- Rate limiting: token bucket via Redis Lua scripts
- Cache strategy: Cache-Aside + delayed double-delete for consistency
