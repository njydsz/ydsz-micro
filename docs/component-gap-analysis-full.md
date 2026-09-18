# YDSZ UI 组件库竞品差距分析报告（完整版）

> **分析日期**: 2026-09-18  
> **分析对象**: ydsz-ui（88 primitives）+ 业务复合组件（common-ui 35+ / shared-business 18）  
> **竞品锚点**: Element Plus 3.x / Ant Design Vue 4.2+ / Naive UI 2.44+ / Reka UI 2.x / shadcn-vue v2 / Arco Design Vue 2.5x / PrimeVue 5.x  
> **依据文档**: `component-benchmark-88.md` (09-17) + `component-optimization-plan.md` (09-17) + 全量源码审计

---

## 一、组件资产盘点

### 1.1 基础组件层（ydsz-ui primitives）

| 维度 | 数值 |
|------|------|
| 组件总数 | 88 |
| 聚合出口 | `src/primitives/index.ts` |
| 平均文件数 | 3.5 |
| 有 Storybook Stories | 18 / 88（20%） |
| 有 .test.ts | 17（覆盖约 15%） |
| 两者皆有 | ~9 |
| 两者皆无 | ~71（80%） |

88 个组件呈现清晰二态：A 组 44 个薄封装（纯 Reka UI 透传，2 文件结构）+ B 组 44 个复合实现（3-20 文件，带子组件 + CVA + 状态机）。

### 1.2 业务复合组件层

**common-ui（通用 UI 组件）** — 位于 `comm/effects/common-ui`：

| 能力域 | 组件清单 |
|--------|---------|
| 状态呈现 | YdErrorBoundary / YdErrorState / YdCommonEmptyState / YdNetworkStatus / YdErrorFeedback |
| 加载 | YdPageSpinner / YdPageLoading / Skeleton（指令 + 组件） |
| 表单控件 | form-switch / form-checkbox / form-checkbox-group / form-radio-group / form-input-number / form-time-picker / form-tree-select / form-upload |
| 功能组件 | YdIconPicker / YdColPage / YdCountTo / YdEllipsisText / YdApiComponent |
| 安全验证 | slider-captcha / point-selection-captcha / slider-translate-captcha / slider-rotate-captcha（4 种验证码） |
| 工具 | YdVResize / Watermark / SafeHtml / JSON Viewer / PageStatus |

**shared-business（共享业务组件）** — 位于 `comm/effects/shared-business`：

| 能力域 | 组件清单 |
|--------|---------|
| 数据容器 | YdAsyncState（loading/error/empty/data 自动切换） |
| 状态呈现 | YdBizStatusBadge / YdFileIcon / YdCommonEmptyState2 / YdCommonErrorState |
| 用户相关 | YdUserAvatar |
| 字典联动 | YdDictSelect / YdDictTag |
| Excel | YdExcelExportButton / YdExcelImportButton |
| 虚拟化 | YdVirtualSelect / YdVirtualList |
| 审批 | YdApprovalTimeline |
| 交互 | YdAppTour / YdKeyboardHelp / YdSecondaryAuthModal |

**应用级复合组件** — 各业务模块自建：

| 模块 | 代表组件 |
|------|---------|
| workflow-web | WorkflowDesigner / FlowDiagramViewer / WorkflowFormRenderer / embedded-approval / ExpressionEditor / DesignerCanvas+Toolbar+Palette+PropertyPanel |
| literule-web | RuleChainDesigner / DecisionTableDesigner / DslEditor |
| agent-web | WorkflowDesigner(DAG) / ConversationShare / agent-status-badge |
| nextwiki-web | WopiEditor / FileVersionHistory |
| cronjob-web | DagDesigner / GlueCodeEditor / WebhookConfigPanel |
| generator-web | CodeDiffViewer |
| system-web | secondary-auth-modal |
| main(主应用) | tenant-switcher / global-search / command-palette / network-alert / subapp-progress |

**ydsz-ui 之外独立分包**：`@ydsz-core/form-ui` / `@ydsz-core/editor-ui` / `@ydsz-core/layout-ui` / `@ydsz-core/menu-ui` / `@ydsz-core/tabs-ui` / `@ydsz-core/popup-ui`。

