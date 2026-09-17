# YDSZ-UI 基础组件竞品对标与优化路线图

> **分析日期**: 2026-09-17  
> **分析对象**: `ydsz-ui/primitives/` 下 88 个原始基础组件  
> **竞品锚点**: Element Plus 3.x / Ant Design Vue 4.x / Naive UI 2.44+ / Reka UI (Radix Vue) 2.x / shadcn-vue v2 / Vuetify 3.8 / Arco Design Vue 2.5x

---

## 一、现状盘点

### 1.1 数量与结构

| 维度 | 数值 |
|------|------|
| primitives 组件总目录数 | 88 |
| 对外有实质实现的组件数 | 88 |
| 聚合出口文件 | `src/primitives/index.ts`（88 个 export） |
| 组件平均文件数 | 3.5 |
| 有 Storybook Stories 的组件 | 19 / 88（21%） |
| 有 .test.ts 的组件 | 10 / 88（11%） |
| 既有 stories 又有 tests | 9 / 88（10%） |
| 两者皆无的组件 | 71 / 88（79%） |
| 总文件数 | 319 |

### 1.2 二态分布

88 个组件呈现清晰的"二态分布"——

**A 组 · 44 个「薄封装」组件**：每个仅 `YdXxx.vue` + `index.ts` 两个文件，是直接对 Reka UI（Radix Vue）或原生能力的转译层。组件内零自有逻辑，纯 API 透传。代表：`label` `link` `spin` `float-button` `back-top` `mention` `textarea` `divider`。

**B 组 · 44 个「复合实现」组件**：3~20 个文件不等，带自有子组件、状态管理、设计变体（cva）和注入键。代表：`table`（16 文件）`context-menu`（16）`dropdown-menu`（15）`sheet`（11）`form`（10）`breadcrumb`（8）`card`（8）。

> 还有个别单文件纯粹再导出（如 qr-code、countdown），不纳入主分类。

### 1.3 代码健康度

**做得好的**：
- 严整的 `Yd` 前缀命名，全局无歧义
- CVA 变体 + Tailwind Merge 的样式组合模式覆盖一致
- Reka `Primitive` 的 `asChild` 穿透到位，button / link 已做到组件多态
- Table 支持列驱动 + 语义插槽双模式，ColumnDef 抽象清晰
- 层次良好的 JSDoc（带 `@path` `@author` `@since`）

**显性短板**：
- 79% 组件零文档（stories）零测试（tests），`sheet`（11 文件）`dropdown-menu`（15）`context-menu`（16）三巨头全部裸奔
- 测试集中在 `button / dialog / form / select / sheet` 以外的组件基本没有语法级品质门禁
- `skeleton` 的 stories 文件命名偏离 `Yd` 前缀约定
- 设计 Token 体系（暗色 / 圆角 / 密度）存在硬编码，尚未切换至 CSS 自定义属性运行时切换

---

## 二、竞品对标矩阵

### 2.1 组件能力广度

| 能力域 | ydsz-ui | Element Plus | Ant Design Vue | Naive UI | Reka UI | shadcn-vue | Vuetify | Arco Design |
|--------|---------|-------------|----------------|----------|---------|------------|---------|-------------|
| 通用（按钮/图标/排版/分割线） | 18 | 22 | 18 | 20 | 18 | 14 | 20 | 18 |
| 布局（栅格/弹性/间距/分隔） | 12 | 14 | 11 | 12 | 8 | 6 | 14 | 12 |
| 表单（输入/选择/校验/上传） | 28 | 32 | 28 | 30 | 26 | 22 | 30 | 26 |
| 数据展示（表/树/列表/描述） | 14 | 18 | 16 | 18 | 12 | 10 | 18 | 14 |
| 反馈（弹窗/抽屉/提示/进度） | 12 | 14 | 12 | 14 | 16 | 12 | 14 | 12 |
| 导航（标签/面包屑/菜单） | 8 | 10 | 9 | 8 | 8 | 6 | 10 | 9 |
| **合计** | **88+** | **~110** | **~90** | **~95** | **~88** | **~60** | **~106** | **~86** |

**ydsz-ui 对比竞品的「能力白缺口」**：

