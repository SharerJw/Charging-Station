# 大规模种子数据实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 清空数据库并使用 Flyway SQL 迁移脚本批量生成 190,000 条种子数据用于压测。

**Architecture:** 使用 PostgreSQL 的 generate_series() 函数批量插入数据，通过 CTE 组织省份分布等复杂逻辑，确保数据一致性和跨服务引用正确。

**Tech Stack:** PostgreSQL 16 + Flyway + SQL

## Global Constraints

- 金额单位：分（fen），1 元 = 100 分
- 电量单位：瓦时（Wh），1 kWh = 1000 Wh
- tenant_id 统一使用 'T001'
- 时间范围：近 90 天
- 省份分布按真实充电桩比例

---

## 阶段一：清空现有数据

### Task 1: 创建清空数据迁移脚本

**Files:**
- Create: `backend/ev-service/ev-service-order/src/main/resources/db/migration/V6__truncate_all_data.sql`
- Create: `backend/ev-service/ev-service-station/src/main/resources/db/migration/V4__truncate_all_data.sql`
- Create: `backend/ev-service/ev-service-identity/src/main/resources/db/migration/V4__truncate_all_data.sql`

- [ ] **Step 1: 创建 order 服务清空脚本**

```sql
-- backend/ev-service/ev-service-order/src/main/resources/db/migration/V6__truncate_all_data.sql
-- 清空订单服务所有数据（保留表结构）

TRUNCATE TABLE charging_order CASCADE;
TRUNCATE TABLE payment_record CASCADE;
TRUNCATE TABLE device_alert CASCADE;
TRUNCATE TABLE work_order CASCADE;
TRUNCATE TABLE inspection_task CASCADE;

-- 重置序列
ALTER SEQUENCE charging_order_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_record_id_seq RESTART WITH 1;
ALTER SEQUENCE device_alert_id_seq RESTART WITH 1;
ALTER SEQUENCE work_order_id_seq RESTART WITH 1;
ALTER SEQUENCE inspection_task_id_seq RESTART WITH 1;
```

- [ ] **Step 2: 创建 station 服务清空脚本**

```sql
-- backend/ev-service/ev-service-station/src/main/resources/db/migration/V4__truncate_all_data.sql
-- 清空站点服务所有数据（保留表结构）

TRUNCATE TABLE connector CASCADE;
TRUNCATE TABLE device CASCADE;
TRUNCATE TABLE station CASCADE;

-- 重置序列
ALTER SEQUENCE station_id_seq RESTART WITH 1;
ALTER SEQUENCE device_id_seq RESTART WITH 1;
ALTER SEQUENCE connector_id_seq RESTART WITH 1;
```

- [ ] **Step 3: 创建 identity 服务清空脚本**

```sql
-- backend/ev-service/ev-service-identity/src/main/resources/db/migration/V4__truncate_all_data.sql
-- 清空认证服务所有数据（保留表结构）

TRUNCATE TABLE sys_user_role CASCADE;
TRUNCATE TABLE sys_role_permission CASCADE;
TRUNCATE TABLE sys_user CASCADE;
TRUNCATE TABLE sys_role CASCADE;
TRUNCATE TABLE sys_permission CASCADE;

-- 重置序列
ALTER SEQUENCE sys_user_id_seq RESTART WITH 1;
ALTER SEQUENCE sys_role_id_seq RESTART WITH 1;
ALTER SEQUENCE sys_permission_id_seq RESTART WITH 1;
```

- [ ] **Step 4: 提交**

```bash
git add backend/ev-service/ev-service-order/src/main/resources/db/migration/V6__truncate_all_data.sql
git add backend/ev-service/ev-service-station/src/main/resources/db/migration/V4__truncate_all_data.sql
git add backend/ev-service/ev-service-identity/src/main/resources/db/migration/V4__truncate_all_data.sql
git commit -m "feat: add migration scripts to truncate all seed data"
```

---

## 阶段二：生成基础数据

### Task 2: 生成用户和角色数据

**Files:**
- Create: `backend/ev-service/ev-service-identity/src/main/resources/db/migration/V5__seed_large_users.sql`

- [ ] **Step 1: 创建用户种子数据脚本**