---

## 二、基础组件层差距（对标一线竞品）

### 2.1 能力完整度

| 能力域 | ydsz-ui | Element Plus 3.x | Ant Design Vue 4.x | Naive UI 2.44 | Arco Design | 差距评级 |
|--------|---------|-----------------|-------------------|---------------|-------------|---------|
| 通用（按钮/图标/排版/分割线） | 18 | 22 | 18 | 20 | 18 | ⚠️ 少 4 |
| 布局（栅格/弹性/间距） | 12 | 14 | 11 | 12 | 12 | ✅ 持平 |
| 表单（输入/选择/校验/上传） | 28 | 32 | 28 | 30 | 26 | ⚠️ 少 2-4 |
| 数据展示（表/树/列表/描述） | 14 | 18 | 16 | 18 | 14 | 🔴 少 4 |
| 反馈（弹窗/抽屉/提示/进度） | 12 | 14 | 12 | 14 | 12 | ⚠️ 少 2 |
| 导航（标签/面包屑/菜单） | 8 | 10 | 9 | 8 | 9 | ⚠️ 少 1-2 |
| 特殊（FloatButton/Tour/QRCode） | 6 | 5 | 3 | 5 | 7 | ✅ 领先 |
| **合计** | **88** | **~115** | **~97** | **~107** | **~98** | ⚠️ 差距约 10-27 |

### 2.2 核心能力白缺口

| 编号 | 缺失/薄弱项 | 竞品参考 | 影响评级 |
|------|-----------|---------|---------|
| G-01 | **Table 数据层不完整** — 无排序/筛选/行选择/树形/汇总状态机，固定列仅 sticky | Naive DataTable 列拖拽+固定+聚合 | 🔴 P0 阻断 |
| G-02 | **Form 校验链路** — 仅 vee-validate 起步，无 validateOn 分档 / dependencies / 去抖异步 | EP rules 200+、Naive 类型推断、Ant Form 联动 | 🔴 P0 阻断 |
| G-03 | **国际化字符串外部化** — 仅 date-picker（1/88 组件）接入了 i18n | EP 60+ 语言、Ant 40+、Naive 30+ | 🔴 P0 阻断 |
| G-04 | **Upload 切片/秒传/续传** — 仅前端选择器，composables/use-chunk-upload 已存在但未接线 | EP/Ant/Naive 标配 tus 🔶 | 🟠 P1 严重 |
| G-05 | **Tree 拖拽排序/懒加载/筛选** — 仅渲染层 | EP/Naive/Arco 树形拖拽 | 🟠 P1 严重 |
| G-06 | **DatePicker 粒度矩阵** — 仅 date/datetime/range（3 种），竞品 8+（week/month/quarter/year） | EP DatePicker 全粒度 | 🟠 P1 严重 |
| G-07 | **AutoComplete 异步搜索** — 仅前端静态数据 | Ant AutoComplete 异步 | 🟠 P1 严重 |
| G-08 | **Input 系细节** — 无 clearable/prefix/suffix/autosize（裸壳） | EP/Ant Input 标配 | 🟠 P1 严重 |
| G-09 | **ConfigProvider 打通** — 已存在但尚未在全部消费点接通 | EP/Naive/Arco 标配 | 🟡 P2 中等 |
| G-10 | **命令式反馈 API 分裂** — primitives/message（声明式）与 effects/notification（命令式）两套体系 | Naive discrete API + Provider 双入口 | 🟡 P2 中等 |
| G-11 | **Tabs 可关闭/可新增/溢出滚动** — 当前为 Reka 纯转发 | EP/Ant Tabs 全功能 | 🟡 P2 中等 |
| G-12 | **在制品验收** — cascader / tree-select / time-picker 已导出但零测试零 stories | — | 🟡 P2 中等 |

### 2.3 设计系统成熟度

