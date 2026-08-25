# Changesets

本目录存放变更集（changeset）条目，用于管理共享包（`comm/*`、`conf/*`、`bash/*`）的版本发布。

## 工作流

1. 修改共享包代码后，运行 `pnpm changeset` 交互式创建变更集
2. 变更集文件描述：变更摘要 + 语义化版本影响（major/minor/patch）
3. 发布时运行 `pnpm changeset:version` 合并版本并更新 CHANGELOG，随后 `pnpm changeset:publish` 发布

## 约定

- 每个包含用户可见变更的 PR 都应附带一个 changeset
- 仅内部消费、无发布计划的变更可省略（本仓库 `@ydsz/*` 为内网发布，建议仍按规范记录）
- 变更集文件命名如 `great-llamas-smile.md`，由 Changesets CLI 自动生成，无需手写

## 当前状态

- `config.json` 已就绪（指向 GitHub Releases）
- 首个正式版本发布前需确认 `@ydsz/*` 包的 `publishConfig` 与内网 registry 配置
