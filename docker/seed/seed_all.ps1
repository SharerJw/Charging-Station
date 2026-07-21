# ============================================================
# EV 充电平台 - 种子数据导入脚本 (Windows PowerShell)
# 日期: 2026-07-21
# 用法: .\docker\seed\seed_all.ps1
# ============================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  EV 充电平台 - 种子数据导入" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 PostgreSQL 容器
$pgRunning = docker ps --format '{{.Names}}' 2>$null | Select-String 'ev-postgres'
if (-not $pgRunning) {
    Write-Host "[ERROR] ev-postgres 容器未运行，请先启动基础设施" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] 导入 ev_identity 种子数据..." -ForegroundColor Yellow
Get-Content "$ScriptDir\01_seed_identity.sql" | docker exec -i ev-postgres psql -U ev -d ev_identity 2>$null | Select-Object -Last 1
Write-Host ""

Write-Host "[2/4] 导入 ev_station 种子数据（含电价方案、优惠券表）..." -ForegroundColor Yellow
Get-Content "$ScriptDir\02_seed_station.sql" | docker exec -i ev-postgres psql -U ev -d ev_station 2>$null | Select-Object -Last 1
Write-Host ""

Write-Host "[3/4] 导入 ev_order 种子数据（含统计报表）..." -ForegroundColor Yellow
Get-Content "$ScriptDir\03_seed_order.sql" | docker exec -i ev-postgres psql -U ev -d ev_order 2>$null | Select-Object -Last 1
Write-Host ""

Write-Host "[4/4] 导入 ev_charging 种子数据..." -ForegroundColor Yellow
Get-Content "$ScriptDir\04_seed_charging.sql" | docker exec -i ev-postgres psql -U ev -d ev_charging 2>$null | Select-Object -Last 1
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "  所有种子数据导入完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "数据概览:"
Write-Host "  用户:      22个 (admin/运维/财务/站长/普通用户/VIP)"
Write-Host "  角色:      7个 (admin/ops/ops_leader/finance/station_mgr/user/vip)"
Write-Host "  权限:      40+ 细粒度权限 (树形菜单+按钮)"
Write-Host "  充电站:    10个 (覆盖全国主要城市)"
Write-Host "  设备:      25台 (直流快充+交流慢充)"
Write-Host "  连接器:    50个 (2个/设备)"
Write-Host "  电价方案:  5个 (分时/节假日/VIP/夜间/商业)"
Write-Host "  优惠券:    7个模板 + 15个实例"
Write-Host "  订单:      49条 (覆盖全部10种状态)"
Write-Host "  支付记录:  34条"
Write-Host "  告警:      20条 (P0~P3)"
Write-Host "  工单:      15条 (维修/维护/巡检)"
Write-Host "  巡检任务:  10条"
Write-Host "  统计数据:  30天日报 + 7个月月报"
Write-Host "  充电会话:  10条"
Write-Host ""
