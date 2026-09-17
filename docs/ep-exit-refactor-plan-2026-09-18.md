# Element Plus 退场 + 自研 shadcn/ui 单栈收敛 —— 详细重构计划（v2）

> 日期：2026-09-18
> 基于：
> - 既有计划 `docs/ep-exit-refactor-plan-2026-09-17.md`（已完成约 60%）
> - 实测数据：脚本层 EP 192 + icons-vue 6、模板层 49 处、构建引用 vite×10 + catalog×3
> - 云顶编码规范 + `docs/UI组件复用规范.md`
>
> **结论先行**：上一版计划「模板层 el- 标签已清零」事实上并不成立（当前 apps 24 / comm 24 / main 1）；脚本层经过 `migrate-apps-ep.mjs` 第一轮粗糙替换后，ElMessage 的写法大面积迁移到 showToast，但 import 行未清理、注册表与构建链未动。**真实完成度约 35%（模板/脚本清洗 0% + 命令式 API 约 70% + kit 就绪度约 95%）**。

---

## 一、现状基线（2026-09-18 实际数据）

### 1.1 已就绪的自研基座

| 能力 | 位置 | 状态 |
|------|------|------|
| shadcn 原子组件（43 目录） | `comm/@core/ui-kit/shadcn-ui/src/ui/`（alert-dialog/accordion/avatar/badge/breadcrumb/button/card/checkbox/context-menu/date-picker/dropdown-menu/form/hover-card/input/label/number-field/pagination/pin-input/popover/radio-group/resizable/scroll-area/select/separator/sheet/switch/tabs/textarea/toggle/toggle-group/tooltip/tree/upload） | ✅ 可用 |
| shadcn 业务组件（33 目录） | `comm/@core/ui-kit/shadcn-ui/src/components/`（AdvancedFilterBar/Avatar/BackTop/Breadcrumb/Button/Checkbox/ContextMenu/CountToAnimator/Dashboard/DomainFilter/DropdownMenu/EmptyState/EntityCard/ExpandableArrow/FullScreen/HoverCard/Icon/InputPassword/Logo/Notification/PinInput/Popover/QuickCreate/RenderContent/Scrollbar/Search/Segmented/Select/SettingsFloat/SpineText/Spinner/StatusBadge/Tooltip + advanced-filter/avatar/back-top/breadcrumb/button/checkbox/context-help/context-menu/count-to-animator/dashboard/domain-filter/dropdown-menu/empty-state/entity-card/expandable-arrow/full-screen/hover-card/icon/input-password/logo/notification/pin-input/popover/quick-create/render-content/scrollbar/search/segmented/select/settings-float/spine-text/spinner/status-badge/tooltip） | ✅ 可用 |
| Schema 驱动表单渲染 | `comm/@core/ui-kit/form-ui/`（vee-validate + zod + shadcn: Form/FormItem/FormControl/FormLabel/FormDescription/FormMessage） | ✅ 可用 |
| 命令式弹窗 API | `comm/@core/ui-kit/popup-ui/`（alert/confirm/prompt/modal/drawer/sheet） | ✅ 可用 |
| 表格方案 | `@ydsz/plugins/vxe-table` + `main/src/adapter/vxe-table.ts`（CellImage/CellLink/CellMask，不依赖 EP） | ✅ 可用 |
| 自研加载指令 | `@ydsz/common-ui/es/loading`（registerLoadingDirective） | ✅ 可用 |
| 命令式 API 桥的**半成品** | `comm/effects/notification/src/el-bridge.ts`（ElMessage/ElMessageBox/ElNotification → showToast/confirm/notify，业务方 112 处 import 待清） | ⚠️ 半成品 |
| 图标过渡 | lucide-vue-next 已在 catalog | ✅ 已备好 |

### 1.2 残留清单（2026-09-18 实测）

