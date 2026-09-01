/**
 * 布局组件统一导出 —— 聚合基础布局、认证页布局与 iframe 视图三类容器
 *
 * @path main\src\layouts\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 基础布局组件（懒加载） */
const BasicLayout = () => import('./basic.vue');
/** 认证页布局组件（懒加载） */
const AuthPageLayout = () => import('./auth.vue');
/** 内嵌 iframe 视图组件（懒加载） */
const IFrameView = () => import('@ydsz/layouts').then((m) => m.IFrameView);

export { AuthPageLayout, BasicLayout, IFrameView };
