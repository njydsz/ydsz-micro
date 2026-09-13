/**
 * 代码生成器子应用 / 路由守卫与初始化。
 *
 * <p>复用基座共享子应用路由守卫（createSubAppRouterGuard）；
 * <p>注入 accessRoutes 集合（所有静态 + 动态路由）。
 *
 * @path apps/generator-web/src/router/guard.ts
 */
import type { Router } from 'vue-router';

import { createSubAppRouterGuard, initRoutes as sharedInitRoutes } from '@ydsz/shared-auth/guards';

import { accessRoutes } from '#/router/routes';

function createRouterGuard(router: Router) {
  createSubAppRouterGuard(router, accessRoutes);
}

function initRoutes(router: Router) {
  sharedInitRoutes(router, accessRoutes);
}

export { createRouterGuard, initRoutes };