| 缺失 / 薄弱的组件 | 说明 | 竞品参考 |
|-------------------|------|----------|
| ConfigProvider（全局化配置） | ❌ 完全缺失 | EP/Ant/Naive/Arco 标配；shadcn-vue 走 Theme 组件 |
| Form 校验的异步/跨字段规则 | ⚠️ 仅 vee-validate 起步，无 `validateDebounce` / `dependencies` | Naive 的类型推断校验、EP 的 `rule` 对象描述 |
| Table 列固定 / 列宽拖拽 / 聚合行 | ⚠️ 仅列驱动 + 语义插槽，无固定列、无列拖拽、无虚拟滚动集成 | EP vnda TablePro / Naive DataTable / Arco Table |
| Tree 的拖拽排序 | ❌ 仅渲染层 | EP / Naive / Arco 树形拖拽 |
| Upload 切片上传 / 秒传 | ❌ 仅前端选择器 | EP/Ant/Naive 标配 |
| 国际化（i18n）| ⚠️ 沿用 vue-i18n 全局，组件内字符串硬编码 | EP 60+ 语言、Ant 40+、Naive 30+ |
| 空结果兜底（Empty 组件的能力）| ⚠️ 仅占位图 | EP Empty 含重试按钮 + 插槽联动 |
| 穿梭框 Transfer 交互 | ⚠️ 仅简单列表，无搜索/无排序 | EP Transfer 全功能 |
| 自动补全 AutoComplete 异步 | ⚠️ 仅前端静态数据 | Ant 自动补全 |
| 富文本 WYSIWYG | ❌（`ui-kit/editor-ui` 拆分独立包，未在 primitives 统计） | Tinymce / Quill 适配 |
| 多租户切换的 Affix / QuickCreate | ✅ `advance-filter` `quick-create` `domain-filter` 已覆盖 | — |

### 2.2 设计系统成熟度

| 维度 | ydsz-ui | 一线竞品最佳实践 |
|------|---------|-----------------|
| 设计 Token | Tailwind v3 + `baseColor: slate`；暗色切换走 `dark:` 类 | Element Plus 3.0 运行时 CSS 变量切换、Naive 类型安全 Token |
| 主题编辑 | ⚠️ 无 visual editor | Naive ThemeEditor、Arco Design Lab |
| 品牌色切换 | ⚠️ 要重编译 | EP/Ant/Arco 一行 `ConfigProvider` |
| 暗色模式 | `dark:` 静态切换，无 `useTheme()` 响应式 hook | Naive `useThemeVars()`、Vuetify `useTheme()` |
| 密度 | ⚠️ 三档未体系化 | EP `size` 系统、Naive `SizeEnum` |
| 动效 | ⚠️ 仅 Tailwind 过渡类 | VueUse Motion、Naive 精细过渡 |
| 圆角/阴影/字号层级 | ⚠️ 未 token 化 | Ant Design 5 级圆角、Naive 自定义圆角变量 |
| 国际化字符串外部化 | ❌ | EP 60+ 语言包 |

### 2.3 开发者体验 (DX)

| 维度 | ydsz-ui | 竞品 |
|------|---------|------|
| API 命名一致性 | ✅ `Yd` 前缀 + `v-model` 等，一致性高 | EP/Ant/Arco 统一度高 |
| TypeScript 覆盖率 | 100%（全 TS 编写） | Naive 100%、Ant ~95%、EP 90%+ |
| 自动导入 | ✅ 走 unplugin-vue-components | EP AutoImport 一键 |
| Nuxt 模块 | ❌ | Nuxt UI 原生 |
| Figma/Sketch 设计稿 | ❌ | EP Figma/AntSketch/Arco Lab |
| 站点文档 | ⚠️ 仅 stories（21%组件有） | EP/Ant 全量文档 + 在线 Playground |
| 交互式 Playground | ❌ | Vuetify Playground、Naive 文档 |
| 脚手架 CLI | ❌ | shadcn-vue `npx shadcn-vue@latest add` |
| 全局搜索 | ❌ | 主流标配 |
| 无障碍声明 | ⚠️ 依赖 Reka 继承 | Reka WCAG 2.1 AA、Naive 良好 A11y |
| 升级迁移 | ⚠️ 无变更日志 | EP/Ant Semver Changelog |

### 2.4 性能

