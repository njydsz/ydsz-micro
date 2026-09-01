/**
 * UI 业务页面统一出口 — 聚合登录、仪表盘、关于、异常页等场景组件
 *
 * 集中导出认证页、分析页、工作台、异常兜底页等完整页面级组件，
 * 供主应用与子应用直接引用，无需各自实现。
 *
 * @path comm\effects\common-ui\src\ui\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './about';
export * from './authentication';
export * from './dashboard';
export * from './fallback';
