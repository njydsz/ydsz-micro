# 快速启动

## 环境要求

| 工具 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥ 20.10.0 | 前端运行时 |
| pnpm | ≥ 9.12.0 | 包管理器（强制使用） |
| JDK | ≥ 17 | 后端运行时 |
| Maven | ≥ 3.9 | 后端构建 |
| MySQL | 5.7 / 8.0+ | 关系数据库 |
| Redis | 5.0+ | 缓存 |
| Docker | 24.0+ | 容器化部署 |

## 克隆代码

```bash
# 前端
git clone <repo-url> ydsz-micro
cd ydsz-micro

# 后端
git clone <repo-url> ydsz-cloud
```

## 启动后端

```bash
cd ydsz-cloud
mvn clean install -DskipTests
# 启动网关 + 八大引擎（按依赖顺序）
java -jar ydsz-gateway/target/*.jar
java -jar ydsz-system/target/*.jar
java -jar ydsz-userinfo/target/*.jar
# ... 依次启动其他引擎
```

## 启动前端

```bash
cd ydsz-micro
pnpm install
pnpm dev              # 全应用启动
pnpm dev:main         # 仅主应用
pnpm dev:system       # 仅系统引擎子应用
```

## 首次登录

访问 `http://localhost:5173`，使用默认管理员账号登录：

| 用户名 | 密码 |
|--------|------|
| admin | admin123 |

## 目录结构

```
ydsz-micro/
├── apps/                  # 前端子应用
│   ├── main/              # 主应用入口
│   ├── system-web/        # 系统引擎前端
│   ├── userinfo-web/      # 身份引擎前端
│   └── ...
├── comm/                  # 公共模块
│   ├── @core/             # UI Kit / 核心能力
│   ├── effects/           # 响应式效果
│   └── locales/           # 国际化
├── conf/                  # 构建配置
└── bash/                  # 构建脚本
```