```sql
-- backend/ev-service/ev-service-identity/src/main/resources/db/migration/V5__seed_large_users.sql
-- 生成 5,000 个用户和 5 个角色

-- 1. 插入角色
INSERT INTO sys_role (code, name, tenant_id, created_at) VALUES
  ('admin', '系统管理员', 'T001', NOW()),
  ('operator', '运营人员', 'T001', NOW()),
  ('technician', '技术工程师', 'T001', NOW()),
  ('finance', '财务人员', 'T001', NOW()),
  ('viewer', '只读用户', 'T001', NOW());

-- 2. 插入权限
INSERT INTO sys_permission (code, name, type, parent_id, path, icon, sort_order) VALUES
  ('dashboard:view', '查看仪表盘', 'menu', 0, '/dashboard', 'Dashboard', 1),
  ('station:view', '查看站点', 'menu', 0, '/station', 'Station', 2),
  ('station:manage', '管理站点', 'button', 2, NULL, NULL, 1),
  ('device:view', '查看设备', 'menu', 0, '/device', 'Device', 3),
  ('device:manage', '管理设备', 'button', 4, NULL, NULL, 1),
  ('order:view', '查看订单', 'menu', 0, '/order', 'Order', 4),
  ('order:manage', '管理订单', 'button', 6, NULL, NULL, 1),
  ('user:view', '查看用户', 'menu', 0, '/user', 'User', 5),
  ('user:manage', '管理用户', 'button', 8, NULL, NULL, 1),
  ('finance:view', '查看财务', 'menu', 0, '/finance', 'Finance', 6),
  ('alert:view', '查看告警', 'menu', 0, '/alert', 'Alert', 7),
  ('alert:manage', '处理告警', 'button', 10, NULL, NULL, 1);

-- 3. 角色权限关联（admin 拥有所有权限）
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT 
  (SELECT id FROM sys_role WHERE code = 'admin'),
  id
FROM sys_permission;

-- 4. 生成 5,000 个用户
INSERT INTO sys_user (username, password, nickname, phone, status, tenant_id, created_at, updated_at)
SELECT
  'user_' || lpad(i::text, 4, '0'),
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', -- 密码: 123456
  CASE 
    WHEN i <= 100 THEN '测试用户' || i
    WHEN i <= 1000 THEN '用户' || i
    ELSE '普通用户' || i
  END,
  '138' || lpad(i::text, 8, '0'),
  CASE WHEN random() > 0.05 THEN 1 ELSE 0 END, -- 95% 启用
  'T001',
  NOW() - (random() * INTERVAL '90 days'),
  NOW()
FROM generate_series(1, 5000) AS i;

-- 5. 给前 100 个用户分配 admin 角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT 
  id,
  (SELECT id FROM sys_role WHERE code = 'admin')
FROM sys_user 
WHERE id <= 100;

-- 6. 给其他用户随机分配角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT 
  u.id,
  (SELECT id FROM sys_role WHERE code = 
    CASE (u.id % 4)
      WHEN 0 THEN 'operator'
      WHEN 1 THEN 'technician'
      WHEN 2 THEN 'finance'
      ELSE 'viewer'
    END
  )
FROM sys_user u
WHERE u.id > 100;
```

- [ ] **Step 2: 提交**

```bash
git add backend/ev-service/ev-service-identity/src/main/resources/db/migration/V5__seed_large_users.sql
git commit -m "feat: add large scale user seed data (5000 users)"
```

---

### Task 3: 生成站点和设备数据

**Files:**
- Create: `backend/ev-service/ev-service-station/src/main/resources/db/migration/V5__seed_large_stations.sql`

- [ ] **Step 1: 创建站点种子数据脚本**

