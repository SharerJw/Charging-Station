-- 订单状态变更历史表
CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(32),
    order_id BIGINT NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    trigger_type VARCHAR(32),
    trigger_user_id BIGINT,
    trigger_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted INT DEFAULT 0,
    version INT DEFAULT 0,

    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES charging_order(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_order_status_history_tenant_id ON order_status_history(tenant_id);

COMMENT ON TABLE order_status_history IS '订单状态变更历史';
COMMENT ON COLUMN order_status_history.trigger_type IS '触发类型：USER, SYSTEM, DEVICE, ADMIN';
COMMENT ON COLUMN order_status_history.from_status IS '原状态';
COMMENT ON COLUMN order_status_history.to_status IS '新状态';
