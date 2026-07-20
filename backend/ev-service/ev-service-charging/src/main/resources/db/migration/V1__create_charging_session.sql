-- V1: 创建充电会话表
CREATE TABLE IF NOT EXISTS charging_session (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL,
    order_id VARCHAR(32),
    user_id BIGINT NOT NULL,
    user_nickname VARCHAR(64),
    station_id BIGINT NOT NULL,
    station_name VARCHAR(128),
    device_id BIGINT,
    device_code VARCHAR(64),
    connector_id INT,
    status VARCHAR(16) DEFAULT 'INITIATING',
    current_soc SMALLINT DEFAULT 0,
    start_soc SMALLINT,
    target_soc SMALLINT,
    power_w INT DEFAULT 0,
    energy_wh BIGINT DEFAULT 0,
    voltage_mv INT,
    current_ma INT,
    duration_sec BIGINT DEFAULT 0,
    cost_cents BIGINT DEFAULT 0,
    error_code VARCHAR(32),
    error_message VARCHAR(256),
    meter_start BIGINT DEFAULT 0,
    meter_stop BIGINT,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    started_at TIMESTAMP DEFAULT NOW(),
    stopped_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted SMALLINT DEFAULT 0
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cs_user ON charging_session(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cs_station ON charging_session(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cs_device ON charging_session(device_code);
CREATE INDEX IF NOT EXISTS idx_cs_status ON charging_session(status);
CREATE INDEX IF NOT EXISTS idx_cs_order ON charging_session(order_id);
CREATE INDEX IF NOT EXISTS idx_cs_tenant ON charging_session(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_started ON charging_session(started_at DESC);