```sql
-- backend/ev-service/ev-service-station/src/main/resources/db/migration/V5__seed_large_stations.sql
-- 生成 200 个站点、1,000 台设备、2,000 个连接器

-- 1. 生成 200 个站点（按省份分布）
WITH province_data AS (
  SELECT * FROM (VALUES
    ('广东', '广州', 12, 113.27, 23.13),
    ('广东', '深圳', 10, 114.07, 22.63),
    ('广东', '东莞', 8, 113.75, 23.02),
    ('江苏', '南京', 8, 118.78, 32.06),
    ('江苏', '苏州', 7, 120.59, 31.30),
    ('江苏', '无锡', 5, 120.30, 31.57),
    ('浙江', '杭州', 7, 120.15, 30.28),
    ('浙江', '宁波', 5, 121.55, 29.87),
    ('浙江', '温州', 4, 120.70, 28.00),
    ('山东', '济南', 6, 117.00, 36.67),
    ('山东', '青岛', 5, 120.38, 36.07),
    ('山东', '烟台', 3, 121.39, 37.52),
    ('上海', '上海', 12, 121.47, 31.23),
    ('北京', '北京', 12, 116.41, 39.90),
    ('四川', '成都', 7, 104.07, 30.67),
    ('四川', '绵阳', 3, 104.73, 31.47),
    ('湖北', '武汉', 5, 114.31, 30.52),
    ('湖北', '宜昌', 3, 111.29, 30.69),
    ('河南', '郑州', 5, 113.65, 34.76),
    ('河南', '洛阳', 3, 112.45, 34.62),
    ('福建', '福州', 4, 119.30, 26.08),
    ('福建', '厦门', 4, 118.09, 24.48),
    ('湖南', '长沙', 4, 112.97, 28.23),
    ('安徽', '合肥', 4, 117.28, 31.86),
    ('河北', '石家庄', 3, 114.51, 38.04),
    ('辽宁', '沈阳', 3, 123.43, 41.80),
    ('陕西', '西安', 3, 108.95, 34.27),
    ('重庆', '重庆', 3, 106.55, 29.56),
    ('天津', '天津', 3, 117.20, 39.13),
    ('江西', '南昌', 2, 115.89, 28.68),
    ('广西', '南宁', 2, 108.37, 22.82),
    ('云南', '昆明', 2, 102.83, 25.02),
    ('贵州', '贵阳', 2, 106.71, 26.65),
    ('山西', '太原', 2, 112.55, 37.87),
    ('吉林', '长春', 2, 125.32, 43.88),
    ('黑龙江', '哈尔滨', 2, 126.63, 45.75),
    ('甘肃', '兰州', 2, 103.83, 36.06),
    ('内蒙古', '呼和浩特', 2, 111.75, 40.84),
    ('新疆', '乌鲁木齐', 2, 87.62, 43.83),
    ('海南', '海口', 2, 110.35, 20.02)
  ) AS t(province, city, count, lng, lat)
),
station_data AS (
  SELECT 
    row_number() OVER () AS rn,
    province,
    city,
    lng,
    lat
  FROM province_data
  CROSS JOIN generate_series(1, (SELECT count FROM province_data pd WHERE pd.province = province_data.province AND pd.city = province_data.city))
)
INSERT INTO station (code, name, type, status, province, city, district, address, longitude, latitude, 
  contact_name, contact_phone, electricity_price, service_price, parking_price, 
  total_ports, available_ports, tenant_id, org_id, created_at, updated_at)
SELECT
  'ST-' || lpad(rn::text, 4, '0'),
  province || city || '充电站' || rn,
  CASE WHEN random() > 0.3 THEN 'PUBLIC' ELSE 'DESTINATION' END,
  CASE WHEN random() > 0.05 THEN 'ACTIVE' ELSE 'MAINTENANCE' END,
  province,
  city,
  city || '区',
  city || '某街道' || (rn % 100) || '号',
  lng + (random() - 0.5) * 0.1,
  lat + (random() - 0.5) * 0.1,
  '站长' || rn,
  '138' || lpad(rn::text, 8, '0'),
  (0.8 + random() * 1.0)::decimal(10,4),  -- 电价 0.8-1.8 元/kWh
  (0.3 + random() * 0.5)::decimal(10,4),  -- 服务费 0.3-0.8 元/kWh
  CASE WHEN random() > 0.5 THEN (random() * 10)::decimal(10,4) ELSE 0 END,
  (3 + random() * 12)::int,  -- 3-15 个端口
  (2 + random() * 10)::int,  -- 可用端口
  'T001',
  'ORG001',
  NOW() - (random() * INTERVAL '365 days'),
  NOW()
FROM station_data;

-- 2. 生成 1,000 台设备（每站 5 台）
INSERT INTO device (station_id, code, ocpp_id, name, type, model, vendor, rated_power, 
  firmware_version, status, lifecycle, tenant_id, created_at, updated_at)
SELECT
  s.id,
  'DEV-' || lpad(((s.id - 1) * 5 + i)::text, 4, '0'),
  'EVSE-' || s.code || '-' || i,
  s.name || '-充电桩' || i,
  CASE WHEN i <= 2 THEN 'DC' ELSE 'AC' END,
  CASE 
    WHEN i <= 2 THEN 'DC-' || (60 + random() * 180)::int || 'kW'
    ELSE 'AC-' || (7 + random() * 21)::int || 'kW'
  END,
  CASE (i % 5)
    WHEN 0 THEN '特来电'
    WHEN 1 THEN '国电南瑞'
    WHEN 2 THEN '华为'
    WHEN 3 THEN '星星充电'
    ELSE 'ABB'
  END,
  CASE WHEN i <= 2 THEN (60000 + random() * 180000)::int ELSE (7000 + random() * 21000)::int END,
  'v' || (1 + random() * 3)::int || '.' || (random() * 9)::int || '.' || (random() * 9)::int,
  CASE 
    WHEN random() > 0.1 THEN 'ONLINE'
    WHEN random() > 0.5 THEN 'CHARGING'
    ELSE 'OFFLINE'
  END,
  'ONLINE',
  'T001',
  s.created_at,
  NOW()
FROM station s
CROSS JOIN generate_series(1, 5) AS i;

-- 3. 生成 2,000 个连接器（每设备 2 个）
INSERT INTO connector (device_id, connector_id, type, status, max_power, 
  cumulative_energy, charge_count)
SELECT
  d.id,
  i,
  CASE WHEN d.type = 'DC' THEN 'GB_DC' ELSE 'GB_AC' END,
  CASE 
    WHEN d.status = 'CHARGING' AND i = 1 THEN 'CHARGING'
    WHEN d.status = 'OFFLINE' THEN 'UNAVAILABLE'
    WHEN random() > 0.1 THEN 'AVAILABLE'
    ELSE 'FAULTED'
  END,
  d.rated_power,
  (random() * 1000000)::bigint,  -- 累计电量
  (random() * 1000)::int          -- 充电次数
FROM device d
CROSS JOIN generate_series(1, 2) AS i;
```

