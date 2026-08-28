/**
 * 统一导出 — @ydsz/micro-kernel
 *
 * @path comm/effects/micro-kernel/src/index.ts
 * @author ydsz-team
 * @since 3.0.0
 */

// v4.0 P2-2: 灰度版本分流管理器 + v4.2.2 P3-5 扩展（组织白名单 + 标签路由 + 遥测回调）
export {
  getCanaryManager,
  resetCanaryManager,
} from "./canary-manager";
export type {
  CanaryGlobalConfig,
  CanaryMode,
  CanaryResolutionEvent,
  CanaryTag,
  CanaryVersion,
} from "./canary-manager";
// v4.2 P2-1/P2-2: 主子应用国际化与主题运行时同步 composable
export {
  initThemeForSubApp,
  onLocaleChange,
  onThemeChange,
  registerLocaleProvider,
  registerThemeProvider,
  useLocaleSync,
  useThemeSync,
} from './composables';
export type {
  ThemeMode,
  UseLocaleSyncOptions,
  UseLocaleSyncReturn,
  UseThemeSyncOptions,
  UseThemeSyncReturn,
} from './composables';
// v3.7.0: DevTools 管理面板（开发态可视化工具）
export {
  destroyMicroDevTools,
  enableMicroDevTools,
  toggleMicroDevTools,
} from "./devtools-panel";
// v3.3: 公开 error-boundary i18n helpers，主应用可运行时切换降级 UI 文案语言
export {
  getCurrentLocale,
  getErrorFallbackMessagesByLocale,
  setCurrentLocale,
  setErrorFallbackMessages,
} from "./error-boundary";
// v3.7.0: 三级降级决策 — 自动静默重试 / 占重试计数读写
export {
  decideDegradationLevel,
  getNextAutoRetryDelay,
  getRetryCount,
  resetRetryCount,
  setRetryCount,
} from "./error-boundary";
export type { ErrorFallbackMessages } from "./error-boundary";
// v4.2 P1-1: 健康检查（ping 探测 + 内存估算）
export {
  clearLoadDuration,
  getAverageLoadDuration,
  getMemoryEstimate,
  recordLoadDuration,
  resetHealthCheck,
  runHealthCheck,
} from "./health-check";
export type {
  AppHealthResult,
  KernelHealthReport,
  MemoryEstimate,
} from "./health-check";
// v4.1 P3-1: 预加载 hover 视觉反馈（配合 kernel.prefetchApp 使用）
export {
  attachHoverPreloadFeedback,
  attachHoverPreloadFeedbackAll,
} from "./hover-feedback";
export type { PrefetchFeedbackState } from "./hover-feedback";
// v4.2.2 P4-2: CSS Containment 样式隔离增强 + CSS 变量透传
export {
  copyRootCssVariables,
  disableCssContainment,
  enableCssContainment,
  hasCssContainment,
} from "./css-containment";
export type { ContainmentConfig, ContainmentLevel } from "./css-containment";
export { createIframeSandbox } from "./iframe-sandbox";
export type { IframeSandboxInstance } from "./iframe-sandbox";
export { createKernel } from "./kernel";
export {
  createCanaryManager,
  createDevToolsManager,
  createErrorBoundaryManager,
  createMessageBrokerManager,
  createPerformanceManager,
  createPreloadManager,
  createRoutePredictorManager,
  createSchedulerManager,
  createSpeculationRulesManager,
  createVersionManager,
} from "./kernel-managers";
// v3.5 (C4): 资源预连接与模块预加载提示
export {
  clearLinkHints,
  injectModulePreload,
  injectPreconnect,
  preloadAppAssets,
  preloadManifest,
} from "./link-hints";
// v4.2.2 P3-4: 子应用页面缓存状态记忆（滚动位置 + localStorage 持久化 + 编程式状态存取）
export {
  captureScrollPosition,
  clearAllPageCache,
  clearPageCacheForApp,
  configurePageCache,
  consumePersistedPageCache,
  getCacheSummary,
  getPageCachePolicy,
  hasPersistedPageCache,
  loadAppState,
  persistPageCache,
  removeAppState,
  resetPageCachePolicy,
  restoreScrollPosition,
  saveAppState,
} from "./page-cache-manager";
export type {
  PageCachePolicy,
  PageCacheRecord,
  ScrollPosition,
} from "./page-cache-manager";
// v3.3: 公开 Manifest 类型供主应用容器读取 routes 配置（骨架屏细化）
export type {
  LoadOptions,
  LoadResult,
  Manifest,
  ManifestRoute,
} from "./loader";
// v4.2.1 L2: CSP nonce 配置（SRI 兼容）
export { setCspNonce } from "./loader";
// v4.1 P0-A1: 管理器注册表 + 统一生命周期工厂
export { createManagerRegistry } from "./manager-registry";
export type { DisposableManager } from "./manager-registry";
// v3.7.0: 子应用点对点通信 — request/response + fire-and-forget
export {
  clearPendingRequests,
  registerAppMessageHandler,
  sendMessage,
  sendRequest,
  startMessageListener,
} from "./message-broker";
export type { MessageHandler, MicroMessage } from "./message-broker";
// v3.4: 公开预加载策略工厂，供主应用按需注册 frequency 策略
export {
  createFrequencyPreloadStrategy,
  createHoverPreloadStrategy,
  createIdlePreloadStrategy,
  createRoutePreloadStrategy,
  getPreloadManager,
  recordRouteTransition,
  resetPreloadManager,
} from "./preload-strategy";
export type {
  AppUsageStats,
  PermissionChecker,
  PrefetchStrategy,
  PrefetchStrategyConfig,
  PreloadPriority,
  PreloadStrategy,
  PreloadStrategyOptions,
} from "./preload-strategy";
export { createProxySandbox } from "./proxy-sandbox";
export type { ProxySandboxInstance } from "./proxy-sandbox";
// v3.7.0: 远程注册表适配器 — 支持运行时拉取子应用配置
export {
  clearRegistryCache,
  refreshRegistry,
  resolveAppEntry,
  resolveRegistry,
} from "./registry-adapter";
// v4.0 P1-2: 路由预测引擎（马尔可夫链转移概率模型）
export { getRoutePredictor, resetRoutePredictor } from "./route-predictor";
export type { Prediction } from "./route-predictor";
// v4.4.0: 预加载命中率指标回环（sendBeacon 上报，数据驱动预测策略调优）
export {
  collectPreloadMetrics,
  setPreloadMetricsEndpoint,
  setupPreloadMetricsReporting,
} from "./preload-metrics";
export type { PreloadMetricsSnapshot } from "./preload-metrics";
export { enterSandbox, exitSandbox } from "./sandbox";
export type { SandboxInstance } from "./sandbox";
// v4.0 P3-1: 沙箱策略统一接口（snapshot / proxy / iframe 三模式抽象）
export {
  createSandboxStrategy,
  IframeSandboxStrategy,
  ProxySandboxStrategy,
  SnapshotSandboxStrategy,
} from "./sandbox-strategy";
export type { SandboxStrategy } from "./sandbox-strategy";
export {
  bindSchedulerContext,
  configureKeepAlive,
  createSchedulerContext,
  evictAllKeepAliveOnMemoryPressure,
  getAllInstances,
  getAppInstance,
  getKeepAliveConfig,
  getKeepAliveCount,
  getKeepAliveTTL,
  isKeepAliveEnabled,
  setKeepAlive,
  setKeepAliveTTL,
  setMaxKeepAliveApps,
  setPinnedApp,
  setStyleIsolation,
  setupVisibilityAutoRelease,
} from "./scheduler";
export type { KeepAliveConfig } from "./scheduler";
export type { SchedulerContext } from "./scheduler";
// v4.2.1 N5: 运行时 CSS 作用域兜底
export {
  applyRuntimeCssScope,
  removeRuntimeCssScope,
} from "./runtime-css-scope";
// v3.6.0: 公开 GlobalStateBridge 类型，供外部扩展沙箱时使用
export type { GlobalStateBridge } from "./scheduler";
// P0-P2: 公开 DeactivateResult 类型，供调用方感知 LRU 淘汰
export type { DeactivateResult } from "./scheduler";
// v3.6.0: SandboxType 单一事实源在 micro-runtime，scheduler re-export
export type { SandboxType } from "./scheduler";
// v4.2 P3-1: 骨架屏标准化配置接口
export {
  DEFAULT_SKELETON_CONFIG,
  isStandardSkeletonType,
  mergeSkeletonConfig,
  resolveSkeletonType,
  SkeletonType,
} from "./skeleton-types";
export type { SkeletonConfig, SkeletonMatchRule } from "./skeleton-types";
// v3.7.0: Speculation Rules API 集成 — 浏览器原生预取增强
export {
  applyPrefetchBoost,
  injectSpeculationRules,
  isSpeculationRulesSupported,
  removeSpeculationRules,
} from "./speculation-rules";
// v4.2 P0-4: localStorage 统一抽象层
export {
  clearNamespace,
  getStorage,
  getStorageUsage,
  isStorageAvailable,
  removeStorage,
  setStorage,
  STORAGE_KEYS,
} from "./storage-utils";
export type { StorageKey } from "./storage-utils";
export { getVersionManager, resetVersionManager } from "./version-manager";
export type {
  VersionManagerOptions,
  VersionUpdateResult,
} from "./version-manager";
export { viteManifestPlugin } from "./vite-plugin-manifest";
export type {
  ManifestPluginOptions,
  ManifestPluginRoute,
} from "./vite-plugin-manifest";
// v4.0 P1-1 (公开): semver 兼容校验工具 —— 子应用 bootstrap 阶段版本断言
export {
  compareVersion,
  parseVersion,
  satisfiesVersion,
} from "@YDSZ-core/shared/semver";
