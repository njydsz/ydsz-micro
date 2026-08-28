# Changesets

本目录用于管理共享包（`comm/**`）与内核包的版本与变更记录。

## 使用方式

```bash
# 1. 在 PR 中添加变更条目（交互式选择受影响的包与版本级别 patch/minor/major）
pnpm changeset

# 2. 合并到 main 后执行版本号更新与 CHANGELOG 生成
pnpm changeset:version

# 3. 发布（需要 npm token）
pnpm changeset:publish
```

## 约定

- 仅对公开共享包（`@ydsz/*` workspace 包）写 changeset，应用包（`apps/*`、`main`）不参与版本发布。
- 版本级别：修复缺陷用 `patch`；新增向后兼容能力用 `minor`；破坏性变更用 `major` 并在描述中标注迁移方式。
- 变更描述遵循 Conventional Commits 风格，说明「做了什么 + 为什么」。
