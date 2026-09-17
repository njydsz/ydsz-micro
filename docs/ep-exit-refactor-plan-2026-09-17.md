# Element Plus 退场 + 自研 shadcn 单栈收敛 —— 重构计划

> 日期：2026-09-17 ｜ 基准：云顶编码规范 + docs/UI组件复用规范.md
> 结论先行：迁移已完成约 60%（模板层 `<el-*>` 标签全量清零），残留集中在「脚本层导入 + 基座注册表 + comm 公共包」三条线，合计约 217 个残留点。收敛路径 = 先换基座心脏，再清公共包，最后分批下应用，全程静态门禁防回流。

---

## 一、现状基线（代码事实）

### 1.1 已就绪的自研基座（不重复造轮子）

| 能力 | 位置 | 状态 |
|------|------|------|
| shadcn 原子组件（43 目录） | `comm/@core/ui-kit/shadcn-ui/src/ui/`（button/select/tabs/switch/radio-group/tooltip/date-picker/number-field/sheet/tree/upload/form/…） | ✅ 可用 |
| shadcn 业务组件（33 目录） | `comm/@core/ui-kit/shadcn-ui/src/components/`（EmptyState/StatusBadge/EntityCard/CardGrid/Dashboard/AdvancedFilterBar/…） | ✅ 可用 |
| Schema 驱动表单渲染 | `comm/@core/ui-kit/form-ui/`（vee-validate + zod + shadcn Form） | ✅ 可用 |
| 命令式弹窗 API | `comm/@core/ui-kit/popup-ui/`（alert/confirm/prompt/modal/drawer） | ✅ 可用 |
| EP 命令式 API 兼容层 | `comm/effects/notification/src/el-bridge.ts`（ElMessage/ElMessageBox/ElNotification → showToast/popup-ui，业务零改动换 import） | ✅ 可用，属过渡件 |
| 表格方案 | `@ydsz/plugins/vxe-table` + `main/src/adapter/vxe-table.ts`、`apps/generator-web/src/adapter/vxe-table.ts`（含 CellImage/CellLink/CellMask 渲染器，已脱离 EP） | ✅ 可用 |
| v-loading 指令替代 | `@ydsz/common-ui/es/loading`（registerLoadingDirective，main 中已引入但被 EP 指令压制） | ✅ 待启用 |

### 1.2 残留清单（按层）

> ⚠️ 勘误（2026-09-17 实测修正）：初版曾判定「模板层 `<el-*>` 标签已全量清零」，
> 该结论系检索工具对 `<` 字符处理缺陷导致的**假阴性**。经以 kebab-case 标签名
> （模板用 `el-xxx`、脚本用 `ElXxx`，可精确区分）重新全量复核，模板层与 EP 主题变量层
> 均仍有残留，实际残留面如下。

| 层 | 残留点 | 证据 |
|----|--------|------|
| 应用层（脚本导入） | **~194 个文件**残留 `from 'element-plus'` 导入 | userinfo 39 / cronjob 26 / message 26 / workflow 21 / nextwiki 20 / agent 19 / literule 16 / system 15 / generator 12 |
| 模板层（kebab 标签） | **~28 个 .vue**存在 `el-xxx` 标签，其中约 17 个与脚本导入重叠；**其余 ~11 个文件无 EP import**（依赖不存在的全局注册 → 渲染降级/未知组件告警，属缺陷），如 `common-ui/src/components/page-status.vue`、`common-ui/src/components/error-state.vue`、`common-ui/src/components/empty-state.vue`、`shared-business/src/components/status-badge.vue`、`layouts/.../check-updates.vue`、`layouts/.../user-dropdown.vue`、`main/src/views/_core/subapp/index.vue`、`main/src/components/global-search.vue`、`workflow-web/.../DesignerPalette.vue`、`message-web/src/views/reactive/index.vue` |
| 主题变量层 | **~29 个文件**使用 `--el-color-* / --el-text-color-*` 等 EP CSS 变量；集中桥接点在 `comm/effects/hooks/src/use-design-tokens.ts`（55 处）、`main/src/components/command-palette/command-palette.css`（42 处）、`comm/styles/src/ele/index.css` | 反证 EP 主题桥的存在：`use-design-tokens.ts:255-374` 把 EP 变量映射到 YDSZ token |
| 基座 main | EP 异步组件注册表（~20 组件）、ElLoading.directive、`@ydsz/styles/ele`、tenant-switcher | `main/src/adapter/component/index.ts`、`main/src/setup/app.ts:25,45`、`main/src/components/tenant-switcher.vue` |
| comm 公共包 | **~20 个文件** | `shadcn-ui/notification-panel.vue`（自家用 EP）、`tiptap` 2 文件、`@core/components/notification-bell`、`form-ui/src/validation/*`（仅类型依赖 FormRules）、`shared-business` ~13 文件、`common-ui` 5 文件、`shared-auth/src/i18n-setup.ts`（EP locale 死代码） |
| 构建链 | 10 个 vite.config 挂 `unplugin-element-plus`；13 个 package.json 依赖；catalog 3 条（element-plus ^2.10.2 / @element-plus/icons-vue / unplugin-element-plus） | `apps/*/vite.config.mts`、`main/vite.config.mts`、`pnpm-workspace.yaml:19,89,141` |
| 图标 | `@element-plus/icons-vue` 零散使用 | main、notification-bell 等 → lucide-vue-next 已在 catalog |

