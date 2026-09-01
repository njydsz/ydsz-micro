/**
 * 前端过滤动态路由与菜单，基于角色权限替换无权限页面为 403 组件。
 *
 * @path comm\utils\src\helpers\generate-routes-frontend.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

import { filterTree, mapTree } from '@YDSZ-core/shared/utils';

/**
 * 根据角色权限过滤路由配置（前端鉴权模式）。
 *
 * @remarks
 * 遍历路由树，保留有权限或标记为 `menuVisibleWithForbidden` 的路由；
 * 若提供 forbiddenComponent，将无权限但需展示的页面替换为 403 组件。
 *
 * @param routes - 完整路由配置
 * @param roles - 当前用户角色列表
 * @param forbiddenComponent - 用于替换无权限页面的 403 组件
 * @returns 过滤后的路由配置
 */
async function generateRoutesByFrontend(
  routes: RouteRecordRaw[],
  roles: string[],
  forbiddenComponent?: RouteRecordRaw['component'],
): Promise<RouteRecordRaw[]> {
  // 根据角色标识过滤路由表,判断当前用户是否拥有指定权限
  const finalRoutes = filterTree(routes, (route) => {
    return hasAuthority(route, roles);
  });

  if (!forbiddenComponent) {
    return finalRoutes;
  }

  // 如果有禁止访问的页面，将禁止访问的页面替换为403页面
  return mapTree(finalRoutes, (route) => {
    if (menuHasVisibleWithForbidden(route)) {
      route.component = forbiddenComponent;
    }
    return route;
  });
}

/**
 * 判断路由是否在指定角色权限范围内可访问。
 *
 * 若路由未配置 authority 则视为公开路由（始终可访问）；
 * 若配置了 authority，则检查是否与用户角色有交集；
 * 若配置了 `menuVisibleWithForbidden`，即使无权限也会保留（将替换为 403）。
 *
 * @param route - 路由配置
 * @access - 用户角色列表
 * @returns 是否有权限
 */
function hasAuthority(route: RouteRecordRaw, access: string[]): boolean {
  const authority = route.meta?.authority;
  if (!authority) {
    return true;
  }
  const canAccess = access.some((value) => authority.includes(value));

  return canAccess || (!canAccess && menuHasVisibleWithForbidden(route));
}

/**
 * 判断路由是否在菜单中展示但访问将被替换为 403 页面。
 *
 * @param route - 路由配置
 * @returns 是否标记为有权限展示但无权限访问
 */
function menuHasVisibleWithForbidden(route: RouteRecordRaw): boolean {
  return (
    !!route.meta?.authority &&
    Reflect.has(route.meta || {}, 'menuVisibleWithForbidden') &&
    !!route.meta?.menuVisibleWithForbidden
  );
}

export { generateRoutesByFrontend, hasAuthority };
