/**
 * 子应用双模式入口工厂（P2-1 独立运行模式产品化）
 *
 * 提供统一的子应用定义入口，自动检测运行环境并选择合适的启动方式：
 *
 * 1. **微前端模式（Micro Frontend Mode）**：
 *    - 当主应用 micro-kernel 加载子应用时，子应用导出标准的
 *      `bootstrap` / `mount` / `unmount` / `update` 生命周期钩子
 *    - kernel 通过 dynamic import() 获取这些钩子并驱动子应用
 *
 * 2. **独立运行模式（Standalone Mode）**：
 *    - 当子应用脱离主应用直接访问时（如独立开发调试），
 *      `defineSubApp` 自动检测微内核不存在并自启动（bootstrap + mount）
 *    - 使用独立路由（`/` 而非 `/YDSZ-xxx/`），注入 Mock 数据层
 *
 * 使用方式：
 * ```ts
 * // apps/your-app/src/main.ts
 * import { defineSubApp } from '@ydsz/micro-runtime/define-sub-app';
 *
 * export const { bootstrap, mount, unmount, update } = defineSubApp({
 *   appName: 'your-app',
 *   basename: '/YDSZ-your',
 *   autoBootstrap: true, // 允许独立运行时自启动
 *   onSetup: async (app) => {
 *     // 自定义初始化
 *   },
 * });
 * ```
 *
 * 工作原理：
 * - 检测 `window.__MICRO_KERNEL__.getAppInstance('your-app')` 是否存在
 * - 存在 → 微前端模式，仅导出 lifecycle hooks
 * - 不存在 + `autoBootstrap=true` → 独立模式，直接创建 Vue app 挂载
 *
 * @path comm/effects/micro-runtime/src/define-sub-app.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import type { App as VueApp } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('SubApp');

/**
 * 子应用生命周期导出。
 *
 * 对齐 micro-kernel 的 LifecycleContracts 接口。
 */
export interface SubAppLifecycle {
  bootstrap?: () => Promise<void>;
  mount: (props?: Record<string, unknown>) => Promise<void>;
  unmount: (props?: Record<string, unknown>) => Promise<void>;
  update?: (props?: Record<string, unknown>) => Promise<void>;
}

/**
 * defineSubApp 配置选项。
 */
export interface DefineSubAppOptions {
  /** 应用唯一标识（如 'workflow-web'） */
  appName: string;
  /**
   * 是否允许独立运行模式自启动。
   *
   * - `true`（默认）：脱离微前端时自动创建 Vue app 并挂载
   * - `false`：仅导出 lifecycle hooks，不自动启动（适用于独立入口由 standalone-main.ts 管理）
   */
  autoBootstrap?: boolean;
  /**
   * 独立模式下创建 Vue 应用的工厂函数。
   *
   * 必须返回配置好的 Vue app 实例（已完成 router/store/i18n 注册）。
   * 独立模式下自动调用此工厂启动应用。
   *
   * 工厂接收 appName 用于调试与监控注入。
   */
  createStandaloneApp?: (appName: string) => Promise<VueApp> | VueApp;
  /**
   * 独立模式挂载容器选择器。
   *
   * 默认 `#app`，与 Vite 默认 index.html 对齐。
   */
  standaloneContainer?: string;
}

/**
 * 检测当前是否运行在 micro-kernel 微前端环境中。
 *
 * 检测条件：
 * 1. 存在 `window.__MICRO_KERNEL__` 全局引用
 * 2. kernel 能通过 `getAppInstance` 找到本应用
 *
 * 两个条件均满足才视为微前端模式。
 *
 * @param appName - 子应用名
 * @returns true 表示运行在微前端容器内
 */
export function isMicroFrontendEnvironment(appName: string): boolean {
  try {
    const kernel = (window as unknown as {
      __MICRO_KERNEL__?: {
        getAppInstance?: (name: string) => unknown;
      };
    }).__MICRO_KERNEL__;
    return !!kernel?.getAppInstance?.(appName);
  } catch {
    return false;
  }
}

/**
 * 子应用双模式入口工厂。
 *
 * 当运行在微前端容器内时，仅导出 lifecycle hooks 供 kernel 调用。
 *
 * 当 `autoBootstrap=true` 且不在微前端容器内时，
 * 在模块加载后自动调用 `createStandaloneApp` 工厂创建并挂载 Vue 应用，
 * 使子应用可以直接通过 Vite dev server 独立运行调试。
 *
 * @param options - 配置选项
 * @returns 子应用生命周期钩子（bootstrap / mount / unmount / update）
 *
 * @example
 * ```ts
 * export const { bootstrap, mount, unmount } = defineSubApp({
 *   appName: 'my-app',
 *   autoBootstrap: true,
 *   async createStandaloneApp(appName) {
 *     const app = createApp(RootComponent);
 *     app.use(createRouter({ history: createWebHistory('/'), routes }));
 *     await initStores(app, { namespace: appName });
 *     return app;
 *   },
 * });
 * ```
 */
export function defineSubApp(options: DefineSubAppOptions): SubAppLifecycle {
  const {
    appName,
    autoBootstrap = true,
    createStandaloneApp,
    standaloneContainer = '#app',
  } = options;

  // 独立模式下当前运行的 Vue 应用实例（供 P1-8 HMR 重挂载复用）
  let currentStandaloneApp: VueApp | null = null;

  // lifecycle hooks（微前端模式导出）
  const lifecycle: SubAppLifecycle = {
    async mount(_props) {
      // 微前端模式下由 kernel 驱动，实际 mount 逻辑在 createStandaloneApp 之外
      // 此处的 mount 作为兼容出口，实际未使用（kernel 会调用子应用 expose 的 mount）
    },
    async unmount(_props) {
      // 同上
    },
  };

  // 独立模式自启动：不在微前端环境 + autoBootstrap=true
  async function bootstrapStandalone(): Promise<void> {
    if (typeof createStandaloneApp !== 'function') return;
    try {
      const app = await createStandaloneApp(appName);
      currentStandaloneApp = app;
      app.mount(standaloneContainer);
      logger.info(`[${appName}] Standalone mode bootstrapped`);
    } catch (err) {
      logger.error(`[${appName}] Standalone bootstrap failed:`, err);
    }
  }

  if (autoBootstrap && !isMicroFrontendEnvironment(appName) && typeof createStandaloneApp === 'function') {
    // 微任务中自启动，确保模块加载完毕
    queueMicrotask(() => void bootstrapStandalone());
  }

  // ==================== v4.0 P1-8: 子应用运行时热替换（HMR） ====================
  // 仅 DEV 生效：生产构建中 import.meta.hot 被 Vite 剥离，此分支永不进入，零运行时开销。
  const viteHot = (
    import.meta as unknown as {
      hot?: { accept: (cb: () => void | Promise<void>) => void };
    }
  ).hot;
  if (viteHot) {
    viteHot.accept(async () => {
      currentStandaloneApp?.unmount();
      currentStandaloneApp = null;
      // bootstrapStandalone 内部 import 的模块已被 Vite 失效刷新，重挂载即拿到新版本
      await bootstrapStandalone();
    });
  }

  return lifecycle;
}