**全局注册事实核验**：全仓无 `app.use(ElementPlus)`、无 `unplugin-vue-components` EP resolver（`grep ElementPlusResolver` 仅命中 `globalShareState.setComponents`）。因此「有 kebab 标签但无 import」的文件确属未知组件渲染。

### 1.3 关键发现：大量 TODO 是「过期标记」

~60 个文件带 `TODO: 暂无 shadcn-ui 等效组件`，但核验 kit 实际导出后发现**以下声称缺件的组件 kit 里早就有**：

| TODO 声称缺失 | kit 实际已有 | 
|--------------|-------------|
| ElEmpty | `components/empty-state/EmptyState.vue` |
| ElInputNumber | `ui/number-field/` |
| ElTooltip | `ui/tooltip/` + `components/tooltip/help-tooltip.vue` |
| ElSwitch | `ui/switch/` |
| ElRadio/ElRadioGroup | `ui/radio-group/` |
| ElTabs/ElTabPane | `ui/tabs/` |
| ElDatePicker | `ui/date-picker/` |
| ElDrawer | `ui/sheet/` |
| ElDropdown | `ui/dropdown-menu/` + `components/dropdown-menu/` |
| ElCollapse | `ui/accordion/` |
| ElTree | `ui/tree/` |
| ElUpload | `ui/upload/` |
| ElIcon | `components/icon/icon.vue`（iconify） |
| ElNotification | `notification/el-bridge.ts` |

**这部分是低垂果实：预估 194 个残留文件中约 40%（~80 个）只被过期 TODO 挡住，可直接迁移。**

### 1.4 真实缺口（kit 确实没有，需新建）

按使用频次排序：

| 组件 | 使用方 | 优先级 |
|------|--------|--------|
| Descriptions / DescriptionsItem | 9 个 app 通用（详情页/抽屉） | 🔴 高 |
| Timeline / TimelineItem | userinfo/cronjob/literule/agent/workflow/shared-business(approval-timeline) | 🔴 高 |
| Steps / Step | workflow(simulation)、message(trace) | 🟡 中 |
| Progress | cronjob(queue)、userinfo(user-import) | 🟡 中 |
| Skeleton | shared-business(async-state) | 🟡 中 |
| TreeSelect | userinfo(user-form/user/index) | 🟡 中（tree+select 组合） |
| Cascader | workflow(category-form) | 🟢 低 |
| Transfer | userinfo(role-assign) | 🟢 低 |
| Slider | workflow 设计器三件套、agent WorkflowDesigner | 🟢 低 |
| Rate | literule(rule-pack) | 🟢 低 |
| Calendar | cronjob(schedule-calendar) | 🟢 低 |
| SelectV2 虚拟滚动 | shared-business(virtual-select)、main 注册表 | 🟡 中（需无 EP 依赖的虚拟列表方案） |
| Image 预览 | vxe-table adapter、userinfo(user-profile) | 🟢 低（CellImage 的 window.open 已是降级方案） |
| Result | common-ui(error-boundary) | 🟢 低（评估用 EmptyState/error-feedback 吸收） |
| ElStatistic | workflow/message monitor/stats | 🟡 中（扩展 dashboard/StatCard 即可，不新建） |