- [ ] **Step 2: 提交**

```bash
git add backend/ev-service/ev-service-station/src/main/resources/db/migration/V5__seed_large_stations.sql
git commit -m "feat: add large scale station seed data (200 stations, 1000 devices)"
```

---

## 阶段三：生成业务数据

### Task 4: 生成订单和支付数据

**Files:**
- Create: `backend/ev-service/ev-service-order/src/main/resources/db/migration/V7__seed_large_orders.sql`

- [ ] **Step 1: 创建订单种子数据脚本**

```sql
-- backend/ev-service/ev-service-order/src/main/resources/db/migration/V7__seed_large_orders.sql
-- 生成 100,000 个订单和 80,000 条支付记录

-- 1. 生成 100,000 个订单
WITH order_data AS (
  SELECT 
    i,
    -- 随机选择设备（1-1000）
    (1 + random() * 999)::int AS device_id,
    -- 随机选择用户（1-5000）
    (1 + random() * 4999)::int AS user_id,
    -- 随机时间（近 90 天）
    NOW() - (random() * INTERVAL '90 days') AS order_time,
    -- 随机状态
    CASE 
      WHEN random() < 0.40 THEN 'PAID'
      WHEN random() < 0.70 THEN 'SETTLED'
      WHEN random() < 0.75 THEN 'CHARGING'
      WHEN random() < 0.85 THEN 'STOPPED'
      WHEN random() < 0.88 THEN 'CREATED'
      WHEN random() < 0.92 THEN 'REFUNDING'
      WHEN random() < 0.97 THEN 'ABNORMAL'
      ELSE 'CANCELLED'
    END AS status
  FROM generate_series(1, 100000) AS i
)
INSERT INTO charging_order (order_no, station_id, station_name, device_id, device_code, 
  connector_id, user_id, user_nickname, status, version,
  meter_start, meter_stop, energy_wh, peak_power, avg_power,
  start_soc, stop_soc, electricity_fee, service_fee, parking_fee,
  discount_amount, total_amount, pay_method, pay_time, start_time, stop_time,
  settle_time, tenant_id, created_at, updated_at)
SELECT
  'ORD-' || to_char(order_time, 'YYYYMMDD') || '-' || lpad(i::text, 6, '0'),
  d.station_id,
  s.name,
  od.device_id,
  d.code,
  1,
  od.user_id,
  u.nickname,
  od.status,
  1,
  (random() * 100000)::bigint,  -- meter_start
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL') 
    THEN (random() * 100000 + 50000)::bigint ELSE NULL END,  -- meter_stop
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (10000 + random() * 90000)::bigint ELSE 0 END,  -- energy_wh (10-100 kWh)
  CASE WHEN d.type = 'DC' THEN (60000 + random() * 180000)::int 
    ELSE (3000 + random() * 18000)::int END,  -- peak_power
  CASE WHEN d.type = 'DC' THEN (40000 + random() * 120000)::int 
    ELSE (2000 + random() * 12000)::int END,  -- avg_power
  (10 + random() * 40)::int,  -- start_soc
  CASE WHEN od.status IN ('PAID', 'SETTLED') 
    THEN (60 + random() * 35)::int ELSE NULL END,  -- stop_soc
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (1000 + random() * 20000)::bigint ELSE 0 END,  -- electricity_fee
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (500 + random() * 5000)::bigint ELSE 0 END,  -- service_fee
  CASE WHEN random() > 0.7 THEN (random() * 2000)::bigint ELSE 0 END,  -- parking_fee
  CASE WHEN random() > 0.8 THEN (random() * 1000)::bigint ELSE 0 END,  -- discount_amount
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (1500 + random() * 25000)::bigint ELSE 0 END,  -- total_amount
  CASE 
    WHEN od.status IN ('PAID', 'SETTLED') THEN 
      CASE (random() * 3)::int
        WHEN 0 THEN 'WECHAT'
        WHEN 1 THEN 'ALIPAY'
        ELSE 'BALANCE'
      END
    ELSE NULL
  END,
  CASE WHEN od.status IN ('PAID', 'SETTLED') 
    THEN od.order_time + INTERVAL '1 hour' ELSE NULL END,
  od.order_time,
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN od.order_time + INTERVAL '30 minutes' ELSE NULL END,
  CASE WHEN od.status = 'SETTLED' 
    THEN od.order_time + INTERVAL '2 hours' ELSE NULL END,
  'T001',
  od.order_time,
  od.order_time + INTERVAL '5 minutes'
FROM order_data od
JOIN device d ON d.id = od.device_id
JOIN station s ON s.id = d.station_id
JOIN sys_user u ON u.id = od.user_id;

-- 2. 生成支付记录（PAID 和 SETTLED 订单）
INSERT INTO payment_record (payment_no, order_id, user_id, channel, amount, status, 
  channel_trade_no, created_at)
SELECT
  'PAY-' || to_char(o.created_at, 'YYYYMMDD') || '-' || lpad(o.id::text, 6, '0'),
  o.id,
  o.user_id,
  o.pay_method,
  o.total_amount,
  CASE 
    WHEN o.status = 'SETTLED' THEN 'SUCCESS'
    WHEN o.status = 'PAID' THEN 'SUCCESS'
    WHEN o.status = 'REFUNDING' THEN 'REFUNDED'
    ELSE 'PENDING'
  END,
  'WX' || lpad(o.id::text, 10, '0'),
  o.pay_time
FROM charging_order o
WHERE o.status IN ('PAID', 'SETTLED', 'REFUNDING')
  AND o.pay_time IS NOT NULL;
```

