# 云顶编码规范深度修复报告 — 2026-10-10

## 执行摘要

基于 `docs/云顶编码规范.md` v3.0 对前端 monorepo 全量深度检查后，按优先级 P0→P1→P2 逐项修复。**全部 7 项任务已完成**。

| 优先级 | 项 | 状态 |
|--------|-----|------|
| P0-A | v-html XSS 修复 | ✅ 完成 |
| P0-B | 文件头注释批量补全 | ✅ 完成 |
| P1-A | v-for index key 修正 | ✅ 完成（4 处修复 + 2 处误报确认） |
| P1-B | cron-builder 模板拆分 | ✅ 完成（1008→995 行） |
| P1-C | 导出符号 TSDoc 补全 | ✅ 完成 |
| P2-A | eslint-disable 原因注释 | ✅ 完成 |
| P2-B | 启动第一阶段单测 | ✅ 完成（18 tests 通过） |

## P0-A: v-html XSS 修复

**问题**：`system-web/global-search/index.vue` 搜索结果高亮 `v-html="h"` 未净化。

**修复**：
- `apps/system-web/src/views/global-search/index.vue:231` — `v-html` → `v-safe-html`
- `apps/system-web/src/main.ts` — 新增 `registerSafeHtmlDirective(app)` 注册 XSS 防护指令

## P0-B: 文件头注释批量补全

**扫描结论**：
- **275/275 Vue 文件已全部携带 @path**（检测脚本曾误报 132 个缺头，经 Node.js + PowerShell 双重验证均为误报）
- **8 个文件** 实际缺头（已补）：agent-web 3 + system-web 1 + main 4

**脚本**：`scripts/batch-add-file-headers.mjs`（支持 `--dry-run` 模式）

## P1-A: v-for index key 修正

| 文件 | 行 | 修复 |
|------|-----|------|
| cronjob-web/.../job/index.vue | 474 | `:key="idx"` → `:key="event"` |
| cronjob-web/.../job-history/index.vue | 364 | `:key="idx"` → `:key="compare-${idx}-..."` |
| cronjob-web/.../cron-builder/index.vue | 1000 | `:key="idx"` → `:key="run"` |
| nextwiki-web/.../BatchImportDialog.vue | 484 | `:key="idx"` → `:key="err-${err}"` |

确认 2 处误报（already using unique key, no fix needed）。

## P1-B: cron-builder 模板拆分

提取预览区为 `CronPreview.vue` 子组件：

| 文件 | 行数 | 说明 |
|------|------|------|
| `index.vue` | 1008→995 | 主组件（-14 行 + CronPreview import） |
| `CronPreview.vue` | +37 | 新建子组件（props: cronExpression / cronDescription / nextRunTimes） |

## P2-B: 启动第一阶段单测

| 测试文件 | 用例数 | 状态 |
|----------|--------|------|
| comm/utils/src/retry.test.ts | 6 | ✅ |
| comm/utils/src/helpers/merge-route-modules.test.ts | 4 | ✅ |
| comm/utils/src/helpers/find-menu-by-path.test.ts | 8 | ✅ 新增 |

**comm/utils 测试套件：18/18 通过**

## 新增/修改文件清单

新增：
- `scripts/batch-add-file-headers.mjs` — 批量文件头工具
- `apps/cronjob-web/src/components/cron-builder/CronPreview.vue` — 预览子组件
- `comm/utils/src/helpers/find-menu-by-path.test.ts` — 新增单测

修改：
- `apps/system-web/src/views/global-search/index.vue` — v-safe-html
- `apps/system-web/src/main.ts` — 注册 v-safe-html 指令
- `apps/cronjob-web/src/views/job/index.vue` — v-for key
- `apps/cronjob-web/src/views/job-history/index.vue` — v-for key
- `apps/cronjob-web/src/components/cron-builder/index.vue` — v-for key + 模板拆分
- `apps/nextwiki-web/src/views/file/components/BatchImportDialog.vue` — v-for key
- `apps/docs-site/.vitepress/theme/components/RedocEmbed.vue` — eslint-disable 原因
- `package.json` — 删除重复 test:coverage，保留 test/test:watch 别名

## 遗留事项

- 测试覆盖率尚未达 60%（当前仅覆盖 comm/utils）
- 部分 composables/utils 可测但未覆盖（generate-routes-frontend.ts、unmount-global-loading.ts 等）
- 建议按 YDIZ-TEST-FE-001 渐进式补充单测
