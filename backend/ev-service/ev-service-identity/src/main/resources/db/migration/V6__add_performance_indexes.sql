-- V6__add_performance_indexes.sql
-- 添加性能优化索引

-- ============================================
-- 用户表索引
-- ============================================

-- 按用户名查询（登录）- 已有唯一约束，自动创建索引
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_user_username ON sys_user(username);

-- 按手机号查询 - 已有唯一约束，自动创建索引
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_sys_user_phone ON sys_user(phone);

-- 按状态查询用户
CREATE INDEX IF NOT EXISTS idx_sys_user_status
ON sys_user(status);

-- 复合索引：按租户+状态查询
CREATE INDEX IF NOT EXISTS idx_sys_user_tenant_status
ON sys_user(tenant_id, status);

-- 按创建时间查询
CREATE INDEX IF NOT EXISTS idx_sys_user_created_at
ON sys_user(created_at);

-- ============================================
-- 角色表索引
-- ============================================

-- 按租户查询角色
CREATE INDEX IF NOT EXISTS idx_sys_role_tenant_id
ON sys_role(tenant_id);

-- ============================================
-- 权限表索引
-- ============================================

-- 按父级查询权限（菜单树）
CREATE INDEX IF NOT EXISTS idx_sys_permission_parent_id
ON sys_permission(parent_id);

-- 按类型查询权限
CREATE INDEX IF NOT EXISTS idx_sys_permission_type
ON sys_permission(type);
