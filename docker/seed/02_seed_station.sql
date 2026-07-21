-- ============================================================
-- EV 充电平台 - 完整种子数据脚本
-- 日期: 2026-07-21
-- 说明: 充电站、设备、连接器、电价、优惠券等全部数据
-- 数据库: ev_station
-- ============================================================

-- ==================== 1. 电价方案表（新建） ====================
CREATE TABLE IF NOT EXISTS electricity_price_plan (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(64) NOT NULL,
    type            VARCHAR(16) NOT NULL DEFAULT 'FLAT',   -- FLAT/TOU/PEAK_VALLEY
    description     VARCHAR(256),
    peak_price      DECIMAL(10,4) DEFAULT 0,               -- 峰时电价(元/kWh)
    flat_price      DECIMAL(10,4) DEFAULT 0,               -- 平时电价(元/kWh)
    valley_price    DECIMAL(10,4) DEFAULT 0,               -- 谷时电价(元/kWh)
    service_price   DECIMAL(10,4) DEFAULT 0,               -- 服务费(元/kWh)
    peak_hours      VARCHAR(128),                          -- 峰时段 (如 08:00-11:00,18:00-21:00)
    valley_hours    VARCHAR(128),                          -- 谷时段 (如 23:00-07:00)
    status          VARCHAR(16) DEFAULT 'ACTIVE',
    tenant_id       VARCHAR(32) DEFAULT 'T001',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted         SMALLINT DEFAULT 0
);