| 维度 | ydsz-ui 现状 | 一线竞品最佳实践 | 差距 |
|------|-------------|-----------------|------|
| 设计 Token | Tailwind v3 + `baseColor: slate`；主题 schema 已存在（cssVar+暗色值）| Element Plus 3.0 运行时 CSS 变量、Naive 类型安全 Token | 需三层化（base→semantic→component） |
| 主题编辑器 | YdThemeEditor 已存在（产品级排期待确认）| Naive ThemeEditor、Arco Design Lab | 中等 |
| 品牌色切换 | `useTheme` `style.setProperty` 写 CSS 变量已实现 | EP/Ant/Arco ConfigProvider 切换 | 接近 |
| 暗色模式 | `dark:` 类 + useTheme hook 双模式 | Naive `useThemeVars()`、Vuetify `useTheme()` | 良好 |
| 密度档位 | dark / light / compact 三预设 | EP size 系統、Naive SizeEnum | 需扩展 normal/compact/loose |
| 动效体系 | 仅 Tailwind 过渡类 | VueUse Motion、Naive 精细过渡 | 明显缺失 |
| 圆角/阴影层级 | 未 token 化 | Ant 5 级圆角、Naive 自定义圆角变量 | 需补 |
| RTL 方向 | ❌ | EP/Ant/Arco 部分支持 | 缺失 |

### 2.4 开发者体验 (DX)

| 维度 | ydsz-ui | 竞品 | 差距评级 |
|------|---------|------|---------|
| API 一致性 | ✅ Yd 前缀 + v-model | 统一度高 | 持平 |
| TypeScript | 100% 全 TS | Naive 100%、Ant ~95% | 持平 |
| 自动导入 | ✅ unplugin-vue-components | 标配 | 持平 |
| 站点文档 | ⚠️ 仅 stories（18 组件约 20%）| EP/Ant 全量 + Playground | 🔴 严重 |
| Playground | ❌ | Vuetify Playground、Naive 在线示例 | 🔴 严重 |
| 全局搜索 | ❌ | 主流标配 | 🔴 严重 |
| 脚手架 CLI | ❌ | shadcn-vue CLI | 🟠 中等 |
| Changelog | ⚠️ 无正式变更日志 | EP/Ant Semver Changelog | 🟠 中等 |
| Figma 设计稿 | ❌ | EP Figma / Ant Sketch / Arco Lab | 🔴 严重 |
| Nuxt 模块 | ❌ | Nuxt UI 原生 | 🟡 低 |
| 测试门禁 | 17 测试文件，15% 覆盖 | 主流 60%+ | 🔴 严重 |
| A11y 专项 | 依赖 Reka 继承，无自检 | Reka WCAG 2.1 AA | 🟠 中等 |

### 2.5 性能

| 维度 | ydsz-ui | 竞品 | 差距 |
|------|---------|------|------|
| Tree-shaking | ✅ ESM + 具名导出 | 标配 | 持平 |
| 按需加载 | ✅ unplugin | 标配 | 持平 |
| 虚拟滚动 | ⚠️ virtual-table 孤岛在业务层，Select 已接入 | Naive 全系默认、EP vxe | 🔴 需整合 |
| 首屏体积 | 约 500KB+（gzipped，88 组件全集）| EP ~380KB / Ant ~420KB / Naive ~300KB | 🟠 偏胖 |
| 渲染性能 | ⚠️ 无明显 memo / signal 优化 | Ant 4.x signal 优化、Naive 细粒度响应 | 🟠 中等 |
| SSR | ⚠️ 未验证 | Naive 一等公民、EP/Ant PASS | 🟡 低 |
| 懒水合 | ✅ `useIdleHydrate`（requestIdleCallback）| — | ✅ 独有优势 |

### 2.6 可访问性 (A11y)

| 维度 | ydsz-ui | 竞品 | 差距 |
|------|---------|------|------|
| WAI-ARIA | 68 文件 / 143 处 aria 属性，继承自 Reka | Reka WCAG 2.1 AA | 良好 |
| 键盘导航 | 依赖 Reka 架构性保障 | 完整 | 良好 |
| 焦点管理 | Dialog/Sheet 走 Reka 焦点陷阱 | 最佳 | 良好 |
| 色彩对比度 | ⚠️ 未系统化检测 | EP 4.5:1、Ant 4.5:1 | 需接入 axe-core |
| 屏幕阅读器 | ⚠️ 未专门测试 | Reka 优秀 | 需补测试 |
| RTL | ❌ | EP/Ant/Arco 部分 | 缺失 |

