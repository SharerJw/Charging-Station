#!/bin/bash

# ============================================
# EV 充电平台 - 一键部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# 检查 Docker 是否安装
check_docker() {
    print_info "检查 Docker 安装状态..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_success "Docker 已安装"
}

# 检查 Docker 服务是否运行
check_docker_running() {
    print_info "检查 Docker 服务状态..."

    if ! docker info &> /dev/null; then
        print_error "Docker 服务未运行，请启动 Docker"
        exit 1
    fi

    print_success "Docker 服务运行中"
}

# 停止现有容器
stop_existing_containers() {
    print_info "停止现有容器..."

    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    elif [ -f "docker-compose.yml" ]; then
        docker-compose down 2>/dev/null || true
    fi

    print_success "现有容器已停止"
}

# 复制环境变量文件
setup_env() {
    print_info "配置环境变量..."

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "已创建 .env 文件，请根据需要修改配置"
        else
            print_error ".env.example 文件不存在"
            exit 1
        fi
    else
        print_info ".env 文件已存在，跳过创建"
    fi
}

# 启动基础设施
start_infrastructure() {
    print_header "启动基础设施服务"

    print_info "启动 PostgreSQL、Redis、Kafka、Nacos、MinIO..."

    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml up -d postgres redis kafka nacos minio
    else
        docker-compose up -d postgres redis kafka nacos minio
    fi

    print_success "基础设施服务启动完成"
}

# 等待服务就绪
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_info "等待 $service_name 服务就绪 (端口: $port)..."

    while [ $attempt -le $max_attempts ]; do
        if docker exec $(docker ps -q -f "name=$service_name") sh -c "nc -z localhost $port" 2>/dev/null; then
            print_success "$service_name 服务已就绪"
            return 0
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    print_error "$service_name 服务启动超时"
    return 1
}

# 等待所有基础设施就绪
wait_for_infrastructure() {
    print_header "等待基础设施服务就绪"

    # 等待 PostgreSQL
    wait_for_service "postgres" 5432

    # 等待 Redis
    wait_for_service "redis" 6379

    # 等待 Kafka
    wait_for_service "kafka" 9092

    # 等待 Nacos
    wait_for_service "nacos" 8848

    print_success "所有基础设施服务已就绪"
}

# 启动后端服务
start_backend() {
    print_header "启动后端微服务"

    print_info "构建后端项目..."
    cd ../backend && ./gradlew build -x test

    print_info "启动后端服务..."
    cd ../docker

    if [ -f "docker-compose.prod.yml" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi

    print_success "后端服务启动完成"
}

# 启动前端服务
start_frontend() {
    print_header "启动前端应用"

    # 管理后台
    print_info "启动管理后台 (admin-web)..."
    cd ../apps/admin-web
    pnpm install --frozen-lockfile
    pnpm dev &

    # 运维移动端
    print_info "启动运维移动端 (ops-app)..."
    cd ../ops-app
    pnpm install --frozen-lockfile
    pnpm dev:h5 &

    # 用户小程序
    print_info "启动用户小程序 (user-miniapp)..."
    cd ../user-miniapp
    pnpm install --frozen-lockfile
    pnpm dev:h5 &

    cd ../../docker

    print_success "前端应用启动完成"
}

# 显示服务状态
show_status() {
    print_header "服务状态"

    echo ""
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""

    print_info "访问地址："
    echo -e "  ${CYAN}管理后台:${NC} http://localhost:5173"
    echo -e "  ${CYAN}运维移动端:${NC} http://localhost:5175"
    echo -e "  ${CYAN}用户小程序:${NC} http://localhost:5176"
    echo -e "  ${CYAN}API 网关:${NC} http://localhost:8080"
    echo -e "  ${CYAN}Nacos 控制台:${NC} http://localhost:8848/nacos"
    echo -e "  ${CYAN}MinIO 控制台:${NC} http://localhost:9001"
    echo ""
}

# 主流程
main() {
    print_header "EV 充电平台 - 一键部署"
    echo ""

    # 切换到脚本所在目录
    cd "$(dirname "$0")"

    check_docker
    check_docker_running
    setup_env
    stop_existing_containers
    start_infrastructure
    wait_for_infrastructure
    start_backend
    show_status

    print_header "部署完成"
    print_success "EV 充电平台已成功启动！"
    print_info "使用 'docker-compose -f docker-compose.prod.yml logs -f' 查看日志"
    print_info "使用 './stop.sh' 停止所有服务"
}

# 捕获中断信号
trap 'print_error "部署被中断"; exit 1' INT TERM

main