| 层 | 计数 | 关键位置 |
|----|------|--------|
| **脚本导入 — element-plus** | **192 文件** | userinfo 31 / cronjob 26 / message 17 / workflow 20 / agent 20 / nextwiki 19 / literule 12 / system 15 / generator 13 / **comm 18 / main 1** |
| **脚本导入 — @element-plus/icons-vue** | **6 文件** | apps: generator 2, system 1, userinfo 1 / comm: notification-bell 1 / main: tenant-switcher 1 |
| **模板 kebab 标签** | apps 24 / comm 24 / main 1 | 侧重 workflow designer×8、workflow form×6、literule RuleChainDesigner 10、message reactive 7、comm/shared-business（virtual-select、approval-timeline、dict-select、dict-tag、async-state、keyboard-help、excel-import/export、secondary-auth-modal、error-state、user-avatar、status-badge）等 |
| **主题 CSS 变量** | `comm/effects/hooks/src/use-design-tokens.ts`、`comm/styles/src/ele/index.css`、`main/src/components/command-palette/command-palette.css` | 仍桥接 `--el-*` 变量至 YDSZ token |
| **main 注册表** | `main/src/adapter/component/index.ts` + `main/src/adapter/form.ts` | createElAsyncComponent、registry Mapping |
| **构建链** | 10 vite.config.mts + catalog 3 条（element-plus ^2.10.2 / @element-plus/icons-vue ^2.3.2 / unplugin-element-plus ^0.10.0） | apps 9 + main 1 |
| **el-bridge 半成品** | 仅 ElMessage → showToast 完成（ElMessageBox/ElNotification 未处理） | `bash/migrate-apps-ep.mjs`：仅替换 ElMessage 用法行 1 策略 + ElMessageBox 未完成 |
| **过期标记 TODO** | **87** 个文件含 `TODO: 暂无 shadcn` / `FIXME: el-` 等 | 其中大量 TODO 实际 kit 已有对应件（见下） |

### 1.3 TODO 勘误 — kit 实际已有对应件

| TODO 声称缺失 | kit 已有件 |
|--------------|-----------|
| ElEmpty | `components/empty-state/EmptyState.vue` |
| ElInputNumber | `ui/number-field/` |
| ElTooltip | `ui/tooltip/` + `components/tooltip/help-tooltip.vue` |
| ElSwitch | `ui/switch/` |
| ElRadio / ElRadioGroup | `ui/radio-group/` |
| ElTabs / ElTabPane | `ui/tabs/` |
| ElDatePicker | `ui/date-picker/` |
| ElDrawer | `ui/sheet/` |
| ElDropdown | `ui/dropdown-menu/` + `components/dropdown-menu/` |
| ElCollapse | `ui/accordion/` |
| ElTree | `ui/tree/` |
| ElUpload | `ui/upload/` |
| ElIcon | `components/icon/icon.vue`（iconify） |
| ElNotification | `notification/el-bridge.ts` |

> 这 87 个 TODO 中预估 **≥40% 属"过期标记"**，直接换件即可完成，无需新建。

### 1.4 仍需新建的 shadcn 组件（基于全仓清点）

| 使用频次 | 典型应用方 | EP 源 | 复杂度 |
|---------|----------|------|--------|
| 🔴 高 | 9 app 详情页、抽屉 | **Descriptions / DescriptionsItem** | 中 |
| 🔴 高 | userinfo/cronjob/literule/agent/workflow/shared-business(approval-timeline) | **Timeline / TimelineItem** | 中 |
| 🟡 中 | workflow simulation / message trace | **Steps / Step** | 低 |
| 🟡 中 | cronjob(queue)、userinfo(user-import) | **Progress** | 低 |
| 🟡 中 | shared-business(async-state) | **Skeleton** | 低 |
| 🟡 中 | workflow 设计器、agent WorkflowDesigner | **Slider** | 中 |
| 🟡 中 | shared-business virtual-select（大数据集） | **SelectV2 虚拟滚动替代方案** | 中（可用 @vueuse/useVirtualList 自研 wrapper） |
| 🟢 低 | userinfo(role-assign) | **Transfer** | 中 |
| 🟢 低 | userinfo(user-form/user/tree) | **TreeSelect**（Tree + Popover 组合） | 低 |
| 🟢 低 | workflow(category-form) | **Cascader** | 中 |
| 🟢 低 | cronjob(schedule-calendar) | **Calendar** | 低 |
| 🟢 低 | literule(rule-pack) | **Rate** | 低 |
| 🟢 低 | common-ui(error-boundary) | **Result**（EmptyState/error-feedback 即可吸收） | — |

