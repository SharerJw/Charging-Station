TRUNCATE TABLE charging_order CASCADE;
TRUNCATE TABLE payment_record CASCADE;
TRUNCATE TABLE device_alert CASCADE;
TRUNCATE TABLE work_order CASCADE;
TRUNCATE TABLE inspection_task CASCADE;

ALTER SEQUENCE charging_order_id_seq RESTART WITH 1;
ALTER SEQUENCE payment_record_id_seq RESTART WITH 1;
ALTER SEQUENCE device_alert_id_seq RESTART WITH 1;
ALTER SEQUENCE work_order_id_seq RESTART WITH 1;
ALTER SEQUENCE inspection_task_id_seq RESTART WITH 1;