- [ ] **Step 2: 提交**

```bash
git add backend/ev-service/ev-service-order/src/main/resources/db/migration/V7__seed_large_orders.sql
git commit -m "feat: add large scale order seed data (100000 orders)"
```

---

### Task 5: 生成告警和工单数据

**Files:**
- Create: `backend/ev-service/ev-service-order/src/main/resources/db/migration/V8__seed_large_alerts.sql`

- [ ] **Step 1: 创建告警种子数据脚本**

```sql
-- backend/ev-service/ev-service-order/src/main/resources/db/migration/V8__seed_large_alerts.sql
-- 生成 500 个告警、200 个工单、100 个巡检任务

-- 1. 生成 500 个告警
WITH alert_data AS (
  SELECT 
    i,
    -- 随机选择设备
    (1 + random() * 999)::int AS device_id,
    -- 随机时间
    NOW() - (random() * INTERVAL '90 days') AS alert_time,
    -- 随机等级
    CASE 
      WHEN random() < 0.05 THEN 'P0'
      WHEN random() < 0.20 THEN 'P1'
      WHEN random() < 0.60 THEN 'P2'
      ELSE 'P3'
    END AS level,
    -- 随机状态
    CASE 
      WHEN random() < 0.20 THEN 'pending'
      WHEN random() < 0.30 THEN 'processing'
      WHEN random() < 0.90 THEN 'resolved'
      ELSE 'ignored'
    END AS status
  FROM generate_series(1, 500) AS i
)
INSERT INTO device_alert (device_id, device_code, station_id, station_name, 
  level, title, description, status, handler, handle_result, handle_time,
  tenant_id, created_at)
SELECT
  ad.device_id,
  d.code,
  d.station_id,
  s.name,
  ad.level,
  CASE (random() * 5)::int
    WHEN 0 THEN '设备离线告警'
    WHEN 1 THEN '温度过高告警'
    WHEN 2 THEN '电压异常告警'
    WHEN 3 THEN '通信故障告警'
    WHEN 4 THEN '充电异常告警'
    ELSE '漏电保护告警'
  END,
  '设备 ' || d.code || ' 发生异常，请及时处理。',
  ad.status,
  CASE WHEN ad.status IN ('processing', 'resolved', 'ignored') 
    THEN '运维人员' || (random() * 10)::int ELSE NULL END,
  CASE WHEN ad.status = 'resolved' THEN '已处理完成' ELSE NULL END,
  CASE WHEN ad.status IN ('resolved', 'ignored') 
    THEN ad.alert_time + INTERVAL '2 hours' ELSE NULL END,
  'T001',
  ad.alert_time
FROM alert_data ad
JOIN device d ON d.id = ad.device_id
JOIN station s ON s.id = d.station_id;

-- 2. 生成 200 个工单
WITH workorder_data AS (
  SELECT 
    i,
    -- 随机选择设备
    (1 + random() * 999)::int AS device_id,
    -- 随机时间
    NOW() - (random() * INTERVAL '90 days') AS create_time,
    -- 随机类型
    CASE 
      WHEN random() < 0.50 THEN 'repair'
      WHEN random() < 0.90 THEN 'maintenance'
      ELSE 'inspection'
    END AS type,
    -- 随机状态
    CASE 
      WHEN random() < 0.20 THEN 'pending'
      WHEN random() < 0.35 THEN 'accepted'
      WHEN random() < 0.50 THEN 'processing'
      WHEN random() < 0.90 THEN 'completed'
      ELSE 'closed'
    END AS status
  FROM generate_series(1, 200) AS i
)
INSERT INTO work_order (order_no, type, title, description, station_id, station_name,
  device_id, device_code, priority, status, creator, assignee, result,
  tenant_id, created_at, accept_time, complete_time, updated_at)
SELECT
  'WO-' || to_char(create_time, 'YYYYMMDD') || '-' || lpad(i::text, 4, '0'),
  wd.type,
  CASE wd.type
    WHEN 'repair' THEN '设备维修-' || d.code
    WHEN 'maintenance' THEN '设备维护-' || d.code
    ELSE '设备巡检-' || d.code
  END,
  '设备 ' || d.code || ' 需要进行' || 
    CASE wd.type WHEN 'repair' THEN '维修' WHEN 'maintenance' THEN '维护' ELSE '巡检' END,
  d.station_id,
  s.name,
  wd.device_id,
  d.code,
  CASE WHEN random() > 0.7 THEN 'high' WHEN random() > 0.4 THEN 'medium' ELSE 'low' END,
  wd.status,
  '系统',
  CASE WHEN wd.status != 'pending' 
    THEN '运维人员' || (random() * 10)::int ELSE NULL END,
  CASE WHEN wd.status IN ('completed', 'closed') 
    THEN '已完成处理' ELSE NULL END,
  'T001',
  wd.create_time,
  CASE WHEN wd.status != 'pending' 
    THEN wd.create_time + INTERVAL '1 hour' ELSE NULL END,
  CASE WHEN wd.status IN ('completed', 'closed') 
    THEN wd.create_time + INTERVAL '4 hours' ELSE NULL END,
  wd.create_time + INTERVAL '30 minutes'
FROM workorder_data wd
JOIN device d ON d.id = wd.device_id
JOIN station s ON s.id = d.station_id;

-- 3. 生成 100 个巡检任务
INSERT INTO inspection_task (name, station_id, station_name, device_count, item_count,
  status, plan_time, start_time, complete_time, inspector,
  tenant_id, created_at, updated_at)
SELECT
  '巡检任务-' || s.name || '-' || i,
  s.id,
  s.name,
  5,
  10,
  CASE 
    WHEN random() < 0.30 THEN 'pending'
    WHEN random() < 0.50 THEN 'in_progress'
    ELSE 'completed'
  END,
  NOW() + (random() * INTERVAL '30 days'),
  CASE WHEN random() > 0.3 THEN NOW() - (random() * INTERVAL '7 days') ELSE NULL END,
  CASE WHEN random() > 0.5 THEN NOW() - (random() * INTERVAL '3 days') ELSE NULL END,
  '巡检员' || (random() * 5)::int,
  'T001',
  NOW() - (random() * INTERVAL '30 days'),
  NOW()
FROM station s
CROSS JOIN generate_series(1, 1) AS i
LIMIT 100;
```

