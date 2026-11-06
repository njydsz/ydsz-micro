/**
 * 子应用核心路由配置（根路由 + 404 兜底）。
 *
 * @remarks
 * 9 个子应用的 `router/routes/core.ts` 长期各存一份拷贝（md5 互不相同，仅
 * `@path` 注释差异）。本模块把根路由与 404 兜底收敛为单一事实源，子应用
 * 改为 re-export，避免后续改动需要同步 9 处。
 *
 * <p>BasicLayout 通过**惰性 import** 解析，因此本模块不依赖任何子应用目录；
 * 若子应用未提供同名布局，可在 re-export 时按需覆盖。
 *
 * @path comm\effects\shared-auth\src\shell-core-routes.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import type { RouteRecordRaw } from 'vue-router';

import { preferences } from '@ydsz/preferences';

/** 基本布局（惰性解析，避免与子应用布局循环依赖） */
const BasicLayout = () => import('#/layouts/basic.vue');

/** 全局 404 页面 */
const fallbackNotFoundRoute: RouteRecordRaw = {
  component: () => import('#/views/fallback/not-found.vue'),
  meta: {
    hideInBreadcrumb: true,
    hideInMenu: true,
    hideInTab: true,
    title: '404',
  },
  name: 'FallbackNotFound',
  path: '/:path(.*)*',
};

/** 基本路由，这些路由是必须存在的 */
const coreRoutes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
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

export { coreRoutes, fallbackNotFoundRoute };
