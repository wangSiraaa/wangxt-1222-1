#!/bin/bash
# ============================================================
# 水库闸门调度系统 - PostgreSQL 一键初始化脚本
# 用法: ./init.sh
# 环境变量: PGUSER(默认postgres) PGPASSWORD PGHOST(默认localhost) PGPORT(默认5432)
# ============================================================
set -e

PGUSER="${PGUSER:-postgres}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/init.sql"

echo "============================================"
echo " 水库闸门调度系统 - PostgreSQL 初始化"
echo "============================================"
echo "数据库主机: $PGHOST"
echo "数据库端口: $PGPORT"
echo "执行用户:   $PGUSER"
echo "SQL脚本:    $SQL_FILE"
echo "============================================"

if [ ! -f "$SQL_FILE" ]; then
  echo "[错误] 找不到 SQL 脚本: $SQL_FILE"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo "[错误] 未找到 psql 命令，请先安装 PostgreSQL 客户端工具"
  exit 1
fi

echo ""
echo "开始执行初始化脚本..."
echo "(如提示输入密码，请输入 PostgreSQL 用户 $PGUSER 的密码)"
echo ""

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -f "$SQL_FILE"

echo ""
echo "============================================"
echo " ✅ 数据库初始化完成！"
echo "============================================"
echo "数据库 reservoir_scheduling 已创建并填充演示数据"
echo ""
echo "请确认 backend/.env 中的配置："
echo "  DB_HOST=$PGHOST"
echo "  DB_PORT=$PGPORT"
echo "  DB_USER=$PGUSER"
echo "  DB_NAME=reservoir_scheduling"
echo "============================================"
