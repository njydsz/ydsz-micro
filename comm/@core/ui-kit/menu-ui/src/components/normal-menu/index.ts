/**
 * 普通菜单（非递归渲染）实现类型的出口。
 *
 * 只导出类型：normal-menu 提供的是扁平数据 → 菜单结构的转换方式，
 * 组件实现仍复用 Menu / SubMenu，因此这里没有组件可导出。
 *
 * @path comm\@core\ui-kit\menu-ui\src\components\normal-menu\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export type * from './normal-menu';
export { default as NormalMenu } from './normal-menu.vue';
