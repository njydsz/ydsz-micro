/**
 * 布局挂件统一出口 — 聚合顶栏全部工具型小组件
 *
 * 集中导出面包屑、全局搜索、主题切换、语言切换、锁屏、通知、用户下拉等挂件，
 * 供 BasicLayout 顶栏一次性引用完成布局骨架搭建。
 *
 * @path comm\effects\layouts\src\widgets\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Breadcrumb } from './breadcrumb.vue';
export * from './check-updates';
export { default as AuthenticationColorToggle } from './color-toggle.vue';
export * from './global-search';
export { default as LanguageToggle } from './language-toggle.vue';
export { default as AuthenticationLayoutToggle } from './layout-toggle.vue';
export * from './lock-screen';
export * from './notification';
export * from './preferences';
export * from './theme-toggle';
export * from './user-dropdown';
