FROM nginx:alpine

# 复制静态文件到 Nginx 默认目录
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/

# 复制 Nginx 配置模板
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# 复制启动脚本并设置执行权限
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 设置默认端口环境变量
ENV PORT=34567

# 暴露默认端口
EXPOSE 34567

# 自定义启动命令
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