> **本计划策略**：高优先级 2 件（Descriptions / Timeline）必须在应用迁移前完成；中优先级 4 件可与迁移并行；低优先级 5 件在每 app 迁移时按需补齐，**一次避免写过多组件**。

---

## 二、目标终态（验收标准）

1. `grep -r "from 'element-plus'" apps/ main/ comm/ --include=*.vue --include=*.ts --include=*.mts` **= 0**（el-bridge 亦须拆除）
2. `grep -r "from '@element-plus/icons-vue'" apps/ main/ comm/ --include=*.vue --include=*.ts` **= 0**
3. `grep -r "<el-" apps/ main/ comm/ --include=*.vue` **= 0**
4. `pnpm why element-plus` 为空；catalog 删除 3 条
5. 10 个 `vite.config.mts` 移除 `unplugin-element-plus`
6. `use-design-tokens.ts` 与 `comm/styles/src/ele/index.css` `--el-*` 替换为 YDSZ design token（保留向后兼容别名 ≤ 1 版本周期）
7. ESLint `no-restricted-imports` 对 `element-plus` / `@element-plus/*` 在全仓 **error** 级（防回流门禁）
8. 表单渲染统一 form-ui（vee-validate + zod）；表格统一 vxe-table（useYDSZVxeGrid）；弹层统一 popup-ui
9. `pnpm type-check` + `vsh check-standard` + 10 app dev 冒烟通过
10. main + 9 app 产物体积、冷启动对比报告归档 `docs/ep-exit-benchmark-2026-09-18.md`

---

## 三、P0 阶段：换心脏 + 清零 comm/main（阻塞路径）

> 总工时：约 3~4 人日  
> 原则：comm 被 9 app 依赖，main 表单注册表是动态表单的组件源。这两层不清零，应用层迁移永远有回流通道。

### 批次 P0-1：comm 包 EP 清零（18 文件 + 1 package.json）

| 动作 | 文件 | 替换方案 | 备注 |
|------|------|-----------|------|
| 通知铃铛 | `comm/@core/components/notification-bell/index.vue` | ElBadge→Badge, ElPopover→Popover, ElScrollbar→ScrollArea, ElTooltip→Tooltip, OfficeBuilding→lucide | 解除 comm 内图标对 @element-plus/icons-vue 的依赖 |
| 错误边界 | `comm/effects/common-ui/src/components/error-boundary.vue` | ElResult→EmptyState error-feedback preset | |
| 网络状态 | `comm/effects/common-ui/src/components/network-status.vue` | ElAlert→alert/alert-dialog 组合 | |
| 审批流 | `comm/effects/shared-business/src/components/approval-timeline.vue` | **临时保留 EP Timeline 注释**，P1-1 Timeline 建成立即回补 | 当前 6 处，搭桥保留 |
| 加载态 | `comm/effects/shared-business/src/components/async-state.vue` | ElSkeleton→Loading + Spinner 组合 | |
| 字典选择 | `comm/effects/shared-business/src/components/dict-select.vue` | ElSelect→kit Select、ElOption→SelectItem、ElTag→Badge | |
| 字典标签 | `comm/effects/shared-business/src/components/dict-tag.vue` | ElTag→Badge | |
| 错误态 | `comm/effects/shared-business/src/components/error-state.vue` | ElResult→EmptyState | |
| Excel 导入 | `comm/effects/shared-business/src/components/excel-import-button.vue` | ElButton→Button、ElDialog→Dialog、ElUpload→Upload | 9 EP 引用 |
| Excel 导出 | `comm/effects/shared-business/src/components/excel-export-button.vue` | ElButton→Button | 5 EP 引用 |
| 快捷键 | `comm/effects/shared-business/src/components/keyboard-help.vue` | ElDialog→Dialog | 3 EP 引用 |
| 二级鉴权 | `comm/effects/shared-business/src/components/secondary-auth-modal/index.vue` | ElButton→Button、ElDialog→Dialog | |
| 虚拟选择 | `comm/effects/shared-business/src/components/virtual-select.vue` | ElSelectV2→**Select + 分页加载**临时方案 | 真虚拟滚动随 P1-1 落地；在迁移前**必须**测性能基线 |
| 用户头像 | `comm/effects/shared-business/src/components/user-avatar.vue` | ElAvatar→Avatar、ElPopover→Popover | |
| 状态徽章 | `comm/effects/shared-business/src/components/status-badge.vue` | ElTag→Badge | |
| 适配-组件 | `comm/effects/shared-business/src/adapter/component/index.ts` | ElNotification→showToast | |
| 适配-表格 | `comm/effects/shared-business/src/adapter/vxe-table.ts` | ElButton→Button、ElImage→CellImage 渲染器 | |
| use-crud-table | `comm/effects/shared-business/src/composables/use-crud-table.ts` | ElTable→vxe-table、ElPagination→kit Pagination | ⚠️ 关键公共 composable，需回归 7 app |
| use-excel-export | `comm/effects/shared-business/src/composables/use-excel-export.ts` | ElMessage→showToast | |
| el-bridge | `comm/effects/notification/src/el-bridge.ts` | **全量完成**：ElMessageBox.confirm→popup-ui ydszConfirm、ElNotification→notify、移除 element-plus import | 当前半成品 |

