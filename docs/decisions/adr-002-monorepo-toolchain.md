# ADR-002: Monorepo 工具链选型 — pnpm workspace + Turborepo

- **状态**: 已采纳（追溯补记）
- **关联代码**: `pnpm-workspace.yaml`、`turbo.json`、根 `package.json`

## 背景

仓库含 9 个前端应用 + 约 24 个共享包 + 构建配置包，需要统一构建编排、依赖版本治理与任务缓存。

## 决策

- **pnpm 10 workspace**（`only-allow pnpm` 强制）：catalog 统一版本源，避免幻影依赖（v4.3.1 已修复 vitest 幻影依赖问题）
- **Turborepo**：`build` / `test` / `type-check` 任务依赖图编排 + 远端可扩展缓存，`globalDependencies` 收敛共享配置感知
- **自研 vsh 工具链**（`bash/vsh/`，零第三方依赖，node --experimental-strip-types 直跑 TS）：check-arch / check-circular / check-dep / check-bundle / publint 五类架构与合规门禁

## 后果

- 正面：依赖单源（catalog）、构建可增量缓存、架构守护不依赖外部工具链
- 负面：vsh 使用 `--experimental-strip-types`，要求 Node ≥ 22.6（CI 已固定 node-version: 22）；taze 交互式升级依赖需人工确认
