# Element Plus 彻底退场 + 自研 shadcn/ui 单栈收敛 —— 重构计划 v3（执行版）

> 日期：2026-09-17
> 前序：v1 `ep-exit-refactor-plan-2026-09-17.md` → v2 `ep-exit-refactor-plan-2026-09-18.md` → **本版 v3（以今日全量复测为准）**
> 依据：云顶编码规范 + `docs/UI组件复用规范.md` + 本轮命令实测（Grep 三口径交叉验证）
>
> **结论先行**：v2 的批次结构（P0 换心脏 → P1 补件+批量 → P2 收尾）仍然成立，但 v2 基线有 **5 处勘误**（含 1 个方法论级缺陷：测量口径漏形态导致 main 漏计 3 文件），并遗漏了 **微前端共享依赖层**（importmap/vendor）这一第六层。真实完成度约 30%：apps 模板层已基本清空（仅 2 文件）、el-bridge 已是完成品、kit 就绪；但脚本层 apps 168 文件未动、三处 EP 注册表未动、构建链与共享层未动。

---

## 一、v2 基线勘误（5 处，均经今日实跑核验）

| # | v2 记录 | v3 实测 | 证据 |
|---|---------|---------|------|
| 1 | main 脚本层 1 文件 | **4 文件**：`tenant-switcher.vue`（单引号）、`setup/app.ts`（双引号 ElLoading）、`adapter/component/index.ts`（动态 import ×2 形态）、**`locales/index.ts`（EP locale ×5，v1/v2 均漏计）** | `main/src/locales/index.ts:8,27-30`：`import type { Language } from 'element-plus/es/locale'` + 4 个 locale 包 |
| 2 | comm `adapter/component` 仅「ElNotification→showToast」单点 | **该文件是完整第二 EP 注册表，35 处 EP 引用**（17 个 EP 组件的 Promise.all 双 import + 静态 ElNotification） | `comm/effects/shared-business/src/adapter/component/index.ts:21-70+`，与 main 注册表同款 |
| 3 | el-bridge 半成品（ElMessageBox/ElNotification 未处理） | **已是完成品**：三 API 全导出、无 EP 运行时 import（仅第 4/7 行注释提及字面量） | `el-bridge.ts:322-324` `export const ElMessage/ElMessageBox/ElNotification`；全文件无 element-plus import |
| 4 | apps 模板层 kebab 24 文件 | **2 文件**（`workflow-form-renderer.vue`、`system-web/src/views/preference/index.vue`）——收敛快于预期 | Grep `<el-` apps 全量 |
| 5 | （未识别） | **第六层残留：微前端共享依赖层**——EP 作为 micro-kernel importmap 外部化依赖存在 | `conf/vite-config/src/micro-shared-deps.ts:41-42`、`main/public/vendor/importmap.json`（EP + icons-vue + scopes 子路径）、vendor 物理 ESM 文件 |

**附加事实**：importmap 中 EP 为 `2.14.5`，catalog 声明 `^2.10.2` —— 共享依赖版本已经漂移失控，本身就是 EP 退场的佐证。

---

## 二、测量口径修正（方法论，先于一切批次）

EP 引用存在 **三种形态**，任何单一 pattern 都会漏计（v2 的 main「1 文件」即因此产生假阴性）：

1. 单引号静态：`import { ElMessage } from 'element-plus'`
2. 双引号静态：`import { ElLoading } from "element-plus"`（main/setup/app.ts:25）
3. 动态子路径：`import('element-plus/es/components/xxx/index')`（三处注册表核心形态）

另有两类**假阳性**必须排除：注释行字面量（`el-bridge.ts:4,7` 注释含 `from 'element-plus'` 字样）、声明未消费的 package.json。

**统一探测正则**（供 vsh check-standard 与验收共用）：

