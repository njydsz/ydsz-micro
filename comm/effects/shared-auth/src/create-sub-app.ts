/**
 * 子应用启动工厂 — 消除各子应用 main.ts 中重复的 bootstrap/mount/unmount 样板代码。
 *
 * v3.0: 对接 micro-kernel ESM 原生微前端运行时。
 *       - defineSubApp 导出标准 LifecycleExports（ESM entry 规范）
 *       - micro-kernel 通过 dynamic import() 加载并调用 lifecycle 方法
 *       - 独立运行时（非微前端环境）自启动
 *
 * @path comm/effects/shared-auth/src/create-sub-app.ts
 * @author ydsz-team
 * @since 2.0.0
 */
import type { App as VueApp } from 'vue';
import type { RouteRecordRaw, Router } from 'vue-router';

import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

import { registerAccessDirective } from '@ydsz/access';
import { registerLoadingDirective, registerSafeHtmlDirective } from '@ydsz/common-ui';
import { setupMonitor } from '@ydsz/monitor';
import { initPreferences } from '@ydsz/preferences';
import { initStores } from '@ydsz/stores';

import { ElLoading } from 'element-plus';

import { createLogger } from '@YDSZ-core/shared/utils';

import { setupSharedAuth } from './setup-shared-auth';
import { provideMicroProps, MICRO_PROPS_KEY } from '@ydsz/micro-runtime/use-micro-props';
import type { StandardMicroProps } from '@ydsz/micro-runtime/standard-props';

const logger = createLogger('SubApp');

/** 子应用启动配置 */
export interface SubAppConfig {
  /** 应用唯一标识（如 'workflow-web'，与微应用注册名一致） */
  appName: string;
  /** 路由 basename（如 '/YDSZ-proj'） */
  basename: string;
  /** 路由表 */
  routes: RouteRecordRaw[];
  /** 路由守卫安装回调 */
  guard?: (router: Router) => void;
  /** 初始化动态路由回调（在 router 创建后、guard 注册前执行） */
  initRoutes?: (router: Router) => void;
  /** Vue 根组件 */
  rootComponent: Parameters<typeof createApp>[0];
  /** 应用级自定义 setup（用于 I18N/ComponentAdapter 等） */
  onSetup?: (app: VueApp) => Promise<void> | void;
  /** 偏好设置覆盖 */
  preferencesOverrides?: Record<string, unknown>;
  /** 命名空间覆写 */
  namespace?: string;
}

/**
 * 标准化挂载参数（兼容 micro-kernel mountProps）
 *
 * v4.0: 继承 StandardMicroProps 契约，保留向后兼容字段。
 * 新代码推荐直接使用 useMicroProps() 访问标准化 props，
 * 而非从函数参数逐字段解构。
 */
interface StandardMountProps extends Partial<StandardMicroProps> {
  container?: HTMLElement;
  /** v3.6.0: Proxy 沙箱注入的 fakeWindow */
  fakeWindow?: Record<string, unknown>;
  /** v3.6.0: iframe 沙箱注入的 contentWindow */
  iframeWindow?: Window;
  [key: string]: unknown;
}

let app: null | VueApp = null;

/** 最近一次 mount 使用的 props（供 P1-8 HMR 重挂载复用） */
let lastMountProps: StandardMountProps | undefined;

/** 清理函数注册表 — 子应用 unmount 时自动调用 */
const cleanupCallbacks = new Set<() => void | Promise<void>>();

/**
 * 注册清理回调 — 在子应用 unmount 时自动执行
 *
 * 用于清理 globalState 订阅、定时器、事件监听等资源，防止内存泄漏。
 *
 * @param cleanup - 清理函数
 * @returns 取消注册函数
 */
export function registerCleanup(cleanup: () => void | Promise<void>): () => void {
  cleanupCallbacks.add(cleanup);
  return () => {
    cleanupCallbacks.delete(cleanup);
  };
}

/** 统一安装基础插件与指令 */
async function installBasePlugins(vueApp: VueApp, appName: string) {
  vueApp.directive('loading', ElLoading.directive);

  registerLoadingDirective(vueApp, {
    loading: false,
    spinning: 'spinning',
  });
  registerAccessDirective(vueApp);
  registerSafeHtmlDirective(vueApp);

  const { initTippy } = await import('@ydsz/common-ui/es/tippy');
  initTippy(vueApp);

  const { MotionPlugin } = await import('@ydsz/plugins/motion');
  vueApp.use(MotionPlugin);

  vueApp.config.errorHandler = (err, _instance, info) => {
    logger.error(`[${appName}] Unhandled error:`, err, info);
  };
  vueApp.config.warnHandler = (msg, _instance, trace) => {
    logger.warn(`[${appName}] Vue warning:`, msg, trace);
  };
}

