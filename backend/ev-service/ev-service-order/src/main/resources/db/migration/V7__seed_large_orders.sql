-- V7__seed_large_orders.sql
-- 生成 100,000 个订单和 80,000 条支付记录

-- 1. 生成 100,000 个订单
WITH order_data AS (
  SELECT
    i,
    (1 + random() * 999)::int AS device_id,
    (1 + random() * 4999)::int AS user_id,
    NOW() - (random() * INTERVAL '90 days') AS order_time,
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
  (random() * 100000)::bigint,
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (random() * 100000 + 50000)::bigint ELSE NULL END,
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (10000 + random() * 90000)::bigint ELSE 0 END,
  CASE WHEN d.type = 'DC' THEN (60000 + random() * 180000)::int
    ELSE (3000 + random() * 18000)::int END,
  CASE WHEN d.type = 'DC' THEN (40000 + random() * 120000)::int
    ELSE (2000 + random() * 12000)::int END,
  (10 + random() * 40)::int,
  CASE WHEN od.status IN ('PAID', 'SETTLED')
    THEN (60 + random() * 35)::int ELSE NULL END,
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (1000 + random() * 20000)::bigint ELSE 0 END,
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (500 + random() * 5000)::bigint ELSE 0 END,
  CASE WHEN random() > 0.7 THEN (random() * 2000)::bigint ELSE 0 END,
  CASE WHEN random() > 0.8 THEN (random() * 1000)::bigint ELSE 0 END,
  CASE WHEN od.status IN ('PAID', 'SETTLED', 'STOPPED', 'REFUNDING', 'ABNORMAL')
    THEN (1500 + random() * 25000)::bigint ELSE 0 END,
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
