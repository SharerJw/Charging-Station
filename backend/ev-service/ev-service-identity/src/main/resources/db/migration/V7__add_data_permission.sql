-- 数据权限配置表
CREATE TABLE IF NOT EXISTS sys_data_permission (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(64),
    permission_code VARCHAR(64) UNIQUE,
    data_scope VARCHAR(32),
    description VARCHAR(255),
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 角色-数据权限关联表
CREATE TABLE IF NOT EXISTS sys_role_data_permission (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    data_permission_id INT NOT NULL,
    custom_org_ids TEXT,
    tenant_id VARCHAR(32) DEFAULT 'T001',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(role_id, data_permission_id)
);

-- 预置数据
INSERT INTO sys_data_permission (permission_name, permission_code, data_scope) VALUES
('全部数据', 'data:all', 'ALL'),
('本机构及下级', 'data:org_child', 'ORG_AND_CHILD'),
('仅本机构', 'data:org_only', 'ORG_ONLY'),
('仅本人', 'data:self_only', 'SELF_ONLY')
ON CONFLICT (permission_code) DO NOTHING;

-- admin 角色默认全部数据权限
INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'admin' AND dp.data_scope = 'ALL'
ON CONFLICT DO NOTHING;
