# 环境准备

## 必备工具

### Node.js + pnpm

```bash
# 安装 nvm（推荐方式）
curl -o- https.raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 安装 Node.js
nvm install 20
nvm use 20

# 启用 pnpm
corepack enable
corepack prepare pnpm@10.27.0 --activate
```

### JDK 17 + Maven

```bash
# 验证安装
java -version   # openjdk 17.x
mvn -version    # Maven 3.9.x
```

### MySQL + Redis

```bash
# Docker 快速启动
docker run -d --name mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 mysql:8.0
docker run -d --name redis -p 6379:6379 redis:7
```

## 数据库初始化

```sql
-- 创建数据库
CREATE DATABASE ydsz_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ydsz_userinfo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ydsz_message DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ydsz_workflow DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ydsz_cronjob DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ydsz_nextwiki DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ydsz_literule DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE ydsz_agent DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 环境变量

参考 `.env.example` 文件，按需配置各引擎的环境变量。

## 下一步

环境准备好后，前往 [快速启动](./quick-start) 开始本地开发。
