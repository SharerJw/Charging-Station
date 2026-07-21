#!/bin/bash
# ============================================================================
# Let's Encrypt SSL 证书自动配置脚本（生产环境）
# 用法: bash letsencrypt-setup.sh <domain> <email> [--staging]
# 示例: bash letsencrypt-setup.sh charging.example.com admin@example.com
#       bash letsencrypt-setup.sh charging.example.com admin@example.com --staging
# ============================================================================

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
STAGING="${3:-}"
NGINX_CONF_DIR="./nginx"
SSL_DIR="./ssl"

if [ -z "${DOMAIN}" ] || [ -z "${EMAIL}" ]; then
  echo "用法: bash letsencrypt-setup.sh <domain> <email> [--staging]"
  echo "  domain  - 你的域名（如 charging.example.com）"
  echo "  email   - 用于证书到期通知的邮箱"
  echo "  --staging - 使用 Let's Encrypt 测试环境（避免速率限制）"
  exit 1
fi

STAGING_FLAG=""
if [ "${STAGING}" = "--staging" ]; then
  STAGING_FLAG="--staging"
  echo "[INFO] 使用 Let's Encrypt 测试环境"
fi

echo "=========================================="
echo " EV 充电平台 - Let's Encrypt 证书配置"
echo "=========================================="
echo "域名: ${DOMAIN}"
echo "邮箱: ${EMAIL}"
echo "=========================================="

# 检查 certbot 是否已安装
if ! command -v certbot &> /dev/null; then
  echo "[INFO] certbot 未检测到，尝试使用 Docker 方式..."
  CERTBOT_CMD="docker run --rm -v ${SSL_DIR}:/etc/letsencrypt -v /var/www/certbot:/var/www/certbot certbot/certbot"
else
  CERTBOT_CMD="certbot"
fi

mkdir -p "${SSL_DIR}" "/var/www/certbot"

# 创建 Nginx 临时配置用于验证
echo "[STEP 1] 创建 ACME 验证用 Nginx 配置..."
cat > "${NGINX_CONF_DIR}/certbot.conf" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

echo "[STEP 2] 重启 Nginx 以加载验证配置..."
docker compose restart nginx 2>/dev/null || echo "[WARN] Nginx 容器未运行，跳过重启"

echo "[STEP 3] 申请 Let's Encrypt 证书..."
${CERTBOT_CMD} certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  -d "${DOMAIN}" \
  ${STAGING_FLAG} \
  --non-interactive

echo "[STEP 4] 配置 Nginx 使用 SSL 证书..."
SSL_CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"

cat > "${NGINX_CONF_DIR}/ssl.conf" <<EOF
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate     ${SSL_CERT_PATH}/fullchain.pem;
    ssl_certificate_key ${SSL_CERT_PATH}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://ev-gateway;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws/ {
        proxy_pass http://ev-gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo "[STEP 5] 设置自动续期..."
# 创建续期钩子脚本
cat > "${SSL_DIR}/renew-hook.sh" <<'HOOK'
#!/bin/bash
docker compose exec nginx nginx -s reload
HOOK
chmod +x "${SSL_DIR}/renew-hook.sh"

echo "[DONE] SSL 证书配置完成！"
echo ""
echo "后续操作："
echo "  1. 将 ${NGINX_CONF_DIR}/ssl.conf 中的配置合并到你的主 nginx.conf"
echo "  2. 重启 Nginx: docker compose restart nginx"
echo "  3. 手动续期: ${CERTBOT_CMD} renew"
echo "  4. 自动续期（添加 crontab）:"
echo "     0 3 * * 1 ${CERTBOT_CMD} renew --deploy-hook '${SSL_DIR}/renew-hook.sh'"
echo ""
echo "证书路径:"
echo "  证书: ${SSL_CERT_PATH}/fullchain.pem"
echo "  私钥: ${SSL_CERT_PATH}/privkey.pem"
