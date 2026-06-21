-- ============================================================
-- 水库闸门调度系统 - PostgreSQL 建库脚本
-- 说明：
--   1. 本脚本只建库，必须连接到 postgres(或 template1) 数据库，以超级用户执行
--   2. PostgreSQL 不支持 CREATE DATABASE IF NOT EXISTS，故请用 init.sh 执行更可靠（见 init.sh）
-- 用法: psql -U postgres -d postgres -f init_db.sql
-- ============================================================
-- 注意：若报错 "ERROR: CREATE DATABASE cannot run inside a transaction block" 属正常现象，
-- 说明此 psql 时请改用命令行方式：
--   psql -U postgres -d postgres -c "CREATE DATABASE reservoir_scheduling ENCODING 'UTF8' TEMPLATE=template0;"
-- ============================================================

CREATE DATABASE reservoir_scheduling ENCODING 'UTF8' TEMPLATE=template0;
