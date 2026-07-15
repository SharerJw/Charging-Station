-- V5__seed_large_users.sql
-- 生成 5,000 个用户和 5 个角色

-- 1. 插入角色
INSERT INTO sys_role (code, name, tenant_id, created_at) VALUES
  ('admin', '系统管理员', 'T001', NOW()),
  ('operator', '运营人员', 'T001', NOW()),
  ('technician', '技术工程师', 'T001', NOW()),
  ('finance', '财务人员', 'T001', NOW()),
  ('viewer', '只读用户', 'T001', NOW());

-- 2. 插入权限
INSERT INTO sys_permission (code, name, type, parent_id, path, icon, sort_order) VALUES
  ('dashboard:view', '查看仪表盘', 'menu', 0, '/dashboard', 'Dashboard', 1),
  ('station:view', '查看站点', 'menu', 0, '/station', 'Station', 2),
  ('station:manage', '管理站点', 'button', 2, NULL, NULL, 1),
  ('device:view', '查看设备', 'menu', 0, '/device', 'Device', 3),
  ('device:manage', '管理设备', 'button', 4, NULL, NULL, 1),
  ('order:view', '查看订单', 'menu', 0, '/order', 'Order', 4),
  ('order:manage', '管理订单', 'button', 6, NULL, NULL, 1),
  ('user:view', '查看用户', 'menu', 0, '/user', 'User', 5),
  ('user:manage', '管理用户', 'button', 8, NULL, NULL, 1),
  ('finance:view', '查看财务', 'menu', 0, '/finance', 'Finance', 6),
  ('alert:view', '查看告警', 'menu', 0, '/alert', 'Alert', 7),
  ('alert:manage', '处理告警', 'button', 10, NULL, NULL, 1);

-- 3. 角色权限关联（admin 拥有所有权限）
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT
  (SELECT id FROM sys_role WHERE code = 'admin'),
  id
FROM sys_permission;

-- 4. 生成 5,000 个用户
INSERT INTO sys_user (username, password, nickname, phone, status, tenant_id, created_at, updated_at)
SELECT
  'user_' || lpad(i::text, 4, '0'),
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH',
  CASE
    WHEN i <= 100 THEN '测试用户' || i
    WHEN i <= 1000 THEN '用户' || i
    ELSE '普通用户' || i
  END,
  '138' || lpad(i::text, 8, '0'),
  CASE WHEN random() > 0.05 THEN 1 ELSE 0 END,
  'T001',
  NOW() - (random() * INTERVAL '90 days'),
  NOW()
FROM generate_series(1, 5000) AS i;

-- 5. 给前 100 个用户分配 admin 角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT
  id,
  (SELECT id FROM sys_role WHERE code = 'admin')
FROM sys_user
WHERE id <= 100;

-- 6. 给其他用户随机分配角色
INSERT INTO sys_user_role (user_id, role_id)
SELECT
  u.id,
  (SELECT id FROM sys_role WHERE code =
    CASE (u.id % 4)
      WHEN 0 THEN 'operator'
      WHEN 1 THEN 'technician'
      WHEN 2 THEN 'finance'
      ELSE 'viewer'
    END
  )
FROM sys_user u
WHERE u.id > 100;