---

## 三、业务复合组件层差距（对标竞品业务组件生态）

### 3.1 竞品业务组件生态扫描

一线竞品已从"基础组件库"演进为**后台业务解决方案**：

| 竞品 | 业务组件生态 | 代表 |
|------|-------------|------|
| **Ant Design** | ProTable / ProForm / ProList / ProDescriptions / QueryFilter / LightFilter / ProSkeleton | 几乎覆盖 CRUD 全场景 |
| **Arco Design** | ProTable / Form StepsForm / Form DynamicForm + Arco AI 助手 | 完整 Pro 套件 |
| **Element Plus** | vnda TablePro + 可视化表单设计器（JSON Schema 驱动）| 趋向 Pro 化 |
| **Naive Admin** | Naive Admin Pro + usePageTable / useFormModal 等封装 | 模板级输出 |
| **PrimeVue** | FormKit / DataTable Pro 高级扩展 | 商业付费 |
| **Vuetify** | Vuetify Pro / Material Dashboard | 付费模板 |

### 3.2 YDSZ 业务组件 vs 竞品对照表

| 能力域 | YDSZ 实现 | 竞品对标 | 差距评级 |
|--------|----------|---------|---------|
| **CRUD 一体化** | `use-crud-table.ts` + `use-server-pagination.ts`（composables 存在，组件层缺）| Ant ProTable / Arco ProTable（开箱即用 + 列配置 + 工具栏 + 导出）| 🔴 显著 |
| **声明式状态容器** | ✅ YdAsyncState / YdBizStatusBadge | Ant Spin + Empty 手动编排 | ✅ 领先 |
| **Excel 导入导出** | ✅ YdExcelExportButton / YdExcelImportButton | Ant ProTable 工具栏内置 | ✅ 相当 |
| **数据字典联动** | ✅ YdDictSelect / YdDictTag / use-dict-event（事件总线）| Ant DictSelect 二次封装 | ✅ 相当 |
| **用户头像增强** | ✅ YdUserAvatar（含在线状态、角色标签）| Ant Avatar.Group | ✅ 领先 |
| **键盘快捷键** | ✅ YdKeyboardHelp | — | ✅ 独有 |
| **操作引导** | ✅ YdAppTour（步骤引导）| Ant Tour | ⚠️ 缺少 Popover 定位引擎 |
| **审批时间轴** | ✅ YdApprovalTimeline | — | ✅ 独有业务资产 |
| **二次认证** | ✅ YdSecondaryAuthModal | — | ✅ 安全增强 |
| **滑块验证码** | ✅ 4 种变体（滑动/点选/翻译/旋转）| 极验等第三方 | ✅ 自研丰富 |
| **图标选择器** | ✅ YdIconPicker | Arco IconPicker | ✅ 相当 |
| **代码差异查看** | ✅ CodeDiffViewer（generator）| — | ✅ 独有业务资产 |
| **文件版本历史** | ✅ FileVersionHistory（nextwiki）| — | ✅ 独有业务资产 |
| **工作流设计器** | ✅ WorkflowDesigner / FlowDiagramViewer（自建）| — | ✅ 行业领先 |
| **决策表设计器** | ✅ DecisionTableDesigner（literule）| — | ✅ 独有 |
| **命令面板** | ✅ CommandPalette（K 模式）| — | ✅ 优秀 DX |
| **表单 Schema 驱动** | ✅ openapi-to-component / WorkflowFormRenderer | EP 可视化表单设计器 | ⚠️ 待打通全链路 |
| **Quick Create** | ✅ YdQuickCreateButton | — | ✅ 独有 |
| **Domain Filter** | ✅ YdDomainFilterPanel | — | ✅ 独有 |
| **Entity Card** | ✅ YdEntityCard + YdCardGrid | — | ✅ 独有 |

### 3.3 业务组件层差距总结

