-- V3: Fix seed data tenant_id for tables that have the column
-- Only sys_user and sys_role have tenant_id (sys_permission/sys_user_role/sys_role_permission don't)
UPDATE sys_user SET tenant_id = 'T001' WHERE tenant_id IS NULL;
UPDATE sys_role SET tenant_id = 'T001' WHERE tenant_id IS NULL;
