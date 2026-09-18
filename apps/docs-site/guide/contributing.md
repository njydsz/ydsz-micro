# 贡献指南

## 代码仓库结构

YDSZ 采用前后端分离的双仓库结构：

| 仓库 | 路径 | 说明 |
|------|------|------|
| 前端 | `D:\Code\open\ydsz-micro` | Vue 3 + Vite + Pnpm Monorepo |
| 后端 | `D:\Code\open\ydsz-cloud` | Spring Boot 3 + Maven 多模块 |
| 文档站 | `D:\Code\open\ydsz-micro\apps\docs-site` | VitePress 文档站 |

## 提交规范

采用 Conventional Commits 规范：

```
<type>(<scope>): <description>
```

类型（type）：

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 缺陷修复 |
| `docs` | 文档变更 |
| `style` | 代码风格调整（不影响功能） |
| `refactor` | 重构（非新功能、非修复） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具/依赖变更 |

## 分支策略

| 分支 | 说明 |
|------|------|
| `main` | 主干分支，保护状态 |
| `develop` | 开发分支 |
| `feature/*` | 功能分支 |
| `fix/*` | 修复分支 |
| `release/*` | 发布分支 |

## PR 检查清单

提交 PR 前请确认以下事项：

- [ ] 代码符合 [编码规范](../standards/)
- [ ] 禁止项检查：无 FQN、无 wildcard import、无 `any` 类型（前端）
- [ ] 布尔字段统一 `is` 前缀（后端 OOP-006）
- [ ] 集合初始化指定初始容量（COLL-001）
- [ ] IO 使用 try-with-resources（PERF-002）
- [ ] DDD 依赖方向正确：web → domain ← infra
- [ ] 新 API 已补充 SpringDoc 注解（`@Operation`, `@Tag`, `@Schema`）
- [ ] `@ApiVersion` 注解位于 `@RequestMapping` 上方（API-002）
- [ ] 提交通过 `pnpm lint` / `mvn checkstyle:check`