| 差距项 | 说明 | 评级 |
|--------|------|------|
| **Pro 级 CRUD 模板** | use-crud-table / use-server-pagination 停留在 composables 层，未形成开箱即用 ProTable 级组件 | 🔴 严重 |
| **列配置器（Table Columns Setter）** | 列显隐 / 列冻结 / 列顺序的记忆化配置，业务线重复造轮子 | 🟠 严重 |
| **查询表单生成器** | 从 JSON Schema 自动生成高级查询区域（Ant QueryFilter / LightFilter） | 🟠 严重 |
| **表单弹窗 Hook** | useFormModal → 一行代码弹出可拖动弹窗（Naive Admin 标配模式） | 🟠 严重 |
| **动态表单** | 根据后端配置动态渲染表单字段（增减/联动/校验） | 🟡 中等 |
| **表单设计器可视化** | 拖拽生成表单 Schema（EP 可视化表单设计器对标） | 🟡 中等 |
| **导出模板配置** | 导出字段 / 列宽 / 样式预设 | 🟡 中等 |
| **打印组件** | 业务打印（套打、标签、单据）| 🟡 中等 |
| **导入模板生成** | 根据字典/字段定义自动生成导入 Excel 模板 | 🟢 低 |
| **批量操作范式** | bulk-actions 已被 YdAdvancedFilterBar 部分覆盖 | 🟢 低 |

---

## 四、架构级差距

### 4.1 微前端架构

| 维度 | YDSZ | 竞品 |
|------|------|------|
| 微内核 | ✅ micro-kernel / micro-runtime 自研，主子应用通信 | qiankun / single-spa / Module Federation |
| 主题跨应用共享 | ✅ 经 kernel 全局状态共享 | 一般需自行实现 |
| 跨应用消息 | ✅ notification + 统一浮层管理 | — |
| 组件共享 | ⚠️ 每个子应用可能独立副本（需 Module Federation 方案）| 主流方案 |

### 4.2 国际化体系

| 维度 | YDSZ | 竞品 |
|------|------|------|
| 前端 i18n | vue-i18n + useSimpleLocale（仅 date-picker 接入）| EP 60+ lang |
| 组件库内部 i18n | 未外部化 | 业界标配 |
| 后端同步 | ⚠️ 词典通过 ydsz-system 字典引擎统一管理（独有优势）| 一般无 |
| RTL | ❌ | EP/Ant/Arco 部分 |

### 4.3 多租户支撑

| 维度 | YDSZ | 竞品 |
|------|------|------|
| 租户切换 | ✅ TenantSwitcher + useTenant composable | 无 |
| 数据隔离感知 | ✅ 前端 tenant 上下文注入 | 无 |
| 主题级租户自定义 | ⚠️ 待产品化 | 无 |

### 4.4 字典引擎联动

| 维度 | YDSZ | 竞品 |
|------|------|------|
| 字典热更新 | ✅ use-dict-event EventTarget 总线 | — |
| CRUD 联动刷新 | ✅ dict-type/dict-item 修改后 emit 事件 | — |
| 后端字典缓存 | ✅ 全局字典缓存 + 版本机制 | — |

---

## 五、综合差距分级

### 5.1 基础组件层优先级矩阵

#### P0 阻断级（6 个月内必须补齐）

| 编号 | 差距 | 对标竞品 | 预期产出 |
|------|------|---------|---------|
| **BP0-1** | Table 数据层（排序/筛选/行选择/树形/汇总/虚拟滚动）| Naive DataTable | useTableData + ColumnDef 扩展 + virtual 模式合并 |
| **BP0-2** | Form 校验链路（validateOn/dependencies/去抖异步/错误聚焦）| EP rules 200+ | 校验时机配置 + 跨字段联动 |
| **BP0-3** | 国际化字符串外部化（zh-CN + en-US 首批）| EP 60+ 语言 | ConfigProvider.locale ↔ 词典打通 |
| **BP0-4** | 核心测试覆盖率 ≥ 60%（stories ≥ 80%）| 主流团队 | Vitest + axe-core PR 卡点 |
| **BP0-5** | Input 系细节补齐（clearable/prefix/suffix/autosize）| EP Input 标配 | input/textarea 增量 props |
| **BP0-6** | DatePicker 粒度矩阵扩展（week/month/quarter/year）| EP DatePicker 全粒度 | date-utils 模块 + 面板状态机 |

#### P1 建议级（12 个月内完成）

