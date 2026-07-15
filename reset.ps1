# EV Charging Platform - Reset Database Script
# 清空数据库并重新填充种子数据
param(
    [switch]$SkipStop,
    [switch]$SkipStart
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$SeedDir = Join-Path $ProjectRoot "backend\scripts\seed"

function Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "[OK] $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

# Docker PostgreSQL 配置
$pgContainer = "ev-postgres"
$pgUser = "ev"
$pgPassword = "ev123"

# 执行 SQL 文件
function Invoke-SqlFile($database, $sqlFile) {
    $fullPath = Join-Path $SeedDir $sqlFile
    if (-not (Test-Path $fullPath)) {
        Err "File not found: $fullPath"
        return $false
    }

    Log "  Executing: $sqlFile"
    try {
        # 复制文件到容器并执行
        docker cp $fullPath "${pgContainer}:/tmp/$sqlFile" 2>&1 | Out-Null
        $result = docker exec -e PGPASSWORD=$pgPassword $pgContainer psql -U $pgUser -d $database -f "/tmp/$sqlFile" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Ok "  Done"
            return $true
        } else {
            Err "  Failed: $result"
            return $false
        }
    } catch {
        Err "  Error: $_"
        return $false
    }
}

Write-Host ""
Write-Host "EV Charging Platform - Database Reset" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Stop all services" -ForegroundColor Gray
Write-Host "  2. Drop and recreate all databases" -ForegroundColor Gray
Write-Host "  3. Execute seed data scripts" -ForegroundColor Gray
Write-Host "  4. Restart services" -ForegroundColor Gray
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
    Log "Step 1/4: Stopping all services..."
    $stopScript = Join-Path $ProjectRoot "stop.ps1"
    if (Test-Path $stopScript) {
        & $stopScript
        Start-Sleep -Seconds 3
    } else {
        Warn "stop.ps1 not found, skipping..."
    }
} else {
    Log "Step 1/4: Skipping stop (already stopped)"
}

# ============================================================
# Step 2: Reset databases
# ============================================================
Log "Step 2/4: Resetting databases..."

$databases = @("ev_identity", "ev_station", "ev_order")

foreach ($db in $databases) {
    Log "  Resetting $db..."

    # 终止现有连接
    try {
        docker exec -e PGPASSWORD=$pgPassword $pgContainer psql -U $pgUser -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db' AND pid <> pg_backend_pid();" 2>&1 | Out-Null
    } catch {}

    # 删除并重建数据库
    try {
        docker exec -e PGPASSWORD=$pgPassword $pgContainer psql -U $pgUser -d postgres -c "DROP DATABASE IF EXISTS $db;" 2>&1 | Out-Null
        docker exec -e PGPASSWORD=$pgPassword $pgContainer psql -U $pgUser -d postgres -c "CREATE DATABASE $db;" 2>&1 | Out-Null
        Ok "$db reset complete"
    } catch {
        Err "Failed to reset $db : $_"
        exit 1
    }
}

# ============================================================
# Step 3: Execute seed data
# ============================================================
Log "Step 3/4: Executing seed data scripts..."

# Identity 种子数据
Log "  Database: ev_identity"
Invoke-SqlFile "ev_identity" "identity_truncate.sql"
Invoke-SqlFile "ev_identity" "identity_seed_users.sql"

# Station 种子数据
Log "  Database: ev_station"
Invoke-SqlFile "ev_station" "station_truncate.sql"
Invoke-SqlFile "ev_station" "station_seed_stations.sql"

# Order 种子数据
Log "  Database: ev_order"
Invoke-SqlFile "ev_order" "order_truncate.sql"
Invoke-SqlFile "ev_order" "order_seed_orders.sql"
Invoke-SqlFile "ev_order" "order_seed_alerts.sql"

# ============================================================
# Step 4: Start services
# ============================================================
if (-not $SkipStart) {
    Log "Step 4/4: Starting services..."
    $startScript = Join-Path $ProjectRoot "start.ps1"
    if (Test-Path $startScript) {
        & $startScript
    } else {
        Err "start.ps1 not found"
        exit 1
    }
} else {
    Log "Step 4/4: Skipping start"
}

# ============================================================
# Summary
# ============================================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database reset complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Seed data populated:" -ForegroundColor White
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
