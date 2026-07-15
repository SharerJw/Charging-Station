# EV Charging Platform - Seed Data Script
# 手动执行种子数据清空和重新填充
param(
    [ValidateSet("all", "truncate", "seed")]
    [string]$Action = "all",
    [switch]$Confirm
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

function Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "[OK] $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

# 数据库连接信息
$pgHost = "localhost"
$pgUser = "postgres"
$databases = @{
    "ev_identity" = "backend/ev-service/ev-service-identity/src/main/resources/db/migration"
    "ev_station"  = "backend/ev-service/ev-service-station/src/main/resources/db/migration"
    "ev_order"    = "backend/ev-service/ev-service-order/src/main/resources/db/migration"
}

# 种子数据文件（按执行顺序）
$seedFiles = @{
    "ev_identity" = @(
        "V4__truncate_all_data.sql",
        "V5__seed_large_users.sql"
    )
    "ev_station" = @(
        "V4__truncate_all_data.sql",
        "V5__seed_large_stations.sql"
    )
    "ev_order" = @(
        "V6__truncate_all_data.sql",
        "V7__seed_large_orders.sql",
        "V8__seed_large_alerts.sql"
    )
}

Write-Host ""
Write-Host "EV Charging Platform - Seed Data Manager" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host ""

# 确认操作
if (-not $Confirm) {
    Write-Host "This will:" -ForegroundColor White
    if ($Action -eq "all" -or $Action -eq "truncate") {
        Write-Host "  - TRUNCATE all tables in ev_identity, ev_station, ev_order" -ForegroundColor Gray
    }
    if ($Action -eq "all" -or $Action -eq "seed") {
        Write-Host "  - Insert ~190,000 rows of seed data" -ForegroundColor Gray
    }
    Write-Host ""

    $response = Read-Host "Continue? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# 执行 SQL 文件
function Execute-SqlFile($db, $sqlFile) {
    $fullPath = Join-Path $ProjectRoot $sqlFile
    if (-not (Test-Path $fullPath)) {
        Err "File not found: $fullPath"
        return $false
    }

    Log "  Executing: $(Split-Path $sqlFile -Leaf)"
    try {
        $result = psql -h $pgHost -U $pgUser -d $db -f $fullPath 2>&1
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

# 执行清空
if ($Action -eq "all" -or $Action -eq "truncate") {
    Log "Step 1: Truncating tables..."
    foreach ($db in $databases.Keys) {
        Log "  Database: $db"
        $truncateFile = $seedFiles[$db] | Where-Object { $_ -like "*truncate*" } | Select-Object -First 1
        if ($truncateFile) {
            Execute-SqlFile $db (Join-Path $databases[$db] $truncateFile)
        }
    }
    Write-Host ""
}

# 执行填充
if ($Action -eq "all" -or $Action -eq "seed") {
    Log "Step 2: Inserting seed data..."
    foreach ($db in $databases.Keys) {
        Log "  Database: $db"
        $files = $seedFiles[$db] | Where-Object { $_ -notlike "*truncate*" }
        foreach ($file in $files) {
            Execute-SqlFile $db (Join-Path $databases[$db] $file)
        }
    }
    Write-Host ""
}

# 验证
Log "Verifying data..."
$verifySql = @"
SELECT 'station' AS tbl, COUNT(*) AS cnt FROM station
UNION ALL SELECT 'device', COUNT(*) FROM device
UNION ALL SELECT 'charging_order', COUNT(*) FROM charging_order
UNION ALL SELECT 'sys_user', COUNT(*) FROM sys_user;
"@

$result = $verifySql | psql -h $pgHost -U $pgUser -d ev_station -t 2>&1
$result += $verifySql | psql -h $pgHost -U $pgUser -d ev_order -t 2>&1

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Seed data operation complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
