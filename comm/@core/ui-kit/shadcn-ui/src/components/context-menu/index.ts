/**
 * 右键菜单的出口：导出 YDSZContextMenu 与菜单项类型。
 *
 * 菜单项类型一并导出，便于业务侧在构造 menus 数组时获得类型校验。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\context-menu\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YDSZContextMenu } from './context-menu.vue';

export type * from './interface';

