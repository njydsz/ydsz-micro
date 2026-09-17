/**
 * 下拉菜单全部子组件的出口，并额外透出 radix-vue 的 DropdownMenuPortal。
 *
 * Portal 之所以一并导出：菜单内容默认挂在 body，
 * 但在被 overflow:hidden 的容器里需要指定挂载点时，调用方必须能自己包一层 Portal。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\dropdown-menu\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdDropdownMenuBase } from './YdDropdownMenuBase.vue';

export { default as YdDropdownMenuCheckboxItemBase } from './YdDropdownMenuCheckboxItemBase.vue';
export { default as YdDropdownMenuContentBase } from './YdDropdownMenuContentBase.vue';
export { default as YdDropdownMenuGroupBase } from './YdDropdownMenuGroupBase.vue';
export { default as YdDropdownMenuItemBase } from './YdDropdownMenuItemBase.vue';
export { default as YdDropdownMenuLabelBase } from './YdDropdownMenuLabelBase.vue';
export { default as YdDropdownMenuRadioGroupBase } from './YdDropdownMenuRadioGroupBase.vue';
export { default as YdDropdownMenuRadioItemBase } from './YdDropdownMenuRadioItemBase.vue';
export { default as YdDropdownMenuSeparatorBase } from './YdDropdownMenuSeparatorBase.vue';
export { default as YdDropdownMenuShortcutBase } from './YdDropdownMenuShortcutBase.vue';
export { default as YdDropdownMenuSubBase } from './YdDropdownMenuSubBase.vue';
export { default as YdDropdownMenuSubContentBase } from './YdDropdownMenuSubContentBase.vue';
export { default as YdDropdownMenuSubTriggerBase } from './YdDropdownMenuSubTriggerBase.vue';
export { default as YdDropdownMenuTriggerBase } from './YdDropdownMenuTriggerBase.vue';
export { DropdownMenuPortal } from 'radix-vue';
