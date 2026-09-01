/**
 * 菜单内部组件的出口：Menu、MenuItem、SubMenu 与 MenuBadge。
 *
 * MenuBadge 一并导出是因为业务常需要在自定义菜单项上复用同一套徽标呈现；
 * 过渡组件（collapse-transition）不导出，它只服务于子菜单的展开动画。
 *
 * @path comm\@core\ui-kit\menu-ui\src\components\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as MenuBadge } from './menu-badge.vue';
export { default as MenuItem } from './menu-item.vue';
export { default as Menu } from './menu.vue';
export { default as SubMenu } from './sub-menu.vue';
