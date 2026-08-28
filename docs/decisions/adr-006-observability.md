# ADR-006: 前端可观测性体系 — 错误 / 性能 / 预加载指标

- **状态**: 已采纳（v4.4.0 补齐预加载指标回环）
- **关联代码**: `comm/effects/monitor/`、`comm/effects/micro-kernel/src/preload-metrics.ts`、`main/src/setup/monitoring.ts`

## 背景

微前端内核的预测、预加载、调度能力需要运行时数据验证效果；子应用故障需要可归因（traceId / release / 面包屑）。

## 决策

三层可观测性，全部经 `navigator.sendBeacon`（降级 fetch keepalive）上报：

| 层 | 内容 | 端点（可配置，v4.4.0 起） |
| ---- | ---- | ---- |
| 错误监控 | Vue/window/Promise/资源错误 + 面包屑 + sessionId/traceId/release + 离线缓存重放 + 采样率 + beforeSend 脱敏 | `/api/v1/monitor/error` |
| 性能监控 | Web Vitals（LCP/FID/CLS/INP/FCP/TTFB/LT/RT）批量缓冲上报 + 运行时火焰图/时间线/内存趋势（performance-tracker） | `/api/v1/monitor/web-vitals` |
| 预加载指标 | preloadCount / consumedCount / wastedCount / hitRate + 马尔可夫转移样本量（v4.4.0，preload-metrics.ts） | `/api/v1/monitor/preload-metrics` |

- **端点配置化**（v4.4.0）：`setupMonitor(app, { endpoints })` 按部署环境覆盖，默认值保持向后兼容
- **Sentry 转发**：设置 `VITE_SENTRY_DSN` 后错误同步转发 Sentry APM（tracesSampleRate 可配）

## 后果

- 正面：预加载/路由预测策略的有效性可量化（周报对比），为 `routePreload` 开关与 `minSampleSize` 门槛调优提供数据
- 负面：`/api/v1/monitor/*` 需要网关侧配合提供采集端点，未部署前指标仅进 DevTools/控制台
