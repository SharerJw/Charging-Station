#!/bin/bash
# EV充电平台 - 停止脚本
# Usage: ./stop.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "⚡ EV充电平台 - 停止服务"
echo "================================"

# 停止前端 (端口 5173-5177)
echo "停止前端应用..."
for port in 5173 5175 5176 5177; do
    pid=$(netstat -ano 2>/dev/null | grep ":$port.*LISTENING" | head -1 | awk '{print $5}' || \
          lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        kill $pid 2>/dev/null && echo -e "${GREEN}✓${NC} Port $port stopped (PID $pid)"
    fi
done

# 停止后端 (端口 8080-8085)
echo "停止后端服务..."
for port in 8080 8081 8082 8083 8084 8085; do
    pid=$(netstat -ano 2>/dev/null | grep ":$port.*LISTENING" | head -1 | awk '{print $5}' || \
          lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ] && [ "$pid" != "0" ]; then
        kill $pid 2>/dev/null && echo -e "${GREEN}✓${NC} Port $port stopped (PID $pid)"
    fi
done

# 停止Docker容器
echo "停止 Docker 容器..."
cd "$(dirname "$0")/docker" 2>/dev/null && docker compose down 2>/dev/null && echo -e "${GREEN}✓${NC} Docker containers stopped"

echo ""
echo "================================"
echo -e "${GREEN}全部服务已停止${NC}"
