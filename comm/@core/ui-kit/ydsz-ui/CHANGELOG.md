# Changelog — @ydsz-core/ydsz-ui

本项目所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- **P0-3 图表能力**：新增 `@ydsz-core/chart-ui` 独立包，提供 YdChart / YdLineChart / YdBarChart / YdPieChart / YdRadarChart / YdGaugeChart 六个标准化 ECharts 封装组件，含 `useChartTheme` / `withChartTheme` composable
- **P1-4 主题 Preset**：新增 5 套内置主题预设（ocean-blue / forest-green / sunset-orange / royal-purple / graphite），通过 `themePresets` / `themePresetMeta` 导出，支持 `theme.applyPreset(name)` 一键切换
- **P1-5 虚拟滚动**：新增 `useAutoVirtual` composable，根据数据量自动决定是否启用虚拟滚动（阈值默认 100），对标 Naive UI 全数据组件默认虚拟滚动策略
- **P2-1 缺失组件**：新增 YdCodeHighlighter（轻量代码高亮）、YdInfiniteScroll（无限滚动）、YdLoadingBar（顶部加载进度条）、YdFloatButtonGroup（浮动按钮组）四个组件
- **P2-2 动画系统**：新增 `useTransition` composable，提供统一的进入/离开动画状态管理，支持 duration / easing / delay 配置

### 变更

- **P0-1 包发布形态**：ydsz-ui 默认 export 从源码 (`src/index.ts`) 改为 dist 构建产物 (`dist/index.mjs`)，新增 `development` 条件保留源码入口；同步更新所有子路径 exports
- **P0-2 测试覆盖**：vitest 覆盖率 include 新增 `.vue` 文件，排除 story/playground 目录；阈值对齐编码规范（statements 25% / branches 15% / functions 20% / lines 25%）
- **P1-3 类型质量**：清理 ydsz-ui 中 5 处 `@ts-nocheck`（anchor/auto-complete/alert-dialog），统一 `ClassValue` 导入路径为 `clsx`
- **P1-6 ARIA 契约**：ARIA 契约覆盖从 16 个组件扩展到 40 个交互组件，新增 `AriaRoleCategory` 的 `'navigation'` 分类

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
