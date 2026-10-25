/**
 * 下拉菜单的出口：导出普通下拉菜单、单选下拉菜单与菜单项类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\dropdown-menu\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdDropdownMenuSmart } from './YdDropdownMenuSmart.vue';
export { default as YdDropdownRadioMenu } from './YdDropdownRadioMenu.vue';

export type * from './interface';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdDropdownMenu } from './YdDropdownMenu.vue';
export { default as YdDropdownMenuCheckboxItem } from './YdDropdownMenuCheckboxItem.vue';
export { default as YdDropdownMenuContent } from './YdDropdownMenuContent.vue';
export { default as YdDropdownMenuGroup } from './YdDropdownMenuGroup.vue';
export { default as YdDropdownMenuItem } from './YdDropdownMenuItem.vue';
export { default as YdDropdownMenuLabel } from './YdDropdownMenuLabel.vue';
export { default as YdDropdownMenuRadioGroup } from './YdDropdownMenuRadioGroup.vue';
export { default as YdDropdownMenuRadioItem } from './YdDropdownMenuRadioItem.vue';
export { default as YdDropdownMenuSeparator } from './YdDropdownMenuSeparator.vue';
export { default as YdDropdownMenuShortcut } from './YdDropdownMenuShortcut.vue';
export { default as YdDropdownMenuSub } from './YdDropdownMenuSub.vue';
export { default as YdDropdownMenuSubContent } from './YdDropdownMenuSubContent.vue';
export { default as YdDropdownMenuSubTrigger } from './YdDropdownMenuSubTrigger.vue';
export { default as YdDropdownMenuTrigger } from './YdDropdownMenuTrigger.vue';
export { DropdownMenuPortal } from '@ydsz-core/ydsz-vue';
export { default as ydDropdownMenu } from './dropdown-menu.vue';
export type { DropdownMenuProps } from './dropdown-menu-types';

// 兼容旧引用名（消费方仍以 *Base 命名引用原子组件）
export { default as YdDropdownMenuBase } from './YdDropdownMenu.vue';
export { default as YdDropdownMenuContentBase } from './YdDropdownMenuContent.vue';
export { default as YdDropdownMenuGroupBase } from './YdDropdownMenuGroup.vue';
export { default as YdDropdownMenuItemBase } from './YdDropdownMenuItem.vue';
export { default as YdDropdownMenuLabelBase } from './YdDropdownMenuLabel.vue';
export { default as YdDropdownMenuSeparatorBase } from './YdDropdownMenuSeparator.vue';
export { default as YdDropdownMenuShortcutBase } from './YdDropdownMenuShortcut.vue';
export { default as YdDropdownMenuSubBase } from './YdDropdownMenuSub.vue';
export { default as YdDropdownMenuSubContentBase } from './YdDropdownMenuSubContent.vue';
export { default as YdDropdownMenuSubTriggerBase } from './YdDropdownMenuSubTrigger.vue';
export { default as YdDropdownMenuTriggerBase } from './YdDropdownMenuTrigger.vue';
