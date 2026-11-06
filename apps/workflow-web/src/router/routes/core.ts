/**
 * 核心路由配置（根路由 + 404 兜底）
 *
 * @remarks
 * 路由结构收敛到 `@ydsz/shared-auth` 的 `createCoreRoutes`，此处仅注入
 * 子应用侧的布局与兜底组件（`#/` 别名只在应用上下文内可解析）。
 *
 * @path apps\workflow-web\src\router\routes\core.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { createCoreRoutes } from '@ydsz/shared-auth';

const { coreRoutes, fallbackNotFoundRoute } = createCoreRoutes({
  basicLayout: () => import('#/layouts/basic.vue'),
  notFoundComponent: () => import('#/views/fallback/not-found.vue'),
});

export { coreRoutes, fallbackNotFoundRoute };
