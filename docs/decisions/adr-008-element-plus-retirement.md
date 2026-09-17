# ADR-008: Element Plus 全面退场 — 自研 Ydsz UI 基座替换

- **状态**: 已采纳（v5.0.0 落地，2026-09-17）
- **决策人**: ydsz-team
- **关联代码**: `comm/@core/ui-kit/ydsz-ui/`、`comm/@core/base/design/`、`apps/*/`

## 背景

YDSZ 前端基座原使用 Element Plus 2.x 作为默认 UI 组件库。随着自研 `ydsz-ui`
（基于 Radix Vue + Tailwind CSS + CVA 的 shadcn 体系）组件覆盖度突破 88 个原语，
继续保留 Element Plus 会带来双组件库并存、主题桥接层耦合、暗色模式/品牌换肤
经过两层间接映射等问题。

决策：**彻底退场 Element Plus，所有运行时/构建时/样式层引用归零，
仅保留 frozen 守夜门禁阻止回退**。

## 决策

采用「消费面治理 → 桥接层退役 → 运行时注入改造 → importmap/工具链清理 → 门禁冻结」
五阶段路线：

1. **消费面治理**：全量替换业务代码中的 `var(--el-*)` CSS 变量为 YDSZ 原生设计令牌
2. **桥接层退役**：删除 `element-bridge.css` 及其引用
3. **运行时注入改造**：`useLegacyDesignTokens()` 整体移除；system-web 偏好设置页改为直写令牌
4. **importmap/工具链清理**：EP 条目从外部化清单移除
5. **门禁冻结**：eslint no-restricted-imports + check-standard 三组正则标记 frozen 守夜

## 设计令牌桥接映射表

| `--el-XXX` 调用点 | 替换为（YDSZ 原生） |
|---|---|
| `--el-color-primary` | `--brand-500` |
| `--el-color-primary-light-3..9` | `--brand-300 / --brand-200 / --brand-100 / --brand-50` |
| `--el-color-primary-dark-2` | `--brand-600` |
| `--el-color-success*` | `--success-*` 系列 |
| `--el-color-warning*` | `--warning-*` 系列 |
| `--el-color-danger* / --el-color-error*` | `--destructive-*` 系列 |
| `--el-text-color-primary/regular/secondary` | `--txt-primary/secondary/tertiary` |
| `--el-text-color-placeholder / --el-text-color-disabled` | `--txt-disabled` |
| `--el-bg-color / --el-bg-color-overlay / --el-fill-color-blank` | `--bg-surface-2` |
| `--el-bg-color-page` | `--bg-canvas` |
| `--el-fill-color*` | `--neutral-*` 系列 |
| `--el-border-color*` | `--border-default/subtle/strong` |
| `--el-border-radius-*` | `--radius-*` |
| `--el-box-shadow*` | `--shadow-raised-* / --shadow-overlay-*` |
| `--el-overlay-color*` | `--overlay` |
| `--el-font-size-base` | `--yd-font-size-base`（system-web 运行时） |

## 变更范围

### 删除文件
- `comm/@core/base/design/src/css/element-bridge.css`（~70 条 --el-* 静态桥接）

### 核心重构文件（按优先级）
- P0-A `main/src/components/command-palette/command-palette.css`（~30 处）
- P0-B `main/src/views/_core/subapp/index.vue`（8 处）
- P0-C `apps/workflow-web/src/views/designer/` Designer 系列 6 文件（~12 处）
- P0-D `apps/system-web/src/composables/usePreferences.ts` + `views/preference/index.vue`（含运行时 JS 写入改造）
- P0-E `apps/literule-web/` 设计器 3 文件（~7 处）
- P0-F `apps/agent-web/` + `apps/nextwiki-web/`（~4 处）
- P0-G `comm/effects/common-ui/` 4 文件（~10 处）
- P0-H `comm/effects/micro-kernel/` devtools-tabs + error-boundary（6 处）
- 补遗 `main/src/components/global-search.vue`（1 处）

### 工具链清理
- `bash/importmap.lock.json`：移除 `element-plus@2.14.5` + `@element-plus/icons-vue@2.3.2`
- `bash/sync-shared-deps.mts`：移除两条 EP 依赖声明
- `bash/vsh/src/check-bundle/index.ts`：`UI_DEPS` 数组移除两项
- `bash/vsh/src/check-standard/index.ts`：EP 检测正则区块标记 `frozen 守夜`

### 运行时注入改造
- `comm/effects/hooks/src/use-design-tokens.ts`：整体移除 `useLegacyDesignTokens()`
- `apps/system-web/src/composables/usePreferences.ts`：新增 `hexToHsl()` + `applyBrandColorToDOM()`，
  主题色写入 `--brand-50` ~ `--brand-700`，字体写入 `--yd-font-size-base`

### 保留的 frozen 守夜门禁
- `conf/lint-configs/eslint-config/src/index.ts`：`EP_IMPORT_PATTERNS` no-restricted-imports（永久硬阻断）
- `bash/vsh/src/check-standard/index.ts`：`EP_MODULE_RE` / `EP_TEMPLATE_TAG_RE` /
  `EP_TABLE_COLUMN_ONLY_RE` / `EP_TOOLCHAIN_RE`（frozen 守夜，注释标注）

## 验证门禁

```
# 源码层 --el-* 变量清零
grep -rnE 'var\(--el-|--el-(color|bg|text|fill|border))' apps/ comm/ main/ \
  --include='*.vue' --include='*.ts' --include='*.css' --include='*.scss'
# 期望：0 结果

# 源码层 EP import 清零
grep -rnE "from ['\"]element-plus|from ['\"]@element-plus" apps/ comm/ main/ \
  --include='*.ts' --include='*.vue'
# 期望：0 结果
```

## 影响与风险

- **视觉回归**：理论上零变化。桥接右侧已是 YDSZ 原生令牌，删除后消费者直接读原生令牌
- **存量 external 残留**：importmap.lock.json 清理后 standalone 模式下 EP 不再 externalize
- **EP 代码重新合入**：eslint + check-standard 守夜门禁反向阻断
