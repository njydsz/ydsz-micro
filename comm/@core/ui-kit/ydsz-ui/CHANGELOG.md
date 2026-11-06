# Changelog — @ydsz-core/ydsz-ui

本项目所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循
[Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- **P0-3 图表能力**：新增 `@ydsz-core/chart-ui` 独立包，提供 YdChart /
  YdLineChart / YdBarChart / YdPieChart / YdRadarChart /
  YdGaugeChart 六个标准化 ECharts 封装组件，含 `useChartTheme` /
  `withChartTheme` composable
- **P1-4 主题 Preset**：新增 5 套内置主题预设（ocean-blue / forest-green /
  sunset-orange / royal-purple / graphite），通过 `themePresets` /
  `themePresetMeta` 导出，支持 `theme.applyPreset(name)` 一键切换
- **P1-5 虚拟滚动**：新增 `useAutoVirtual`
  composable，根据数据量自动决定是否启用虚拟滚动（阈值默认 100），对标 Naive
  UI 全数据组件默认虚拟滚动策略
- **P2-1 缺失组件**：新增 YdCodeHighlighter（轻量代码高亮）、YdInfiniteScroll（无限滚动）、YdLoadingBar（顶部加载进度条）、YdFloatButtonGroup（浮动按钮组）四个组件
- **P2-2 动画系统**：新增 `useTransition`
  composable，提供统一的进入/离开动画状态管理，支持 duration / easing /
  delay 配置

### 变更

- **SFC-006 体积治理**：10 个超标组件/composable 按职责拆分，超标项从 18 降至 5（剩余 4 项为 ydsz-vue 上游 fork 债务 +
  1 项编排层）：
  - `YdDataTable.vue`：提取 `use-table-resize-persistence.ts` +
    `use-data-table-selection.ts`（脚本 953 → 750 行）
  - `YdFileUpload.vue`（1016 行）：提取 `use-file-upload-core.ts`，再拆为
    `file-upload-utils` / `use-file-list` / `use-file-validation` /
    `use-upload-executor`（脚本 680 → 186 行）
  - `YdTreeTable.vue`（792 行）：提取 `use-tree-table-core.ts`，再拆为
    `tree-table-utils` / `use-tree-flatten` / `use-tree-expand` /
    `use-tree-selection` / `use-tree-drag`（脚本 569 → 75 行）
  - `YdProTable.vue`（647 行）：提取 `use-pro-table.ts`（脚本 271 → 132 行）
  - `YdTable.vue`（530 行）：提取 `use-table-core.ts`（脚本 259 → 119 行）
  - `YdOrgChart.vue`（675 行）：提取 `use-org-chart-core.ts`（脚本 544 → 71 行）
  - `theme-schema.ts`（523 行）：拆为 `theme-schema-types` /
    `theme-schema-semantic` /
    `theme-schema-component` + 桶文件（最大单文件 338 行）
  - `YdChartCard.vue`：提取 `use-chart-card-core.ts`，补齐 `defineOptions`
    name 与暗色主题/空态能力
- **SFC-006 规则澄清**：阈值以**脚本行数**为准（模板复杂度不计入），composable 同样适用 500 行阈值
- **新增门禁**：`pnpm check:component-budget`
  扫描组件脚本行数预算；`pnpm gen:component-docs` 从 SFC 类型生成 API 文档
- **编码规范更新**：CLAUDE.md 新增「新增 ydsz-ui / ydsz-vue 组件」决策树 +
  3 条 AI 行为约束（18-20）

- **P0-1 包发布形态**：ydsz-ui 默认 export 从源码 (`src/index.ts`) 改为 dist 构建产物 (`dist/index.mjs`)，新增
  `development` 条件保留源码入口；同步更新所有子路径 exports
- **P0-2 测试覆盖**：vitest 覆盖率 include 新增 `.vue`
  文件，排除 story/playground 目录；阈值对齐编码规范（statements 25% / branches
  15% / functions 20% / lines 25%）
- **P1-3 类型质量**：清理 ydsz-ui 中 5 处
  `@ts-nocheck`（anchor/auto-complete/alert-dialog），统一 `ClassValue`
  导入路径为 `clsx`
- **P1-6 ARIA 契约**：ARIA 契约覆盖从 16 个组件扩展到 40 个交互组件，新增
  `AriaRoleCategory` 的 `'navigation'` 分类

### 废弃

- 无

### 修复

- 无

## [5.5.9] - 2026-09-27

### 新增

- YdSpineText 脊柱文本组件
- showNotification 命令式增强 API（action 按钮 + 持续时长控制 + 持久模式）
- YdCard shadow 语义化（never / always / hover）
- YdSteps 增强（finishIcon prop）
- YdBreadcrumbPro 配置式面包屑
- YdMenu 配置式侧边栏导航菜单
- YdTagCheckable 可选中标签
- YdTimelinePro alternate / ghost 增强模式

### 变更

- EP 退场收官，runtime import 全仓归零
- Element Plus 全面替换为 ydsz-ui 自研组件

## [5.0.0] - 2026-10-11

### 重大变更

- Element Plus 正式退场（v5.0.0），全量迁移至 @ydsz-core/ydsz-ui
- 两层架构写入编码规范：ydsz-vue（Headless 原语层）+ ydsz-ui（有样式组件层）
