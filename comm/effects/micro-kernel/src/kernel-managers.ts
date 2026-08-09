/**
 * 微内核统一管理器工厂聚合
 *
 * P0-A1: 为 ManagerRegistry 提供全部管理器的 DisposableManager 工厂函数。
 * 通过此聚合模块避免 kernel.ts 与各管理器模块产生星形依赖，
 * 同时保持各管理器模块的独立可测试性。
 *
 * **管理器清单**：
 * 1. scheduler — 子应用实例 + keepAlive 配置
 * 2. version-manager — 版本信息缓存 + 自动检查定时器
 * 3. preload-strategy — 预加载策略 + MutationObserver
 * 4. route-predictor — 马尔可夫链转移矩阵 + 持久化
 * 5. canary-manager — 灰度分流配置 + 远程刷新定时器
 * 6. message-broker — 点对点通信 pending 请求
 * 7. performance-utils — Performance API 缓冲区 + 清理定时器
 * 8. speculation-rules — Speculation Rules API 注入元素
 * 9. error-boundary — 降级标记 + 重试计数器
 * 10. devtools-panel — 开发态面板 DOM + 刷新定时器
 * 11. health-checker — 加载耗时窗口 + 节流状态
 *
 * @path comm/effects/micro-kernel/src/kernel-managers.ts
 * @author ydsz-team
 * @since 4.1.0
 */

export { createCanaryManager } from "./canary-manager";
export { createDevToolsManager } from "./devtools-panel";
export { createErrorBoundaryManager } from "./error-boundary";
export { createHealthCheckerManager } from "./health-check";
export { createMessageBrokerManager } from "./message-broker";
export { createPerformanceManager } from "./performance-utils";
export { createPreloadManager } from "./preload-strategy";
export { createRoutePredictorManager } from "./route-predictor";
export { createSchedulerManager } from "./scheduler";
export { createSpeculationRulesManager } from "./speculation-rules";
export { createVersionManager } from "./version-manager";
