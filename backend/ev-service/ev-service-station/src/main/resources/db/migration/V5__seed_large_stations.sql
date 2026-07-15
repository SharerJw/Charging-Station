-- V5__seed_large_stations.sql
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
  (0.8 + random() * 1.0)::decimal(10,4),
  (0.3 + random() * 0.5)::decimal(10,4),
  CASE WHEN random() > 0.5 THEN (random() * 10)::decimal(10,4) ELSE 0 END,
  (3 + random() * 12)::int,
  (2 + random() * 10)::int,
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
  (random() * 1000000)::bigint,
  (random() * 1000)::int
FROM device d
CROSS JOIN generate_series(1, 2) AS i;
