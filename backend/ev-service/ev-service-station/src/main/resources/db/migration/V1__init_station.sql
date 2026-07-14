CREATE TABLE IF NOT EXISTS station (
    id BIGSERIAL PRIMARY KEY, code VARCHAR(32) UNIQUE NOT NULL, name VARCHAR(128) NOT NULL,
    type VARCHAR(16) DEFAULT 'PUBLIC', status VARCHAR(16) DEFAULT 'ACTIVE',
    province VARCHAR(32), city VARCHAR(32), district VARCHAR(32), address VARCHAR(256),
    longitude DECIMAL(10,7), latitude DECIMAL(10,7),
    contact_name VARCHAR(64), contact_phone VARCHAR(20),
    electricity_price DECIMAL(10,4), service_price DECIMAL(10,4), parking_price DECIMAL(10,4),
    total_ports INT DEFAULT 0, available_ports INT DEFAULT 0,
    tenant_id VARCHAR(32) DEFAULT 'T001', org_id VARCHAR(32) DEFAULT 'ORG001',
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
    deleted SMALLINT DEFAULT 0, version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS device (
    id BIGSERIAL PRIMARY KEY, station_id BIGINT REFERENCES station(id),
    code VARCHAR(64) UNIQUE NOT NULL, ocpp_id VARCHAR(64) UNIQUE,
    name VARCHAR(128), type VARCHAR(16) NOT NULL, model VARCHAR(64), vendor VARCHAR(64),
    rated_power INT, firmware_version VARCHAR(32),
    status VARCHAR(16) DEFAULT 'OFFLINE', lifecycle VARCHAR(16) DEFAULT 'ONLINE',
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
    deleted SMALLINT DEFAULT 0, version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS connector (
    id BIGSERIAL PRIMARY KEY, device_id BIGINT REFERENCES device(id),
    connector_id INT NOT NULL, type VARCHAR(16) NOT NULL,
    status VARCHAR(32) DEFAULT 'AVAILABLE', max_power INT,
    cumulative_energy BIGINT DEFAULT 0, charge_count INT DEFAULT 0,
    current_transaction_id BIGINT,
    UNIQUE(device_id, connector_id)
);

CREATE INDEX IF NOT EXISTS idx_station_status ON station(status);
CREATE INDEX IF NOT EXISTS idx_station_city ON station(city);
CREATE INDEX IF NOT EXISTS idx_station_tenant ON station(tenant_id);
CREATE INDEX IF NOT EXISTS idx_device_station ON device(station_id);
CREATE INDEX IF NOT EXISTS idx_device_status ON device(status);
CREATE INDEX IF NOT EXISTS idx_device_ocpp_id ON device(ocpp_id);
CREATE INDEX IF NOT EXISTS idx_connector_device ON connector(device_id, connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_status ON connector(status);