-- ==================== 2. 优惠券表（新建） ====================
CREATE TABLE IF NOT EXISTS coupon_template (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(128) NOT NULL,
    type            VARCHAR(16) NOT NULL,                  -- FIXED/PERCENT/RECHARGE_GIFT
    discount_value  BIGINT DEFAULT 0,                      -- 固定金额(分) 或 折扣比例(%*100)
    min_amount      BIGINT DEFAULT 0,                      -- 最低消费金额(分)
    max_discount    BIGINT DEFAULT 0,                      -- 最大优惠金额(分, 0=不限)
    total_count     INT DEFAULT 0,                         -- 发放总量 (0=不限)
    used_count      INT DEFAULT 0,                         -- 已使用数量
    start_time      TIMESTAMP,
    end_time        TIMESTAMP,
    valid_days      INT DEFAULT 30,                        -- 领取后有效天数
    description     VARCHAR(256),
    status          VARCHAR(16) DEFAULT 'ACTIVE',          -- ACTIVE/EXHAUSTED/EXPIRED
    tenant_id       VARCHAR(32) DEFAULT 'T001',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    deleted         SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coupon_instance (
    id              BIGSERIAL PRIMARY KEY,
    template_id     BIGINT REFERENCES coupon_template(id),
    user_id         BIGINT NOT NULL,
    status          VARCHAR(16) DEFAULT 'UNUSED',          -- UNUSED/USED/EXPIRED
    used_order_id   BIGINT,
    used_amount     BIGINT DEFAULT 0,
    expire_time     TIMESTAMP NOT NULL,
    used_time       TIMESTAMP,
    tenant_id       VARCHAR(32) DEFAULT 'T001',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_instance_user ON coupon_instance(user_id, status);
CREATE INDEX IF NOT EXISTS idx_coupon_instance_expire ON coupon_instance(expire_time);
CREATE INDEX IF NOT EXISTS idx_price_plan_status ON electricity_price_plan(status);

-- ==================== 3. 充电站（扩充至10个） ====================
INSERT INTO station (code, name, type, status, province, city, district, address, longitude, latitude, contact_name, contact_phone, electricity_price, service_price, parking_price, total_ports, available_ports, org_id) VALUES
('S001', '朝阳区超级充电站',       'PUBLIC',      'ACTIVE',      '北京市',   '北京市',   '朝阳区',   '朝阳区建国路88号',               116.4610000, 39.9230000, '张经理', '13800000001', 1.2000, 0.8000, 5.0000, 8,  5, 'ORG001'),
('S002', '浦东新区快充站',         'PUBLIC',      'ACTIVE',      '上海市',   '上海市',   '浦东新区', '浦东新区陆家嘴环路1000号',       121.5020000, 31.2390000, '李经理', '13800000002', 1.3500, 0.8500, 4.0000, 6,  3, 'ORG002'),
('S003', '天河区充电站',           'PUBLIC',      'ACTIVE',      '广东省',   '广州市',   '天河区',   '天河区天河路385号',               113.3310000, 23.1310000, '王经理', '13800000003', 1.1500, 0.7500, 3.0000, 10, 7, 'ORG003'),
('S004', '南山区科技园充电站',     'PUBLIC',      'MAINTENANCE',  '广东省',   '深圳市',   '南山区',   '南山区科技南路16号',             113.9430000, 22.5300000, '赵经理', '13800000004', 1.3000, 0.9000, 6.0000, 4,  0, 'ORG003'),
('S005', '西湖区充电站',           'DESTINATION', 'ACTIVE',      '浙江省',   '杭州市',   '西湖区',   '西湖区文三路478号',               120.1290000, 30.2740000, '孙经理', '13800000005', 1.1000, 0.7000, 2.0000, 6,  4, 'ORG004'),
('S006', '高新区光谷充电站',       'PUBLIC',      'ACTIVE',      '湖北省',   '武汉市',   '东湖高新区','东湖高新区光谷大道77号',         114.4290000, 30.5060000, '钱经理', '13800000006', 1.1800, 0.7800, 3.5000, 8,  6, 'ORG005'),
('S007', '天府新区充电站',         'PUBLIC',      'ACTIVE',      '四川省',   '成都市',   '天府新区', '天府新区天府大道南段888号',       104.0650000, 30.6580000, '周经理', '13800000007', 1.0500, 0.6500, 2.5000, 12, 10,'ORG006'),
('S008', '雨花台区充电站',         'PUBLIC',      'ACTIVE',      '江苏省',   '南京市',   '雨花台区', '雨花台区软件大道168号',           118.7780000, 32.0030000, '吴经理', '13800000008', 1.1200, 0.7200, 3.0000, 6,  4, 'ORG007'),
('S009', '岳麓区充电站',           'DESTINATION','ACTIVE',      '湖南省',   '长沙市',   '岳麓区',   '岳麓区麓山南路932号',             112.9380000, 28.2280000, '郑经理', '13800000009', 1.0000, 0.6000, 2.0000, 8,  7, 'ORG008'),
('S010', '沈河区充电站',           'PUBLIC',      'ACTIVE',      '辽宁省',   '沈阳市',   '沈河区',   '沈河区青年大街1号',               123.4310000, 41.8050000, '冯经理', '13800000010', 1.0800, 0.6800, 2.0000, 6,  5, 'ORG009')
ON CONFLICT (code) DO NOTHING;

-- ==================== 4. 设备（扩充至25台） ====================
INSERT INTO device (station_id, code, ocpp_id, name, type, model, vendor, rated_power, firmware_version, status, lifecycle) VALUES
-- S001 朝阳站 (8台)
(1, 'DEV-001', 'CP001', '1号直流快充桩',   'DC', 'DC-120kW',  '特来电',   120000, 'v2.1.3', 'ONLINE',    'ONLINE'),
(1, 'DEV-002', 'CP002', '2号直流快充桩',   'DC', 'DC-120kW',  '特来电',   120000, 'v2.1.3', 'ONLINE',    'ONLINE'),
(1, 'DEV-003', 'CP003', '3号交流慢充桩',   'AC', 'AC-7kW',    '星星充电', 7000,   'v1.5.0', 'CHARGING',  'ONLINE'),
(1, 'DEV-004', 'CP004', '4号交流慢充桩',   'AC', 'AC-7kW',    '星星充电', 7000,   'v1.5.0', 'OFFLINE',   'MAINTENANCE'),
-- S002 浦东站 (6台)
(2, 'DEV-005', 'CP005', '5号直流快充桩',   'DC', 'DC-60kW',   '国电南瑞', 60000,  'v3.0.1', 'ONLINE',    'ONLINE'),
(2, 'DEV-006', 'CP006', '6号直流快充桩',   'DC', 'DC-60kW',   '国电南瑞', 60000,  'v3.0.1', 'FAULT',     'ONLINE'),
(2, 'DEV-007', 'CP007', '7号交流桩',       'AC', 'AC-22kW',   'ABB',      22000,  'v2.0.0', 'ONLINE',    'ONLINE'),
-- S003 天河站 (10台)
(3, 'DEV-008', 'CP008', '8号超充桩',       'DC', 'DC-240kW',  '华为',     240000, 'v4.0.0', 'ONLINE',    'ONLINE'),
(3, 'DEV-009', 'CP009', '9号超充桩',       'DC', 'DC-240kW',  '华为',     240000, 'v4.0.0', 'ONLINE',    'ONLINE'),
(3, 'DEV-010', 'CP010', '10号直流桩',      'DC', 'DC-120kW',  '特来电',   120000, 'v2.1.3', 'ONLINE',    'ONLINE'),
-- S004 南山站 (4台)
(4, 'DEV-011', 'CP011', '11号交流桩',      'AC', 'AC-7kW',    '星星充电', 7000,   'v1.5.0', 'OFFLINE',   'MAINTENANCE'),
-- S005 西湖站 (6台)
(5, 'DEV-012', 'CP012', '12号直流桩',      'DC', 'DC-60kW',   '国电南瑞', 60000,  'v3.0.1', 'ONLINE',    'ONLINE'),
-- S006 光谷站 (8台)
(6, 'DEV-013', 'CP013', '13号直流快充桩',  'DC', 'DC-120kW',  '特来电',   120000, 'v2.1.3', 'ONLINE',    'ONLINE'),
(6, 'DEV-014', 'CP014', '14号直流快充桩',  'DC', 'DC-120kW',  '特来电',   120000, 'v2.1.3', 'ONLINE',    'ONLINE'),
(6, 'DEV-015', 'CP015', '15号交流桩',      'AC', 'AC-22kW',   'ABB',      22000,  'v2.0.0', 'ONLINE',    'ONLINE'),
-- S007 天府站 (12台)
(7, 'DEV-016', 'CP016', '16号超充桩',      'DC', 'DC-240kW',  '华为',     240000, 'v4.0.0', 'ONLINE',    'ONLINE'),
(7, 'DEV-017', 'CP017', '17号超充桩',      'DC', 'DC-240kW',  '华为',     240000, 'v4.0.0', 'ONLINE',    'ONLINE'),
(7, 'DEV-018', 'CP018', '18号直流快充桩',  'DC', 'DC-120kW',  '特来电',   120000, 'v2.1.3', 'ONLINE',    'ONLINE'),
(7, 'DEV-019', 'CP019', '19号交流桩',      'AC', 'AC-22kW',   'ABB',      22000,  'v2.0.0', 'ONLINE',    'ONLINE'),
-- S008 雨花台站 (6台)
(8, 'DEV-020', 'CP020', '20号直流快充桩',  'DC', 'DC-60kW',   '国电南瑞', 60000,  'v3.0.1', 'ONLINE',    'ONLINE'),
(8, 'DEV-021', 'CP021', '21号交流桩',      'AC', 'AC-7kW',    '星星充电', 7000,   'v1.5.0', 'ONLINE',    'ONLINE'),
-- S009 岳麓站 (8台)
(9, 'DEV-022', 'CP022', '22号直流快充桩',  'DC', 'DC-120kW',  '特来电',   120000, 'v2.1.3', 'ONLINE',    'ONLINE'),
(9, 'DEV-023', 'CP023', '23号交流桩',      'AC', 'AC-22kW',   'ABB',      22000,  'v2.0.0', 'ONLINE',    'ONLINE'),
-- S010 沈河站 (6台)
(10,'DEV-024', 'CP024', '24号直流快充桩',  'DC', 'DC-60kW',   '国电南瑞', 60000,  'v3.0.1', 'ONLINE',    'ONLINE'),
(10,'DEV-025', 'CP025', '25号交流桩',      'AC', 'AC-7kW',    '星星充电', 7000,   'v1.5.0', 'ONLINE',    'ONLINE')
ON CONFLICT (code) DO NOTHING;

-- ==================== 5. 连接器 ====================
INSERT INTO connector (device_id, connector_id, type, status, max_power) VALUES
(1, 1, 'GB_DC', 'AVAILABLE', 120000), (1, 2, 'GB_DC', 'CHARGING', 120000),
(2, 1, 'GB_DC', 'AVAILABLE', 120000), (2, 2, 'GB_DC', 'AVAILABLE', 120000),
(3, 1, 'GB_AC', 'CHARGING', 7000),    (3, 2, 'GB_AC', 'AVAILABLE', 7000),
(4, 1, 'GB_AC', 'UNAVAILABLE', 7000), (4, 2, 'GB_AC', 'UNAVAILABLE', 7000),
(5, 1, 'GB_DC', 'AVAILABLE', 60000),  (5, 2, 'GB_DC', 'AVAILABLE', 60000),
(6, 1, 'GB_DC', 'FAULTED', 60000),    (6, 2, 'GB_DC', 'UNAVAILABLE', 60000),
(7, 1, 'GB_AC', 'AVAILABLE', 22000),  (7, 2, 'GB_AC', 'AVAILABLE', 22000),
(8, 1, 'GB_DC', 'AVAILABLE', 240000), (8, 2, 'GB_DC', 'AVAILABLE', 240000),
(9, 1, 'GB_DC', 'AVAILABLE', 240000), (9, 2, 'GB_DC', 'CHARGING', 240000),
(10,1, 'GB_DC', 'AVAILABLE', 120000), (10,2, 'GB_DC', 'AVAILABLE', 120000),
(11,1, 'GB_AC', 'UNAVAILABLE', 7000), (11,2, 'GB_AC', 'UNAVAILABLE', 7000),
(12,1, 'GB_DC', 'AVAILABLE', 60000),  (12,2, 'GB_DC', 'AVAILABLE', 60000),
(13,1, 'GB_DC', 'AVAILABLE', 120000), (13,2, 'GB_DC', 'AVAILABLE', 120000),
(14,1, 'GB_DC', 'CHARGING', 120000),  (14,2, 'GB_DC', 'AVAILABLE', 120000),
(15,1, 'GB_AC', 'AVAILABLE', 22000),  (15,2, 'GB_AC', 'AVAILABLE', 22000),
(16,1, 'GB_DC', 'AVAILABLE', 240000), (16,2, 'GB_DC', 'AVAILABLE', 240000),
(17,1, 'GB_DC', 'CHARGING', 240000),  (17,2, 'GB_DC', 'AVAILABLE', 240000),
(18,1, 'GB_DC', 'AVAILABLE', 120000), (18,2, 'GB_DC', 'AVAILABLE', 120000),
(19,1, 'GB_AC', 'AVAILABLE', 22000),  (19,2, 'GB_AC', 'AVAILABLE', 22000),
(20,1, 'GB_DC', 'AVAILABLE', 60000),  (20,2, 'GB_DC', 'AVAILABLE', 60000),
(21,1, 'GB_AC', 'AVAILABLE', 7000),   (21,2, 'GB_AC', 'CHARGING', 7000),
(22,1, 'GB_DC', 'AVAILABLE', 120000), (22,2, 'GB_DC', 'AVAILABLE', 120000),
(23,1, 'GB_AC', 'AVAILABLE', 22000),  (23,2, 'GB_AC', 'AVAILABLE', 22000),
(24,1, 'GB_DC', 'AVAILABLE', 60000),  (24,2, 'GB_DC', 'AVAILABLE', 60000),
(25,1, 'GB_AC', 'AVAILABLE', 7000),   (25,2, 'GB_AC', 'AVAILABLE', 7000);

-- ==================== 6. 电价方案 ====================
INSERT INTO electricity_price_plan (name, type, description, peak_price, flat_price, valley_price, service_price, peak_hours, valley_hours, status) VALUES
('标准分时电价',   'TOU',        '工作日分时电价方案',           1.5000, 1.0000, 0.5000, 0.8000, '08:00-11:00,18:00-21:00', '23:00-07:00', 'ACTIVE'),
('节假日优惠价',   'TOU',        '节假日电价优惠',               1.2000, 0.8000, 0.4000, 0.6000, '09:00-12:00,17:00-20:00', '23:00-08:00', 'ACTIVE'),
('VIP专属电价',    'FLAT',       'VIP会员统一电价',              0,      0.8500, 0,      0.5000, NULL, NULL, 'ACTIVE'),
('夜间谷电特惠',   'PEAK_VALLEY','夜间22:00-06:00超低谷电价',    1.3000, 0.9000, 0.3500, 0.6000, '10:00-15:00,19:00-22:00', '22:00-06:00', 'ACTIVE'),
('商业区高峰价',   'TOU',        '商业区高峰时段电价',           1.8000, 1.2000, 0.6000, 1.0000, '09:00-12:00,14:00-18:00', '00:00-07:00', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- ==================== 7. 优惠券模板 & 实例 ====================
INSERT INTO coupon_template (name, type, discount_value, min_amount, max_discount, total_count, used_count, start_time, end_time, valid_days, description, status) VALUES
('新用户立减10元',     'FIXED',    1000,  2000,  1000,  10000, 3520, '2026-01-01', '2026-12-31', 30, '新用户专享，满20元减10元',                 'ACTIVE'),
('充电8折券',          'PERCENT',  8000,  5000,  2000,  5000,  1230, '2026-01-01', '2026-12-31', 15, '全场充电8折，最高优惠20元',                'ACTIVE'),
('充值满100送20',      'RECHARGE_GIFT', 2000, 10000, 2000, 2000, 890, '2026-03-01', '2026-09-30', 7, '充值100元送20元优惠券',                    'ACTIVE'),
('周末充电减5元',      'FIXED',    500,   1000,  500,   8000,  2100, '2026-06-01', '2026-08-31', 7, '周六日专享，满10元减5元',                   'ACTIVE'),
('VIP满50减15',        'FIXED',    1500,  5000,  1500,  3000,  650,  '2026-01-01', '2026-12-31', 30, 'VIP用户专享，满50元减15元',                'ACTIVE'),
('国庆充电7折',        'PERCENT',  7000,  3000,  3000,  10000, 0,    '2026-10-01', '2026-10-07', 3, '国庆期间全场7折',                           'ACTIVE'),
('推荐好友奖励',       'FIXED',    800,   0,     800,   0,     456,  '2026-01-01', '2026-12-31', 365,'推荐好友注册奖励',                          'ACTIVE')
ON CONFLICT DO NOTHING;

-- 给用户发放优惠券实例
INSERT INTO coupon_instance (template_id, user_id, status, expire_time) VALUES
-- 用户 13800000002 (id=10) 有多张券
(1, 10, 'UNUSED', '2026-08-20'), (2, 10, 'UNUSED', '2026-08-05'), (4, 10, 'UNUSED', '2026-07-28'),
-- 用户 13800000003 (id=11)
(1, 11, 'UNUSED', '2026-08-15'), (5, 11, 'UNUSED', '2026-08-30'),
-- 用户 13800000004 (id=12)
(2, 12, 'USED',   '2026-07-25'), (4, 12, 'UNUSED', '2026-07-30'),
-- 用户 13800000005 (id=13)
(1, 13, 'EXPIRED','2026-07-10'), (3, 13, 'UNUSED', '2026-09-01'),
-- VIP 用户
(5, 20, 'UNUSED', '2026-12-31'), (5, 21, 'UNUSED', '2026-12-31'), (5, 22, 'UNUSED', '2026-12-31'),
(2, 20, 'UNUSED', '2026-08-15'), (4, 21, 'UNUSED', '2026-07-28')
ON CONFLICT DO NOTHING;

SELECT '✅ ev_station 种子数据导入完成' AS result;
