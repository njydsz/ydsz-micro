/**
 * 核心路由配置（根路由 + 404 兜底）
 *
 * @remarks
 * 实现收敛到 `@ydsz/shared-auth` 的 `shell-core-routes`，此处仅做 re-export，
 * 保留子应用侧 `#/router/routes/core` 的导入路径。
 *
 * @path apps\workflow-web\src\router\routes\core.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { coreRoutes, fallbackNotFoundRoute } from '@ydsz/shared-auth';
