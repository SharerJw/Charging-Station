# 大规模种子数据设计

**日期：** 2026-07-16
**状态：** 已批准
**方案：** Flyway SQL 批量生成（方案 A）

---

## 1. 目标

清空现有数据库，添加大规模种子数据用于压测和演示。

---

## 2. 数据规模

### 目标数据量

| 表 | 当前 | 目标 | 倍数 |
|------|------|------|------|
| sys_user | 3 | 5,000 | 1667x |
| sys_role | 3 | 5 | 1.7x |
| station | 5 | 200 | 40x |
| device | 12 | 1,000 | 83x |
| connector | 24 | 2,000 | 83x |
| charging_order | 20 | 100,000 | 5000x |
| payment_record | 5 | 80,000 | 16000x |
| device_alert | 10 | 500 | 50x |
| work_order | 5 | 200 | 40x |
| inspection_task | 5 | 100 | 20x |
| **总计** | **109** | **~190,000** | **1743x** |

---

## 3. 省份分布（基于真实充电桩分布）

| 省份 | 站点数 | 占比 | 城市 |
|------|--------|------|------|
| 广东 | 30 | 15% | 广州、深圳、东莞 |
| 江苏 | 20 | 10% | 南京、苏州、无锡 |
| 浙江 | 16 | 8% | 杭州、宁波、温州 |
| 山东 | 14 | 7% | 济南、青岛、烟台 |
| 上海 | 12 | 6% | 上海 |
| 北京 | 12 | 6% | 北京 |
| 四川 | 10 | 5% | 成都、绵阳 |
| 湖北 | 8 | 4% | 武汉、宜昌 |
| 河南 | 8 | 4% | 郑州、洛阳 |
| 福建 | 8 | 4% | 福州、厦门 |
| 其他 | 62 | 31% | 分散布局 |

---

## 4. 订单数据分布

### 状态分布

| 状态 | 数量 | 占比 |
|------|------|------|
| PAID | 40,000 | 40% |
| SETTLED | 30,000 | 30% |
| CHARGING | 5,000 | 5% |
| STOPPED | 10,000 | 10% |
| CREATED | 3,000 | 3% |
| REFUNDING | 4,000 | 4% |
| ABNORMAL | 5,000 | 5% |
| CANCELLED | 3,000 | 3% |

### 时间范围

- 范围：近 90 天
- 工作日订单量 > 周末（1.5 倍）
- 高峰时段：8:00-10:00, 17:00-20:00

### 金额分布

| 充电类型 | 单价范围 | 典型电量 | 典型金额 |
|----------|----------|----------|----------|
| 快充 (DC) | 1.2-1.8 元/kWh | 30-60 kWh | 36-108 元 |
| 慢充 (AC) | 0.8-1.2 元/kWh | 10-30 kWh | 8-36 元 |
| 超充 (DC) | 1.5-2.5 元/kWh | 50-100 kWh | 75-250 元 |

---

## 5. 告警数据

### 等级分布

| 等级 | 数量 | 占比 |
|------|------|------|
| P0 | 25 | 5% |
| P1 | 75 | 15% |
| P2 | 200 | 40% |
| P3 | 200 | 40% |

### 状态分布

| 状态 | 数量 | 占比 |
|------|------|------|
| pending | 100 | 20% |
| processing | 50 | 10% |
| resolved | 300 | 60% |
| ignored | 50 | 10% |

---

## 6. 工单数据

### 类型分布

| 类型 | 数量 |
|------|------|
| repair | 100 |
| maintenance | 80 |
| inspection | 20 |

### 状态分布

| 状态 | 数量 | 占比 |
|------|------|------|
| pending | 40 | 20% |
| accepted | 30 | 15% |
| processing | 30 | 15% |
| completed | 80 | 40% |
| closed | 20 | 10% |

---

## 7. 实现方案

### 使用 PostgreSQL generate_series()

```sql
-- 站点生成
WITH province_dist AS (
  SELECT * FROM (VALUES
    ('广东', '广州', 30), ('江苏', '南京', 20), ...
  ) AS t(province, city, count)
)
INSERT INTO station (code, name, province, city, ...)
SELECT 
  'ST-' || lpad(i::text, 4, '0'),
  pd.province || pd.city || '充电站' || i,
  pd.province,
  pd.city,
  ...
FROM province_dist pd
CROSS JOIN generate_series(1, pd.count) AS i;
```

### 执行顺序

1. TRUNCATE 现有数据
2. 生成 sys_user (5,000)
3. 生成 station (200)
4. 生成 device (1,000)
5. 生成 connector (2,000)
6. 生成 charging_order (100,000)
7. 生成 payment_record (80,000)
8. 生成 device_alert (500)
9. 生成 work_order (200)
10. 生成 inspection_task (100)

---

## 8. 验证检查

```sql
SELECT 'station' AS tbl, COUNT(*) FROM station
UNION ALL SELECT 'device', COUNT(*) FROM device
UNION ALL SELECT 'charging_order', COUNT(*) FROM charging_order;
```

预期结果：
- station: 200
- device: 1,000
- charging_order: 100,000

---

## 9. 性能预期

| 操作 | 预期时间 |
|------|----------|
| 清空数据 | < 1 秒 |
| 生成站点 | < 1 秒 |
| 生成设备 | < 2 秒 |
| 生成订单 | < 10 秒 |
| **总计** | **< 30 秒** |
