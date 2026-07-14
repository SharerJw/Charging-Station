-- 预置角色
INSERT INTO sys_role (code, name) VALUES ('admin', '系统管理员') ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES ('ops', '运维工程师') ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES ('user', '普通用户') ON CONFLICT (code) DO NOTHING;

-- 预置用户 (密码 BCrypt 加密: admin123/ops123)
INSERT INTO sys_user (username, password, nickname, phone, avatar, status) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员', '13800000001', '', 1),
('ops1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '运维工程师', '13900139000', '', 1),
('13800138000', NULL, '充电用户', '13800138000', '', 1)
ON CONFLICT (username) DO NOTHING;

-- 用户-角色关联
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'admin' AND r.code = 'admin'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'ops1' AND r.code = 'ops'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = '13800138000' AND r.code = 'user'
ON CONFLICT DO NOTHING;

-- 预置权限
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('station:view', '查看充电站', 'menu', 0, 1),
('station:create', '创建充电站', 'button', 0, 2),
('station:edit', '编辑充电站', 'button', 0, 3),
('station:delete', '删除充电站', 'button', 0, 4),
('device:view', '查看设备', 'menu', 0, 5),
('device:control', '控制设备', 'button', 0, 6),
('order:view', '查看订单', 'menu', 0, 7),
('order:refund', '退款', 'button', 0, 8),
('user:view', '查看用户', 'menu', 0, 9),
('user:edit', '编辑用户', 'button', 0, 10),
('finance:view', '查看财务', 'menu', 0, 11),
('dashboard:view', '查看仪表盘', 'menu', 0, 12)
ON CONFLICT (code) DO NOTHING;

-- admin 角色拥有所有权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;
