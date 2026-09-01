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
export { default as DropdownMenu } from './DropdownMenu.vue';

export { default as DropdownMenuCheckboxItem } from './DropdownMenuCheckboxItem.vue';
export { default as DropdownMenuContent } from './DropdownMenuContent.vue';
export { default as DropdownMenuGroup } from './DropdownMenuGroup.vue';
export { default as DropdownMenuItem } from './DropdownMenuItem.vue';
export { default as DropdownMenuLabel } from './DropdownMenuLabel.vue';
export { default as DropdownMenuRadioGroup } from './DropdownMenuRadioGroup.vue';
export { default as DropdownMenuRadioItem } from './DropdownMenuRadioItem.vue';
export { default as DropdownMenuSeparator } from './DropdownMenuSeparator.vue';
export { default as DropdownMenuShortcut } from './DropdownMenuShortcut.vue';
export { default as DropdownMenuSub } from './DropdownMenuSub.vue';
export { default as DropdownMenuSubContent } from './DropdownMenuSubContent.vue';
export { default as DropdownMenuSubTrigger } from './DropdownMenuSubTrigger.vue';
export { default as DropdownMenuTrigger } from './DropdownMenuTrigger.vue';
export { DropdownMenuPortal } from 'radix-vue';
