@echo off
REM EV充电平台 - Windows一键启动脚本
REM Usage: start.bat

echo.
echo ⚡ EV充电平台 - 一键启动
echo ================================
echo.

REM 检查Docker
docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo [✗] Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)
echo [✓] Docker 已就绪

REM 检查Java
java -version 2>&1 | findstr "21" >nul
if %errorlevel% neq 0 (
    echo [!] 未检测到 Java 21，请确保 JAVA_HOME 已设置
)
echo [✓] Java 已就绪

REM 启动Docker基础设施
echo.
echo [1/3] 启动 Docker 基础设施...
cd docker
docker compose up -d
echo [✓] 基础设施启动完成

REM 等待数据库就绪
echo 等待数据库就绪...
timeout /t 10 /nobreak >nul

REM 构建后端
echo.
echo [2/3] 构建后端服务...
cd ..\backend
call gradlew.bat build -x test --no-daemon -q
if %errorlevel% neq 0 (
    echo [✗] 构建失败
    pause
    exit /b 1
)
echo [✓] 构建完成

REM 启动后端服务
echo 启动 6 个后端服务...
start "Gateway"     cmd /c "gradlew.bat :ev-gateway:bootRun --no-daemon"
start "Identity"    cmd /c "gradlew.bat :ev-service:ev-service-identity:bootRun --no-daemon"
start "Station"     cmd /c "gradlew.bat :ev-service:ev-service-station:bootRun --no-daemon"
start "Order"       cmd /c "gradlew.bat :ev-service:ev-service-order:bootRun --no-daemon"
start "Charging"    cmd /c "gradlew.bat :ev-service:ev-service-charging:bootRun --no-daemon"
start "Simulator"   cmd /c "gradlew.bat :ev-service:ev-service-simulator:bootRun --no-daemon"

echo 等待后端服务就绪 (约30秒)...
timeout /t 30 /nobreak >nul

REM 安装前端依赖
echo.
echo [3/3] 启动前端应用...
cd ..\apps\admin-web
if not exist node_modules call npm install
start "Admin-Web" cmd /c "set VITE_USE_MOCK=false && npx vite --port 5173"

cd ..\ops-app
if not exist node_modules call npm install
start "Ops-App" cmd /c "set VITE_USE_MOCK=false && npx uni --port 5175"

cd ..\user-miniapp
if not exist node_modules call npm install
start "User-Miniapp" cmd /c "set VITE_USE_MOCK=false && npx uni --port 5176"

cd ..\simulator-web
if not exist node_modules call npm install
start "Simulator-Web" cmd /c "set VITE_USE_MOCK=false && set VITE_API_BASE_URL=http://localhost:8080/api && npx vite --port 5177"

echo.
echo ================================
echo 启动完成！
echo.
echo   Gateway:     http://localhost:8080
echo   Admin Web:   http://localhost:5173
echo   Ops App:     http://localhost:5175
echo   User App:    http://localhost:5176
echo   Simulator:   http://localhost:5177
echo.
echo   演示账号: admin / admin123
echo ================================
echo.
pause
