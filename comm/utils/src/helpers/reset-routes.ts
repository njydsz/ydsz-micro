/**
 * 路由重置工具，清除动态注册的路由，仅保留静态白名单路由。
 *
 * @path comm\utils\src\helpers\reset-routes.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { Router, RouteRecordName, RouteRecordRaw } from 'vue-router';

import { traverseTreeValues } from '@YDSZ-core/shared/utils';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('reset-routes');
/**
 * 重置路由器，移除所有非静态白名单路由。
 *
 * @remarks
 * 遍历当前所有已注册路由，删除不在静态路由 name 列表中的路由，
 * 用于退出登录或切换用户时清理动态权限路由。
 *
 * @param router - Vue Router 实例
 * @param routes - 静态白名单路由配置（不会被删除）
 */
export function resetStaticRoutes(router: Router, routes: RouteRecordRaw[]): void {
  // 获取静态路由所有节点包含子节点的 name，并排除不存在 name 字段的路由
  const staticRouteNames = traverseTreeValues<
    RouteRecordRaw,
    RouteRecordName | undefined
  >(routes, (route) => {
    // 这些路由需要指定 name，防止在路由重置时，不能删除没有指定 name 的路由
    if (!route.name) {
      logger.warn(
        `The route with the path ${route.path} needs to have the field name specified.`,
      );
    }
    return route.name;
  });

  const { getRoutes, hasRoute, removeRoute } = router;
  const allRoutes = getRoutes();
  allRoutes.forEach(({ name }) => {
    // 存在于路由表且非白名单才需要删除
    if (name && !staticRouteNames.includes(name) && hasRoute(name)) {
      removeRoute(name);
    }
  });
}
