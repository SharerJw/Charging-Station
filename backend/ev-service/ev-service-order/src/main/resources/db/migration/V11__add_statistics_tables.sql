-- V11__add_statistics_tables.sql
-- 添加统计报表表

CREATE TABLE IF NOT EXISTS daily_statistics (
    id BIGSERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    total_orders BIGINT DEFAULT 0,
    completed_orders BIGINT DEFAULT 0,
    cancelled_orders BIGINT DEFAULT 0,
    abnormal_orders BIGINT DEFAULT 0,
    refunded_orders BIGINT DEFAULT 0,
    total_amount BIGINT DEFAULT 0,
    total_energy_wh BIGINT DEFAULT 0,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS weekly_statistics (
    id BIGSERIAL PRIMARY KEY,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_orders BIGINT DEFAULT 0,
    completed_orders BIGINT DEFAULT 0,
    cancelled_orders BIGINT DEFAULT 0,
    abnormal_orders BIGINT DEFAULT 0,
    refunded_orders BIGINT DEFAULT 0,
    total_amount BIGINT DEFAULT 0,
    total_energy_wh BIGINT DEFAULT 0,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS monthly_statistics (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_orders BIGINT DEFAULT 0,
    completed_orders BIGINT DEFAULT 0,
    cancelled_orders BIGINT DEFAULT 0,
    abnormal_orders BIGINT DEFAULT 0,
    refunded_orders BIGINT DEFAULT 0,
    total_amount BIGINT DEFAULT 0,
    total_energy_wh BIGINT DEFAULT 0,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_daily_stat_date ON daily_statistics(stat_date);
CREATE INDEX IF NOT EXISTS idx_daily_stat_tenant ON daily_statistics(tenant_id);

CREATE INDEX IF NOT EXISTS idx_weekly_stat_week ON weekly_statistics(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_stat_tenant ON weekly_statistics(tenant_id);

CREATE INDEX IF NOT EXISTS idx_monthly_stat_year_month ON monthly_statistics(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_stat_tenant ON monthly_statistics(tenant_id);

-- 注释
COMMENT ON TABLE daily_statistics IS '每日统计报表';
COMMENT ON TABLE weekly_statistics IS '每周统计报表';
COMMENT ON TABLE monthly_statistics IS '每月统计报表';
