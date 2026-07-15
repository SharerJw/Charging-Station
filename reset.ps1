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

Write-Host ""
Write-Host "EV Charging Platform - Database Reset" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "  1. Stop all services" -ForegroundColor Gray
Write-Host "  2. Drop and recreate all databases" -ForegroundColor Gray
Write-Host "  3. Restart services (Flyway will populate seed data)" -ForegroundColor Gray
Write-Host ""

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

    # Terminate existing connections
    $terminateSql = @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$db' AND pid <> pg_backend_pid();
"@
    try {
        $terminateSql | psql -h localhost -U postgres -d postgres 2>&1 | Out-Null
    } catch {}

    # Drop and recreate database
    $resetSql = "DROP DATABASE IF EXISTS $db; CREATE DATABASE $db;"
    try {
        $resetSql | psql -h localhost -U postgres -d postgres 2>&1 | Out-Null
        Ok "$db reset complete"
    } catch {
        Err "Failed to reset $db : $_"
        exit 1
    }
}

# Also reset simulator database if exists
$simDb = "ev_simulator"
try {
    "DROP DATABASE IF EXISTS $simDb; CREATE DATABASE $simDb;" | psql -h localhost -U postgres -d postgres 2>&1 | Out-Null
    Ok "$simDb reset complete"
} catch {
    Warn "$simDb not found or already clean"
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
