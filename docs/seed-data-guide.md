# 种子数据使用指南

## 快速开始

### 1. 清空并重新生成数据

```bash
# 重启服务会自动执行 Flyway 迁移
cd backend
./gradlew :ev-service:ev-service-identity:bootRun
./gradlew :ev-service:ev-service-station:bootRun
./gradlew :ev-service:ev-service-order:bootRun
```

### 2. 验证数据

```bash
psql -h localhost -U postgres -d ev_order -f backend/scripts/verify_seed_data.sql
```

## 数据规模

| 表 | 行数 |
|------|------|
| sys_user | 5,000 |
| station | 200 |
| device | 1,000 |
| charging_order | 100,000 |
| **总计** | **~190,000** |

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| user_0001 | 123456 | 系统管理员 |
| user_0002 | 123456 | 系统管理员 |
| admin | 123456 | 系统管理员 |

## 省份分布

- 广东: 30 个站点 (15%)
- 江苏: 20 个站点 (10%)
- 浙江: 16 个站点 (8%)
- 山东: 14 个站点 (7%)
- 上海: 12 个站点 (6%)
- 北京: 12 个站点 (6%)

## 订单状态分布

- PAID: 40% (已支付)
- SETTLED: 30% (已结算)
- STOPPED: 10% (已停止)
- CHARGING: 5% (充电中)
- ABNORMAL: 5% (异常)
- REFUNDING: 4% (退款中)
- CREATED: 3% (已创建)
- CANCELLED: 3% (已取消)

## 注意事项

- 所有金额单位为分（fen）
- 所有电量单位为瓦时（Wh）
- 时间范围为近 90 天
- tenant_id 统一为 'T001'
