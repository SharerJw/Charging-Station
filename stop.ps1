# EV Charging Platform - Stop Script
$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot

function Ok($msg)  { Write-Host "[OK] $msg" -ForegroundColor Green }
function Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan }

Write-Host ""
Write-Host "EV Charging Platform - Stop" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Stop frontend ports
$frontendPorts = @(5173, 5175, 5176, 5177)
Log "Stopping frontend apps..."
foreach ($port in $frontendPorts) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            if ($proc -and $proc.Id -ne $PID) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Ok "Port $port - PID $($proc.Id) stopped"
            }
        }
    } catch {}
}

# Stop backend ports
$backendPorts = @(8080, 8081, 8082, 8083, 8084, 8085)
Log "Stopping backend services..."
foreach ($port in $backendPorts) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            if ($proc -and $proc.Id -ne $PID) {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Ok "Port $port - PID $($proc.Id) stopped"
            }
        }
    } catch {}
}

# Stop Docker
Log "Stopping Docker containers..."
$dockerDir = Join-Path $ProjectRoot "docker"
if (Test-Path $dockerDir) {
    Set-Location $dockerDir
    docker compose down 2>&1 | Out-Null
    Set-Location $ProjectRoot
    Ok "Docker containers stopped"
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "All services stopped" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
