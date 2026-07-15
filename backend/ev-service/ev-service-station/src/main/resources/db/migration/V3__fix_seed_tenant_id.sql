-- V3: Fix seed data tenant_id (was NULL, filtered by TenantLineInnerInterceptor)
UPDATE station SET tenant_id = 'T001' WHERE tenant_id IS NULL;
UPDATE device SET tenant_id = 'T001' WHERE tenant_id IS NULL;
