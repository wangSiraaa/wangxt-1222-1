#!/bin/bash
# ============================================================
# 水库闸门调度系统 - PostgreSQL 一键初始化脚本
# 用法: ./init.sh
# 环境变量:
#   PGUSER(默认postgres)  PGPASSWORD  PGHOST(默认localhost)  PGPORT(默认5432)
# ============================================================
set -e

PGUSER="${PGUSER:-postgres}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_NAME="reservoir_scheduling"
SCHEMA_SQL="$SCRIPT_DIR/init_schema.sql"

echo "============================================"
echo " 水库闸门调度系统 - PostgreSQL 初始化"
echo "============================================"
echo "主机:        $PGHOST"
echo "端口:        $PGPORT"
echo "用户:        $PGUSER"
echo "脚本目录:    $SCRIPT_DIR"
echo "============================================"

# ---------- 环境检查 ----------
if ! command -v psql &> /dev/null; then
  echo "[错误] 未找到 psql 命令，请先安装 PostgreSQL 客户端工具"
  exit 1
fi

if [ ! -f "$SCHEMA_SQL" ]; then
  echo "[错误] 找不到建表脚本: $SCHEMA_SQL"
  exit 1
fi

echo ""
echo "(如提示输入密码，请输入 PostgreSQL 用户 $PGUSER 的密码)"
echo ""

# ---------- Step 1. 建库（连接到 postgres 库执行，CREATE DATABASE 不能在事务块内
# ---------- 注意：PostgreSQL 不支持 CREATE DATABASE IF NOT EXISTS，故先判断
echo "[1/3] 检查并创建数据库 $DB_NAME（如已存在则跳过）..."
DB_EXISTS=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || true)
if [ "$DB_EXISTS" = "1" ]; then
  echo "   数据库 $DB_NAME 已存在，跳过建库"
else
  echo "   数据库 $DB_NAME 不存在，开始创建..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE $DB_NAME ENCODING 'UTF8' TEMPLATE=template0;"
  echo "   数据库 $DB_NAME 创建成功"
fi

# ---------- Step 2. 建表 + 种子数据 ----------
echo ""
echo "[2/3] 建表与插入种子数据..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DB_NAME" -f "$SCHEMA_SQL"

# ---------- Step 3. 验证 ----------
echo ""
echo "[3/3] 验证连接..."
TABLE_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null || echo "0")

echo ""
echo "============================================"
if [ "$TABLE_COUNT" -ge 7 ]; then
  echo " ✅ 数据库初始化完成！"
  echo "   已创建数据表数: $TABLE_COUNT"
else
  echo " ⚠️  初始化完成，但表数量异常: $TABLE_COUNT（预期≥7）"
fi
echo "============================================"
echo ""
echo "请确认 backend/.env 中以下配置与输出一致："
echo "  DB_HOST=$PGHOST"
echo "  DB_PORT=$PGPORT"
echo "  DB_USER=$PGUSER"
echo "  DB_NAME=$DB_NAME"
echo "============================================"
echo ""
echo "然后启动后端："
echo "  cd backend && cp .env.example .env && go run main.go"
echo ""
