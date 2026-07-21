# Copy UniApp web resources to Android assets directory
# This script copies dist/build/app/ content into android/app/src/main/assets/www/

param(
    [string]$SourceDir = "D:\Agent\claude\demo07\apps\ops-app\dist\build\app",
    [string]$TargetDir = "D:\Agent\claude\demo07\apps\ops-app\android\app\src\main\assets\www"
)

Write-Host "=== EV Ops Android Asset Copy ===" -ForegroundColor Cyan

# Check if source directory exists
if (-not (Test-Path $SourceDir)) {
    Write-Host "[ERROR] Source directory not found: $SourceDir" -ForegroundColor Red
    Write-Host "Please run 'uni build -p app' first to generate the web resources." -ForegroundColor Yellow
    exit 1
}

# Create target directory if it doesn't exist
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "[OK] Created target directory: $TargetDir" -ForegroundColor Green
}

# Clear old assets
Remove-Item -Path "$TargetDir\*" -Recurse -Force -ErrorAction SilentlyContinue

# Copy all files from source to target
Copy-Item -Path "$SourceDir\*" -Destination $TargetDir -Recurse -Force

# Count copied items
$fileCount = (Get-ChildItem -Path $TargetDir -Recurse -File).Count
$dirCount = (Get-ChildItem -Path $TargetDir -Recurse -Directory).Count

Write-Host "[OK] Copied $fileCount files and $dirCount directories" -ForegroundColor Green
Write-Host "[OK] Assets ready at: $TargetDir" -ForegroundColor Green
Write-Host "=== Done ===" -ForegroundColor Cyan
