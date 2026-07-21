-- ============================================================
-- EV 充电平台 - 完整种子数据脚本
-- 日期: 2026-07-21
-- 说明: 包含用户、角色、权限、数据权限等全部数据
-- 数据库: ev_identity
-- ============================================================

-- ==================== 1. 角色（扩充） ====================
INSERT INTO sys_role (code, name) VALUES
('admin',      '系统管理员')  ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES
('ops',        '运维工程师')  ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES
('user',       '普通用户')   ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES
('ops_leader', '运维主管')   ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES
('finance',    '财务人员')   ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES
('station_mgr','站长')       ON CONFLICT (code) DO NOTHING;
INSERT INTO sys_role (code, name) VALUES
('vip',        'VIP用户')   ON CONFLICT (code) DO NOTHING;

-- ==================== 2. 用户（扩充至20+） ====================
-- 密码说明: admin123 → $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH
--          ops123  → $2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi
--          user123 → $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH
INSERT INTO sys_user (username, password, nickname, phone, avatar, status) VALUES
-- 管理员
('admin',       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '系统管理员',   '13800000001', '', 1),
-- 运维人员
('ops1',        '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '张伟',         '13900139001', '', 1),
('ops2',        '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '李强',         '13900139002', '', 1),
('ops3',        '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '王磊',         '13900139003', '', 1),
-- 运维主管
('ops_leader1', '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '赵敏',         '13900139004', '', 1),
-- 财务人员
('finance1',    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '刘芳',         '13700137001', '', 1),
('finance2',    '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '陈静',         '13700137002', '', 1),
-- 站长
('station_mgr1','$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '周杰',         '13600136001', '', 1),
('station_mgr2','$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3H1Gwq8pKZi', '吴昊',         '13600136002', '', 1),
-- 普通用户
('13800000002', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张三',         '13800000002', '', 1),
('13800000003', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李四',         '13800000003', '', 1),
('13800000004', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王五',         '13800000004', '', 1),
('13800000005', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '赵六',         '13800000005', '', 1),
('13800000006', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '孙七',         '13800000006', '', 1),
('13800000007', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '周八',         '13800000007', '', 1),
('13800000008', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '吴九',         '13800000008', '', 1),
('13800000009', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '郑十',         '13800000009', '', 1),
('13800000010', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '钱十一',       '13800000010', '', 1),
-- VIP 用户
('13800138000', NULL, '充电用户',       '13800138000', '', 1),
('vip001',      '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'VIP-刘先生',   '13500135001', '', 1),
('vip002',      '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'VIP-陈女士',   '13500135002', '', 1),
('vip003',      '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'VIP-黄先生',   '13500135003', '', 1)
ON CONFLICT (username) DO NOTHING;

-- ==================== 3. 用户-角色关联 ====================
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'admin' AND r.code = 'admin'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'ops1' AND r.code = 'ops'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'ops2' AND r.code = 'ops'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'ops3' AND r.code = 'ops'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'ops_leader1' AND r.code = 'ops_leader'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'finance1' AND r.code = 'finance'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'finance2' AND r.code = 'finance'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'station_mgr1' AND r.code = 'station_mgr'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'station_mgr2' AND r.code = 'station_mgr'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = '13800000002' AND r.code = 'user'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = '13800000003' AND r.code = 'user'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = '13800000004' AND r.code = 'user'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = '13800000005' AND r.code = 'user'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = '13800138000' AND r.code = 'user'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'vip001' AND r.code = 'vip'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'vip002' AND r.code = 'vip'
ON CONFLICT DO NOTHING;
INSERT INTO sys_user_role (user_id, role_id)
SELECT u.id, r.id FROM sys_user u, sys_role r WHERE u.username = 'vip003' AND r.code = 'vip'
ON CONFLICT DO NOTHING;

-- ==================== 4. 权限（细粒度，树形结构） ====================
-- 一级菜单
INSERT INTO sys_permission (code, name, type, parent_id, path, icon, sort_order) VALUES
('dashboard',       '数据看板',     'menu',   0, '/dashboard',       'Dashboard',    1),
('station',         '充电站管理',   'menu',   0, '/station',         'Station',      2),
('device',          '设备管理',     'menu',   0, '/device',          'Device',       3),
('order',           '订单管理',     'menu',   0, '/order',           'Order',        4),
('user_mgmt',       '用户管理',     'menu',   0, '/user',            'User',         5),
('finance',         '财务管理',     'menu',   0, '/finance',         'Finance',      6),
('ops',             '运维管理',     'menu',   0, '/ops',             'Ops',          7),
('system',          '系统管理',     'menu',   0, '/system',          'Setting',      8),
('monitor',         '监控中心',     'menu',   0, '/monitor',         'Monitor',      9)
ON CONFLICT (code) DO NOTHING;

-- 二级菜单 & 按钮权限（通过 parent_id 关联）
-- 数据看板
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('dashboard:view',          '查看数据看板',     'button', (SELECT id FROM sys_permission WHERE code='dashboard'), 1),
('dashboard:export',        '导出报表',         'button', (SELECT id FROM sys_permission WHERE code='dashboard'), 2)
ON CONFLICT (code) DO NOTHING;

-- 充电站管理
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('station:list',            '充电站列表',       'button', (SELECT id FROM sys_permission WHERE code='station'), 1),
('station:view',            '查看充电站详情',   'button', (SELECT id FROM sys_permission WHERE code='station'), 2),
('station:create',          '创建充电站',       'button', (SELECT id FROM sys_permission WHERE code='station'), 3),
('station:edit',            '编辑充电站',       'button', (SELECT id FROM sys_permission WHERE code='station'), 4),
('station:delete',          '删除充电站',       'button', (SELECT id FROM sys_permission WHERE code='station'), 5),
('station:price',           '电价管理',         'button', (SELECT id FROM sys_permission WHERE code='station'), 6)
ON CONFLICT (code) DO NOTHING;

-- 设备管理
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('device:list',             '设备列表',         'button', (SELECT id FROM sys_permission WHERE code='device'), 1),
('device:view',             '查看设备详情',     'button', (SELECT id FROM sys_permission WHERE code='device'), 2),
('device:control',          '控制设备',         'button', (SELECT id FROM sys_permission WHERE code='device'), 3),
('device:config',           '设备配置',         'button', (SELECT id FROM sys_permission WHERE code='device'), 4),
('device:firmware',         '固件升级',         'button', (SELECT id FROM sys_permission WHERE code='device'), 5)
ON CONFLICT (code) DO NOTHING;

-- 订单管理
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('order:list',              '订单列表',         'button', (SELECT id FROM sys_permission WHERE code='order'), 1),
('order:view',              '查看订单详情',     'button', (SELECT id FROM sys_permission WHERE code='order'), 2),
('order:refund',            '退款',             'button', (SELECT id FROM sys_permission WHERE code='order'), 3),
('order:export',            '导出订单',         'button', (SELECT id FROM sys_permission WHERE code='order'), 4),
('order:cancel',            '取消订单',         'button', (SELECT id FROM sys_permission WHERE code='order'), 5)
ON CONFLICT (code) DO NOTHING;

-- 用户管理
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('user:list',               '用户列表',         'button', (SELECT id FROM sys_permission WHERE code='user_mgmt'), 1),
('user:view',               '查看用户详情',     'button', (SELECT id FROM sys_permission WHERE code='user_mgmt'), 2),
('user:edit',               '编辑用户',         'button', (SELECT id FROM sys_permission WHERE code='user_mgmt'), 3),
('user:disable',            '禁用用户',         'button', (SELECT id FROM sys_permission WHERE code='user_mgmt'), 4),
('user:role',               '分配角色',         'button', (SELECT id FROM sys_permission WHERE code='user_mgmt'), 5)
ON CONFLICT (code) DO NOTHING;

-- 财务管理
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('finance:view',            '查看财务数据',     'button', (SELECT id FROM sys_permission WHERE code='finance'), 1),
('finance:export',          '导出财务报表',     'button', (SELECT id FROM sys_permission WHERE code='finance'), 2),
('finance:refund',          '退款审核',         'button', (SELECT id FROM sys_permission WHERE code='finance'), 3),
('finance:coupon',          '优惠券管理',       'button', (SELECT id FROM sys_permission WHERE code='finance'), 4)
ON CONFLICT (code) DO NOTHING;

-- 运维管理
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('ops:alert',               '告警管理',         'button', (SELECT id FROM sys_permission WHERE code='ops'), 1),
('ops:workorder',           '工单管理',         'button', (SELECT id FROM sys_permission WHERE code='ops'), 2),
('ops:inspection',          '巡检任务',         'button', (SELECT id FROM sys_permission WHERE code='ops'), 3),
('ops:handle',              '处理工单',         'button', (SELECT id FROM sys_permission WHERE code='ops'), 4)
ON CONFLICT (code) DO NOTHING;

-- 系统管理
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('system:role',             '角色管理',         'button', (SELECT id FROM sys_permission WHERE code='system'), 1),
('system:permission',       '权限管理',         'button', (SELECT id FROM sys_permission WHERE code='system'), 2),
('system:config',           '系统配置',         'button', (SELECT id FROM sys_permission WHERE code='system'), 3),
('system:log',              '操作日志',         'button', (SELECT id FROM sys_permission WHERE code='system'), 4)
ON CONFLICT (code) DO NOTHING;

-- 监控中心
INSERT INTO sys_permission (code, name, type, parent_id, sort_order) VALUES
('monitor:view',            '查看监控',         'button', (SELECT id FROM sys_permission WHERE code='monitor'), 1),
('monitor:alert_rule',      '告警规则配置',     'button', (SELECT id FROM sys_permission WHERE code='monitor'), 2)
ON CONFLICT (code) DO NOTHING;

-- ==================== 5. 角色-权限关联 ====================
-- admin: 全部权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;

-- ops_leader: 运维 + 设备 + 告警 + 看板
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.code = 'ops_leader' AND p.code IN (
    'dashboard', 'dashboard:view', 'dashboard:export',
    'station', 'station:list', 'station:view',
    'device', 'device:list', 'device:view', 'device:control', 'device:config', 'device:firmware',
    'ops', 'ops:alert', 'ops:workorder', 'ops:inspection', 'ops:handle',
    'monitor', 'monitor:view', 'monitor:alert_rule'
)
ON CONFLICT DO NOTHING;

-- ops: 运维 + 设备查看 + 告警处理
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.code = 'ops' AND p.code IN (
    'dashboard', 'dashboard:view',
    'station', 'station:list', 'station:view',
    'device', 'device:list', 'device:view', 'device:control',
    'ops', 'ops:alert', 'ops:workorder', 'ops:inspection', 'ops:handle'
)
ON CONFLICT DO NOTHING;

-- finance: 财务 + 订单查看 + 看板
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.code = 'finance' AND p.code IN (
    'dashboard', 'dashboard:view', 'dashboard:export',
    'order', 'order:list', 'order:view', 'order:refund', 'order:export',
    'finance', 'finance:view', 'finance:export', 'finance:refund', 'finance:coupon'
)
ON CONFLICT DO NOTHING;

-- station_mgr: 站点 + 设备 + 订单查看
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.code = 'station_mgr' AND p.code IN (
    'dashboard', 'dashboard:view',
    'station', 'station:list', 'station:view', 'station:edit', 'station:price',
    'device', 'device:list', 'device:view', 'device:control',
    'order', 'order:list', 'order:view',
    'ops', 'ops:alert', 'ops:workorder'
)
ON CONFLICT DO NOTHING;

-- user/vip: 仅查看自己的订单和充电站
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.code = 'user' AND p.code IN (
    'station', 'station:list', 'station:view',
    'order', 'order:list', 'order:view'
)
ON CONFLICT DO NOTHING;

INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.code = 'vip' AND p.code IN (
    'station', 'station:list', 'station:view',
    'order', 'order:list', 'order:view'
)
ON CONFLICT DO NOTHING;

-- ==================== 6. 数据权限 ====================
INSERT INTO sys_data_permission (permission_name, permission_code, data_scope) VALUES
('全部数据',     'data:all',        'ALL')           ON CONFLICT (permission_code) DO NOTHING;
INSERT INTO sys_data_permission (permission_name, permission_code, data_scope) VALUES
('本机构及下级', 'data:org_child',  'ORG_AND_CHILD') ON CONFLICT (permission_code) DO NOTHING;
INSERT INTO sys_data_permission (permission_name, permission_code, data_scope) VALUES
('仅本机构',     'data:org_only',   'ORG_ONLY')      ON CONFLICT (permission_code) DO NOTHING;
INSERT INTO sys_data_permission (permission_name, permission_code, data_scope) VALUES
('仅本人',       'data:self_only',  'SELF_ONLY')     ON CONFLICT (permission_code) DO NOTHING;

-- admin → 全部数据
INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'admin' AND dp.data_scope = 'ALL'
ON CONFLICT DO NOTHING;

-- ops_leader → 本机构及下级
INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'ops_leader' AND dp.data_scope = 'ORG_AND_CHILD'
ON CONFLICT DO NOTHING;

-- ops → 仅本机构
INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'ops' AND dp.data_scope = 'ORG_ONLY'
ON CONFLICT DO NOTHING;

-- finance → 全部数据
INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'finance' AND dp.data_scope = 'ALL'
ON CONFLICT DO NOTHING;

-- station_mgr → 仅本机构
INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'station_mgr' AND dp.data_scope = 'ORG_ONLY'
ON CONFLICT DO NOTHING;

-- user/vip → 仅本人
INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'user' AND dp.data_scope = 'SELF_ONLY'
ON CONFLICT DO NOTHING;

INSERT INTO sys_role_data_permission (role_id, data_permission_id)
SELECT r.id, dp.id FROM sys_role r, sys_data_permission dp
WHERE r.code = 'vip' AND dp.data_scope = 'SELF_ONLY'
ON CONFLICT DO NOTHING;

SELECT '✅ ev_identity 种子数据导入完成' AS result;
