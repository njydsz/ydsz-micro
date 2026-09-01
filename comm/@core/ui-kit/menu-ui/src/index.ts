/**
 * menu-ui 的包出口：普通菜单、菜单类型与预加载适配器。
 *
 * 递归版 Menu / SubMenu 不在此导出 —— 它们需要调用方自行组装菜单树，
 * 对外暴露的是「给一份数据就能渲染」的入口，即普通菜单与预加载适配器。
 *
 * @path comm\@core\ui-kit\menu-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as MenuBadge } from './components/menu-badge.vue';
export * from './components/normal-menu';
export { default as Menu } from './menu.vue';
export type * from './types';
export * from './preload-adapter';
