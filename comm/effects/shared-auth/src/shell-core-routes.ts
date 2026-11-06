/**
 * 子应用核心路由配置（根路由 + 404 兜底）。
 *
 * @remarks
 * 9 个子应用的 `router/routes/core.ts` 长期各存一份拷贝（内容等价，仅
 * `@path` 注释与注释间距不同）。本模块把根路由与 404 兜底的结构收敛为
 * 单一事实源，通过 {@link createCoreRoutes} 工厂注入子应用侧的布局与
 * 兜底组件（`#/` 别名仅在应用上下文内可解析，因此必须由调用方传入）。
 *
 * @path comm\effects\shared-auth\src\shell-core-routes.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import type { RouteRecordRaw } from 'vue-router';

import { preferences } from '@ydsz/preferences';

/** 核心路由配置选项 */
interface CoreRoutesOptions {
  /** 子应用基本布局组件（惰性 import） */
  basicLayout: () => Promise<unknown>;
  /** 子应用 404 兜底组件（惰性 import） */
  notFoundComponent: () => Promise<unknown>;
}

/**
 * 创建子应用核心路由配置。
 *
 * @param options - 布局与兜底组件
 * @returns `{ coreRoutes, fallbackNotFoundRoute }`
 */
export function createCoreRoutes(options: CoreRoutesOptions): {
  coreRoutes: RouteRecordRaw[];
  fallbackNotFoundRoute: RouteRecordRaw;
} {
  const { basicLayout, notFoundComponent } = options;

  const fallbackNotFoundRoute: RouteRecordRaw = {
    component: notFoundComponent,
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      title: '404',
    },
    name: 'FallbackNotFound',
    path: '/:path(.*)*',
  };

  const coreRoutes: RouteRecordRaw[] = [
    {
      component: basicLayout,
      meta: {
        hideInBreadcrumb: true,
        title: 'Root',
      },
      name: 'Root',
      path: '/',
      redirect: () => preferences.app.defaultHomePath,
      children: [],
    },
  ];

  return { coreRoutes, fallbackNotFoundRoute };
}
