CREATE TABLE IF NOT EXISTS charging_order (
    id BIGSERIAL PRIMARY KEY, order_no VARCHAR(32) UNIQUE NOT NULL,
    station_id BIGINT, station_name VARCHAR(128),
    device_id BIGINT, device_code VARCHAR(64), connector_id INT,
    user_id BIGINT, user_nickname VARCHAR(64),
    status VARCHAR(16) DEFAULT 'CREATED', version INT DEFAULT 1,
    meter_start BIGINT DEFAULT 0, meter_stop BIGINT, energy_wh BIGINT,
    peak_power INT, avg_power INT, start_soc SMALLINT, stop_soc SMALLINT,
    electricity_fee BIGINT DEFAULT 0, service_fee BIGINT DEFAULT 0, parking_fee BIGINT DEFAULT 0,
    discount_amount BIGINT DEFAULT 0, total_amount BIGINT DEFAULT 0,
    pay_method VARCHAR(16), pay_time TIMESTAMP,
    start_time TIMESTAMP, stop_time TIMESTAMP, settle_time TIMESTAMP,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
    deleted SMALLINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payment_record (
    id BIGSERIAL PRIMARY KEY, payment_no VARCHAR(32) UNIQUE NOT NULL,
    order_id BIGINT REFERENCES charging_order(id), user_id BIGINT,
    channel VARCHAR(16), amount BIGINT, status VARCHAR(16) DEFAULT 'PENDING',
    channel_trade_no VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_alert (
    id BIGSERIAL PRIMARY KEY, device_id BIGINT, device_code VARCHAR(64),
    station_id BIGINT, station_name VARCHAR(128),
    level VARCHAR(4), title VARCHAR(256), description TEXT,
    status VARCHAR(16) DEFAULT 'pending', handler VARCHAR(64),
    handle_result TEXT, handle_time TIMESTAMP,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_no ON charging_order(order_no);
CREATE INDEX IF NOT EXISTS idx_order_user ON charging_order(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_station ON charging_order(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_status ON charging_order(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_created ON charging_order(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_order ON payment_record(order_id);
CREATE INDEX IF NOT EXISTS idx_alert_station ON device_alert(station_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_status ON device_alert(status, level, created_at DESC);
