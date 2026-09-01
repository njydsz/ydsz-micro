/**
 * 布局模块统一入口 — 聚合基础布局、认证页布局、iframe 嵌入与布局挂件
 *
 * 集中导出 BasicLayout、AuthPageLayout、IFrameView 等布局容器与全部 Widget，
 * 供主应用一次性引用完成整体页面框架搭建。
 *
 * @path comm\effects\layouts\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './authentication';
export * from './basic';
export * from './iframe';
export * from './widgets';
