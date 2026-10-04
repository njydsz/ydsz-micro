/**
 * 子应用启动统一工厂 — 封装 pinia / router / i18n / feature-flags / 错误边界等共性逻辑
 *
 * v1.0: 首次抽取 9 个子应用的 main.ts 样板代码，统一为 defineYdzSubApp(options)。
 *       子应用只需传入 appKey 即可启动，亦可通过 hooks 注入差异化逻辑。
 *
 * @path comm\effects\shared-business\src\composables\use-bootstrap.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @remarks
 * 设计要点：
 * - 内置共性封装了 pinia + persistedState、feature-flags、错误边界、全局样式注入
 * - createRouter 可由调用方自定义注入，未提供时使用默认 history router
 * - 依赖树可摇树：pinia / router 通过工厂内部引用，调用方无需提前安装
 * - 兼容裸 Vue API：子应用仍可直接使用 createApp，无需强制迁移
 */

import type { App, Component } from 'vue';
import type { Pinia, PiniaPlugin } from 'pinia';
import type { RouteRecordRaw, Router } from 'vue-router';

// ==================== 类型契约 ====================

/** 子应用启动配置 */
export interface SubAppOptions {
  /** 子应用唯一 key（用于持久化命名空间） */
  appKey: string;
  /** 应用创建函数，默认自动动态加载同级目录的 app.vue */
  createApp?: () => Promise<{ default: Component }>;
  /** 可选：自定义 router 工厂（如子应用使用不同的 history mode） */
  createRouter?: (app: App) => Router;
  /** 额外 pinia 插件（在 persistedState 之后注册） */
  piniaPlugins?: PiniaPlugin[];
  /** 挂载前执行的事务（可在其内部完成 i18n 装配、拦截器注册等） */
  onBeforeMount?: (app: App) => void | Promise<void>;
  /** 挂载后执行（通常用于路由跳转、初始化动态菜单等） */
  onMounted?: (app: App, router: Router) => void | Promise<void>;
  /** 路由 basename（默认 '/'） */
  basename?: string;
  /** 预注册路由表 */
  routes?: RouteRecordRaw[];
}

/** 子应用实例（返回给调用方进一步编排） */
export interface SubAppInstance {
  /** Vue 应用实例 */
  app: App;
  /** 路由器实例 */
  router: Router;
  /** Pinia 实例 */
  pinia: Pinia;
}

// ==================== 内部工具 ====================

/** 默认 router 工厂 — 使用 history mode + 子应用 basename */
async function defaultCreateRouter(
  basename: string,
  routes: RouteRecordRaw[],
): Promise<Router> {
  const { createRouter, createWebHistory } = await import('vue-router');
  const router = createRouter({
    history: createWebHistory(basename || '/'),
    routes,
    scrollBehavior: (_to, _from, savedPosition) => {
      if (savedPosition) return savedPosition;
      return { left: 0, top: 0 };
    },
  });
  return router;
}

// ==================== 核心函数 ====================

/**
 * 统一子应用启动工厂
 *
 * 封装了各子应用 main.ts 中的共性逻辑，子应用入口只需：
 * ```ts
 * import { defineYdzSubApp } from '@ydsz/shared-business';
 *
 * export const { app, router, pinia } = await defineYdzSubApp({
 *   appKey: 'agent-web',
 * });
 * ```
 *
 * @param options - 子应用启动配置，见 {@link SubAppOptions}
 * @returns 已装配的 Vue 应用、路由器与 Pinia 实例
 * @throws 当 appKey 为空串时抛出 Error
 *
 * @since 1.0.0
 */
export async function defineYdzSubApp(
  options: SubAppOptions,
): Promise<SubAppInstance> {
  const {
    appKey,
    createApp,
    createRouter,
    piniaPlugins = [],
    onBeforeMount,
    onMounted,
    basename = '/',
    routes = [],
  } = options;

  // ---------- 1. 参数校验 ----------
  if (!appKey || appKey.trim() === '') {
    throw new Error(
      '[defineYdzSubApp] appKey is required and must be a non-empty string.',
    );
  }

  // ---------- 2. Pinia 装配（含 persistedState） ----------
  const { createPinia } = await import('pinia');
  const { createPersistedState } = await import('pinia-plugin-persistedstate');

  const pinia = createPinia();

  pinia.use(
    createPersistedState({
      key: (storeId: string) => `${appKey}-${storeId}`,
    }),
  );

  for (const plugin of piniaPlugins) {
    pinia.use(plugin);
  }

  // ---------- 3. Vue 应用创建 ----------
  const { createApp: vueCreateApp } = await import('vue');

  const rootModule = createApp ? await createApp() : { default: { template: '<div></div>' } };
  const app = vueCreateApp(rootModule.default);

  app.use(pinia);

  // ---------- 4. Feature Flags 装配（从 micro-props 读取） ----------
  try {
    const { useMicroProps } = await import('@ydsz/micro-runtime/use-micro-props');
    const { defineFeatureFlags, initFeatureFlags } = await import('@ydsz-core/feature-flags');

    const microProps = useMicroProps();
    const flagDefs = (microProps as unknown as { featureFlags?: Array<{ name: string; defaultValue: boolean }> }).featureFlags;

    if (Array.isArray(flagDefs) && flagDefs.length > 0) {
      defineFeatureFlags(flagDefs.map((def) => ({
        name: def.name,
        defaultValue: def.defaultValue,
      })));
      await initFeatureFlags({
        namespace: appKey,
        env: import.meta.env as Record<string, unknown>,
      });
    }
  } catch {
    // 独立运行或 micro-runtime 未注入时静默降级 — 不影响主流程
  }

  // ---------- 5. 全局错误边界 ----------
  app.config.errorHandler = (err: unknown, _instance, info: string): void => {
    // eslint-disable-next-line no-console
    console.error(`[${appKey}] Unhandled error in ${info}:`, err);
  };

  // ---------- 6. Router 装配 ----------
  const router = createRouter
    ? createRouter(app)
    : await defaultCreateRouter(basename, routes);

  app.use(router);

  // ---------- 7. 全局样式注入 ----------
  try {
    await import('@ydsz/styles');
  } catch {
    // SSR 或未安装 @ydsz/styles 时静默跳过
  }

  // ---------- 8. 挂载前钩子（用户可注入 i18n、拦截器等） ----------
  if (onBeforeMount) {
    await onBeforeMount(app);
  }

  // ---------- 9. 自动挂载 ----------
  const mountNode = document.querySelector('#app') || document.body.appendChild(document.createElement('div'));
  mountNode.id = 'app';
  app.mount(mountNode);

  // ---------- 10. 挂载后钩子（用户可注入路由跳转等） ----------
  if (onMounted) {
    await onMounted(app, router);
  }

  return { app, router, pinia };
}
