#!/bin/bash
# ============================================================================
# 自签名 SSL 证书生成脚本（开发环境）
# 用法: bash generate-ssl.sh [domain] [output_dir]
# 默认: domain=ev-charging.local, output_dir=./ssl
# ============================================================================

set -euo pipefail

DOMAIN="${1:-ev-charging.local}"
OUTPUT_DIR="${2:-./ssl}"
DAYS=365
KEY_SIZE=2048

echo "=========================================="
echo " EV 充电平台 - 自签名 SSL 证书生成"
echo "=========================================="
echo "域名:     ${DOMAIN}"
echo "输出目录: ${OUTPUT_DIR}"
echo "有效期:   ${DAYS} 天"
echo "=========================================="

mkdir -p "${OUTPUT_DIR}"

# 生成 CA 私钥
openssl genrsa -out "${OUTPUT_DIR}/ca.key" ${KEY_SIZE}

# 生成 CA 自签名证书
openssl req -x509 -new -nodes \
  -key "${OUTPUT_DIR}/ca.key" \
  -sha256 -days ${DAYS} \
  -out "${OUTPUT_DIR}/ca.crt" \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=EV-Charging/OU=Dev/CN=EV-Charging-CA"

# 生成服务器私钥
openssl genrsa -out "${OUTPUT_DIR}/server.key" ${KEY_SIZE}

# 创建扩展配置文件
cat > "${OUTPUT_DIR}/server.ext" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,nonRepudiation,keyEncipherment,dataEncipherment
subjectAltName=@alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = *.${DOMAIN}
DNS.3 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# 生成证书签名请求
openssl req -new \
  -key "${OUTPUT_DIR}/server.key" \
  -out "${OUTPUT_DIR}/server.csr" \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=EV-Charging/OU=Dev/CN=${DOMAIN}"

# 用 CA 签发服务器证书
openssl x509 -req \
  -in "${OUTPUT_DIR}/server.csr" \
  -CA "${OUTPUT_DIR}/ca.crt" \
  -CAkey "${OUTPUT_DIR}/ca.key" \
  -CAcreateserial \
  -out "${OUTPUT_DIR}/server.crt" \
  -days ${DAYS} -sha256 \
  -extfile "${OUTPUT_DIR}/server.ext"

# 清理临时文件
rm -f "${OUTPUT_DIR}/server.csr" "${OUTPUT_DIR}/server.ext" "${OUTPUT_DIR}/ca.srl"

# 设置私钥权限
chmod 600 "${OUTPUT_DIR}/ca.key" "${OUTPUT_DIR}/server.key"
chmod 644 "${OUTPUT_DIR}/ca.crt" "${OUTPUT_DIR}/server.crt"

echo ""
echo "证书生成完成！"
echo "  CA 证书:   ${OUTPUT_DIR}/ca.crt"
echo "  服务器证书: ${OUTPUT_DIR}/server.crt"
echo "  服务器私钥: ${OUTPUT_DIR}/server.key"
echo ""
echo "验证证书:"
echo "  openssl x509 -in ${OUTPUT_DIR}/server.crt -text -noout"
echo ""
echo "信任 CA（macOS）:"
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ${OUTPUT_DIR}/ca.crt"
echo ""
echo "信任 CA（Linux）:"
echo "  sudo cp ${OUTPUT_DIR}/ca.crt /usr/local/share/ca-certificates/ev-charging-ca.crt"
echo "  sudo update-ca-certificates"
