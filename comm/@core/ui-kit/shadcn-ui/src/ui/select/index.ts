/**
 * 选择器全部子组件的出口：容器、触发器、值、内容、分组、标签、选项与滚动按钮。
 *
 * 拆分粒度对应 radix 的插槽结构，缺一不可 ——
 * 尤其是 SelectItemText 与 SelectValue，漏掉会分别导致触发器空白与选项无文本。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Select } from './Select.vue';
export { default as SelectContent } from './SelectContent.vue';
export { default as SelectGroup } from './SelectGroup.vue';
export { default as SelectItem } from './SelectItem.vue';
export { default as SelectItemText } from './SelectItemText.vue';
export { default as SelectLabel } from './SelectLabel.vue';
export { default as SelectScrollDownButton } from './SelectScrollDownButton.vue';
export { default as SelectScrollUpButton } from './SelectScrollUpButton.vue';
export { default as SelectSeparator } from './SelectSeparator.vue';
export { default as SelectTrigger } from './SelectTrigger.vue';
export { default as SelectValue } from './SelectValue.vue';
