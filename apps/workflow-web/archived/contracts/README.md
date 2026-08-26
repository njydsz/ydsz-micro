# archived/contracts

契约归档目录（P0-8 治理）。

## 用途

存放由 `bash/gen-contract.py` 归档的**孤立契约产物**：后端已删除对应 Controller 后，
旧版本自动生成的 `flow*.ts` / `models.ts` / `base.ts` 被脚本移入此处，避免悬空导入。

## 为什么放在 src 外

- `.generated-archived/` 曾位于 `src/api/` 下，但被 tsconfig 排除，导致 ESLint 报
  `not found by the project service` 解析错误（污染整个应用的 lint 门禁）。
- 归档产物仅供追溯/回滚参考，**不应被业务代码 import**。

## 维护约定

- 由 `bash/gen-contract.py` 自动维护，无需手工增删。
- 契约漂移检查：`pnpm gen:contract:check`（CI 门禁）。
- 重新生成：`pnpm gen:contract`。