**验收**：`grep element-plus comm/` = 0；三个 comm 包（common-ui/shared-auth/shared-business）及 `@core/shadcn-ui` 的 package.json 无 element-plus 依赖；type-check 通过；use-crud-table 跑通 7 app 冒烟。

### 批次 P0-2：main 基座换心（3 文件 + 1 注册表）

1. **`main/src/adapter/component/index.ts`（核心）**：`createElAsyncComponent` 注册表 → shadcn 组件映射。

   | 注册表键 | EP 组件 | 替换 |
   |----------|---------|--------|
   | Button / 默认按钮 | ElButton(type=info/primary) | Button variant=secondary/default，保留 type 兼容层 |
   | Input / InputNumber | ElInput / ElInputNumber | Input / NumberField |
   | Select / SelectV2 | ElSelectV2 | Select（**虚拟滚动**临时降级为分页）|
   | Checkbox / CheckboxButton / CheckboxGroup | EP | Checkbox / ToggleGroup |
   | Radio / RadioButton / RadioGroup | EP | RadioGroup + indicator 样式 |
   | Switch | EP | Switch |
   | DatePicker / TimePicker | EP | DatePicker（TimePicker 暂缓，P1-1 补）|
   | TreeSelect | EP | Tree + Popover 内联 |
   | Divider | EP | Separator |
   | Space | EP | `cn("flex", gap-*)` |
   | Upload | EP | kit Upload |

2. **`main/src/adapter/form.ts`**：基于注册表的表单渲染器同样切到 shadcn Form/FormItem。
3. **`main/src/setup/app.ts`**：删除 `ElLoading.directive`（行 25/45），启用 `@ydsz/common-ui/loading` 的 `registerLoadingDirective(app, { loading: true })`；删除 `import "@ydsz/styles/ele"`（核验后）。
4. **`main/src/components/tenant-switcher.vue`**：ElSelect/ElOption→Select/SelectItem，ElTooltip→Tooltip，ElMessage→showToast，OfficeBuilding→lucide Building2，**删除** `from '@element-plus/icons-vue'`。

**验收**：main 不再 import element-plus；main 注册表在登录/用户管理/字典/角色等页面人工冒烟；v-loading 行为与 EP 一致；移除 main 的 package.json EP 依赖与 unplugin-element-plus。

### 批次 P0-3：门禁先行（防回流）

