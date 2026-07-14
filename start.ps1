# EV Charging Platform - PowerShell Start Script
param(
    [ValidateSet("all", "infra", "backend", "frontend")]
    [string]$Step = "all"
)

$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$DockerDir = Join-Path $ProjectRoot "docker"

function Log($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan }
function Ok($msg)  { Write-Host "[OK] $msg" -ForegroundColor Green }
function Err($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red }

function Test-Port($port) {
    $c = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return $null -ne $c
}

function Wait-Ports($ports, $timeoutSec, $label) {
    Log "Waiting for $label (max ${timeoutSec}s)..."
    $elapsed = 0
    while ($elapsed -lt $timeoutSec) {
        $up = 0
        foreach ($p in $ports) {
            if (Test-Port $p) { $up++ }
        }
        if ($up -eq $ports.Count) {
            Ok "$label ready ($up/$($ports.Count))"
            return $true
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
    }
    Err "$label timeout ($up/$($ports.Count) ready)"
    return $false
}

function Kill-Ports($ports) {
    foreach ($port in $ports) {
        try {
            $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($c in $conns) {
                $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
                if ($proc -and $proc.Id -ne $PID) {
                    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                }
            }
        } catch {}
    }
}

function Test-Dependencies {
    Log "Checking dependencies..."

    try {
        $dv = docker version --format '{{.Server.Version}}' 2>$null
        Ok "Docker: $dv"
    } catch {
        Err "Docker not found. Install Docker Desktop first."
        exit 1
    }

    try {
        $jv = java -version 2>&1 | Select-Object -First 1
        if ($jv -match '"(\d+)') {
            $ver = $matches[1]
            if ([int]$ver -lt 21) {
                Err "Java $ver found, need JDK 21+"
                exit 1
            }
            Ok "Java: JDK $ver"
        }
    } catch {
        Err "Java not found. Need JDK 21."
        exit 1
    }

    try {
        $nv = node --version 2>$null
        Ok "Node.js: $nv"
    } catch {
        Err "Node.js not found. Need Node 18+."
        exit 1
    }
}

function Start-Infrastructure {
    Log "Starting Docker infrastructure..."
    Set-Location $DockerDir
    docker compose up -d 2>&1 | Out-Null
    Set-Location $ProjectRoot

    Wait-Ports @(5432, 6379, 8848, 9000, 9092) 60 "Infrastructure"
}

function Start-Backend {
    Log "Cleaning old backend processes..."
    Kill-Ports @(8080, 8081, 8082, 8083, 8084, 8085)
    Start-Sleep -Seconds 2

    Log "Building backend..."
    Set-Location $BackendDir

    $gradlew = Join-Path $BackendDir "gradlew.bat"
    if (-not (Test-Path $gradlew)) {
        Err "gradlew.bat not found"
        Set-Location $ProjectRoot
        return
    }

    $buildOut = & $gradlew build -x test --no-daemon 2>&1
    if ($LASTEXITCODE -ne 0) {
        Err "Build failed"
        $buildOut | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkRed }
        Set-Location $ProjectRoot
        return
    }
    Ok "Build complete"

    Log "Starting 6 backend services..."
    $services = @(
        @{ Task = "ev-gateway";                             Port = 8080; Name = "Gateway" },
        @{ Task = "ev-service:ev-service-identity";         Port = 8081; Name = "Identity" },
        @{ Task = "ev-service:ev-service-station";          Port = 8082; Name = "Station" },
        @{ Task = "ev-service:ev-service-order";            Port = 8083; Name = "Order" },
        @{ Task = "ev-service:ev-service-charging";         Port = 8084; Name = "Charging" },
        @{ Task = "ev-service:ev-service-simulator";        Port = 8085; Name = "Simulator" }
    )

    foreach ($svc in $services) {
        $logOut = Join-Path $env:TEMP "ev-$($svc.Name.ToLower()).log"
        $logErr = Join-Path $env:TEMP "ev-$($svc.Name.ToLower())-err.log"
        Start-Process -FilePath "cmd" `
            -ArgumentList "/c", "gradlew.bat :$($svc.Task):bootRun --no-daemon > `"$logOut`" 2> `"$logErr`"" `
            -WorkingDirectory $BackendDir `
            -WindowStyle Hidden
        Write-Host "  Starting $($svc.Name) on port $($svc.Port)..." -ForegroundColor DarkGray
    }

    Set-Location $ProjectRoot
    Wait-Ports @(8080, 8081, 8082, 8083, 8084, 8085) 120 "Backend services"
}

function Start-Frontend {
    Log "Cleaning old frontend processes..."
    Kill-Ports @(5173, 5175, 5176, 5177)
    Start-Sleep -Seconds 2

    $apps = @(
        @{ Name = "admin-web";     Port = 5173; Exe = "cmd"; Args = @("/c", "npx vite --port 5173") },
        @{ Name = "ops-app";       Port = 5175; Exe = "cmd"; Args = @("/c", "npx uni --port 5175") },
        @{ Name = "user-miniapp";  Port = 5176; Exe = "cmd"; Args = @("/c", "npx uni --port 5176") },
        @{ Name = "simulator-web"; Port = 5177; Exe = "cmd"; Args = @("/c", "npx vite --port 5177") }
    )

    foreach ($app in $apps) {
        $dir = Join-Path $ProjectRoot "apps\$($app.Name)"

        if (-not (Test-Path (Join-Path $dir "node_modules"))) {
            Log "Installing $($app.Name) dependencies..."
            Set-Location $dir
            & cmd /c "npm install --silent" 2>&1 | Out-Null
            Set-Location $ProjectRoot
        }

        $logOut = Join-Path $env:TEMP "ev-$($app.Name).log"
        $logErr = Join-Path $env:TEMP "ev-$($app.Name)-err.log"
        $envCmd = "set VITE_USE_MOCK=false"
        if ($app.Name -eq "simulator-web") {
            $envCmd = "set VITE_USE_MOCK=false && set VITE_API_BASE_URL=http://localhost:8080/api"
        }
        Start-Process -FilePath "cmd" `
            -ArgumentList "/c", "$envCmd && $($app.Exe) $($app.Args -join ' ') > `"$logOut`" 2> `"$logErr`"" `
            -WorkingDirectory $dir `
            -WindowStyle Hidden
        Write-Host "  Starting $($app.Name) on port $($app.Port)..." -ForegroundColor DarkGray
    }

    Start-Sleep -Seconds 8
    foreach ($app in $apps) {
        if (Test-Port $app.Port) {
            Ok "http://localhost:$($app.Port)"
        } else {
            Write-Host "  http://localhost:$($app.Port) still starting..." -ForegroundColor DarkGray
        }
    }
}

# ============================================================
# Main
# ============================================================
Write-Host ""
Write-Host "EV Charging Platform - Start" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Test-Dependencies
Write-Host ""

switch ($Step) {
    "infra"    { Start-Infrastructure }
    "backend"  { Start-Backend }
    "frontend" { Start-Frontend }
    "all" {
        Start-Infrastructure
        Write-Host ""
        Start-Backend
        Write-Host ""
        Start-Frontend
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "  Gateway:     http://localhost:8080"
Write-Host "  Admin Web:   http://localhost:5173"
Write-Host "  Ops App:     http://localhost:5175"
Write-Host "  User App:    http://localhost:5176"
Write-Host "  Simulator:   http://localhost:5177"
Write-Host ""
Write-Host "  Demo: admin / admin123" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
