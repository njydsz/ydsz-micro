# ADR-006: 可访问性 / 运行时可观测性方案

- **状态**：已采纳（Accepted），核心模块已落地
- **日期**：2026-08（评估归档）
- **决策人**：ydsz-frontend-team

## 背景（Context）

微前端运行时（子应用挂载、沙箱、keep-alive、预加载、路由同步）状态复杂，排查问题依赖可视化手段。
YDSZ Micro 将「可观测性」（火焰图 / 时间线 / 内存趋势）列为与 Gitee 竞品的核心差异化要点之一。

## 决策（Decision）

构建**前端原生、零后端依赖**的可观测性栈，分三层：

### 1. 性能追踪（`comm/effects/monitor`）

| 模块 | 能力 | 文件 |
| ---- | ---- | ---- |
| 火焰图 | 从 `Performance API` 提取 `YDSZ:` 前缀 measure，构建父子树 | `performance-tracker-flame.ts` |
| 内存趋势 | 每 5s 采样 `performance.memory`（JS Heap / DOM 节点 / keep-alive 数），保留最近 100 条 | `performance-tracker-memory.ts` |
| 核心追踪 | Web Vitals（LCP/FID/CLS/INP/FCP/TTFB）+ 错误捕获（Vue/window/Promise/资源） | `performance-tracker-core.ts` |

启用条件：`import.meta.env.DEV` 或 URL 参数 `debug_perf=1` 或 `localStorage.ydsz_perf_tracking === 'true'`，
避免生产环境常驻开销（符合云顶规范生产环境最小化原则）。

### 2. DevTools 扩展（`chrome/`）

Manifest V3 扩展，实时查看内核连接、沙箱状态、事件日志、预加载命中率与性能时间线，
对接上述追踪数据（`comm/effects/micro-kernel/src/devtools-tabs.ts`、`kernel-managers.ts`）。

### 3. 内核内部可观测性（`comm/effects/micro-kernel`）

- `RoutePredictor.getSummary()`：导航模式摘要，供面板展示。
- `PreloadManager.debugInfo()`：预加载命中率（preload/consumed/wasted/hitRate）。
- `ManagerRegistry`：统一生命周期与 dispose 追踪，防止子应用卸载后资源泄漏。

## 后果（Consequences）

- **正面**：纯前端方案，无需后端采集服务，契合「最小依赖、绝对可控」；DevTools 扩展提供开箱即用的排障体验。
- **负面**：内存采样依赖 `performance.memory`（Chromium 私有实现），Firefox/Safari 下采样为空；
  火焰图依赖手动埋点的 `YDSZ:` measure，未覆盖的链路不可见。
- **延伸**：当前追踪数据停留在本地（DevTools / 日志），尚未聚合上报到监控后端（见 [v4.0 优化设施说明](../v4.0-优化设施说明.md) Known Issues）。

## 关联

- [v4.0 优化设施说明](../v4.0-优化设施说明.md)
- [ADR-005: 可访问性方案](./adr-005-accessibility.md)
