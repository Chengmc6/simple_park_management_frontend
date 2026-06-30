# ===== 第一阶段：Node.js 编译打包 =====
# 1. 指定基础环境（尽量选择体积小的 alpine 或 slim 版本）
FROM node:24-alpine AS build
# 2. 创建并切换到工作目录
WORKDIR /app

# 3. 复制依赖文件并安装依赖（利用 Docker 缓存机制）
COPY package*.json ./
RUN npm ci

# 4. 复制源代码并构建应用
COPY . .
RUN npm run build

# ===== 第二阶段：Nginx 运行托管 =====
# 5. 使用 Nginx 作为生产环境的 Web 服务器
FROM nginx:alpine
# 6. 复制构建好的文件到 Nginx 的默认目录
COPY --from=build /app/dist /usr/share/nginx/html
# 7. 复制自定义的 Nginx 配置文件（可选）
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 8. 暴露端口（根据需要修改）
EXPOSE 80
# 使用 Python 简单静态服务器
# FROM python:3.12-slim
# WORKDIR /app
# COPY --from=build /app/dist /app
# EXPOSE 80
# CMD ["python", "-m", "http.server", "80", "--directory", "/app"]