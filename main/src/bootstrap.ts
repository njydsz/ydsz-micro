/**
 * 应用引导程序，初始化全局插件和配置
 *
 * v3.0: 基于 @ydsz/micro-kernel 自研 ESM 原生微前端运行时，
 *       通过 @ydsz/micro-runtime 接口层完成内核注册与子应用生命周期管理。
 * v4.1: 拆分职责 —— 应用装配（setup/app）、微前端运行时（setup/micro-runtime）、
 *       监控与运行期增强（setup/monitoring）。本文件仅保留编排逻辑。
 *
 * @path main\src\bootstrap.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { initLogger } from "@YDSZ-core/shared/utils";

import { featureFlagsOptions, registerApplicationFlags } from "./feature-flags";
import { setupApp } from "./setup/app";
import { microRuntime, registerMicroRuntime } from "./setup/micro-runtime";
import {
  initCanaryManager,
  initDevToolsBridge,
  initMicroDevTools,
  setupAppMonitoring,
  setupSessionSync,
} from "./setup/monitoring";

// 保留历史导出契约：外部模块（subapp/index.vue、use-tabbar-micro-sync.ts）通过
// `import { microRuntime } from '#/bootstrap'` 访问运行时的只读绑定。
export { microRuntime };

/**
 * 应用引导启动。
 *
 * 顺序约定：
 *   1. 日志系统（生产默认 INFO，开发默认 DEBUG）
 *   2. 功能开关（Pinia 之前注册定义，远程加载失败降级默认值）
 *   3. Vue 应用装配（适配器/指令/i18n/Pinia/路由守卫/动效/标题）
 *   4. 挂载 + 微前端运行时（app.mount 同步渲染后注册，避免容器空白竞态）
 *   5. 监控 / 灰度 / DevTools / 会话同步（挂载后异步增强）
 */
async function bootstrap(namespace: string) {
  // E6: 初始化日志系统（生产默认 INFO，开发默认 DEBUG）
  // localStorage 'YDSZ:debug' 可运行期覆盖调试过滤
  initLogger({ isDev: import.meta.env.DEV });

  // 功能开关：在 Pinia 之前注册定义，保证默认值尽早生效；
  // init 不阻塞（远程加载在内部异步进行，失败降级到默认值）
  registerApplicationFlags();
  const { initFeatureFlags } = await import("@YDSZ-core/feature-flags");
  await initFeatureFlags(featureFlagsOptions());

  // 创建并装配 Vue 应用（不阻塞后续微前端运行时注册）
  const app = await setupApp(namespace);

  // 安装前端监控（错误捕获 + Web Vitals）+ Sentry 转发
  setupAppMonitoring(app);

  app.mount("#app");

  // v3.1 修复：app.mount 同步渲染，#subapp-container 已就绪，
  // 直接同步注册微前端运行时，避免此前 readyState 延迟导致的初始路由
  // 匹配与子应用激活时序竞态（直连子应用 URL 时可能出现容器空白闪烁）。
  registerMicroRuntime();

  // v4.0 P2-1: 启用微前端运行时 DevTools Bridge —— 桥接生命周期事件到 Chrome Extension
  initDevToolsBridge(microRuntime);

  // v3.7.0: 开发态启用微前端 DevTools 面板（Alt+Shift+M 切换）
  initMicroDevTools();

  // v4.0 P2-2: 初始化灰度分流管理器（有远端 URL 或本地 fallback 配置时启用）
  // Canary 在首次 prefetch 决策时影响子应用加载哪个版本（stable/canary）
  await initCanaryManager();

  // E2/F6: 会话超时预警 + 跨标签页状态同步（必须在 initStores 之后、app 挂载之后调用）
  setupSessionSync();

  return app;
}

export { bootstrap };
