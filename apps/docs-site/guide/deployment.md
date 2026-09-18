# 部署指南

## Docker Compose（推荐）

```bash
cd ydsz-cloud
docker compose up -d
```

一键启动全部后端服务 + MySQL + Redis + RabbitMQ。

## Kubernetes（生产）

```bash
# 构建镜像
mvn clean package -DskipTests
docker build -t ydsz/gateway:latest ./ydsz-gateway

# 部署到 K8s
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/deployments/
```

## Nginx 配置

参考 `apps/docs-site/` 中 `bash/gen-nginx-conf.mts` 脚本，可自动生成反向代理配置。

前端构建产物为纯静态文件，可部署至任意静态站托管服务（Nginx / CDN / GitHub Pages）。

## 环境变量速查

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SPRING_PROFILES_ACTIVE` | 激活的 profile | `dev` |
| `MYSQL_HOST` | MySQL 主机 | `localhost` |
| `REDIS_HOST` | Redis 主机 | `localhost` |
| `RABBITMQ_HOST` | RabbitMQ 主机 | `localhost` |
| `JASYPT_ENCRYPTOR_PASSWORD` | 配置加密密钥 | — |
