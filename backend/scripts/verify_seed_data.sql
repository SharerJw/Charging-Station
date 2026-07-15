-- verify_seed_data.sql
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
