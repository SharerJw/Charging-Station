-- V8__seed_large_alerts.sql
-- 生成 500 个告警、200 个工单、100 个巡检任务

-- 1. 生成 500 个告警
WITH alert_data AS (
  SELECT
    i,
    (1 + random() * 999)::int AS device_id,
    NOW() - (random() * INTERVAL '90 days') AS alert_time,
    CASE
      WHEN random() < 0.05 THEN 'P0'
      WHEN random() < 0.20 THEN 'P1'
      WHEN random() < 0.60 THEN 'P2'
      ELSE 'P3'
    END AS level,
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
    (1 + random() * 999)::int AS device_id,
    NOW() - (random() * INTERVAL '90 days') AS create_time,
    CASE
      WHEN random() < 0.50 THEN 'repair'
      WHEN random() < 0.90 THEN 'maintenance'
      ELSE 'inspection'
    END AS type,
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
