#!/bin/sh
set -e

# 设置默认端口（如果环境变量未设置）
: "${PORT:=34567}"

# 导出端口为环境变量供 envsubst 使用
export PORT

# 使用 envsubst 替换 nginx.conf.template 中的环境变量
# 生成最终的 nginx.conf
echo "使用端口: ${PORT}"
envsubst '${PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf

# 验证 Nginx 配置
if nginx -t; then
    echo "Nginx 配置验证通过"
else
    echo "Nginx 配置验证失败"
    exit 1
fi

# 启动 Nginx
echo "启动 Nginx..."
exec "$@"
