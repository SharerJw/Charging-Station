-- EV充电平台 PostgreSQL 初始化脚本
-- 在 ev_identity 库（由 POSTGRES_DB 环境变量创建）中执行
-- 创建其他业务数据库

-- 创建充电站数据库
CREATE DATABASE ev_station OWNER ev;

-- 创建订单数据库
CREATE DATABASE ev_order OWNER ev;

-- 授权
GRANT ALL PRIVILEGES ON DATABASE ev_identity TO ev;
GRANT ALL PRIVILEGES ON DATABASE ev_station TO ev;
GRANT ALL PRIVILEGES ON DATABASE ev_order TO ev;
