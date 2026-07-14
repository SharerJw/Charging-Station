@echo off
REM EV充电平台 - Windows停止脚本

echo.
echo ⚡ EV充电平台 - 停止服务
echo ================================
echo.

echo 停止前端应用...
for %%p in (5173 5175 5176 5177) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p.*LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1 && echo [✓] Port %%p stopped
    )
)

echo 停止后端服务...
for %%p in (8080 8081 8082 8083 8084 8085) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%p.*LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1 && echo [✓] Port %%p stopped
    )
)

echo 停止 Docker 容器...
cd docker
docker compose down 2>nul && echo [✓] Docker containers stopped
cd ..

echo.
echo ================================
echo 全部服务已停止
echo.
pause
