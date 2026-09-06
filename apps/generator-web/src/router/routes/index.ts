/**
 * 路由配置入口，聚合所有路由模块。
 *
 * @path apps/generator-web/src/router/routes/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules, traverseTreeValues } from '@ydsz/utils';

import { coreRoutes, fallbackNotFoundRoute } from './core';

const dynamicRouteFiles = import.meta.glob('./modules/**/*.ts', {
  eager: true,
});

/** 动态路由 */
const dynamicRoutes: RouteRecordRaw[] = mergeRouteModules(dynamicRouteFiles);

/** 路由列表，由基本路由、外部路由和404兜底路由组成 */
const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  fallbackNotFoundRoute,
];

/** 基本路由名称列表 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

/** 有权限校验的路由列表，包含动态路由 */
const accessRoutes: RouteRecordRaw[] = [...dynamicRoutes];

export { accessRoutes, coreRouteNames, routes };
