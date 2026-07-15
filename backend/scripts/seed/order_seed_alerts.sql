-- order_seed_alerts.sql
-- 生成 500 个告警、200 个工单、100 个巡检任务（不依赖其他数据库）

-- 1. 生成 500 个告警
INSERT INTO device_alert (device_id, device_code, station_id, station_name,
  level, title, description, status, handler, handle_result, handle_time,
  tenant_id, created_at)
SELECT
  1 + (i % 915),  -- device_id
  'DEV-' || lpad((1 + (i % 915))::text, 4, '0'),
  1 + (i % 183),  -- station_id
  '充电站' || (1 + (i % 183)),
  CASE
    WHEN random() < 0.05 THEN 'P0'
    WHEN random() < 0.20 THEN 'P1'
    WHEN random() < 0.60 THEN 'P2'
    ELSE 'P3'
  END,
  CASE (random() * 5)::int
    WHEN 0 THEN '设备离线告警'
    WHEN 1 THEN '温度过高告警'
    WHEN 2 THEN '电压异常告警'
    WHEN 3 THEN '通信故障告警'
    WHEN 4 THEN '充电异常告警'
    ELSE '漏电保护告警'
  END,
  '设备 DEV-' || lpad((1 + (i % 915))::text, 4, '0') || ' 发生异常，请及时处理。',
  CASE
    WHEN random() < 0.20 THEN 'pending'
    WHEN random() < 0.30 THEN 'processing'
    WHEN random() < 0.90 THEN 'resolved'
    ELSE 'ignored'
  END,
  CASE WHEN random() > 0.3 THEN '运维人员' || (random() * 10)::int ELSE NULL END,
  CASE WHEN random() > 0.7 THEN '已处理完成' ELSE NULL END,
  CASE WHEN random() > 0.7 THEN NOW() - (random() * INTERVAL '90 days') + INTERVAL '2 hours' ELSE NULL END,
  'T001',
  NOW() - (random() * INTERVAL '90 days')
FROM generate_series(1, 500) AS i;

-- 2. 生成 200 个工单
INSERT INTO work_order (order_no, type, title, description, station_id, station_name,
  device_id, device_code, priority, status, creator, assignee, result,
  tenant_id, created_at, accept_time, complete_time, updated_at)
SELECT
  'WO-' || to_char(create_time, 'YYYYMMDD') || '-' || lpad(i::text, 4, '0'),
  CASE
    WHEN random() < 0.50 THEN 'repair'
    WHEN random() < 0.90 THEN 'maintenance'
    ELSE 'inspection'
  END,
  '设备维修-DEV-' || lpad((1 + (i % 915))::text, 4, '0'),
  '设备 DEV-' || lpad((1 + (i % 915))::text, 4, '0') || ' 需要进行维修',
  1 + (i % 183),
  '充电站' || (1 + (i % 183)),
  1 + (i % 915),
  'DEV-' || lpad((1 + (i % 915))::text, 4, '0'),
  CASE WHEN random() > 0.7 THEN 'high' WHEN random() > 0.4 THEN 'medium' ELSE 'low' END,
  CASE
    WHEN random() < 0.20 THEN 'pending'
    WHEN random() < 0.35 THEN 'accepted'
    WHEN random() < 0.50 THEN 'processing'
    WHEN random() < 0.90 THEN 'completed'
    ELSE 'closed'
  END,
  '系统',
  CASE WHEN random() > 0.2 THEN '运维人员' || (random() * 10)::int ELSE NULL END,
  CASE WHEN random() > 0.5 THEN '已完成处理' ELSE NULL END,
  'T001',
  create_time,
  CASE WHEN random() > 0.2 THEN create_time + INTERVAL '1 hour' ELSE NULL END,
  CASE WHEN random() > 0.5 THEN create_time + INTERVAL '4 hours' ELSE NULL END,
  create_time + INTERVAL '30 minutes'
FROM (
  SELECT i, NOW() - (random() * INTERVAL '90 days') AS create_time
  FROM generate_series(1, 200) AS i
) sub;

-- 3. 生成 100 个巡检任务
INSERT INTO inspection_task (name, station_id, station_name, device_count, item_count,
  status, plan_time, start_time, complete_time, inspector,
  tenant_id, created_at, updated_at)
SELECT
  '巡检任务-充电站' || (1 + (i % 183)) || '-' || i,
  1 + (i % 183),
  '充电站' || (1 + (i % 183)),
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
FROM generate_series(1, 100) AS i;