| 编号 | 差距 | 说明 |
|------|------|------|
| **BP1-1** | Upload 切片上传接线 | use-chunk-upload 已存在，接入 YdUpload |
| **BP1-2** | Tree 拖拽排序 + 懒加载 + 筛选 | use-tree-headless 补齐 |
| **BP1-3** | AutoComplete 异步搜索 + 防抖 | useDebounceFn |
| **BP1-4** | 虚拟滚动家族化（tree/cascader/tree-select）| useVirtualList 推广 |
| **BP1-5** | 尺寸档位（mini/small/default/large）| ConfigProvider 全局切换 |
| **BP1-6** | 文档站 + Playground（VitePress）| stories 仅 20% |
| **BP1-7** | radix-vue → reka-ui 迁移（60 文件）| 上游停止演进风险 |
| **BP1-8** | Token 三层化（base→semantic→component）| 组件级覆盖能力 |
| **BP1-9** | 命令式反馈收敛（message/notification 函数式 API）| 消除两套体系分裂 |

#### P2 增强级（中长期）

| 编号 | 差距 |
|------|------|
| BP2-1 | SSR 完整验证 |
| BP2-2 | Motion 全局动效体系 |
| BP2-3 | 嵌套弹窗管理器（多层 modal 栈顶）|
| BP2-4 | 508 合规审计 |
| BP2-5 | 微前端组件共享（Module Federation）|
| BP2-6 | RTL 国际化方向 |
| BP2-7 | 脚手架 CLI + 版本 Changelog（changesets 自动化）|
| BP2-8 | Figma → Code 实时同步 |
| BP2-9 | AI 辅助生成表单/表格 |

---

### 5.2 业务复合组件层优先级矩阵

#### P0 阻断级

| 编号 | 差距 | 对标 | 预期产出 |
|------|------|------|---------|
| **AP0-1** | ProTable 一体化 CRUD 组件 | Ant ProTable | 基于 P0-1 Table 数据层封装，含列配置器+工具栏+导出+密度 |
| **AP0-2** | 高级查询表单区域（AdvancedFilter 竞品对标）| Ant QueryFilter / Arco ProForm | JSON Schema 驱动查询表单 |

#### P1 建议级

| 编号 | 差距 | 说明 |
|------|------|------|
| **AP1-1** | Column Setter（列显隐/冻结/顺序记忆化）| 业务线重复造轮子问题 |
| **AP1-2** | useFormModal Hook 弹窗表单 | Naive Admin 一行代码弹窗表单 |
| **AP1-3** | 打印组件（套打/标签/单据）| 业务打印场景 |
| **AP1-4** | 动态表单（后端配置驱动）| 根据配置渲染+联动+校验 |

#### P2 增强级

| 编号 | 差距 |
|------|------|
| AP2-1 | 表单设计器可视化拖拽 |
| AP2-2 | 导入模板自动生成 |
| AP2-3 | 业务组件 Storybook 全量覆盖 |
| AP2-4 | 可编辑表格（EditTable）|

---

## 六、竞品对标雷达图（定性）

```
                    YDSZ UI vs 一线竞品差距雷达
                    
    能力完整度 ──●──────────────────── 85%
         │                             (Table/Form/Upload 三大件薄弱)
    样式体系 ──────●───────────────── 75%
         │                             (Token 三层化/RTL 缺失)
    交互动效 ──────●───────────────── 65%
         │                             (Motion 体系/精细过渡缺失)
    开发者体验 ─────●──────────────── 60%
         │                             (文档站/Playground/CLI 从零)
    性能 ───────────●──────────────── 78%
         │                             (体积偏大/虚拟滚动未整合)
    可访问性 ──────●───────────────── 72%
         │                             (继承 Reka，缺自检体系)
    业务组件 ────●─────────────────── 55%
         │                             (ProTable/QueryFilter 缺失)
    国际化 ───────●────────────────── 50%
         │                             (1/88 组件接入)
    ──·───────────────·───────────────·──
   0%              50%              100%
```

---

## 七、差异化优势（竞品无对应物）

以下能力是 YDSZ-UI 的独特资产，优化过程中需保持而非向竞品看齐：