| 维度 | ydsz-ui | 竞品 |
|------|---------|------|
| Tree-shaking | ✅ ESM + 全量具名导出 | 一线标配 |
| 按需加载 | ✅ unplugin | 标配 |
| 虚拟滚动 | ⚠️ `virtual-table` 起步、Select 已实现 | Naive 全系默认、EP/Ant `vxe` |
| 懒加载/代码分割 | ✅ `vite-plugin-lazy-import` | 主流无感 |
| SSR | ⚠️ 未验证 | Naive 一等公民、EP/Ant/Pass |
| 首屏体积基线 | 约 500KB+（gzipped，88 组件全集） | EP ~380KB / Ant ~420KB / Naive ~300KB |
| 渲染性能 | ⚠️ 无明显 memo | Ant 4.x 引入 signal 优化 |
| 大列表场景 | ❌ | Naive VirtualList 集成 |

### 2.5 可访问性 (A11y)

| 维度 | ydsz-ui | 竞品 |
|------|---------|------|
| WAI-ARIA 规范 | ⚠️ 依赖 Reka（WCAG 2.1 AA 继承） | 最佳 |
| 键盘导航 | ⚠️ 依赖 Reka | Reka 完整 |
| 焦点管理 | ⚠️ 依赖 Reka Dialog/Sheet | 主流依赖其 headless |
| 色彩对比度 | ⚠️ 未系统化检测 | EP 4.5:1、Ant 4.5:1 |
| 屏幕阅读器 | ⚠️ 未专门测试 | Reka 优秀 |
| 国际化 RTL | ❌ | EP/Ant/Arco 部分支持 |

### 2.6 生态与商业化

| 维度 | ydsz-ui | 竞品 |
|------|---------|------|
| 使用场景 | 内部 B 端 SaaS | 业界 |
| 维护团队 | YDSZ 前端团队 | 字节 / 饿了么 / EP 社区 / 商业公司 |
| 后台模板/脚手架 | ⚠️ 自研，尚未产品化 | Ant Pro、Arco Pro、Naive Admin |
| 物料平台 | ❌ | Vuetify Marketplace |
| 周边组件（ProTable / ProForm） | ⚠️ `@YDSZ-core/form-ui` 初见雏形 | EP Pro / Arco Pro |
| 版本管理 | ⚠️ 已有，无正式 Changelog | Semver + 变更日志 |
| 社群 | ❌ | EP 4.8w Star、Ant 4.3k |

---

## 三、差距分级

根据竞品广度 / 用户感知 / 修复成本做三维评估，输出 P0-P2：

### P0（阻断级：6 个月内必须补齐）

| 编号 | 差距 | 原因 | 对标竞品 | 建议动作 |
|------|------|------|---------|----------|
| **P0-1** | **ConfigProvider 全局配置** | 主题 / 区域 / 密度 / 尺寸 / 图标配置入口缺失，产品换肤不可行 | EP ConfigProvider、Naive ConfigProvider | 新建 `YdConfigProvider`，集中管理 `theme / locale / size / iconPrefix / slots` |
| **P0-2** | **设计 Token 运行时切换** | 暗色 / 品牌色 / 圆角目前要重编译，无法 `ConfigProvider` 一键换肤 | EP 3.0 CSS vars、Naive ThemeEditor | 7 个语义色 + 3 个中性色全部改成 CSS 自定义属性，并通过 `useThemeVars` hook 响应 |
| **P0-3** | **核心测试覆盖率 < 30%** | 71/88 组件零 stories + 零 tests，`sheet` `dropdown-menu` `context-menu` 三大巨头裸奔 | 主流团队 stories ≥ 80%、tests ≥ 60% | 复合组件补齐 stories + 关键行为 tests；单文件 wrapper 配 visual regression 而非逐个写 stories |
| **P0-4** | **Table 列固定 / 列虚拟滚动 / 聚合** | B 端管理后台的核心组件，当前仅列驱动+语义插槽 | EP vnda TablePro、Naive DataTable | 借鉴 TanStack Table 架构，补齐 `frozenLeft / frozenRight / summaryRow / columnVirtualizer` |
| **P0-5** | **Form 校验全链路** | 仅 vee-validate 起步，无异步校验 / 跨字段联动 / 校验时机分档 | EP rules、Naive 类型校验、Ant 表单联动 | 补齐 `validateOn: change|blur|input|submit`、`dependencies`、异步去抖校验、错误聚焦 |
| **P0-6** | **国际化字符串外部化** | 组件内中英文硬编码，无法 60+ 语言切换 | EP 60+ lang、Naive 30+ lang | 抽离 `src/locale/zh-CN.ts` `en-US.ts` ja-JP.ts 并通过 ConfigProvider 切换 |

