-- V5: Fix seed data tenant_id for tables that have the column
UPDATE charging_order SET tenant_id = 'T001' WHERE tenant_id IS NULL;
-- Note: device_alert, work_order, inspection_task, payment_record don't have tenant_id column
