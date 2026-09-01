/**
 * 后端驱动路由生成，将菜单接口返回的字符串组件路径转换为 Vue Router 配置。
 *
 * @path comm\utils\src\helpers\generate-routes-backend.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordRaw } from 'vue-router';

import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@YDSZ-core/typings';

import { mapTree } from '@YDSZ-core/shared/utils';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('generate-routes-backend');
/**
 * 根据后端菜单接口数据动态生成路由配置（后端鉴权模式）。
 *
 * @remarks
 * 调用 fetchMenuListAsync 获取菜单路由数据，通过 layoutMap 映射布局组件、
 * pageMap 映射页面组件，将字符串组件标识符转换为实际异步组件。
 *
 * @param options - 生成选项，包含菜单获取函数、布局与页面组件映射
 * @returns 可注册到 Vue Router 的路由配置数组
 * @throws 当菜单获取失败或组件映射缺失时抛出错误
 */
async function generateRoutesByBackend(
  options: GenerateMenuAndRoutesOptions,
): Promise<RouteRecordRaw[]> {
  const { fetchMenuListAsync, layoutMap = {}, pageMap = {} } = options;

  try {
    const menuRoutes = await fetchMenuListAsync?.();
    if (!menuRoutes) {
      return [];
    }

    const normalizePageMap: ComponentRecordType = {};

    for (const [key, value] of Object.entries(pageMap)) {
      normalizePageMap[normalizeViewPath(key)] = value;
    }

    const routes = convertRoutes(menuRoutes, layoutMap, normalizePageMap);

    return routes;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * 将后端菜单路由字符串组件映射为 Vue Router 路由配置。
 *
 * @param routes - 后端返回的菜单路由数据（组件为字符串路径）
 * @param layoutMap - 布局组件映射表（组件名 → 异步组件）
 * @param pageMap - 页面组件映射表（相对路径 → 异步组件）
 * @returns 映射后的 Vue Router 路由配置
 */
function convertRoutes(
  routes: RouteRecordStringComponent[],
  layoutMap: ComponentRecordType,
  pageMap: ComponentRecordType,
): RouteRecordRaw[] {
  return mapTree(routes, (node) => {
    const route = node as unknown as RouteRecordRaw;
    const { component, name } = node;

    if (!name) {
      logger.error('route name is required', route);
    }

    // layout转换
    if (component && layoutMap[component]) {
      route.component = layoutMap[component];
      // 页面组件转换
    } else if (component) {
      const normalizePath = normalizeViewPath(component);
      const pageKey = normalizePath.endsWith('.vue')
        ? normalizePath
        : `${normalizePath}.vue`;
      if (pageMap[pageKey]) {
        route.component = pageMap[pageKey];
      } else {
        logger.error(`route component is invalid: ${pageKey}`, route);
        route.component = pageMap['/_core/fallback/not-found.vue'];
      }
    }

    return route;
  });
}

/**
 * 标准化后端组件路径，去除相对路径前缀和 `/views` 目录前缀。
 *
 * @remarks
 * 当前耦合了 ydsz-admin 目录结构（移除 `/views` 前缀）。
 *
 * @param path - 后端返回的原始组件路径
 * @returns 标准化后的路径（以 `/` 开头，不含视图前缀）
 */
function normalizeViewPath(path: string): string {
  // 去除相对路径前缀
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');

  // 确保路径以 '/' 开头
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  // 这里耦合了ydsz-admin的目录结构
  return viewPath.replace(/^\/views/, '');
}
export { generateRoutesByBackend };
