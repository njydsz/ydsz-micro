/**
 * 下拉菜单全部子组件的出口，并额外透出 radix-vue 的 DropdownMenuPortal。
 *
 * Portal 之所以一并导出：菜单内容默认挂在 body，
 * 但在被 overflow:hidden 的容器里需要指定挂载点时，调用方必须能自己包一层 Portal。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\dropdown-menu\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
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
