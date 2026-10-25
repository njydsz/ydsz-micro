/**
 * 右键菜单的出口：导出 YdContextMenu 与菜单项类型。
 *
 * 菜单项类型一并导出，便于业务侧在构造 menus 数组时获得类型校验。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\context-menu\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdContextMenu } from './YdContextMenu.vue';

export type * from './interface';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdContextMenuCheckboxItem } from './YdContextMenuCheckboxItem.vue';
export { default as YdContextMenuContent } from './YdContextMenuContent.vue';
export { default as YdContextMenuGroup } from './YdContextMenuGroup.vue';
export { default as YdContextMenuItem } from './YdContextMenuItem.vue';
export { default as YdContextMenuLabel } from './YdContextMenuLabel.vue';
export { default as YdContextMenuRadioGroup } from './YdContextMenuRadioGroup.vue';
export { default as YdContextMenuRadioItem } from './YdContextMenuRadioItem.vue';
export { default as YdContextMenuSeparator } from './YdContextMenuSeparator.vue';
export { default as YdContextMenuShortcut } from './YdContextMenuShortcut.vue';
export { default as YdContextMenuSub } from './YdContextMenuSub.vue';
export { default as YdContextMenuSubContent } from './YdContextMenuSubContent.vue';
export { default as YdContextMenuSubTrigger } from './YdContextMenuSubTrigger.vue';
export { default as YdContextMenuTrigger } from './YdContextMenuTrigger.vue';
export { default as ydContextMenu } from './context-menu.vue';
export type { ContextMenuProps } from './context-menu-types';
