/**
 * 子应用共享路由守卫 — 消除 9 个子应用中完全一致的 guard.ts 重复代码。
 *
 * 提供 setupCommonGuard（进度条）、setupAuthGuard（白名单 + 登录检查）、
 * setupPermissionGuard（动态路由注册）、createRouterGuard（组装三者）、
 * initRoutes（预先注入路由）的标准化实现。
 *
 * 子应用只需：
 * ```ts
 * import { createRouterGuard, initRoutes } from '@ydsz/shared-auth/guards';
 * ```
 *
 * @path comm\effects\shared-auth\src\guards.ts
 * @author ydsz-team
 * @since 2.0.0
 */
import type { RouteRecordRaw, Router } from 'vue-router';

import { LOGIN_PATH } from '@ydsz/constants';
import { openSecondaryAuthModal } from '@ydsz/shared-business';
import { preferences } from '@ydsz/preferences';
import { useAccessStore } from '@ydsz/stores';
import { startProgress, stopProgress } from '@ydsz/utils';

/** 默认白名单路径 */
const DEFAULT_WHITE_LIST: readonly string[] = ['/auth', LOGIN_PATH];

/**
 * 通用守卫：记录已加载页面并控制进度条。
 *
 * 完全一致的实现，main 与所有子应用共享。
 */
export function setupCommonGuard(router: Router): void {
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    loadedPaths.add(to.path);

    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 认证守卫：未登录用户访问受保护路由时跳转登录页。
 *
 * 白名单内路径（默认 '/auth' / LOGIN_PATH）直接放行，
 * 无 token 时携带 redirect 参数跳转登录页。
 *
 * @param router - Vue Router 实例
 * @param whiteList - 自定义白名单，默认 ['/auth', LOGIN_PATH]
 */
export function setupAuthGuard(
  router: Router,
  whiteList: readonly string[] = DEFAULT_WHITE_LIST,
): void {
  router.beforeEach((to) => {
    const accessStore = useAccessStore();

    if (whiteList.includes(to.path)) {
      return true;
    }

    if (!accessStore.accessToken) {
      return {
        path: LOGIN_PATH,
        query:
          to.fullPath !== '/'
            ? { redirect: encodeURIComponent(to.fullPath) }
            : {},
        replace: true,
      };
    }

    return true;
  });
}

/**
 * 权限守卫：首次登录后根据权限动态加载路由。
 *
 * 子应用侧保持简单：将 presetRoutes 一次性注册到 'Root' 下，
 * 通过 local flag（闭包变量）防止重复注册。
 *
 * @param router - Vue Router 实例
 * @param presetRoutes - 预设的需要动态注册的路由表（即 accessRoutes）
 */
export function setupPermissionGuard(
  router: Router,
  presetRoutes: RouteRecordRaw[],
): void {
  let routesAdded = false;

  router.beforeEach(async (to) => {
    const accessStore = useAccessStore();

    if (!accessStore.accessToken) {
      return true;
    }

    if (accessStore.isAccessChecked || routesAdded) {
      return true;
    }

    if (!routesAdded) {
      presetRoutes.forEach((route) => {
        router.addRoute('Root', route);
      });
      routesAdded = true;
    }

    if (to.name === 'FallbackNotFound') {
      return true;
    }

    return { ...to, replace: true };
  });
}

/**
 * 初始化动态路由（在路由创建后、守卫注册前执行，避免白屏等待）。
 *
 * 将 presetRoutes 一次性注册到 'Root' 下。
 */
export function initRoutes(
  router: Router,
  presetRoutes: RouteRecordRaw[],
): void {
  presetRoutes.forEach((route) => {
    router.addRoute('Root', route);
  });
}

/**
 * 组装并注册子应用标准路由守卫链：
 *   commonGuard → authGuard → permissionGuard
 *
 * @param router - Vue Router 实例
 * @param presetRoutes - 动态路由表（accessRoutes）
 * @param whiteList - 白名单路径，默认 ['/auth', LOGIN_PATH]
 */
export function createSubAppRouterGuard(
  router: Router,
  presetRoutes: RouteRecordRaw[],
  whiteList?: readonly string[],
): void {
  setupCommonGuard(router);
  setupAuthGuard(router, whiteList);
  setupPermissionGuard(router, presetRoutes);
}

/**
 * 二级认证守卫 —— 为路由动作包裹二次认证流程。
 *
 * <p>调用方可将敏感操作封装为 action 回调，在执行前弹出二次身份验证弹窗。
 * 用户输入密码并确认后执行 action；用户取消则不执行任何操作。
 *
 * @example
 * ```ts
 * const success = await withSecondaryAuth(
 *   async (password) => {
 *     await secondaryAuthApi({ password, scene: 'config-edit' });
 *   },
 *   { hint: '请输入密码确认此操作', scene: 'config-edit' },
 * );
 * if (success) { /&#42;&#42; 继续后续逻辑 &#42;&#47; }
 * ```
 *
 * @param action - 认证通过后执行的回调
 * @param options.hint - 弹窗提示文案
 * @param options.scene - 认证场景（用于后端审计，仅作为参考信息传递给 action）
 * @returns Promise<boolean> — 用户完整走完认证流程且 action 成功返回 true，取消返回 false
 */
export async function withSecondaryAuth(
  action: (password: string) => Promise<void>,
  options?: { hint?: string; scene?: string },
): Promise<boolean> {
  const password = await openSecondaryAuthModal(options?.hint);
  if (!password) return false;
  await action(password);
  return true;
}