```
import 形态：/(from\s+['"]element-plus|import\(\s*['"` ]*element-plus)/
模板形态：/<el-[a-z]/
排除：行首为 //、*、/* 的注释行
```

> ⚠️ **v2 验收标准第 1 条的 grep 命令会假通过**（只查单引号静态形态）。本版验收命令见 §三。
> ⚠️ ESLint `no-restricted-imports` **不覆盖模板字符串动态 import**（`import(\`element-plus/es/\${x}\`)`），必须由 vsh 计数器兜底，两者缺一不可。

---

## 三、目标终态（验收标准 v3）

1. 三形态探测（§二正则）在 `apps/ main/ comm/` 的 *.vue/*.ts/*.mts 计数 = **0**（含注册表动态 import、EP locale）
2. `<el-` 模板探测在 `apps/ main/ comm/` *.vue 计数 = **0**
3. `["']@element-plus/icons-vue` 业务引用 = 0
4. `pnpm why element-plus` 为空；catalog 删除 3 条（element-plus / @element-plus/icons-vue / unplugin-element-plus）
5. 10 个 vite.config.mts 移除 unplugin-element-plus；14 个 package.json 移除 EP 依赖与死声明（含 cronjob 的 icons-vue 死声明）
6. **importmap.json 不含 element-plus / @element-plus/icons-vue / element-plus/ 子路径映射；vendor/esm.sh 下 EP 相关物理文件删除；`pnpm sync:shared-deps:check` 通过**
7. ESLint `no-restricted-imports` 全仓 error + `vsh check-standard` EP 计数 = 0 进 CI
8. 表单统一 form-ui（vee-validate+zod）/ 注册表统一 shadcn 映射；表格统一 vxe-table；弹层统一 popup-ui + Dialog/Sheet
9. `pnpm type-check && pnpm lint && vsh check-standard` 三件套 + 10 app dev 冒烟通过
10. benchmark 报告归档 `docs/ep-exit-benchmark-2026-09-17.md`（main + 9 app 体积/依赖树/冷启动前后对比）

---

## 四、P0：换心脏 + 门禁先行（阻塞路径，约 4~5 人日）

### 批次 P0-0：口径与门禁（最先做——口径错了后面全错）

- `bash/vsh/src/check-standard`：新增 EP 残留计数器，按 §二正则统计三形态 + 模板形态，输出分层计数（apps×9/comm/main），CI 可判定
- `conf/lint-configs/eslint-config`：`no-restricted-imports`（element-plus、@element-plus/*）先对 **comm/main 设 error**（他们应最先清零），apps 逐包跟进
- 编写 `bash/codemod-ep-imports.mjs`（替代粗糙的 `migrate-apps-ep.mjs`）：
  - import 行级替换：`from 'element-plus'` → `from '@ydsz/notification/compat'`（命令式 API 场景）
  - 删除过期 TODO 标记（apps 65 文件的「暂无 shadcn」多数已失效）
  - **不做**组件标签替换（人工审查）；跑 type-check 兜底

### 批次 P0-1：comm 清零（17 个 import 文件 + 5 个标签文件 + 第二注册表）

**P0-1a 第二注册表换心（最优先）**：`shared-business/src/adapter/component/index.ts` —— 35 处 EP 引用的异步组件注册表，9 app 经 `@ydsz/shared-business` 消费。整体替换为 shadcn-ui 映射（方案与 main 注册表一致，见 P0-2 映射表，两处必须同步换心保持 ComponentType 契合）。完成后 `grep element-plus shared-business/` 应仅剩 ElNotification 静态 import 的清除。

**P0-1b 公共组件清洗（17 文件）**：

| 文件 | 替换方案 |
|------|----------|
| virtual-select.vue | ElSelectV2 → kit Select + 分页加载（降级方案，记录调用方；P1-1 虚拟滚动件落地后回补） |
| secondary-auth-modal、keyboard-help、excel-import/export-button | ElDialog→Dialog、ElButton→Button、ElUpload→Upload |
| async-state.vue | ElSkeleton → Loading + Spinner 组合 |
| approval-timeline.vue | **临时降级为列表**（P1-1 Timeline 落地回补），先解除 EP 依赖 |
| dict-select / dict-tag / status-badge(标签) | ElSelect→Select、ElTag→Badge |
| error-state、user-avatar(标签) | EmptyState / Avatar + Popover |
| use-crud-table.ts | ElTable→vxe-table useYDSZVxeGrid、ElPagination→kit Pagination（⚠️ 关键 composable，7 app 回归冒烟） |
| use-excel-export.ts | ElMessage→showToast（compat） |
| adapter/vxe-table.ts | ElButton→Button、ElImage→CellImage |
| notification-bell（@core/components） | ElBadge/Popover/Scrollbar/Tooltip/ElIcon → Badge/Popover/ScrollArea/Tooltip/lucide（解除 comm 对 icons-vue 的依赖） |
| common-ui network-status | ElAlert → kit alert 组合 |
| common-ui error-boundary | ElResult → EmptyState error-feedback preset |
| common-ui page-status / error-state / empty-state（**标签无 import，属未知组件渲染缺陷**） | 换 kit 组件，顺带修复缺陷 |
| shared-auth i18n-setup.ts | EP locale 动态加载死代码，直接删除 |

**验收**：三形态 grep comm = 0（el-bridge/compat 注释除外——注释属 P2-1 随模块删除）；common-ui/shared-auth/shared-business package.json 无 EP 依赖；type-check 通过。

### 批次 P0-2：main 换心（4 文件 + 注册表）

1. **`main/src/adapter/component/index.ts`**：`createElAsyncComponent` 17 个 EP 组件 → shadcn 映射（与 P0-1a 同步）：

   | 注册表键 | 替换 | 备注 |
   |----------|------|------|
   | Input / InputNumber | Input / NumberField | |
   | Select / SelectV2 / ApiSelect | Select（虚拟滚动降级分页） | SelectV2 替代件 P1-1 |
   | Checkbox / CheckboxButton / CheckboxGroup | Checkbox / ToggleGroup | options 渲染逻辑重写 |
   | Radio / RadioButton / RadioGroup | RadioGroup + indicator | 同上 |
   | Switch / DatePicker | Switch / DatePicker | kit 均已有 |
   | TimePicker | **暂缓**：date-picker 扩展，P1-1 | 先登记调用方 |
   | TreeSelect / ApiTreeSelect | Tree + Popover 组合 | P1-1 TreeSelect 专用件前用内联 |
   | Divider / Space | Separator / cn("flex", gap-*) | |
   | Upload | kit Upload | |
   | DefaultButton / PrimaryButton | Button variant=secondary/default（保留 type 兼容层） | |

2. **`main/src/locales/index.ts`（v2 遗漏项）**：`Language` 类型与 4 个 EP locale 包 → `@ydsz/locales` 自持类型 + vue-i18n 原生（shadcn-ui 已用 `useSimpleLocale`，不依赖 EP locale）
3. **`main/src/setup/app.ts`**：删除 `ElLoading.directive`（行 45；自研 `registerLoadingDirective` 行 46 已并存就位，删 EP 行即完成切换）；核验后删除 `import "@ydsz/styles/ele"`（行 22）
4. **`main/src/components/tenant-switcher.vue`**：ElSelect/ElOption→Select、ElTooltip→Tooltip、OfficeBuilding→lucide Building2

**验收**：三形态 grep main = 0；登录/用户/字典/角色核心表单页人工冒烟；v-loading 行为对齐；main package.json + vite.config 去 EP。

### 批次 P0-3：门禁生效

- 每批次单独 PR，合入前 `pnpm type-check && pnpm lint && vsh check-standard`
- ESLint no-restricted-imports：comm/main 已 error；**新增 EP import 被 CI 直接拦截**（共存期防回流）

---

## 五、P1：补缺口 + 应用批量迁移（约 7~9 人日）

### 批次 P1-1：kit 补件（实测 35 个 ui 目录基础上补 7+ 件）

已确认缺口（35 目录全量枚举后比对）：**Descriptions、Timeline、Steps、Progress、Skeleton、Slider、TimePicker、TreeSelect 专用件、SelectV2 虚拟滚动 wrapper**；按需件：Cascader/Transfer/Calendar/Rate（随 app 进度插入，不提前造）。

| 序 | 组件 | 受益方 | 工时 |
|----|------|--------|------|
| 1 | Descriptions + DescriptionsItem | 9 app 详情页 | 0.5d |
| 2 | Timeline + TimelineItem | approval-timeline 回补 + 5 app | 0.5d |
| 3 | Steps | workflow simulation / message trace | 0.5d |
| 4 | Progress + Skeleton | cronjob queue / userinfo import / async-state 回补 | 0.5d |
| 5 | Slider | workflow / agent 设计器 | 0.5d |
| 6 | SelectV2 wrapper（useVirtualList + 原生 Select） | virtual-select 回补 + 双注册表 | 0.5d |
| 7 | TimePicker / TreeSelect | main 注册表尾款 | 0.5d |

每件入库：index 导出 + a11y（radix 内置）+ 暗色 token + `useRenderPerformance` 对齐 UI组件复用规范 §7。

### 批次 P1-2：pilot —— generator-web（12 文件 + 自有注册表）

修正 v2 判断：generator-web 不是「最轻」，而是**最优 pilot**——12 个残留文件中恰好包含自有 `adapter/component` 注册表（2 处 EP 引用）+ `adapter/vxe-table` + 2 个 icons-vue 文件，完整覆盖注册表换心/表格适配/图标替换三类场景，pilot 产出可直接复制到其余 8 app。

- 12 文件全清 + 注册表换 shadcn + icons→lucide + package.json/vite.config 去 EP
- 产出《EP→shadcn 逐组件迁移手册》：标签映射表、ElForm rules→zod、FormInstance.validate→handleSubmit、v-loading 用法、Select 特性核对清单（filterable/clearable/multiple/prefix-icon）
- 记录 bundle 前后基线（EP JS+CSS 退出该 app 的收益）

### 批次 P1-3：批量迁移（按实测 168 文件重排）

| 序 | 应用 | 实测文件 | 难点 | 工时 |
|----|------|---------|------|------|
| 1 | literule-web | 12 | RuleChainDesigner、DecisionTableDesigner | 1d |
| 2 | system-web | 15 | 表单页集中（form-ui 受益最大） | 0.5d |
| 3 | message-web | 17 | 纯 CRUD，codemod 收益最大 | 0.5d |
| 4 | nextwiki-web | 19 | WopiEditor/file 系列交互 | 1d |
| 5 | agent-web | 19 | agent-chat 长列表、WorkflowDesigner | 1d |
| 6 | workflow-web | 20 | 设计器三件套 + form-designer + 表达式编辑器（**拆两批，设计器最后**） | 2d |
| 7 | cronjob-web | 25 | schedule-calendar（Calendar 按需件） | 1d |
| 8 | userinfo-web | 29 | 量大但标准 CRUD；standalone-main.ts、role-assign Transfer、user 树 TreeSelect | 1.5d |

策略细则（沿用 v2）：命令式 API 先统一 `@ydsz/notification/compat`（零逻辑改动），P2 再评估切原生；ElTable 行<50 用卡片视图、复杂表用 useYDSZVxeGrid；表单新页一律 form-ui schema、存量不强推；每 app 完成即拆其 vite/package.json EP 并升 ESLint error。

### 批次 P1-4：icons-vue 清零

业务 6 文件（generator 2 / system 1 / userinfo 1 / notification-bell 1 / tenant-switcher 1）→ lucide；cronjob package.json 死声明删除；catalog 移除。

---

## 六、P2：微前端共享层拆除 + 收尾（约 3~4 人日）

### P2-1：el-bridge / compat 拆除评估

全量退出后统计 `@ydsz/notification/compat` 导入量：若各 app 已直用 showToast/confirm/notify 则删除 el-bridge.ts + compat.ts（注释中的字面量随之消失）；否则保留 1 个 sprint。清理语义缺口登记清单（distinguishCancelAndClose 已在 ConfirmOptions 支持、dangerouslyUseHTMLString、VNode message、position: bottom-right、grouping）。

### P2-2：构建链清理

catalog 删 3 条；10 个 vite.config.mts 已随批次完成；14 个 package.json 清理；根 package.json keywords/description 去 element-plus；`@ydsz/styles/ele` 删除；`pnpm install` 重装锁文件校验。

### P2-3：微前端共享层拆除（v2 遗漏，本版新增）

1. `conf/vite-config/src/micro-shared-deps.ts:41-42`：删除 EP + icons-vue 两条共享依赖声明
2. `main/public/vendor/importmap.json`：用 @jspm/generator 重新生成（catalog 已有 ^2.5.3），移除 `element-plus`、`@element-plus/icons-vue` 主映射 + scopes 下 `element-plus/` 子路径映射
3. vendor/esm.sh 下 EP 相关物理 ESM 删除（`_starelement-plus@2.14.5`、`_star@element-plus/icons-vue@2.3.2`、async-validator、@popperjs、@sxzz/popperjs-es、normalize-wheel-es、lodash-unified 等仅被 EP 消费的级联依赖——删前逐一 `grep` 核验无其他消费方）
4. `bash/vsh/src/check-bundle/index.ts` 白名单更新（现含 @element-plus/icons-vue 引用）
5. `pnpm sync:shared-deps` 重跑 + `sync:shared-deps:check` 通过
6. `application.ts:214-219` 注释级清理（async-validator 外部化说明）

### P2-4：主题 CSS 变量切除

- `use-design-tokens.ts`：59 处 `--el-*` → YDSZ token 直出（v1 记录 55，实测 59）
- `main/src/components/command-palette/command-palette.css`：42 处替换
- `comm/styles/src/ele/index.css`：变量桥迁入 `@ydsz/styles` 主入口，向后兼容别名 ≤1 版本周期

### P2-5：门禁终态 + 报告 + 文档

ESLint 全仓 error；vsh EP 计数 = 0 进 CI；`docs/UI组件复用规范.md`（ElDropdown 示例段→DropdownMenu）与云顶编码规范 UI 条款同步；benchmark 报告归档。

---

## 七、风险清单（v2 基础上新增 3 项）

| 风险 | 等级 | 缓解 |
|------|------|------|
| **双注册表（main + shared-business）换心不同步，ComponentType 契约漂移** | 🔴 | P0-1a 与 P0-2 同一 PR 合入；pilot 前后双冒烟 |
| **门禁口径漏形态导致假通过（v2 验收命令即中招）** | 🔴 | P0-0 先行，vsh 三形态计数 + eslint 双门禁 |
| main 注册表换心影响全部动态表单 | 🔴 | 单独可回滚 commit；核心页面冒烟清单 |
| **importmap 版本漂移（2.14.5 vs ^2.10.2）说明共享层已不受控，重生成后子应用加载行为变化** | 🟡 | P2-3 单独批次；重生成后 10 app 冷启动冒烟；保留旧 importmap 备份一版 |
| virtual-select 降级分页体验回退 | 🟡 | 记录调用方；P1-1 件落地立即回补 |
| v-loading 语义差异（app.ts:45-46 现双指令并存，删除 EP 行后行为切换） | 🟡 | P0-2 冒烟覆盖全屏/局部两场景 |
| 设计器类页面重写回归 | 🟡 | 单独批次 + 逐组件替换 + token 截图对比 |
| use-crud-table 公共 composable 影响面 | 🟡 | 7 app 回归冒烟 + 1 天 buffer |
| codemod 误伤 | 🟢 | 仅 import 行级 + TODO 标记；type-check 兜底 |
| 过期 TODO 换件后 Select 特性组合差异 | 🟡 | pilot 建立特性核对清单 |

---

## 八、执行节奏（5 周，基线 2026-09-17）

| 周次 | 目标 | 交付物 |
|------|------|--------|
| W1 前段 | P0-0 门禁口径 + P0-1a 双注册表换心 | vsh EP 计数器上线；注册表 shadcn 化 |
| W1 后段 | P0-1b comm 清零 | `grep comm = 0`（注释除外） |
| W2 前段 | P0-2 main 换心（含 locales） | main 三形态 = 0 + 冒烟 |
| W2 后段 | P1-1 件 1~4（Descriptions/Timeline/Steps/Progress+Skeleton） | approval-timeline 回补 |
| W3 前段 | P1-2 pilot generator-web | 迁移手册 + bundle 基线 |
| W3 后段 | P1-3 序 1~4（literule/system/message/nextwiki） | 4 app 退出 |
| W4 | P1-3 序 5~8（agent/workflow/cronjob/userinfo）+ P1-4 图标清零 | 9 app 全退 |
| W5 前段 | P2-1 评估 + P2-2 构建链 + P2-3 共享层拆除 | catalog/importmap/vendor 全清 |
| W5 后段 | P2-4 主题变量 + P2-5 门禁终态 + benchmark | 全仓 0 残留 + 报告归档 |

---

## 九、检查清单

- [ ] P0-0 vsh 三形态计数器 + eslint（comm/main error）+ codemod-ep-imports.mjs
- [ ] P0-1a shared-business 第二注册表换心（35 处）
- [ ] P0-1b comm 17 import + 5 标签文件清零
- [ ] P0-2 main 4 文件换心（含 locales/index.ts EP locale）
- [ ] P1-1 kit 补 7 件
- [ ] P1-2 generator-web pilot + 迁移手册 + bundle 基线
- [ ] P1-3 应用层按序 1~8（168 文件）
- [ ] P1-4 icons-vue 清零（6 文件 + 死声明）
- [ ] P2-1 el-bridge/compat 拆除评估
- [ ] P2-2 catalog 3 条 + 14 package.json + styles/ele
- [ ] P2-3 importmap/vendor/micro-shared-deps 共享层拆除
- [ ] P2-4 --el-* 变量（59 + 42 处）→ YDSZ token
- [ ] P2-5 门禁终态 + benchmark + 文档同步

---

## 十、与 v1/v2 的差异总结

| 项 | v1（09-17） | v2（09-18） | **v3（本版）** |
|----|------------|------------|--------------|
| 测量口径 | 检出假阴性后勘误 | 三层计数但仍漏双引号/动态形态 | **三形态 + 注释排除，验收命令修正** |
| main 残留 | 3 文件 | 1 文件（漏计） | **4 文件（含 locales EP locale）** |
| comm 注册表 | 未识别 | 误记为单点替换 | **35 处引用的完整第二注册表** |
| el-bridge | 可用 | 半成品 | **完成品（P0 尾款关闭）** |
| apps 模板层 | 勘误后 28 | 24 | **实测 2** |
| 微前端共享层 | 未识别 | 未识别 | **第六层：importmap/vendor/版本漂移** |
| 验收命令 | grep 计数 | 单引号 grep（会假通过） | **三形态正则 + vsh 计数器 = 0** |