- **`conf/lint-configs/eslint-config`**：增加 `no-restricted-imports` 规则（element-plus / @element-plus/* → error）；先对 **comm/main** 升高，app 批次逐包开
- **`bash/vsh/src/check-standard`**：增加 EP 残留计数器，CI 门禁输出
- **`bash/codemod-ep-imports.mjs`**（替代半成品 `migrate-apps-ep.mjs`）：处理「import 换 kit + 删除过期 TODO + ElMessageBox/ElNotification 命令式 API 归一」的机械变换，**人工审查后套用**
- 分支策略：每个批次单独 PR，跑 `pnpm type-check && vsh check-standard` 通过后再合入

---

## 四、P1 阶段：补缺口 + 应用层批量迁移

> 总工时：约 6~8 人日（视迁移并行度）

### 批次 P1-1：shadcn-ui 补齐"真实缺口"组件

按以下顺序入库，每组件必须：① ui/index.ts 或 components/index.ts 导出 ② a11y 属性（radix 已内置，业务组件补 role/aria）③ 暗色 token（参考 theme-colors）④ `useRenderPerformance` 阈值对齐 UI组件复用规范 §7。

| 序号 | 组件 | 受益方 | 工时 |
|------|------|--------|------|
| 1 | **Descriptions + DescriptionsItem** | 9 app 详情页 | 0.5d |
| 2 | **Timeline + TimelineItem** | shared-business（回补）、workflow/message/cronjob/literule/userinfo/agent | 0.5d |
| 3 | **Steps + Step** | workflow simulation / message trace | 0.5d |
| 4 | **Progress** + **Skeleton** | cronjob / userinfo / comm | 0.5d |
| 5 | **Slider** | workflow 设计器、agent WorkflowDesigner | 0.5d |
| 6 | **SelectV2 虚拟滚动组件**（wrapper `@vueuse/useVirtualList` + 原生 Select 头尾 + 滚动加载） | shared-business virtual-select、main 注册表 | 0.5d |
| 7+ | TreeSelect / Cascader / Transfer / Calendar / Rate / Result | 按 app 迁移进度**按需**插入 | — |

> 克制原则：**不提前设计**；仅在迁移某个 app 遇到真实卡点时再补。

### 批次 P1-2：pilot 打样 —— generator-web（13 文件，最轻）

- 13 个残留文件全量清；7 个 TODO 直接换件；删除其 package.json 的 EP 与 unplugin-element-plus；删除 2 个 `@element-plus/icons-vue` 文件改用 lucide
- 重点产出：**《EP → shadcn 逐组件迁移手册》**，含：
  - 标签映射表（el-form → Form + zod、el-table → vxe-table useYDSZVxeGrid、el-dialog → Dialog、el-dropdown-menu → DropdownMenu）
  - 写法对照（ElForm rules→zod schema、FormInstance.validate→handleSubmit、v-loading→注册指令）
  - 典型反模式与规避
- 量化：**bundle 体积前后对比**（记录 generator-web EP 卸除收益），作为后续 app 基线

**验收**：generator-web 在 `grep` 三件套中计数为 0；pilot 手册归档 `docs/`；该 app 可独立 `pnpm build`。

### 批次 P1-3：批量迁移（按残留量升序，微前端天然支持逐 app 下线）

| 序 | 应用 | EP 文件 | 特殊难点 | 预估工时 |
|----|------|--------|-----------|---------|
| 1 | literule-web | 12 | RuleChainDesigner、DecisionTableDesigner（DAG）| 1d |
| 2 | system-web | 15 | 表单页集中（form-ui 受益最大）| 0.5d |
| 3 | nextwiki-web | 19 | WopiEditor/file 系列交互重 | 1d |
| 4 | agent-web | 20 | agent-chat 长列表、WorkflowDesigner（DAG）| 1d |
| 5 | message-web | 17 | 纯 CRUD 型，codemod 收益最大 | 0.5d |
| 6 | workflow-web | 20 | 设计器三件套 + form-designer + 表达式编辑器（**全仓最重，拆两批**）| 2d |
| 7 | cronjob-web | 26 | schedule-calendar（Calendar 组件依赖）| 1d |
| 8 | userinfo-web | 31 | 量大但多为标准 CRUD | 1.5d |

每 app 完成即：① 移除该 app 的 package.json `element-plus` / `unplugin-element-plus` 依赖 ② 该包 ESLint `no-restricted-imports` 升 error ③ 核心路径冒烟（列表/表单/详情/设计器）

**批次内细则**：
- 命令式 API：**一律先 import `@ydsz/notification.js`（el-bridge 完成件）**，逻辑零等；等 P2 评估是否进一步用原生 `showToast`/`confirm` 替代
- ElTable 页面：行数 < 50 用 CardGrid / EntityCard（规范 §1.1 行<50 用卡片视图）；复杂表统一 `useYDSZVxeGrid`
- ElForm/ElFormItem：新页面一律 form-ui schema；存量简单表单直接改写；复杂校验表单可先 `Form + FormField + vee-validate` 手写过渡，**不强推 schema 化**
- 设计器类重页面（workflow designer、RuleChainDesigner、DagDesigner、form-designer）**放最后单独一批**，允许逐组件替换
- 过期 TODO 清理：每个文件迁移完删除其对应 TODO 标记

### 批次 P1-4：@element-plus/icons-vue 清零

- generator-web: 2 文件 → lucide
- system-web: 1 文件 → lucide
- userinfo-web: 1 文件 → lucide
- comm/notification-bell: 1 文件 → lucide
- main/tenant-switcher: 1 文件 → lucide（已在 P0-2 处理）
- catalog 移除该条目并清 pnpm-lock

---

## 五、P2 阶段：收尾与构建链拆除

### 批次 P2-1：el-bridge 全量完成 + 拆除评估

- 全量 EP exit 后，统计仍 `@ydsz/notification/compat`（el-bridge）的 import 量
- 若各 app 已直接用原生 `showToast/confirm/notify`，删 el-bridge；若仍 > 30% compat 导入，保留 1 个 sprint 桥接再删
- `ElMessageBox.confirm` 三种调用形态归一（确认框、带取消回调、HTML 字符串形态）

### 批次 P2-2：构建链清理

- `pnpm-workspace.yaml` catalog 删除：`element-plus: ^2.10.2`、`@element-plus/icons-vue: ^2.3.2`、`unplugin-element-plus: ^0.10.0`
- 10 个 vite.config.mts 已随各批移除（P0-2 + P1-3 序 1~8）
- 根 `package.json` keywords 移除 `"element-plus"`
- `@ydsz/styles/ele` 包整体删除（P0-2 核验后正式删除）
- `pnpm install` 全量重装，**锁文件校验**

### 批次 P2-3：主题 CSS 变量切除

- `comm/effects/hooks/src/use-design-tokens.ts`：去除 `--el-*` 变量映射，改为 YDSZ token 直出
- `comm/styles/src/ele/index.css`：迁移为 `@ydsz/styles` 主入口别名；保留向后兼容 `:root` 别名 ≤ 1 版本周期
- `main/src/components/command-palette/command-palette.css`：42 处变量替换

### 批次 P2-4：门禁终态 + 文档 + 收益报告

- ESLint `no-restricted-imports` 全仓 error
- `vsh check-standard` EP 计数 = 0 进 CI
- 清理迁移期间登记的 el-bridge 语义缺口清单（`distinguishCancelAndClose`、`dangerouslyUseHTMLString`、VNode message、`ElNotification position: bottom-right`、`ElMessage grouping`）
- 文档同步：`docs/UI组件复用规范.md` ElDropdown 示例段→DropdownMenu；云顶编码规范 UI 条款
- 收益量化报告归档：main + 9 app 产物体积、依赖树、冷启动对比 → `docs/ep-exit-benchmark-2026-09-18.md`

---

## 六、风险清单

| 风险 | 等级 | 缓解 |
|------|------|------|
| main 注册表换心影响所有走 form-ui 的动态表单 | 🔴 | P0-2 单独可回滚 commit；核心页面人工冒烟清单（登录/用户/字典/角色/流程）|
| shared-business virtual-select 降级分页造成大数据集体验回退 | 🟡 | P0-1 记录受影响调用方；P1-1 SelectV2 落地后立即回补 |
| v-loading 行为差异（EP 全屏/局部遮罩语义）| 🟡 | P0-2 冒烟覆盖；common-ui loading 补丁对齐；P0-2 单独可回滚 |
| `@ydsz/styles/ele` 可能被 shadcn 主题间接引用 | 🟡 | P0-2 先 `grep -r "@ydsz/styles/ele"` 核验，必要时变量桥接迁入主 styles |
| 设计器类页面（WorkflowDesigner、RuleChainDesigner、DagDesigner、form-designer）重写引入回归 | 🟡 | 单独批次 + 逐组件替换策略；每个组件迁移前后 design-token 截图对比 |
| ElMessageBox 三种调用形态归一遗漏 | 🟡 | P1-3 序 1 起即登记，P2-1 统一对齐；先迁移再删死代码 |
| codemod 误伤 | 🟢 | 只做 import 行级变换；组件标签替换人工审查；type-check 兜底 |
| ElTable 全切 vxe-table 复杂度（use-crud-table 公共 composable）| 🟡 | P0-1 起完整跑 7 app 冒烟；预留 1 天 buffer |
| 过期 TODO 换件后组件特性差异（Select filterable / clearable / multiple / prefix-icon 等 slot 组合）| 🟡 | pilot 阶段建立「组件特性核对清单」；后续批次按手册走 |
| 跨团队回滚时 EP 与 shadcn 共存期 | 🟡 | 在 P0-3 门禁锁死"新增 EP import"；存量迁移期保留 el-bridge |

---

## 七、执行节奏建议（基线：2026-09-18 起算）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| 本周 | P0-1 comm 清零 + P0-3 门禁（eslint warn → comm/main error）+ codemod 脚本 | `grep element-plus comm` = 0 |
| 下周前段 | P0-2 main 换心 + P0-1 尾款（el-bridge 全量完成）| main build 通过 + 注册表冒烟 |
| 下周后段 | P1-1 前四件（Descriptions / Timeline / Steps / Progress+Skeleton）| kit 导出冒烟 |
| 第 3 周前段 | P1-2 pilot generator-web + 迁移手册 | pilot 手册 + bundle 基线 |
| 第 3 周后段 | P1-3 序 1~4（literule / system / nextwiki / agent）| 4 app 退出 EP |
| 第 4 周 | P1-3 序 5~8（message / workflow / cronjob / userinfo）+ P1-4 图标清零 | 9 app 全退 + catalog Icons 删除 |
| 第 5 周前段 | P2-1 el-bridge 评估 + P2-2 构建链清理 | catalog 3 条 EP 删除 + pnpm 重装 |
| 第 5 周后段 | P2-3 主题变量切除 + P2-4 门禁终态 + 收益报告 | 全仓 eslint error + 0 残留 + benchmark 报告 |

每批次合入前必跑：`pnpm type-check && pnpm lint && vsh check-standard`（静态门禁三件套），并同步在本文件勾选该批次。

---

## 八、检查清单（供勾选）

- [ ] P0-1  comm 18 文件 + package.json EP 清零
- [ ] P0-2  main component/form/tenant-switcher 三文件 + 注册表
- [ ] P0-3  eslint no-restricted-imports（comm/main error）+ vsh check 增加 EP 计数 + codemod-ep-imports.mjs
- [ ] P1-1  Descriptions/Timeline/Steps/Progress/Skeleton/SelectV2-virtual
- [ ] P1-2  generator-web pilot + 迁移手册 + bundle 基线
- [ ] P1-3  应用层按序 1~8 迁移
- [ ] P1-4  @element-plus/icons-vue 清零
- [ ] P2-1  el-bridge 全量 + 拆除评估
- [ ] P2-2  catalog 3 条 + vite 10 文件 + styles/ele 删除
- [ ] P2-3  --el-* CSS 变量→YDSZ token
- [ ] P2-4  eslint 全仓 error + benchmark 报告 + 文档同步

---

## 九、与既有计划的关键差异

| 项 | 旧计划（09-17） | 本计划（09-18） |
|----|--------------|--------------|
| 模板层 el- 标签 | 声称已清零 | **实测 apps 24 / comm 24 / main 1**，纳入 P0/P1 |
| 脚本层 EP 计数 | ~194 | **192 实测**（不含 icons 6）|
| 构建链清理顺序 | 统一 P2 收尾 | **前置**：P0-2 随 main、P1-3 各 app 完成即拆 vite config |
| ElMessageBox 桥接 | 文案称"业务零改动换 import" | 明示 3 种调用形态归一 + 工期 |
| Cascader/Transfer/Calendar/Rate 顺序 | 统一在 P1-1 补齐 | **按 app 迁移进度按需插入**，避免过度设计 |
| SelectV2 虚拟滚动 | 仅标记"用 @vueuse" | 指定 wrapper 方案 + 工时 |
| 过期 TODO 认识 | 仅点出 | 明确 87 处中 ≥40% 属过期标记直接换件 |
| 执行节奏 | 按周次粗排 | 精确到 5 周 + 每批次门禁命令 |