/** 内核 mount 逻辑（micro-kernel & 独立运行共享） */
async function coreMount(
  config: SubAppConfig,
  props?: StandardMountProps,
) {
  const {
    appName,
    basename,
    guard,
    initRoutes,
    namespace: ns,
    onSetup,
    preferencesOverrides = {},
    rootComponent: RootComponent,
    routes,
  } = config;

  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace =
    ns || `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  await initPreferences({
    namespace,
    overrides: preferencesOverrides,
  });

  await setupSharedAuth(appName);

  app = createApp(RootComponent);
  setupMonitor(app);

  // v4.0 P1-2: 将标准化 mountProps 注入子应用组件树
  // 子组件可通过 useMicroProps() / useGlobalState() / useMessageBus() 类型化访问
  if (props) {
    provideMicroProps(props as StandardMicroProps);
  }

  // v3.6.0: 注入沙箱 fakeWindow / iframeWindow 到 Vue 全局属性
  // 子应用代码可通过 `const win = inject('$microWindow') ?? window` 透明降级
  // v4.0: 保留此全局属性作为兼容路径，新代码推荐使用 useMicroProps().fakeWindow
  if (props?.fakeWindow) {
    app.config.globalProperties.$microWindow = props.fakeWindow;
  }
  if (props?.iframeWindow) {
    app.config.globalProperties.$iframeWindow = props.iframeWindow;
  }

  const router = createRouter({
    history: createWebHistory(basename),
    routes,
    scrollBehavior: (to, _from, savedPosition) => {
      if (savedPosition) return savedPosition;
      return to.hash
        ? { behavior: 'smooth', el: to.hash }
        : { left: 0, top: 0 };
    },
  });

  app.use(router);

  await initStores(app, { namespace });

  if (onSetup) {
    await onSetup(app);
  }

  await installBasePlugins(app, appName);

  if (initRoutes) {
    initRoutes(router);
  }

  if (guard) {
    guard(router);
  }

  const mountNode =
    (props?.container as HTMLElement)?.querySelector?.('#app') ||
    document.querySelector('#app');
  app.mount(mountNode);

  return router;
}

/**
 * 子应用生命周期对象（ESM entry 标准导出格式）。
 *
 * micro-kernel 通过 dynamic import() 加载子应用入口，
 * 期望子应用 export { bootstrap, mount, unmount, update, activate, deactivate }。
 *
 * v3.1: 增加 activate/deactivate 生命周期支持，配合 keep-alive 使用。
 *       unmount 时自动执行所有注册的清理回调，防止内存泄漏。
 */
export function defineSubApp(config: SubAppConfig) {
  const lifecycle = {
    async bootstrap() {},
    async mount(props: StandardMountProps) {
      // v4.0 P1-2: 兼容新旧两种 props 结构
      // 新结构：props 中包含 globalState / messageBus / context（由 buildStandardMountProps 构造）
      // 旧结构：props 中包含 _globalState / _messageBus（向后兼容别名）
      lastMountProps = props;
      await coreMount(config, props);
    },
    async unmount() {
      // 执行所有注册的清理回调（globalState 订阅、定时器等）
      for (const cleanup of Array.from(cleanupCallbacks)) {
        try {
          await cleanup();
        } catch (err) {
          logger.error(`[${config.appName}] Cleanup error:`, err);
        }
      }
      cleanupCallbacks.clear();

      app?.unmount();
      app = null;
    },
    async update(_props: StandardMountProps) {},
    /** keep-alive 激活时调用 — 恢复定时器、重新订阅等 */
    async activate() {
      // 子应用可在此钩子中恢复定时器、重新订阅数据等
      if (!import.meta.env.PROD) {
        logger.debug(`[${config.appName}] Activated (keep-alive)`);
      }
    },
    /** keep-alive 停用时调用 — 暂停定时器、取消订阅等 */
    async deactivate() {
      // 子应用可在此钩子中暂停定时器、取消订阅等
      if (!import.meta.env.PROD) {
        logger.debug(`[${config.appName}] Deactivated (keep-alive)`);
      }
    },
  };

  // ==================== v4.0 P1-8: 子应用运行时热替换（HMR） ====================
  // 仅 DEV 生效：生产构建中 import.meta.hot 被 Vite 剥离，此分支永不进入，零运行时开销。
  // 子应用任意模块（组件 / store / 路由 / 工具）改动时，Vite 已失效刷新对应模块，
  // 此处自接受热更新并执行「卸载当前实例 → 基于新模块重挂载」，避免整页刷新。
  const viteHot = (
    import.meta as unknown as {
      hot?: { accept: (cb: () => void | Promise<void>) => void };
    }
  ).hot;
  if (viteHot) {
    viteHot.accept(async () => {
      try {
        app?.unmount();
        app = null;
        // coreMount 内部 import 的模块已被 Vite 失效刷新，重挂载即拿到新版本
        await coreMount(config, lastMountProps);
        if (!import.meta.env.PROD) {
          logger.info(`[${config.appName}] HMR remount done`);
        }
      } catch (err) {
        logger.error(`[${config.appName}] HMR remount failed:`, err);
      }
    });
  }

  return lifecycle;
}

/**
 * 创建子应用标准启动入口（保留向后兼容的 API）。
 *
 * 内部调用 defineSubApp，并在独立运行时自启动。
 *
 * @param config - 子应用配置
 */
export function createSubApp(config: SubAppConfig) {
  const lifecycle = defineSubApp(config);

  // 独立运行（非微前端环境）时自启动
  if (!import.meta.env.VITE_APP_NAMESPACE) {
    (async () => {
      const router = await coreMount(config);
      await router.push(window.location.pathname.replace(config.basename, '') || '/');

      const { unmountGlobalLoading } = await import('@ydsz/utils');
      unmountGlobalLoading();
    })();
  }

  return lifecycle;
}
