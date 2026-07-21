-- ============================================================
-- EV 充电平台 - 消息与调度表
-- 数据库: ev_order
-- ============================================================

-- ==================== 1. 消息表 ====================
CREATE TABLE IF NOT EXISTS ops_message (
    id              BIGSERIAL       PRIMARY KEY,
    type            VARCHAR(32)     NOT NULL DEFAULT 'system',
    title           VARCHAR(128)    NOT NULL,
    content         TEXT,
    target_type     VARCHAR(16)     NOT NULL DEFAULT 'all',
    target_id       VARCHAR(64),
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    related_id      VARCHAR(64),
    tenant_id       VARCHAR(64),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    read_time       TIMESTAMP
);

CREATE INDEX idx_ops_message_type ON ops_message(type);
CREATE INDEX idx_ops_message_target ON ops_message(target_type, target_id);
CREATE INDEX idx_ops_message_unread ON ops_message(is_read) WHERE is_read = FALSE;

-- ==================== 2. 调度规则表 ====================
CREATE TABLE IF NOT EXISTS dispatch_rule (
    id               BIGSERIAL       PRIMARY KEY,
    name             VARCHAR(128)    NOT NULL,
    description      TEXT,
    rule_type        VARCHAR(32)     NOT NULL DEFAULT 'alert',
    priority         VARCHAR(16)     NOT NULL DEFAULT 'medium',
    conditions       TEXT,
    assignee_pattern VARCHAR(256),
    enabled          BOOLEAN         NOT NULL DEFAULT TRUE,
    tenant_id        VARCHAR(64),
    created_at       TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispatch_rule_type ON dispatch_rule(rule_type);
CREATE INDEX idx_dispatch_rule_enabled ON dispatch_rule(enabled);

-- ==================== 3. 调度记录表 ====================
CREATE TABLE IF NOT EXISTS dispatch_record (
    id              BIGSERIAL       PRIMARY KEY,
    rule_id         BIGINT          NOT NULL,
    rule_name       VARCHAR(128),
    target_type     VARCHAR(32)     NOT NULL DEFAULT 'alert',
    target_id       VARCHAR(64),
    target_title    VARCHAR(256),
    assignee        VARCHAR(64),
    status          VARCHAR(16)     NOT NULL DEFAULT 'pending',
    remark          TEXT,
    tenant_id       VARCHAR(64),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dispatch_record_rule ON dispatch_record(rule_id);
CREATE INDEX idx_dispatch_record_target ON dispatch_record(target_type, target_id);
CREATE INDEX idx_dispatch_record_assignee ON dispatch_record(assignee);
CREATE INDEX idx_dispatch_record_status ON dispatch_record(status);

SELECT 'ops_message + dispatch_rule + dispatch_record 表创建完成' AS result;
