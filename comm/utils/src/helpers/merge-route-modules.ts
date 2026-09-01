/**
 * 合并动态路由模块的默认导出数组，将多个 Vue Router 模块展平为统一路由配置。
 *
 * @path comm\utils\src\helpers\merge-route-modules.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

/** 动态路由模块结构：每个模块通过 default 导出 RouteRecordRaw 数组 */
interface RouteModuleType {
  default: RouteRecordRaw[];
}

/**
 * 合并多个动态路由模块的默认导出数组。
 *
 * @param routeModules - 动态导入的路由模块对象（键为模块路径，值为模块）
 * @returns 展平合并后的路由配置数组
 */
function mergeRouteModules(
  routeModules: Record<string, unknown>,
): RouteRecordRaw[] {
  const mergedRoutes: RouteRecordRaw[] = [];

  for (const routeModule of Object.values(routeModules)) {
    const moduleRoutes = (routeModule as RouteModuleType)?.default ?? [];
    mergedRoutes.push(...moduleRoutes);
  }

  return mergedRoutes;
}

export { mergeRouteModules };

export type { RouteModuleType };
