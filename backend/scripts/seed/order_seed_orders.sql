-- order_seed_orders.sql
-- 生成 100,000 个订单和支付记录（不依赖其他数据库的表）

-- 1. 批量生成订单
DO $$
DECLARE
  batch_size INT := 10000;
  total_batches INT := 10;
  batch_num INT;
BEGIN
  FOR batch_num IN 0..(total_batches - 1) LOOP
    INSERT INTO charging_order (
      order_no, station_id, station_name, device_id, device_code,
      connector_id, user_id, user_nickname, status, version,
      meter_start, meter_stop, energy_wh, peak_power, avg_power,
      start_soc, stop_soc, electricity_fee, service_fee, parking_fee,
      discount_amount, total_amount, pay_method, pay_time,
      start_time, stop_time, settle_time, tenant_id, created_at, updated_at
    )
    SELECT
      'ORD-' || to_char(o.order_time, 'YYYYMMDD') || '-' || lpad(o.idx::text, 6, '0'),
      1 + (o.idx % 183),  -- station_id (1-183)
      '充电站' || (1 + (o.idx % 183)),
      1 + (o.idx % 915),  -- device_id (1-915)
      'DEV-' || lpad((1 + (o.idx % 915))::text, 4, '0'),
      1,
      1 + (o.idx % 4999),  -- user_id (1-4999)
      '用户' || (1 + (o.idx % 4999)),
      o.status,
      1,
      (random() * 100000)::bigint,
      CASE WHEN o.status NOT IN ('CREATED', 'CHARGING')
        THEN (random() * 100000 + 50000)::bigint ELSE NULL END,
      CASE WHEN o.status NOT IN ('CREATED', 'CHARGING')
        THEN (10000 + random() * 90000)::bigint ELSE 0 END,
      CASE WHEN o.idx % 3 = 0 THEN (60000 + random() * 180000)::int
        ELSE (3000 + random() * 18000)::int END,
      CASE WHEN o.idx % 3 = 0 THEN (40000 + random() * 120000)::int
        ELSE (2000 + random() * 12000)::int END,
      (10 + random() * 40)::int,
      CASE WHEN o.status IN ('PAID', 'SETTLED')
        THEN (60 + random() * 35)::int ELSE NULL END,
      CASE WHEN o.status NOT IN ('CREATED', 'CHARGING')
        THEN (1000 + random() * 20000)::bigint ELSE 0 END,
      CASE WHEN o.status NOT IN ('CREATED', 'CHARGING')
        THEN (500 + random() * 5000)::bigint ELSE 0 END,
      CASE WHEN random() > 0.7 THEN (random() * 2000)::bigint ELSE 0 END,
      CASE WHEN random() > 0.8 THEN (random() * 1000)::bigint ELSE 0 END,
      CASE WHEN o.status NOT IN ('CREATED', 'CHARGING')
        THEN (1500 + random() * 25000)::bigint ELSE 0 END,
      CASE WHEN o.status IN ('PAID', 'SETTLED') THEN
        CASE (random() * 3)::int
          WHEN 0 THEN 'WECHAT' WHEN 1 THEN 'ALIPAY' ELSE 'BALANCE'
        END ELSE NULL END,
      CASE WHEN o.status IN ('PAID', 'SETTLED')
        THEN o.order_time + INTERVAL '1 hour' ELSE NULL END,
      o.order_time,
      CASE WHEN o.status NOT IN ('CREATED', 'CHARGING')
        THEN o.order_time + INTERVAL '30 minutes' ELSE NULL END,
      CASE WHEN o.status = 'SETTLED'
        THEN o.order_time + INTERVAL '2 hours' ELSE NULL END,
      'T001',
      o.order_time,
      o.order_time + INTERVAL '5 minutes'
    FROM (
      SELECT
        (batch_num * batch_size + i) AS idx,
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
      FROM generate_series(1, batch_size) AS i
    ) o;

    RAISE NOTICE 'Batch % complete: % orders inserted', batch_num + 1, (batch_num + 1) * batch_size;
  END LOOP;
END $$;

-- 2. 生成支付记录
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
