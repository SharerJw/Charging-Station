-- ============================================================
-- EV 充电平台 - 设备故障记录表
-- 日期: 2026-07-21
-- 说明: 设备故障记录，用于运维端查询设备故障历史
-- 数据库: ev_station
-- ============================================================

CREATE TABLE IF NOT EXISTS device_fault (
    id                  BIGSERIAL PRIMARY KEY,
    device_id           BIGINT NOT NULL REFERENCES device(id),
    device_code         VARCHAR(32) NOT NULL,
    fault_code          VARCHAR(32),
    fault_description   VARCHAR(512),
    level               VARCHAR(16) NOT NULL DEFAULT 'P2',   -- P0/P1/P2/P3
    status              VARCHAR(16) NOT NULL DEFAULT 'OPEN', -- OPEN/RESOLVED/IGNORED
    occurred_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMP,
    tenant_id           VARCHAR(32) DEFAULT 'T001',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    deleted             SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_device_fault_device ON device_fault(device_id, status);
CREATE INDEX IF NOT EXISTS idx_device_fault_occurred ON device_fault(occurred_at);

-- 插入示例故障记录
INSERT INTO device_fault (device_id, device_code, fault_code, fault_description, level, status, occurred_at, resolved_at) VALUES
-- 设备6 (DEV-006) 有故障
(6,  'DEV-006', 'F001', '充电模块通信超时',          'P1', 'OPEN',     NOW() - INTERVAL '2 hours',  NULL),
(6,  'DEV-006', 'F002', '输出过流保护触发',          'P2', 'OPEN',     NOW() - INTERVAL '30 minutes', NULL),
-- 设备4 (DEV-004) 维护中
(4,  'DEV-004', 'F003', '风扇转速异常',              'P3', 'RESOLVED', NOW() - INTERVAL '3 days',   NOW() - INTERVAL '2 days'),
(4,  'DEV-004', 'F004', '触摸屏无响应',              'P2', 'RESOLVED', NOW() - INTERVAL '5 days',   NOW() - INTERVAL '4 days'),
-- 设备11 (DEV-011) 维护中
(11, 'DEV-011', 'F005', '交流输入电压异常',          'P1', 'OPEN',     NOW() - INTERVAL '1 day',    NULL),
-- 其他设备偶发故障
(3,  'DEV-003', 'F006', '充电枪锁止机构卡滞',        'P3', 'RESOLVED', NOW() - INTERVAL '10 days',  NOW() - INTERVAL '10 days'),
(8,  'DEV-008', 'F007', '液冷系统温度偏高',          'P2', 'RESOLVED', NOW() - INTERVAL '7 days',   NOW() - INTERVAL '7 days'),
(14, 'DEV-014', 'F008', 'OCPP心跳丢失',             'P1', 'RESOLVED', NOW() - INTERVAL '15 days',  NOW() - INTERVAL '15 days')
ON CONFLICT DO NOTHING;

SELECT '✅ device_fault 表创建及种子数据完成' AS result;
