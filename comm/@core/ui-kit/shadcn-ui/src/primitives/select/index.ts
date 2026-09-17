/**
 * 选择器全部子组件的出口：容器、触发器、值、内容、分组、标签、选项与滚动按钮。
 *
 * 拆分粒度对应 radix 的插槽结构，缺一不可 ——
 * 尤其是 YdSelectItemText 与 YdSelectValue，漏掉会分别导致触发器空白与选项无文本。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdSelectRoot } from './YdSelectRoot.vue';
export { default as YdSelectContent } from './YdSelectContent.vue';
export { default as YdSelectGroup } from './YdSelectGroup.vue';
export { default as YdSelectItem } from './YdSelectItem.vue';
export { default as YdSelectItemText } from './YdSelectItemText.vue';
export { default as YdSelectLabel } from './YdSelectLabel.vue';
export { default as YdSelectScrollDownButton } from './YdSelectScrollDownButton.vue';
export { default as YdSelectScrollUpButton } from './YdSelectScrollUpButton.vue';
export { default as YdSelectSeparator } from './YdSelectSeparator.vue';
export { default as YdSelectTrigger } from './YdSelectTrigger.vue';
export { default as YdSelectValue } from './YdSelectValue.vue';
export { default as YdVSelect } from './YdVSelect.vue';
export { default as YdVSelectTrigger } from './YdVSelectTrigger.vue';
export { default as YdSelectVirtualContent } from './YdSelectVirtualContent.vue';
export type { VSelectProps } from './YdVSelect.vue';
export type { VSelectTriggerProps } from './YdVSelectTrigger.vue';
export type { SelectVirtualContentProps } from './YdSelectVirtualContent.vue';