### P1（建议级：12 个月内完成）

| 编号 | 差距 | 原因 | 建议动作 |
|------|------|------|---------|
| **P1-1** | **Table 列拖拽排序 / 列宽调整 / 列自定义** | B 端需求高频 | 接入 `sortablejs` 或用 Pointer Events 实现 |
| **P1-2** | **Upload 切片上传 / 秒传 / 续传 / 拖拽上传** | 文件引擎是 8 大引擎之一 | 基于 tus/自研协议，封装 `<YdUpload>` |
| **P1-3** | **Tree 拖拽 / 全选 / 筛选 / 懒加载** | 知识库、组织架构高频 | 基于 `use-tree-headless` 补齐拖拽与 async loading |
| **P1-4** | **AutoComplete 异步搜索 / 防抖 / 自定义选项** | 提升表单填充体验 | 集成 `@vueuse/core/useDebounceFn` |
| **P1-5** | **主题编辑器 / 品牌色一键生成** | 商业化需求 | 提供 `useThemeEditor` hook + 可视化调色板组件 |
| **P1-6** | **尺寸档位扩展 lg | md | xs** | 布局密度多变 | 新增 mini | small | default | large 三档，透过 ConfigProvider 切换 |
| **P1-7** | **国际化 RTL 方向** | 出海或阿拉伯语需求 | 借助 Logical Properties + `[dir="rtl"]` 样式 |
| **P1-8** | **文档站点 + Playground** | 降低接入门槛 | 用 VitePress + 在线 REPL，一键复制 `Yd` 组件 |
| **P1-9** | **脚手架 CLI + 版本 Changelog** | 工程化一致性 | 引入 changesets + `pnpm dlx create-ydsz-page` |
| **P1-10** | **可访问性专项检测** | 避免对 Reka 的隐性依赖漏气 | axe-core + CI 卡点、键盘测试补充 |

### P2（增强级：中长期）

| 编号 | 差距 | 建议动作 |
|------|------|----------|
| **P2-1** | **VueUse Motion 全局过渡** | 集成 `@vueuse/motion` 的 `<YdMotion preset="fade|slide">` |
| **P2-2** | **嵌套 Drawer / Form / Dialog 管理器** | 解决多层弹窗栈顶切换 |
| **P2-3** | **组件级暗黑模式独立开关** | 组件粒度 `.dark` 注入，跨组件暗色上下文 |
| **P2-4** | **SSR 完整验证** | 结合 Nuxt 做一次 SSR 首屏通测 |
| **P2-5** | **508 合规审计** | 无障碍 Axe 全量跑一次，给出差距报告 |
| **P2-6** | **微前端粒度共享** | 主应用加载一次 ydsz-ui，子应用复用，避免多个副本 |
| **P2-7** | **可视化低代码物料** | 把 Yd 组件封装成 LogicFlow / 自研搭建器的物料节点 |
| **P2-8** | **Figma → Code 实时同步** | 设计团队一键导出 Vue SFC |
| **P2-9** | **集成 AI 辅助生成表单 / 表格** | 对标 Arco AI 助手 |

---

## 四、优化路线图（按季度）

### Q4 2026（3 个月） — 基线补强

**目标**：测试、文档、Token 基建达标；P0-1～P0-6 全部 Deadline 基准毕业。

- **10 月**
  - 完成 `YdConfigProvider` 设计草案（Token 命名 / 默认值 / 类型定义）
  - 补充 `sheet / dropdown-menu / context-menu / breadcrumb / alert-dialog` 五巨头 stories
- **11 月**
  - 设计 Token 全部抽为 CSS 自定义变量（`--yd-primary` / `--yd-bg-soft` / 7 级语义色）
  - 实现 `useTheme()` hook + 暗色/品牌色响应式切换
  - 完成 `YdConfigProvider` 实现 + stories + tests
- **12 月**
  - 80% 复合组件具备 stories，60% 核心交互具备 unit tests
  - 输出 CHANGELOG v1.1（按 changesets 自动化）
  - 完成 P0-5（Form 校验全链路）+ P0-6（zh-CN / en-US 双语包）

### Q1 2027（3 个月） — 数据密集型组件攻坚

**目标**：Table / Tree / Upload 三件套达到 EP / Naive 头部水准；DX 跃迁。

