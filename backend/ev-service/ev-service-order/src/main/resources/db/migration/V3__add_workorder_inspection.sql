-- 工单表
CREATE TABLE IF NOT EXISTS work_order (
    id BIGSERIAL PRIMARY KEY,
    order_no VARCHAR(32) UNIQUE NOT NULL,
    type VARCHAR(16) NOT NULL,          -- repair/maintenance/inspection
    title VARCHAR(256) NOT NULL,
    description TEXT,
    station_id BIGINT,
    station_name VARCHAR(128),
    device_id BIGINT,
    device_code VARCHAR(64),
    priority VARCHAR(16) DEFAULT 'medium',  -- high/medium/low
    status VARCHAR(16) DEFAULT 'pending',   -- pending/accepted/processing/completed/closed
    creator VARCHAR(64),
    assignee VARCHAR(64),
    result TEXT,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT NOW(),
    accept_time TIMESTAMP,
    complete_time TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted SMALLINT DEFAULT 0
);

-- 巡检任务表
CREATE TABLE IF NOT EXISTS inspection_task (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    station_id BIGINT,
    station_name VARCHAR(128),
    device_count INT DEFAULT 0,
    item_count INT DEFAULT 0,
    status VARCHAR(16) DEFAULT 'pending',   -- pending/in_progress/completed
    plan_time TIMESTAMP,
    start_time TIMESTAMP,
    complete_time TIMESTAMP,
    inspector VARCHAR(64),
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted SMALLINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_workorder_status ON work_order(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workorder_station ON work_order(station_id);
CREATE INDEX IF NOT EXISTS idx_inspection_status ON inspection_task(status, created_at DESC);
