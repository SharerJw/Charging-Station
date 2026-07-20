-- V12__add_charging_session.sql
-- 添加充电实时会话持久化表（charging 服务专用）
-- 用于记录充电会话的实时状态快照，支持历史回溯和异常分析

CREATE TABLE IF NOT EXISTS charging_session (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL,        -- 会话唯一标识（UUID）
    order_id VARCHAR(32),                          -- 关联订单号
    user_id BIGINT NOT NULL,                       -- 用户 ID
    user_nickname VARCHAR(64),                     -- 用户昵称
    station_id BIGINT NOT NULL,                    -- 充电站 ID
    station_name VARCHAR(128),                     -- 充电站名称
    device_id BIGINT,                              -- 设备 ID
    device_code VARCHAR(64),                       -- 设备编码
    connector_id INT,                              -- 连接器编号
    status VARCHAR(16) DEFAULT 'INITIATING',       -- 会话状态: INITIATING/CHARGING/COMPLETED/FAILED/TIMEOUT
    current_soc SMALLINT DEFAULT 0,                -- 当前 SOC（%）
    start_soc SMALLINT,                            -- 起始 SOC（%）
    target_soc SMALLINT,                           -- 目标 SOC（%）
    power_w INT DEFAULT 0,                         -- 当前功率（W）
    energy_wh BIGINT DEFAULT 0,                    -- 累计电量（Wh）
    voltage_mv INT,                                -- 当前电压（mV）
    current_ma INT,                                -- 当前电流（mA）
    duration_sec BIGINT DEFAULT 0,                 -- 充电时长（秒）
    cost_cents BIGINT DEFAULT 0,                   -- 累计费用（分）
    error_code VARCHAR(32),                        -- 错误码
    error_message VARCHAR(256),                    -- 错误信息
    meter_start BIGINT DEFAULT 0,                  -- 起始电表读数（Wh）
    meter_stop BIGINT,                             -- 结束电表读数（Wh）
    tenant_id VARCHAR(32) DEFAULT 'T001',
    started_at TIMESTAMP DEFAULT NOW(),            -- 会话开始时间
    stopped_at TIMESTAMP,                          -- 会话结束时间
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted SMALLINT DEFAULT 0
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_charging_session_user ON charging_session(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charging_session_station ON charging_session(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charging_session_device ON charging_session(device_code);
CREATE INDEX IF NOT EXISTS idx_charging_session_status ON charging_session(status);
CREATE INDEX IF NOT EXISTS idx_charging_session_order ON charging_session(order_id);
CREATE INDEX IF NOT EXISTS idx_charging_session_tenant ON charging_session(tenant_id);
CREATE INDEX IF NOT EXISTS idx_charging_session_started ON charging_session(started_at DESC);

-- 注释
COMMENT ON TABLE charging_session IS '充电实时会话表 - 记录每次充电会话的完整生命周期';
COMMENT ON COLUMN charging_session.session_id IS '会话唯一标识，格式: UUID';
COMMENT ON COLUMN charging_session.status IS '会话状态: INITIATING(初始化中)/CHARGING(充电中)/COMPLETED(已完成)/FAILED(失败)/TIMEOUT(超时)';
COMMENT ON COLUMN charging_session.current_soc IS '当前电池电量百分比 (0-100)';
COMMENT ON COLUMN charging_session.power_w IS '当前充电功率，单位: 瓦特(W)';
COMMENT ON COLUMN charging_session.energy_wh IS '累计充电电量，单位: 瓦时(Wh)';
COMMENT ON COLUMN charging_session.cost_cents IS '累计费用，单位: 分（人民币）';