- [ ] **Step 2: 提交**

```bash
git add backend/ev-service/ev-service-order/src/main/resources/db/migration/V8__seed_large_alerts.sql
git commit -m "feat: add large scale alert and workorder seed data"
```

---

## 阶段四：验证和文档

### Task 6: 创建验证脚本和文档

**Files:**
- Create: `backend/scripts/verify_seed_data.sql`
- Create: `docs/seed-data-guide.md`

- [ ] **Step 1: 创建验证脚本**

```sql
-- backend/scripts/verify_seed_data.sql
-- 验证种子数据完整性

-- 1. 数据量检查
SELECT 'station' AS table_name, COUNT(*) AS row_count, 200 AS expected FROM station
UNION ALL
SELECT 'device', COUNT(*), 1000 FROM device
UNION ALL
SELECT 'connector', COUNT(*), 2000 FROM connector
UNION ALL
SELECT 'sys_user', COUNT(*), 5000 FROM sys_user
UNION ALL
SELECT 'charging_order', COUNT(*), 100000 FROM charging_order
UNION ALL
SELECT 'payment_record', COUNT(*), 80000 FROM payment_record
UNION ALL
SELECT 'device_alert', COUNT(*), 500 FROM device_alert
UNION ALL
SELECT 'work_order', COUNT(*), 200 FROM work_order
UNION ALL
SELECT 'inspection_task', COUNT(*), 100 FROM inspection_task;

-- 2. 省份分布检查
SELECT province, COUNT(*) AS station_count
FROM station
GROUP BY province
ORDER BY station_count DESC
LIMIT 10;

-- 3. 订单状态分布检查
SELECT status, COUNT(*) AS order_count, 
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM charging_order
GROUP BY status
ORDER BY order_count DESC;

-- 4. 时间范围检查
SELECT 
  MIN(created_at) AS earliest_order,
  MAX(created_at) AS latest_order,
  MAX(created_at) - MIN(created_at) AS time_span
FROM charging_order;

-- 5. 跨服务引用完整性检查
SELECT 'orders without valid device' AS check_name, COUNT(*) AS issue_count
FROM charging_order o
LEFT JOIN device d ON d.id = o.device_id
WHERE d.id IS NULL
UNION ALL
SELECT 'alerts without valid device', COUNT(*)
FROM device_alert a
LEFT JOIN device d ON d.id = a.device_id
WHERE d.id IS NULL;
```