| 优势 | 说明 |
|------|------|
| ✅ 业务复合组件层（35+ common-ui + 18 shared-business）| 竞品一般停于基础组件层 |
| ✅ useIdleHydrate 懒水合 | requestIdleCallback + IntersectionObserver 延迟挂载 |
| ✅ 微前端内核联动（主题/消息经 kernel 共享）| 微内核自研架构 |
| ✅ 字典引擎联动（use-dict-event 事件总线 + 后端字典热更新）| 独有 |
| ✅ 多租户感知（TenantContext + TenantSwitcher + 数据隔离上下文）| 独有 |
| ✅ 工作流/DAG/决策表/DSL 等专业设计器 | 垂直领域深度 |
| ✅ 表单 Schema 驱动（openapi-to-component + WorkflowFormRenderer）| 首创 |
| ✅ 业务复合组件的 AsyncState 自动态切换容器 | 优于 Ant 手动编排 |
| ✅ 命令面板 K 模式（CommandPalette）| 对标 VS Code |
| ✅ 滑块验证码 4 种变体 | 安全增强 |

---

## 八、执行路线图建议

### 第一阶段（Q4 2026：10-12 月）— 基线补强

- **10 月**: YdConfigProvider 全面打通 + Token 三层化设计草案 + Cascader/TreeSelect/TimePicker 验收转正
- **11 月**: Table 数据层状态机（排序/筛选/行选择）+ Input 系细节补齐 + ProTable 雏形
- **12 月**: Form 校验链路全打通 + zh-CN/en-US 双语首批覆盖 + 核心测试覆盖 ≥ 60%

### 第二阶段（Q1 2027：1-3 月）— 数据组件攻坚

- **1 月**: Table 列固定/聚合/虚拟滚动 + DatePicker 粒度矩阵
- **2 月**: Upload 切片接线 + Tree 拖拽/懒加载 + AutoComplete 异步
- **3 月**: ProTable Column Setter + useFormModal + 尺寸档位扩展

### 第三阶段（Q2 2027：4-6 月）— 生态外张

- **4 月**: 文档站 VitePress + Playground 基础骨架
- **5 月**: 脚手架 CLI + changesets Changelog 自动化
- **6 月**: Axe CI 卡点 + 微前端 Module Federation 组件共享

### 第四阶段（Q3-Q4 2027）— 智能化与产品化

- SSR 验证 / 508 合规 / RTL / Motion 体系 / AI 辅助生成 / Figma→Code

---

## 九、一句话总结

> YDSZ-UI 的 88 个 primitives 借力 Reka UI headless 架构实现了**可访问性搭便车**，业务复合组件层（35+18）在**垂直深度**上已显著超越竞品基础组件库。但**数据层组件**（Table/Form/Upload/Tree）比 EP/Naive 头部产品有 1-2 年代差；**生态基建**（文档/Playground/CLI/i18n）几乎从零起步；**Pro 级业务组件**（ProTable/QueryFilter/ColumnSetter）尚在用 composables 阶段。

> 守住"业务复合组件 + 微内核联动 + 字典引擎"三大独有优势，把"Table/Form/Token/文档/i18n"五个短板在 6 个月内补齐，YDSZ-UI 即可从"能用"进化到"Tier-1 竞品水准"。

---

## 附录：竞品组件数量统计口径

- Element Plus 3.x（2026 年统计）：通用 22 + 布局 14 + 表单 32 + 数据展示 18 + 反馈 14 + 导航 10 + 特殊 5 ≈ **115**
- Ant Design Vue 4.2+：通用 3 + 布局 4 + 导航 7 + 数据录入 17 + 数据展示 19 + 反馈 11 + 其他 ≈ **97**
- Naive UI 2.44+：90+ 三层架构（基础 / 数据 / 业务）
- Arco Design Vue 2.5x：通用 18 + 布局 12 + 表单 26 + 数据展示 14 + 反馈 12 + 导航 9 + 特殊 ≈ **98**
- Reka UI 2.x：纯 headless（无样式），约 88 组件
- shadcn-vue v2：约 60 组件（不含 pro）
- PrimeVue 5.x：约 90+ 主题组件 + 付费 Pro 扩展
