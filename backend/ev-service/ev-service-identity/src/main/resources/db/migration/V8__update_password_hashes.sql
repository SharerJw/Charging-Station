-- 更新用户密码为正确的 BCrypt 哈希值
-- admin123 的 BCrypt 哈希
UPDATE sys_user SET password = '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH' WHERE username = 'admin';

-- ops123 的 BCrypt 哈希
UPDATE sys_user SET password = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36PsLJfGqKCQ3Rr2QZ3W3fO' WHERE username = 'ops1';

-- 添加一些额外的运维角色权限
INSERT INTO sys_role_permission (role_id, permission_id)
SELECT r.id, p.id FROM sys_role r, sys_permission p
WHERE r.code = 'ops' AND p.code IN ('station:view', 'device:view', 'device:control', 'order:view')
ON CONFLICT DO NOTHING;
