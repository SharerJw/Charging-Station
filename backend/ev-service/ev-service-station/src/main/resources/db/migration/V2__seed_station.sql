INSERT INTO station (code, name, type, status, province, city, district, address, longitude, latitude, contact_name, contact_phone, electricity_price, service_price, parking_price, total_ports, available_ports) VALUES
('S001', '朝阳区超级充电站', 'PUBLIC', 'ACTIVE', '北京市', '北京市', '朝阳区', '朝阳区建国路88号', 116.4610000, 39.9230000, '张经理', '13800000001', 1.2000, 0.8000, 5.0000, 8, 5),
('S002', '浦东新区快充站', 'PUBLIC', 'ACTIVE', '上海市', '上海市', '浦东新区', '浦东新区陆家嘴环路1000号', 121.5020000, 31.2390000, '李经理', '13800000002', 1.3500, 0.8500, 4.0000, 6, 3),
('S003', '天河区充电站', 'PUBLIC', 'ACTIVE', '广东省', '广州市', '天河区', '天河区天河路385号', 113.3310000, 23.1310000, '王经理', '13800000003', 1.1500, 0.7500, 3.0000, 10, 7),
('S004', '南山区科技园充电站', 'PUBLIC', 'MAINTENANCE', '广东省', '深圳市', '南山区', '南山区科技南路16号', 113.9430000, 22.5300000, '赵经理', '13800000004', 1.3000, 0.9000, 6.0000, 4, 0),
('S005', '西湖区充电站', 'DESTINATION', 'ACTIVE', '浙江省', '杭州市', '西湖区', '西湖区文三路478号', 120.1290000, 30.2740000, '孙经理', '13800000005', 1.1000, 0.7000, 2.0000, 6, 4)
ON CONFLICT (code) DO NOTHING;

INSERT INTO device (station_id, code, ocpp_id, name, type, model, vendor, rated_power, firmware_version, status, lifecycle) VALUES
(1, 'DEV-001', 'CP001', '1号直流快充桩', 'DC', 'DC-120kW', '特来电', 120000, 'v2.1.3', 'ONLINE', 'ONLINE'),
(1, 'DEV-002', 'CP002', '2号直流快充桩', 'DC', 'DC-120kW', '特来电', 120000, 'v2.1.3', 'ONLINE', 'ONLINE'),
(1, 'DEV-003', 'CP003', '3号交流慢充桩', 'AC', 'AC-7kW', '星星充电', 7000, 'v1.5.0', 'CHARGING', 'ONLINE'),
(1, 'DEV-004', 'CP004', '4号交流慢充桩', 'AC', 'AC-7kW', '星星充电', 7000, 'v1.5.0', 'OFFLINE', 'MAINTENANCE'),
(2, 'DEV-005', 'CP005', '5号直流快充桩', 'DC', 'DC-60kW', '国电南瑞', 60000, 'v3.0.1', 'ONLINE', 'ONLINE'),
(2, 'DEV-006', 'CP006', '6号直流快充桩', 'DC', 'DC-60kW', '国电南瑞', 60000, 'v3.0.1', 'FAULT', 'ONLINE'),
(2, 'DEV-007', 'CP007', '7号交流桩', 'AC', 'AC-22kW', 'ABB', 22000, 'v2.0.0', 'ONLINE', 'ONLINE'),
(3, 'DEV-008', 'CP008', '8号超充桩', 'DC', 'DC-240kW', '华为', 240000, 'v4.0.0', 'ONLINE', 'ONLINE'),
(3, 'DEV-009', 'CP009', '9号超充桩', 'DC', 'DC-240kW', '华为', 240000, 'v4.0.0', 'ONLINE', 'ONLINE'),
(3, 'DEV-010', 'CP010', '10号直流桩', 'DC', 'DC-120kW', '特来电', 120000, 'v2.1.3', 'ONLINE', 'ONLINE'),
(4, 'DEV-011', 'CP011', '11号交流桩', 'AC', 'AC-7kW', '星星充电', 7000, 'v1.5.0', 'OFFLINE', 'MAINTENANCE'),
(5, 'DEV-012', 'CP012', '12号直流桩', 'DC', 'DC-60kW', '国电南瑞', 60000, 'v3.0.1', 'ONLINE', 'ONLINE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO connector (device_id, connector_id, type, status, max_power) VALUES
(1, 1, 'GB_DC', 'AVAILABLE', 120000), (1, 2, 'GB_DC', 'CHARGING', 120000),
(2, 1, 'GB_DC', 'AVAILABLE', 120000), (2, 2, 'GB_DC', 'AVAILABLE', 120000),
(3, 1, 'GB_AC', 'CHARGING', 7000), (3, 2, 'GB_AC', 'AVAILABLE', 7000),
(4, 1, 'GB_AC', 'UNAVAILABLE', 7000), (4, 2, 'GB_AC', 'UNAVAILABLE', 7000),
(5, 1, 'GB_DC', 'AVAILABLE', 60000), (5, 2, 'GB_DC', 'AVAILABLE', 60000),
(6, 1, 'GB_DC', 'FAULTED', 60000), (6, 2, 'GB_DC', 'UNAVAILABLE', 60000),
(7, 1, 'GB_AC', 'AVAILABLE', 22000), (7, 2, 'GB_AC', 'AVAILABLE', 22000),
(8, 1, 'GB_DC', 'AVAILABLE', 240000), (8, 2, 'GB_DC', 'AVAILABLE', 240000),
(9, 1, 'GB_DC', 'AVAILABLE', 240000), (9, 2, 'GB_DC', 'CHARGING', 240000),
(10, 1, 'GB_DC', 'AVAILABLE', 120000), (10, 2, 'GB_DC', 'AVAILABLE', 120000),
(11, 1, 'GB_AC', 'UNAVAILABLE', 7000), (11, 2, 'GB_AC', 'UNAVAILABLE', 7000),
(12, 1, 'GB_DC', 'AVAILABLE', 60000), (12, 2, 'GB_DC', 'AVAILABLE', 60000);
