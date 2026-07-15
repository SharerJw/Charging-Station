-- V6__add_performance_indexes.sql
-- 添加性能优化索引

-- ============================================
-- 站点表索引
-- ============================================

-- 按状态查询站点
CREATE INDEX IF NOT EXISTS idx_station_status
ON station(status);

-- 按省份查询站点
CREATE INDEX IF NOT EXISTS idx_station_province
ON station(province);

-- 按城市查询站点
CREATE INDEX IF NOT EXISTS idx_station_city
ON station(city);

-- 复合索引：按租户+状态查询
CREATE INDEX IF NOT EXISTS idx_station_tenant_status
ON station(tenant_id, status);

-- ============================================
-- 设备表索引
-- ============================================

-- 按站点查询设备
CREATE INDEX IF NOT EXISTS idx_device_station_id
ON device(station_id);

-- 按状态查询设备（在线、离线、充电中）
CREATE INDEX IF NOT EXISTS idx_device_status
ON device(status);

-- 复合索引：按租户+状态查询
CREATE INDEX IF NOT EXISTS idx_device_tenant_status
ON device(tenant_id, status);

-- ============================================
-- 连接器表索引
-- ============================================

-- 按设备查询连接器
CREATE INDEX IF NOT EXISTS idx_connector_device_id
ON connector(device_id);

-- 按状态查询连接器
CREATE INDEX IF NOT EXISTS idx_connector_status
ON connector(status);
