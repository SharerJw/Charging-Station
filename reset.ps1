# EV Charging Platform - Reset Database Script
# 清空数据库并重新填充种子数据
param(
    [switch]$SkipStop,
    [switch]$SkipStart
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

function Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "[OK] $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

# Docker PostgreSQL 配置
$pgContainer = "ev-postgres"
$pgUser = "ev"
$pgPassword = "ev123"

# 执行 SQL 命令
function Invoke-PgSql($database, $sql) {
    $env:PGPASSWORD = $pgPassword
    $result = docker exec $pgContainer psql -U $pgUser -d $database -c $sql 2>&1
    $env:PGPASSWORD = $null
    return $result
}

Write-Host ""
Write-Host "EV Charging Platform - Database Reset" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Stop all services" -ForegroundColor Gray
Write-Host "  2. Drop and recreate all databases" -ForegroundColor Gray
Write-Host "  3. Restart services (Flyway will populate seed data)" -ForegroundColor Gray
Write-Host ""

# 检查 Docker PostgreSQL 是否运行
$pgRunning = docker ps --filter "name=$pgContainer" --format "{{.Names}}" 2>$null
if (-not $pgRunning) {
    Err "PostgreSQL container '$pgContainer' is not running!"
    Log "Start it with: cd docker && docker compose up -d postgres"
    exit 1
}
Ok "PostgreSQL container is running"

# ============================================================
# Step 1: Stop services
# ============================================================
if (-not $SkipStop) {
    Log "Step 1/3: Stopping all services..."
    $stopScript = Join-Path $ProjectRoot "stop.ps1"
    if (Test-Path $stopScript) {
        & $stopScript
        Start-Sleep -Seconds 3
    } else {
        Warn "stop.ps1 not found, skipping..."
    }
} else {
    Log "Step 1/3: Skipping stop (already stopped)"
}

# ============================================================
# Step 2: Reset databases
# ============================================================
Log "Step 2/3: Resetting databases..."

$databases = @("ev_identity", "ev_station", "ev_order")

foreach ($db in $databases) {
    Log "  Resetting $db..."

    # 终止现有连接
    try {
        Invoke-PgSql "postgres" "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db' AND pid <> pg_backend_pid();" | Out-Null
    } catch {}

    # 删除并重建数据库
    try {
        Invoke-PgSql "postgres" "DROP DATABASE IF EXISTS $db;" | Out-Null
        Invoke-PgSql "postgres" "CREATE DATABASE $db;" | Out-Null
        Ok "$db reset complete"
    } catch {
        Err "Failed to reset $db : $_"
        exit 1
    }
}

# ============================================================
# Step 3: Start services
# ============================================================
if (-not $SkipStart) {
    Log "Step 3/3: Starting services (Flyway will populate seed data)..."
    $startScript = Join-Path $ProjectRoot "start.ps1"
    if (Test-Path $startScript) {
        & $startScript
    } else {
        Err "start.ps1 not found"
        exit 1
    }
} else {
    Log "Step 3/3: Skipping start"
}

# ============================================================
# Summary
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database reset complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Seed data will be populated by Flyway on first startup." -ForegroundColor White
Write-Host ""
Write-Host "Expected data:" -ForegroundColor White
Write-Host "  - Users:        5,000" -ForegroundColor Gray
Write-Host "  - Stations:     200" -ForegroundColor Gray
Write-Host "  - Devices:      1,000" -ForegroundColor Gray
Write-Host "  - Orders:       100,000" -ForegroundColor Gray
Write-Host "  - Alerts:       500" -ForegroundColor Gray
Write-Host "  - Work Orders:  200" -ForegroundColor Gray
Write-Host ""
Write-Host "Test accounts:" -ForegroundColor White
Write-Host "  - user_0001 / 123456 (Admin)" -ForegroundColor Gray
Write-Host "  - user_0002 / 123456 (Admin)" -ForegroundColor Gray
Write-Host ""
