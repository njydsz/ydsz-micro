---
'@ydsz-core/ydsz-ui': minor
'@ydsz-core/form-ui': minor
---

### ydsz-ui 组件测试与基础设施

- **P0-1 测试体系建立**：新增 Button / Dialog / FormItem 组件 Vitest + @vue/test-utils 测试用例共 32 个，全部通过
- **P0-2 字段级订阅隔离**：新增 `use-field-subscription.ts` composable（`watchField` / `watchMultipleFields` / `useFieldValue` / `useDependentFieldValues`），解决 50+ 字段大型表单全量重渲染性能瓶颈
- **P1-3 changeset 版本治理**：新增 .changeset 入口文件，接入 @changesets/cli 自动生成 changelog 流水线
- **基础设施修复**：
  - 修正 `@ydsz/notification` 对 popup-ui 的错误依赖引用（`@ydsz-core/ui-kit/popup-ui` → `@ydsz-core/popup-ui`）
  - 同步修正 `main/src/hooks`、`comm/effects/notification` 中的 import 路径

### 规范符合性

- 全部新增源文件符合《云顶编码规范》§16.10（YDIZ-TEST-FE-001：测试用例必须有明确断言）
- Javadoc 完整覆盖所有 public API
- 布尔字段使用 is 前缀（YDIZ-OOP-006）
- import 采用简单名，禁止 FQN（YDIZ-IMPORT-001）
