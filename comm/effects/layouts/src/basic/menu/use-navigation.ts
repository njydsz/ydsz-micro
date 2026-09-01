/**
 * 菜单点击的统一导航入口。
 *
 * 菜单项的目标有三类（站内路由、外链、需在新窗口打开的站内页），
 * 若让每个菜单组件各自判断，判断逻辑会重复且容易漏掉某一类。
 * 这里集中处理三类分支，对外只暴露一个 `navigation(path)`。
 *
 * 另一个作用是提供 `willOpenedByWindow(path)`：菜单在渲染时就需要知道
 * 「点击后会不会跳出当前页」，以便显示外链图标，而这个结论必须与
 * 真正点击时的判断一致，因此两者共用同一套判定。
 *
 * @path comm\effects\layouts\src\basic\menu\use-navigation.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { RouteRecordNormalized } from 'vue-router';

import { useRouter } from 'vue-router';

import { isHttpUrl, openRouteInNewWindow, openWindow } from '@ydsz/utils';

import { createLogger } from '@YDSZ-core/shared/utils';
const logger = createLogger('use-navigation');
function useNavigation() {
  const router = useRouter();
  const routeMetaMap = new Map<string, RouteRecordNormalized>();

  // 初始化路由映射
  const initRouteMetaMap = () => {
    const routes = router.getRoutes();
    routes.forEach((route) => {
      routeMetaMap.set(route.path, route);
    });
  };

  initRouteMetaMap();

  // 监听路由变化
  router.afterEach(() => {
    initRouteMetaMap();
  });

  // 检查是否应该在新窗口打开
  const shouldOpenInNewWindow = (path: string): boolean => {
    if (isHttpUrl(path)) {
      return true;
    }
    const route = routeMetaMap.get(path);
    return route?.meta?.openInNewWindow ?? false;
  };

  const resolveHref = (path: string): string => {
    return router.resolve(path).href;
  };

  const navigation = async (path: string) => {
    try {
      const route = routeMetaMap.get(path);
      const { openInNewWindow = false, query = {} } = route?.meta ?? {};

      if (isHttpUrl(path)) {
        openWindow(path, { target: '_blank' });
      } else if (openInNewWindow) {
        openRouteInNewWindow(resolveHref(path));
      } else {
        await router.push({
          path,
          query,
        });
      }
    } catch (error) {
      logger.error('Navigation failed:', error);
      throw error;
    }
  };

  const willOpenedByWindow = (path: string) => {
    return shouldOpenInNewWindow(path);
  };

  return { navigation, willOpenedByWindow };
}

export { useNavigation };
