-- ============================================================
-- 水库闸门调度系统 - PostgreSQL 建表与种子数据脚本
-- 说明：必须连接到 reservoir_scheduling 数据库执行
-- 用法: psql -U postgres -d reservoir_scheduling -f init_schema.sql
-- ============================================================

-- 启用扩展（pgcrypto 用于 gen_random_uuid）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 创建业务表
-- ============================================================

-- 1.1 水位记录表
CREATE TABLE IF NOT EXISTS water_level_records (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_time          TIMESTAMP NOT NULL,
    upstream_inflow      DECIMAL(10,2) NOT NULL,
    downstream_water_level DECIMAL(10,2) NOT NULL,
    reservoir_level      DECIMAL(10,2),
    operator_id          UUID,
    operator_name        VARCHAR(100),
    remark               TEXT,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_water_level_records_record_time ON water_level_records(record_time);
CREATE INDEX IF NOT EXISTS idx_water_level_records_deleted_at ON water_level_records(deleted_at);

-- 1.2 闸门调度计划表
CREATE TABLE IF NOT EXISTS gate_schedules (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_date        TIMESTAMP NOT NULL,
    gate_no              VARCHAR(50) NOT NULL,
    planned_opening      DECIMAL(10,2) NOT NULL,
    planned_discharge    DECIMAL(10,2) NOT NULL,
    start_time           TIMESTAMP,
    end_time             TIMESTAMP,
    status               VARCHAR(20) DEFAULT 'draft',
    operator_id          UUID,
    operator_name        VARCHAR(100),
    remark               TEXT,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gate_schedules_schedule_date ON gate_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_gate_schedules_deleted_at ON gate_schedules(deleted_at);

-- 1.3 闸门实际开度表
CREATE TABLE IF NOT EXISTS gate_actual_openings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id          UUID,
    gate_no              VARCHAR(50) NOT NULL,
    actual_opening       DECIMAL(10,2) NOT NULL,
    actual_discharge     DECIMAL(10,2) NOT NULL,
    record_time          TIMESTAMP NOT NULL,
    deviation            DECIMAL(10,2),
    is_deviation_exceeded BOOLEAN DEFAULT FALSE,
    deviation_reason     TEXT,
    operator_id          UUID,
    operator_name        VARCHAR(100),
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gate_actual_openings_schedule_id ON gate_actual_openings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_gate_actual_openings_record_time ON gate_actual_openings(record_time);
CREATE INDEX IF NOT EXISTS idx_gate_actual_openings_deleted_at ON gate_actual_openings(deleted_at);

-- 1.4 生态流量确认表
CREATE TABLE IF NOT EXISTS ecological_flow_confirmations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id          UUID,
    min_required_flow    DECIMAL(10,2) NOT NULL,
    confirmed_flow       DECIMAL(10,2) NOT NULL,
    is_sufficient        BOOLEAN DEFAULT TRUE,
    compensation_note    TEXT,
    confirmed_at         TIMESTAMP,
    confirmer_id         UUID,
    confirmer_name       VARCHAR(100),
    status               VARCHAR(20) DEFAULT 'pending',
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ecological_flow_schedule_id ON ecological_flow_confirmations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_ecological_flow_deleted_at ON ecological_flow_confirmations(deleted_at);

-- 1.5 供水影响表
CREATE TABLE IF NOT EXISTS water_supply_impacts (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id          UUID,
    water_supply_unit    VARCHAR(200) NOT NULL,
    estimated_intake     DECIMAL(10,2),
    impact_level         VARCHAR(20),
    impact_desc          TEXT,
    viewed_at            TIMESTAMP,
    viewer_id            UUID,
    viewer_name          VARCHAR(100),
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_water_supply_impacts_schedule_id ON water_supply_impacts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_w_supply_impacts_deleted_at ON water_supply_impacts(deleted_at);

-- 1.6 审批记录表
CREATE TABLE IF NOT EXISTS approval_records (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id          UUID,
    business_type        VARCHAR(50) NOT NULL,
    approval_type        VARCHAR(50) NOT NULL,
    approver_id          UUID,
    approver_name        VARCHAR(100),
    approval_result      VARCHAR(20) NOT NULL,
    approval_opinion     TEXT,
    approved_at          TIMESTAMP,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_approval_records_business_id ON approval_records(business_id);
CREATE INDEX IF NOT EXISTS idx_approval_records_deleted_at ON approval_records(deleted_at);

-- 1.7 预警记录表
CREATE TABLE IF NOT EXISTS warning_records (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warning_type         VARCHAR(50) NOT NULL,
    warning_level        VARCHAR(20) NOT NULL,
    warning_msg          TEXT NOT NULL,
    business_id          UUID,
    business_type         VARCHAR(50),
    is_handled           BOOLEAN DEFAULT FALSE,
    handled_at           TIMESTAMP,
    handler_id           UUID,
    handler_name         VARCHAR(100),
    handle_remark        TEXT,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at           TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_warning_records_deleted_at ON warning_records(deleted_at);

-- ============================================================
-- 2. 插入演示种子数据（可选，便于联调；ON CONFLICT DO NOTHING 保证幂等）
-- ============================================================

INSERT INTO water_level_records (id, record_time, upstream_inflow, downstream_water_level, reservoir_level, operator_name, remark)
VALUES
  (gen_random_uuid(), NOW() - INTERVAL '6 hours', 45.50, 33.20, 42.80, '调度员张三', '正常水位'),
  (gen_random_uuid(), NOW() - INTERVAL '4 hours', 48.30, 33.80, 43.10, '调度员张三', '来水增加'),
  (gen_random_uuid(), NOW() - INTERVAL '2 hours', 52.10, 34.50, 43.50, '调度员李四', '水位接近警戒'),
  (gen_random_uuid(), NOW() - INTERVAL '1 hour', 55.20, 35.60, 43.90, '调度员李四', '下游水位超警戒')
ON CONFLICT DO NOTHING;

INSERT INTO gate_schedules (id, schedule_date, gate_no, planned_opening, planned_discharge, status, operator_name, remark)
VALUES
  (gen_random_uuid(), NOW() - INTERVAL '1 day', '1号闸门', 40.00, 35.00, 'approved', '调度员张三', '正常调度'),
  (gen_random_uuid(), NOW() - INTERVAL '1 day', '2号闸门', 30.00, 25.00, 'approved', '调度员张三', '正常调度'),
  (gen_random_uuid(), NOW(), '1号闸门', 50.00, 45.00, 'pending_approval', '调度员李四', '待审批'),
  (gen_random_uuid(), NOW(), '3号闸门', 20.00, 15.00, 'draft', '调度员李四', '草稿状态')
ON CONFLICT DO NOTHING;

INSERT INTO gate_actual_openings (id, schedule_id, gate_no, actual_opening, actual_discharge, record_time, deviation, is_deviation_exceeded, deviation_reason, operator_name)
SELECT gen_random_uuid(), gs.id, gs.gate_no, gs.planned_opening + 2.5, gs.planned_discharge + 2.0, NOW() - INTERVAL '12 hours', 2.5, FALSE, NULL, '操作员王五'
FROM gate_schedules gs WHERE gs.status = 'approved' LIMIT 2
ON CONFLICT DO NOTHING;

INSERT INTO gate_actual_openings (id, schedule_id, gate_no, actual_opening, actual_discharge, record_time, deviation, is_deviation_exceeded, deviation_reason, operator_name)
SELECT gen_random_uuid(), gs.id, gs.gate_no, gs.planned_opening + 8.0, gs.planned_discharge + 6.0, NOW() - INTERVAL '6 hours', 8.0, TRUE, '设备液压系统压力波动临时调整', '操作员赵六'
FROM gate_schedules gs WHERE gs.status = 'approved' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ecological_flow_confirmations (id, schedule_id, min_required_flow, confirmed_flow, is_sufficient, compensation_note, confirmer_name, status, confirmed_at)
SELECT gen_random_uuid(), gs.id, 10.00, 12.00, TRUE, NULL, '生态专员孙七', 'confirmed', NOW()
FROM gate_schedules gs WHERE gs.status = 'approved' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO ecological_flow_confirmations (id, schedule_id, min_required_flow, confirmed_flow, is_sufficient, compensation_note, confirmer_name, status)
SELECT gen_random_uuid(), gs.id, 10.00, 8.50, FALSE, '通过下游生态补水站临时补水 1.5 m³/s 进行补偿', '生态专员孙七', 'confirmed'
FROM gate_schedules gs WHERE gs.status = 'approved' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO water_supply_impacts (id, schedule_id, water_supply_unit, estimated_intake, impact_level, impact_desc, viewed_at, viewer_name)
SELECT gen_random_uuid(), gs.id, '城东自来水厂', gs.planned_discharge * 0.3, 'medium', '下泄流量中等，对取水有一定影响', NOW() - INTERVAL '3 hours', '水厂王工'
FROM gate_schedules gs WHERE gs.status = 'approved' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO water_supply_impacts (id, schedule_id, water_supply_unit, estimated_intake, impact_level, impact_desc)
SELECT gen_random_uuid(), gs.id, '城西工业区', gs.planned_discharge * 0.2, 'low', '下泄流量充足，取水基本不受影响'
FROM gate_schedules gs WHERE gs.status = 'approved' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO approval_records (id, business_id, business_type, approval_type, approver_name, approval_result, approval_opinion, approved_at)
SELECT gen_random_uuid(), gs.id, 'gate_schedule', 'approval', '审批员周八', 'approved', '同意执行调度计划', NOW()
FROM gate_schedules gs WHERE gs.status = 'approved' LIMIT 2
ON CONFLICT DO NOTHING;

INSERT INTO warning_records (id, warning_type, warning_level, warning_msg, business_id, business_type, is_handled, handled_at, handler_name, handle_remark)
SELECT gen_random_uuid(), 'water_level', 'high', '下游水位超过警戒水位(35.00m)', wlr.id, 'water_level', FALSE, NULL, NULL, NULL
FROM water_level_records wlr WHERE wlr.downstream_water_level >= 35.00 LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO warning_records (id, warning_type, warning_level, warning_msg, is_handled)
VALUES
  (gen_random_uuid(), 'gate_deviation', 'medium', '闸门实际开度与计划偏差过大，偏差值: 8.00%', FALSE),
  (gen_random_uuid(), 'ecological_flow', 'high', '生态流量不足，需生成补偿说明', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. 验证
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE ' 初始化完成。各表记录数：';
  RAISE NOTICE '============================================';
END $$;

SELECT 'water_level_records' AS table_name, COUNT(*) AS row_count FROM water_level_records
UNION ALL SELECT 'gate_schedules', COUNT(*) FROM gate_schedules
UNION ALL SELECT 'gate_actual_openings', COUNT(*) FROM gate_actual_openings
UNION ALL SELECT 'ecological_flow_confirmations', COUNT(*) FROM ecological_flow_confirmations
UNION ALL SELECT 'water_supply_impacts', COUNT(*) FROM water_supply_impacts
UNION ALL SELECT 'approval_records', COUNT(*) FROM approval_records
UNION ALL SELECT 'warning_records', COUNT(*) FROM warning_records;