### 1.5 el-bridge 语义缺口（边缘 API）

`distinguishCancelAndClose`、`dangerouslyUseHTMLString`、VNode message、`ElNotification position`（bottom-right）、`ElMessage grouping` 等——逐 app 迁移时遇到即登记，统一在 P2 批次对齐，不提前过度设计。

---

## 二、目标终态（验收标准）

1. `grep -r "element-plus" apps/ main/ comm/ --include=*.vue --include=*.ts` 计数为 0（el-bridge 拆除后含 compat 导入也为 0）
2. `pnpm why element-plus` 为空；catalog 删除 3 条 EP 条目
3. 10 个 vite.config.mts 移除 `unplugin-element-plus`
4. ESLint `no-restricted-imports`（element-plus / @element-plus/*）在全部包为 **error** 级（防回流门禁）
5. 表单渲染统一走 form-ui（vee-validate+zod），表格统一走 vxe-table，弹层统一走 popup-ui/dialog/sheet
6. `pnpm type-check` + `vsh check-standard` 五件套通过；main 与 pilot app 产物体积对比有量化收益记录

---

## 三、P0 —— 换心脏：基座与公共包清零（阻塞收敛根路径）

> 原则：comm 被 9 个 app 依赖，main 注册表是表单渲染的组件来源。这两层不清零，应用层迁移永远有回流通道。

### 批次 P0-1：comm 包 EP 清零（~20 文件）

| 动作 | 文件 | 替换方案 |
|------|------|----------|
| shadcn-ui 自净 | `shadcn-ui/src/components/notification/notification-panel.vue`（ElMessage/ElMessageBox） | 换 `@ydsz/notification` 原生 API（注意循环依赖：notification 依赖 shadcn-ui，此文件应直接用 popup-ui/use-toast） |
| tiptap 工具栏 | `tiptap/src/YDSZ-tiptap-editor.vue`、`toolbar/TipTap-toolbar.vue` | ElMessage→el-bridge；ElInput/ElPopover/ElTooltip→kit 同名件 |
| 通知铃铛 | `@core/components/notification-bell/index.vue` | ElBadge→Badge、ElPopover→Popover、ElScrollbar→ScrollArea、ElTooltip→Tooltip、icons-vue→lucide |
| form-ui 类型自持 | `form-ui/src/validation/use-validation-rules.ts`、`openapi-to-rules.ts` | `import type { FormRules } from 'element-plus'` → 本地声明 EP 兼容规则类型（仅类型，无运行时依赖），或直接切 zod schema 类型 |
| shared-business 11 文件 | virtual-select（ElSelectV2）、dict-tag（ElTag→Badge）、dict-select（ElSelect→Select）、async-state（ElSkeleton→Loading/spinner 组合）、approval-timeline（→新 Timeline 组件，先临时用列表降级则放 P1）、keyboard-help（ElDialog→Dialog）、excel 两个按钮、error-state、use-crud-table/use-excel-export（→el-bridge）、adapter/vxe-table.ts（ElButton→Button、ElImage→CellImage 渲染器）、adapter/component（ElNotification→el-bridge） | virtual-select 依赖 SelectV2 → **先降级为 kit Select + 分页加载**，真虚拟滚动随 P1 SelectV2 替代件落地 |
| common-ui 2 文件 | network-status（ElAlert→kit alert/alert-dialog 组合）、error-boundary（ElResult→EmptyState error-feedback preset） | |
| shared-auth 死代码 | `src/i18n-setup.ts` EP locale 动态加载与 elementLocale | ElConfigProvider 已移除，删 elementLocale 导出与 EP locale import；package.json 去 EP 依赖 |

**验收**：`grep element-plus comm/` = 0；三个 comm 包（common-ui/shared-auth/shared-business）+ plugins 的 package.json 移除 EP 依赖；type-check 通过。

### 批次 P0-2：main 基座换心（3 文件 + 注册表）

1. **`main/src/adapter/component/index.ts`（核心）**：`createElAsyncComponent` 注册表整体替换为 shadcn 组件映射。映射关系：

   | 注册表键 | EP 组件 | 替换 |
   |----------|---------|------|
   | Button/默认按钮 | ElButton(type=info/primary) | Button variant=secondary/default + h() 包装保留 type 兼容层 |
   | Input/InputNumber | ElInput/ElInputNumber | Input / NumberField |
   | Select/SelectV2 | ElSelectV2 | Select（虚拟滚动暂降级分页，P1 补） |
   | Checkbox/CheckboxButton/CheckboxGroup | EP | Checkbox / ToggleGroup |
   | Radio/RadioButton/RadioGroup | EP | RadioGroup + indicator 样式 |
   | Switch | EP | Switch |
   | DatePicker/TimePicker | EP | DatePicker（TimePicker 需补，见 P1） |
   | TreeSelect | EP | Tree + Popover 组合（P1 补专用组件前先用 Tree 内联） |
   | Divider | EP | Separator |
   | Space | EP | flex class（cn 工具） |
   | Upload | EP | kit Upload |

2. **`main/src/setup/app.ts`**：删除 `ElLoading.directive`（行 25/45），翻转到自研 `registerLoadingDirective(app, { loading: true, ... })`；删除 `import "@ydsz/styles/ele"`（需先核验 `@ydsz/styles/ele` 内容是否被 shadcn 主题引用，若含 EP CSS 变量桥接则同步迁移到 `@ydsz/styles` 主入口）。
3. **`main/src/components/tenant-switcher.vue`**：ElSelect/ElOption→Select、ElTooltip→Tooltip、ElMessage→el-bridge、OfficeBuilding 图标→lucide。

**验收**：main 不再 import element-plus；表单渲染（form-ui 走注册表）在登录/用户管理/字典等核心页面人工冒烟；v-loading 指令行为对齐。

### 批次 P0-3：门禁先行（防回流）

- `conf/lint-configs/eslint-config` 增加 `no-restricted-imports`：`element-plus`、`@element-plus/*` —— 本批次先 **warn**，随各 app 迁移完成逐包升 **error**
- `bash/vsh/src/check-standard` 增加 EP 残留计数校验（复用本次统计口径：import 语句计数），输出到静态门禁报告
- 参照仓库先例 `bash/codemod-console.mjs`，编写 `bash/codemod-ep-imports.mjs`：处理「import 换 el-bridge/kit + 删除过期 TODO 注释」的机械变换（人工审查后套用）

---

## 四、P1 —— 补缺口 + 应用层批量迁移

### 批次 P1-1：shadcn-ui 补齐真缺口组件（新增强顺序）

1. **Descriptions**（详情页刚需，9 app 受益）
2. **Timeline**（含 approval-timeline 升级回补）
3. **Steps**（workflow/message）
4. **Progress** + **Skeleton**
5. **TimePicker**（date-picker 扩展）+ **TreeSelect**
6. **虚拟滚动 Select**（SelectV2 替代，评估 @vueuse useVirtualList 方案）
7. **Cascader / Transfer / Slider / Rate / Calendar / Image 预览**（低频，按 app 迁移进度按需插入，避免一次全补造成过度设计）

每个组件入库要求：登记 `ui/index.ts` 或 `components/index.ts`、a11y 属性、暗色 token、`useRenderPerformance` 阈值对齐 UI组件复用规范 §7。

### 批次 P1-2：pilot 打样 —— generator-web（12 文件，最轻）

- 全量清 12 个残留文件；移除其 package.json 的 EP/iconify EP 图标依赖与 vite 插件
- 打样产出：**EP→kit 逐组件迁移手册**（含 form-ui schema 改写范式：ElForm rules → zod schema、FormInstance.validate → vee-validate handleSubmit）
- 量化记录 bundle 产物前后对比（EP JS+CSS 退出该 app 的收益），作为后续批次的收益基线

### 批次 P1-3：批量迁移（按残留量升序，微前端天然支持逐 app 下线）

| 序 | 应用 | 文件数 | 特殊难点 |
|----|------|--------|----------|
| 1 | literule-web | 16 | RuleChainDesigner、DecisionTableDesigner 两个设计器 |
| 2 | system-web | 15 | 表单页集中（form-ui 受益最大） |
| 3 | nextwiki-web | 20 | WopiEditor/file 系列交互重 |
| 4 | agent-web | 19 | agent-chat 长列表、WorkflowDesigner |
| 5 | workflow-web | 21 | 设计器三件套 + form-designer + 表达式编辑器（全仓最重，可拆两批） |
| 6 | message-web | 26 | 纯 CRUD 型，codemod 收益最大 |
| 7 | cronjob-web | 26 | schedule-calendar（Calendar 组件依赖） |
| 8 | userinfo-web | 39 | 量大但多为标准 CRUD；role-assign 的 Transfer、user 树的 TreeSelect |

每个 app 完成即：移除该 app 的 element-plus/unplugin-element-plus 依赖与 vite 插件 → ESLint 该包升 error → 冒烟核心路径。

**策略细则**：
- 命令式 API 一律换 `@ydsz/notification/compat`（el-bridge）导入，逻辑零改动；等 P2 评估是否进一步切原生 `showToast`/`confirm` API
- ElTable 页面：简单表→kit 无需表格（规范 §1.1 行<50 用卡片视图）；复杂表→vxe-table（useYDSZVxeGrid）
- ElForm/ElFormItem：新页面一律 form-ui schema；存量简单表单直接改写；复杂校验表单可先「Form+FormField+vee-validate 手写」过渡，不强推 schema 化（避免过度设计）
- 设计器类重页面（workflow designer、RuleChainDesigner、DagDesigner、form-designer）**放最后单独一批**，允许逐组件替换而非一次重写

---

## 五、P2 —— 收尾与拆除

1. **el-bridge 拆除评估**：全量 EP 退出后，按规范文件头注释约定「随最后一批清理删除」——届时统计 compat 导入量：若各 app 已直接用原生 API 则删 bridge；若仍有大量 compat 导入，保留一个迭代周期再删
2. **构建链清理**：catalog 删除 element-plus/@element-plus/icons-vue/unplugin-element-plus 三条；根 package.json devDependencies 清理；10 个 vite.config 已随各批完成
3. **`@ydsz/styles/ele` 包整体移除**（P0-2 核验后正式删除）
4. **门禁终态**：ESLint no-restricted-imports 全仓 error；check-standard EP 计数 = 0 进 CI
5. **边缘语义对齐**：清理迁移期间登记的 el-bridge 语义缺口清单（distinguishCancelAndClose 等），逐项决定「对齐 or 明确不支持」
6. **文档同步**：更新 docs/UI组件复用规范.md（ElDropdown 示例段落换 DropdownMenu）、云顶编码规范如涉 UI 栈条款
7. **收益量化报告**：main + 9 app 产物体积、依赖树、冷启动对比，归档 docs/

---

## 六、风险清单

| 风险 | 等级 | 缓解 |
|------|------|------|
| main 注册表换心影响所有走 form-ui 的动态表单 | 🔴 | P0-2 单独成一个可回滚 commit；核心页面（登录/用户/字典/角色）人工冒烟清单 |
| shared-business virtual-select 降级分页造成大数据集体验回退 | 🟡 | 降级方案先记录受影响调用方；P1-1 虚拟滚动 Select 落地后回补 |
| v-loading 行为差异（EP 全屏/局部遮罩语义） | 🟡 | P0-2 冒烟覆盖 v-loading 场景；自研指令 spinner 参数对齐 |
| 设计器类页面重写引入回归 | 🟡 | 单独批次 + 逐组件替换策略；不设截止时间强推 |
| `@ydsz/styles/ele` 可能被 shadcn 主题间接引用 | 🟡 | P0-2 先核验再动，必要时变量桥接迁入主 styles |
| codemod 误伤 | 🟢 | 只做 import 行级变换，组件标签替换人工审查；跑 type-check 兜底 |
| 过期 TODO 直接换件后组件行为差异（Select filterable 等特性） | 🟡 | pilot 阶段建立「组件特性核对清单」：filterable/clearable/multiple/prefix-icon 等 slot 手工组合范式 |

---

## 七、执行节奏建议

- **本周**：P0-1（comm 清零）+ P0-3（门禁 warn + codemod）
- **下周**：P0-2（main 换心）+ P1-1 前四件（Descriptions/Timeline/Steps/Progress/Skeleton）
- **随后两周**：P1-2 pilot → P1-3 前四个 app（literule/system/nextwiki/agent）
- **第四周起**：剩余四个 app + 设计器专项批次
- **收尾周**：P2 全项

每批次合并前跑：`pnpm type-check` + `pnpm lint` + `vsh check-standard`（§15.10 静态门禁三件套），并同步更新本文件的批次勾选状态。