- [ ] **Step 2: 创建使用文档**

```markdown
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

## 注意事项

- 所有金额单位为分（fen）
- 所有电量单位为瓦时（Wh）
- 时间范围为近 90 天
- tenant_id 统一为 'T001'
```

- [ ] **Step 3: 提交**

```bash
git add backend/scripts/verify_seed_data.sql docs/seed-data-guide.md
git commit -m "docs: add seed data verification script and guide"
```

---

## 附录：数据量汇总

| 表 | 迁移文件 | 预期行数 |
|------|----------|----------|
| sys_user | V5__seed_large_users.sql | 5,000 |
| sys_role | V5__seed_large_users.sql | 5 |
| sys_permission | V5__seed_large_users.sql | 12 |
| station | V5__seed_large_stations.sql | 200 |
| device | V5__seed_large_stations.sql | 1,000 |
| connector | V5__seed_large_stations.sql | 2,000 |
| charging_order | V7__seed_large_orders.sql | 100,000 |
| payment_record | V7__seed_large_orders.sql | 80,000 |
| device_alert | V8__seed_large_alerts.sql | 500 |
| work_order | V8__seed_large_alerts.sql | 200 |
| inspection_task | V8__seed_large_alerts.sql | 100 |
| **总计** | | **~190,000** |
