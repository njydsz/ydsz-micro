# Changelog — @ydsz-core/chart-ui

本项目所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-11-03

### 新增

- 初始发布
- **YdChart** 通用 ECharts 封装组件：懒加载、自动 resize、暗色主题适配、loading / 空态 / 失败态、自动 dispose
- **YdLineChart** 折线图快捷组件
- **YdBarChart** 柱状图快捷组件（支持 stack / barWidth）
- **YdPieChart** 饼图快捷组件（支持环形/玫瑰图）
- **YdRadarChart** 雷达图快捷组件
- **YdGaugeChart** 仪表盘图快捷组件
- **useChartTheme** composable：从 design-tokens 生成 ECharts theme，MutationObserver 跟随 `.dark` class
- **withChartTheme** 工具函数：把主题色注入 option 的 color / textStyle
