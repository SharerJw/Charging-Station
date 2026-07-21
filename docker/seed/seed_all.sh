#!/bin/bash
# ============================================================
# EV 充电平台 - 种子数据导入脚本
# 日期: 2026-07-21
# 用法: bash docker/seed/seed_all.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "  EV 充电平台 - 种子数据导入"
echo "=========================================="
echo ""

# 检查 PostgreSQL 容器是否运行
if ! docker ps --format '{{.Names}}' | grep -q 'ev-postgres'; then
    echo -e "${RED}[ERROR]${NC} ev-postgres 容器未运行，请先启动基础设施"
    exit 1
fi

echo -e "${YELLOW}[1/4]${NC} 导入 ev_identity 种子数据..."
docker exec -i ev-postgres psql -U ev -d ev_identity < "$SCRIPT_DIR/01_seed_identity.sql" 2>&1 | tail -1
echo ""

echo -e "${YELLOW}[2/4]${NC} 导入 ev_station 种子数据（含电价方案、优惠券表）..."
docker exec -i ev-postgres psql -U ev -d ev_station < "$SCRIPT_DIR/02_seed_station.sql" 2>&1 | tail -1
echo ""

echo -e "${YELLOW}[3/4]${NC} 导入 ev_order 种子数据（含统计报表）..."
docker exec -i ev-postgres psql -U ev -d ev_order < "$SCRIPT_DIR/03_seed_order.sql" 2>&1 | tail -1
echo ""

echo -e "${YELLOW}[4/4]${NC} 导入 ev_charging 种子数据..."
docker exec -i ev-postgres psql -U ev -d ev_charging < "$SCRIPT_DIR/04_seed_charging.sql" 2>&1 | tail -1
echo ""

echo "=========================================="
echo -e "${GREEN}  所有种子数据导入完成！${NC}"
echo "=========================================="
echo ""
echo "数据概览:"
echo "  用户:      22个 (admin/运维/财务/站长/普通用户/VIP)"
echo "  角色:      7个 (admin/ops/ops_leader/finance/station_mgr/user/vip)"
echo "  权限:      40+ 细粒度权限 (树形菜单+按钮)"
echo "  充电站:    10个 (覆盖全国主要城市)"
echo "  设备:      25台 (直流快充+交流慢充)"
echo "  连接器:    50个 (2个/设备)"
echo "  电价方案:  5个 (分时/节假日/VIP/夜间/商业)"
echo "  优惠券:    7个模板 + 15个实例"
echo "  订单:      49条 (覆盖全部10种状态)"
echo "  支付记录:  34条"
echo "  告警:      20条 (P0~P3)"
echo "  工单:      15条 (维修/维护/巡检)"
echo "  巡检任务:  10条"
echo "  统计数据:  30天日报 + 7个月月报"
echo "  充电会话:  10条"
echo ""
