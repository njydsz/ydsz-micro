# bash/ —— 构建与工程化脚本

本目录包含云顶微前端项目的所有工程化脚本（按 `docs/` 编码规范第 36 章：所有脚本必须位于 `data/` 或 `bash/` 目录）。

## 分类概览

### API 契约与代码生成

| 脚本 | 用途 |
|------|------|
| `gen-api.mjs` | 从后端 OpenAPI /v3/api-docs 生成前端 TypeScript SDK（支持增量与 CI check 模式） |
| `gen-error-codes.mjs` | 从后端同步错误码到前端 `error-codes.generated.ts` |
| `unified-contract.mjs` | 统一契约运行时：聚合各微服务契约供前端消费 |
| `gen-contract.py` | Python 版契约生成（供特定场景使用） |
| `contract-notify.mjs` | 检测到契约漂移时，通过 webhook 通知相关人 |
| `gen-app.mjs` | 通过脚手架模板一键生成新的子应用骨架 |
| `gen-registry.mjs` | 生成 `public/registry.json` 微前端注册表 |
| `gen-nginx.conf.mjs` | 基于注册表自动生成 nginx 子应用路由配置 |

### 质量与一致性保障

| 脚本 | 用途 |
|------|------|
| `check-locales.mjs` | 检查 i18n 翻译文件完整性（所有语言中 key 一致） |
| `check-size.mjs` | 检查 bundle 大小是否超过预算 |
| `codemod-console.mjs` | 自动清理/收敛 console 语句（仅允许 console.warn/error） |
| `fix-form-any.mjs` | codemod：将表单组件 props 中的 `any` 替换为具体类型 |

### 工程化工具

| 脚本 | 用途 |
|------|------|
| `sync-shared-deps.mjs` | 同步所有子应用的依赖至共享版本（v4.4.0 锁定模式） |
| `dev-standalone.mjs` | 开发态独立运行单个子应用（无需启动整个主壳） |
| `clean.mjs` | 递归清理 dist/target/node_modules 等构建产物 |
| `upload-sourcemaps.mjs` | 构建后上传 sourcemap 到监控服务并从产物中删除 |

## 子包

- `turbo-run/` — 交互式 turbo script 运行器（`pnpm turbo-run <script>`）
- `vsh/` — 编码规范检查 CLI（vsh = 云山顶 coding standard），覆盖 arch/bundle/circular/dep/standard 等检查项
- `deploy/` —— 部署相关 Dockerfile 与 nginx 配置

## 用法约定

所有脚本在 `package.json` 中通过 `pnpm <name>` 调用，执行自带 `--help` 显示选项。每个脚本头部注释详细描述了其用途、参数和环境变量。
