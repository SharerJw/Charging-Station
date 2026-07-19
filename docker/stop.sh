#!/bin/bash

# ============================================
# EV 充电平台 - 停止脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;6m'
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

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# 停止 Docker 服务
stop_docker_services() {
    print_header "停止 Docker 服务"

    if [ -f "docker-compose.prod.yml" ]; then
        print_info "停止生产环境容器..."
        docker-compose -f docker-compose.prod.yml down
    elif [ -f "docker-compose.yml" ]; then
        print_info "停止开发环境容器..."
        docker-compose down
    else
        print_warning "未找到 docker-compose 文件"
    fi

    print_success "Docker 服务已停止"
}

# 停止前端进程
stop_frontend_processes() {
    print_header "停止前端进程"

    # 查找并停止 Node.js 进程
    print_info "停止 Node.js 进程..."

    # 查找占用特定端口的进程
    local ports=(5173 5175 5176 5177)

    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            print_info "停止端口 $port 上的进程 (PID: $pid)"
            kill -9 $pid 2>/dev/null || true
        fi
    done

    print_success "前端进程已停止"
}

# 清理临时文件
cleanup_temp_files() {
    print_header "清理临时文件"

    # 清理日志文件（可选）
    if [ "$1" = "--clean-logs" ]; then
        print_info "清理日志文件..."
        rm -rf logs/*
        print_success "日志文件已清理"
    fi

    # 清理构建缓存（可选）
    if [ "$1" = "--clean-build" ]; then
        print_info "清理构建缓存..."
        rm -rf ../backend/build
        rm -rf ../backend/*/build
        rm -rf ../apps/*/dist
        print_success "构建缓存已清理"
    fi
}

# 显示清理结果
show_cleanup_result() {
    print_header "清理完成"

    echo ""
    echo -e "${GREEN}✓${NC} 所有服务已停止"
    echo -e "${GREEN}✓${NC} 所有容器已移除"
    echo ""

    print_info "如需彻底清理，请运行："
    echo "  ./stop.sh --clean-logs    # 清理日志"
    echo "  ./stop.sh --clean-build   # 清理构建缓存"
    echo ""
}

# 主流程
main() {
    print_header "EV 充电平台 - 停止服务"
    echo ""

    # 切换到脚本所在目录
    cd "$(dirname "$0")"

    stop_docker_services
    stop_frontend_processes
    cleanup_temp_files "$1"
    show_cleanup_result
}

# 捕获中断信号
trap 'echo -e "\033[0;31m[ERROR]\033[0m 操作被中断"; exit 1' INT TERM

main
