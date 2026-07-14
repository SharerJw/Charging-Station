#!/bin/bash
# EV充电平台 - 一键启动脚本
# Usage: ./start.sh [all|infra|backend|frontend]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKEND_DIR="$PROJECT_ROOT/backend"
DOCKER_DIR="$PROJECT_ROOT/docker"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1"; }
ok()  { echo -e "${GREEN}[✓]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; }

# ============================================================
# 检查依赖
# ============================================================
check_deps() {
    log "检查依赖..."

    if ! command -v docker &>/dev/null; then
        err "Docker 未安装。请先安装 Docker Desktop: https://docker.com"
        exit 1
    fi
    ok "Docker: $(docker --version | head -1)"

    if ! command -v java &>/dev/null; then
        err "Java 未安装。需要 JDK 21: https://adoptium.net"
        exit 1
    fi

    JAVA_VER=$(java -version 2>&1 | head -1 | grep -oP '"\K[0-9]+')
    if [ "$JAVA_VER" -lt 21 ]; then
        err "Java 版本过低 ($JAVA_VER)。需要 JDK 21"
        exit 1
    fi
    ok "Java: $(java -version 2>&1 | head -1)"

    if ! command -v node &>/dev/null; then
        err "Node.js 未安装。需要 Node 18+: https://nodejs.org"
        exit 1
    fi
    ok "Node: $(node --version)"
}

# ============================================================
# 启动基础设施
# ============================================================
start_infra() {
    log "启动 Docker 基础设施..."
    cd "$DOCKER_DIR"
    docker compose up -d

    log "等待服务就绪..."
    for i in $(seq 1 30); do
        if docker ps | grep -q "ev-postgres.*healthy" && \
           docker ps | grep -q "ev-redis.*healthy"; then
            ok "基础设施就绪"
            return 0
        fi
        sleep 2
    done
    err "基础设施启动超时"
    return 1
}

# ============================================================
# 构建并启动后端
# ============================================================
start_backend() {
    log "构建后端服务..."
    cd "$BACKEND_DIR"

    # 自动检测 JAVA_HOME
    if [ -z "$JAVA_HOME" ]; then
        if [ -d "/d/Program Files/Java/jdk-21.0.10" ]; then
            export JAVA_HOME="/d/Program Files/Java/jdk-21.0.10"
        elif [ -d "/c/Program Files/Java/jdk-21" ]; then
            export JAVA_HOME="/c/Program Files/Java/jdk-21"
        fi
    fi

    if [ -f "./gradlew" ]; then
        chmod +x ./gradlew
        ./gradlew build -x test --no-daemon -q
    else
        err "gradlew 不存在"
        exit 1
    fi
    ok "构建完成"

    log "启动 6 个后端服务..."
    local SERVICES=(
        "ev-gateway:8080"
        "ev-service:ev-service-identity:8081"
        "ev-service:ev-service-station:8082"
        "ev-service:ev-service-order:8083"
        "ev-service:ev-service-charging:8084"
        "ev-service:ev-service-simulator:8085"
    )

    for svc in "${SERVICES[@]}"; do
        local task=$(echo "$svc" | cut -d: -f1-2)
        local port=$(echo "$svc" | cut -d: -f3)
        ./gradlew ":${task}:bootRun" --no-daemon > /tmp/ev-$(echo "$task" | tr ':' '-').log 2>&1 &
    done

    log "等待后端服务就绪 (最多60秒)..."
    for i in $(seq 1 30); do
        local count=0
        for port in 8080 8081 8082 8083 8084 8085; do
            if curl -sf "http://localhost:$port/actuator/health" >/dev/null 2>&1; then
                count=$((count+1))
            fi
        done
        if [ "$count" -eq 6 ]; then
            ok "6个后端服务全部就绪"
            return 0
        fi
        sleep 2
    done
    err "部分服务启动超时"
    return 1
}

# ============================================================
# 启动前端
# ============================================================
start_frontend() {
    log "安装前端依赖并启动..."

    local APPS=("admin-web:5173" "ops-app:5175" "user-miniapp:5176" "simulator-web:5177")

    for app in "${APPS[@]}"; do
        local name=$(echo "$app" | cut -d: -f1)
        local port=$(echo "$app" | cut -d: -f2)
        local dir="$PROJECT_ROOT/apps/$name"

        if [ ! -d "$dir/node_modules" ]; then
            log "安装 $name 依赖..."
            cd "$dir" && npm install -q 2>/dev/null
        fi

        cd "$dir"
        if [ "$name" = "ops-app" ] || [ "$name" = "user-miniapp" ]; then
            VITE_USE_MOCK=false npx uni --port "$port" > /tmp/ev-$name.log 2>&1 &
        else
            VITE_USE_MOCK=false npx vite --port "$port" > /tmp/ev-$name.log 2>&1 &
        fi
    done

    ok "前端应用启动中..."
    sleep 3

    for app in "${APPS[@]}"; do
        local port=$(echo "$app" | cut -d: -f2)
        if curl -sf "http://localhost:$port" >/dev/null 2>&1; then
            ok "http://localhost:$port ✓"
        else
            log "http://localhost:$port 启动中..."
        fi
    done
}

# ============================================================
# 主流程
# ============================================================
echo ""
echo -e "${BLUE}⚡ EV充电平台 - 一键启动${NC}"
echo "================================"
echo ""

check_deps
echo ""

case "${1:-all}" in
    infra)
        start_infra
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    all)
        start_infra
        echo ""
        start_backend
        echo ""
        start_frontend
        ;;
    *)
        echo "Usage: $0 [all|infra|backend|frontend]"
        exit 1
        ;;
esac

echo ""
echo "================================"
echo -e "${GREEN}启动完成！${NC}"
echo ""
echo "  Gateway:     http://localhost:8080"
echo "  Admin Web:   http://localhost:5173"
echo "  Ops App:     http://localhost:5175"
echo "  User App:    http://localhost:5176"
echo "  Simulator:   http://localhost:5177"
echo ""
echo "  演示账号: admin / admin123"
echo "================================"