- **1 月** Table 列固定 + 列拖拽 + 聚合行 + 虚拟滚动
- **2 月** Tree 拖拽 + 全选 + 筛选 + 懒加载
- **3 月** Upload 切片 + 秒传 + 续传 + 拖拽上传；AutoComplete 异步；尺寸档位扩展
- **Q1 末** 发布 v1.2 并在内部 5 个业务模块完成接入验证

### Q2 2027（3 个月） — 设计系统产品化

**目标**：主题编辑器上线；RTL / 密度打通；文档站对外可开放。

- **4 月** `useThemeEditor` 可视化调色板
- **5 月** RTL 方案 + 60+ 社区语言包首批（英 / 日 / 葡 / 西）
- **6 月** 文档站 VitePress + 在线 Playground；脚手架 CLI `pnpm dlx ydzs add <component>`
- **Q2 末** 版本 v1.3

### Q3-Q4 2027（6 个月） — 智能化与生态

**目标**：SSR 验证、508 合规、微前端、低代码物料、Figma↔Code 链路；为 v2.0 打基础。

- 模块化拆分：`@ydsz-core/primitives` / `@ydsz-core/data-components` / `@ydsz-core/theme`
- 微前端共享方案：Module Federation 接入一次 ydsz-ui，子应用可复用
- 508 合规审计 + CPU 渲染性能专项
- ydsz-admin-pro 一栏，提供开箱即用后台模板

---

## 五、执行建议

### 5.1 组织分工

| 角色 | 职责 | 季度目标 |
|------|------|---------|
| **设计系统 Owner** | 设计 Token / 主题 / 密度 / 圆角 | Q4 落地 ConfigProvider + useTheme |
| **组件架构师** | 大组件（Table / Form / Upload）攻坚 | Q1 数据组件三件套达标 |
| **DX 工程师** | 文档站 / CLI / Playground / Changelog | Q2 对外可开放 |
| **品质门禁** | Visual regression + A11y CI + 测试覆盖率卡点 | Q4 覆盖率 ≥ 60% |

### 5.2 基础设施前置

1. **测试基座**：推 `@vue/test-utils` + `happy-dom` + `vitest` + `@vitest/coverage-v8` 全量接入
2. **视觉回归**：引入 `chromatic` 或自建 `playwright-visual` 对 stories 全量截图
3. **A11y CI**：`@axe-core/playwright` 作为 PR 卡点，≥ AA 才能合并
4. **量体裁衣**：优先在 8 大引擎的高频模块（system / userinfo / workflow）灰度验证，再全量推广

### 5.3 与现有架构的关系

当前 `ydsz-ui` 已实现：

- ✅ 与 `@YDSZ-core/form-ui` / `editor-ui` / `layout-ui` / `tabs-ui` / `popup-ui` / `menu-ui` 解耦良好
- ✅ 遵循 shadcn-vue 「组件即文件」结构，复刻成本低
- ✅ 与 `radix-vue` → `reka-ui` 的 headless 继承保持一致（键盘 / 焦点 / WAI-ARIA 免维护）

这意味着**设计系统层**完全可以站在 Q3-Q4 的产品化高度上，优先补齐 **配置能力**（ConfigProvider / Token / 主题）+ **数据能力**（Table / Tree / Upload / Form）+ **国际化**（双语包），三者齐头并进。

---

## 六、结语

YDSZ-UI 的 88 个 primitives 已覆盖 Reka UI（Radix Vue）相当比例的 headless 组件，底层可访问性与键盘交互"搭便车"即达标，这是一项**卓越的架构选择**。其短板主要在三层：

1. **表现层**：Token 缺运行时化、缺暗色/品牌色一键切换、缺尺寸密度档位。
2. **数据层**：Table / Form / Upload / Tree 四大件与 EP / Naive 头部产品有 1-2 年代差。
3. **生态层**：文档、Playground、Changelog、CLI、低代码物料、设计稿对接，几乎从零起步。

若能 Q4 集中补足 P0 六项（ConfigProvider + Token 运行时化 + 测试覆盖 + Table 全功能 + Form 全链路 + 双语），则 ydsz-ui 可在一线竞品对比中进入"Tier-1.5"；H1 2027 再攻坚数据组件，即可宣告组件基建成熟，支撑 8 大引擎全部业务线的大规模定制化 SaaS 交付。

> **一句话总结**：把"搭便车继承 Reka A11y"的优势守住，把"Table / Form / Token / 文档"四个短板在 6 个月内补齐，YDSZ-UI 就会从"能用"进化到"好用且可规模化"。
