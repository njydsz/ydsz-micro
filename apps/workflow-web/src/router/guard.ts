/**
 * 路由守卫 — 统一通过 shared-auth 包提供的标准化守卫注册。
 *
 * 子应用无需重复实现 commonGuard / authGuard / permissionGuard / initRoutes，
 * 直接传入本应用的 accessRoutes 即可。
 *
 * @path apps\workflow-web\src\router\guard.ts
 * @author ydsz-team
 * @since 2.0.0
 */
import type { Router } from 'vue-router';

import { createSubAppRouterGuard, initRoutes as sharedInitRoutes } from '@ydsz/shared-auth/guards';

import { accessRoutes } from '#/router/routes';

/**
 * 创建并注册路由守卫。
 *
 * <p>通过 shared-auth 提供的 {@code createSubAppRouterGuard} 工厂注册子应用级守卫，
 * 覆盖登录态、权限码、动态路由拦截，内部已处理 basename 与 accessRoutes。
 *
 * @param router 当前子应用的 Vue Router 实例
 */
function createRouterGuard(router: Router) {
  createSubAppRouterGuard(router, accessRoutes);
}

/**
 * 初始化并注册子应用路由表。
 *
 * <p>通过 shared-auth 提供的 {@code initRoutes} 工厂将 accessRoutes 注入 router，
 * 并在路由 meta 中标记权限码等访问信息，供守卫拦截时读取。
 *
 * @param router 当前子应用的 Vue Router 实例
 */
function initRoutes(router: Router) {
  sharedInitRoutes(router, accessRoutes);
}

export { createRouterGuard, initRoutes };
