-- V9__add_performance_indexes.sql
-- 添加性能优化索引

-- ============================================
-- 订单表索引（最频繁查询）
-- ============================================

-- 按站点查询订单
CREATE INDEX IF NOT EXISTS idx_charging_order_station_id
ON charging_order(station_id);

-- 按设备查询订单
CREATE INDEX IF NOT EXISTS idx_charging_order_device_id
ON charging_order(device_id);

-- 按状态查询订单（待结算、退款中等）
CREATE INDEX IF NOT EXISTS idx_charging_order_status
ON charging_order(status);

-- 按用户查询订单
CREATE INDEX IF NOT EXISTS idx_charging_order_user_id
ON charging_order(user_id);

-- 按时间范围查询订单（Dashboard 趋势图）
CREATE INDEX IF NOT EXISTS idx_charging_order_created_at
ON charging_order(created_at);

-- 复合索引：按租户+状态+时间查询
CREATE INDEX IF NOT EXISTS idx_charging_order_tenant_status_time
ON charging_order(tenant_id, status, created_at);

-- 复合索引：按站点+状态统计
CREATE INDEX IF NOT EXISTS idx_charging_order_station_status
ON charging_order(station_id, status);

-- ============================================
-- 告警表索引
-- ============================================

-- 按设备查询告警
CREATE INDEX IF NOT EXISTS idx_device_alert_device_id
ON device_alert(device_id);

-- 按状态查询告警（待处理、处理中）
CREATE INDEX IF NOT EXISTS idx_device_alert_status
ON device_alert(status);

-- 按等级查询告警（P0, P1, P2, P3）
CREATE INDEX IF NOT EXISTS idx_device_alert_level
ON device_alert(level);

-- 复合索引：按租户+状态查询
CREATE INDEX IF NOT EXISTS idx_device_alert_tenant_status
ON device_alert(tenant_id, status);

-- ============================================
-- 工单表索引
-- ============================================

-- 按状态查询工单
CREATE INDEX IF NOT EXISTS idx_work_order_status
ON work_order(status);

-- 按站点查询工单
CREATE INDEX IF NOT EXISTS idx_work_order_station_id
ON work_order(station_id);

-- 按设备查询工单
CREATE INDEX IF NOT EXISTS idx_work_order_device_id
ON work_order(device_id);

-- 复合索引：按租户+状态查询
CREATE INDEX IF NOT EXISTS idx_work_order_tenant_status
ON work_order(tenant_id, status);

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
-- 用户表索引
-- ============================================

-- 按用户名查询（登录）
CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_user_username
ON sys_user(username);

-- 按手机号查询
CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_user_phone
ON sys_user(phone);

-- 复合索引：按租户+状态查询
CREATE INDEX IF NOT EXISTS idx_sys_user_tenant_status
ON sys_user(tenant_id, status);

-- ============================================
-- 支付记录表索引
-- ============================================

-- 按订单查询支付记录
CREATE INDEX IF NOT EXISTS idx_payment_record_order_id
ON payment_record(order_id);

-- 按用户查询支付记录
CREATE INDEX IF NOT EXISTS idx_payment_record_user_id
ON payment_record(user_id);

-- 按状态查询支付记录
CREATE INDEX IF NOT EXISTS idx_payment_record_status
ON payment_record(status);

-- ============================================
-- 巡检任务表索引
-- ============================================

-- 按状态查询巡检任务
CREATE INDEX IF NOT EXISTS idx_inspection_task_status
ON inspection_task(status);

-- 按站点查询巡检任务
CREATE INDEX IF NOT EXISTS idx_inspection_task_station_id
ON inspection_task(station_id);
