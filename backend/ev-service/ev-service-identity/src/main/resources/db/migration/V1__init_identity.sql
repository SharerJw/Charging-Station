-- 用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(64) UNIQUE NOT NULL,
    password    VARCHAR(128),
    nickname    VARCHAR(64),
    phone       VARCHAR(20) UNIQUE,
    avatar      VARCHAR(512),
    status      SMALLINT DEFAULT 1,
    tenant_id   VARCHAR(32) DEFAULT 'T001',
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW(),
    deleted     SMALLINT DEFAULT 0,
    version     INT DEFAULT 1
);

-- 角色表
CREATE TABLE IF NOT EXISTS sys_role (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(32) UNIQUE NOT NULL,
    name        VARCHAR(64),
    tenant_id   VARCHAR(32) DEFAULT 'T001',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 用户-角色关联
CREATE TABLE IF NOT EXISTS sys_user_role (
    user_id     BIGINT REFERENCES sys_user(id),
    role_id     BIGINT REFERENCES sys_role(id),
    PRIMARY KEY (user_id, role_id)
);

-- 权限表
CREATE TABLE IF NOT EXISTS sys_permission (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(64) UNIQUE NOT NULL,
    name        VARCHAR(64),
    type        VARCHAR(16),
    parent_id   BIGINT DEFAULT 0,
    path        VARCHAR(256),
    icon        VARCHAR(64),
    sort_order  INT DEFAULT 0
);

-- 角色-权限关联
CREATE TABLE IF NOT EXISTS sys_role_permission (
    role_id       BIGINT REFERENCES sys_role(id),
    permission_id BIGINT REFERENCES sys_permission(id),
    PRIMARY KEY (role_id, permission_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_username ON sys_user(username);
CREATE INDEX IF NOT EXISTS idx_user_phone ON sys_user(phone);
CREATE INDEX IF NOT EXISTS idx_user_tenant ON sys_user(tenant_id);
