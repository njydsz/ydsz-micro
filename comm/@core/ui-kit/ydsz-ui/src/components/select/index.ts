/**
 * YdSelectSmart 的出口：options 驱动的开箱即用下拉选择器。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdSelectSmart } from './YdSelectSmart.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdSelect, default as YDSZSelect } from './YdSelect.vue';
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
export { default as YdOption } from './YdOption.vue';
export { default as YdSelectVirtualContent } from './YdSelectVirtualContent.vue';
export type { VSelectProps } from './YdVSelect.vue';
export type { VSelectTriggerProps } from './YdVSelectTrigger.vue';
export type { SelectVirtualContentProps } from './YdSelectVirtualContent.vue';
export { default as ydSelect } from './select.vue';
export type { SelectProps } from './select-types';

// 兼容旧引用名（表单 UI 侧仍以 *Base 命名消费原子组件）
export { default as YdSelectBase } from './YdSelect.vue';
export { default as YdSelectContentBase } from './YdSelectContent.vue';
export { default as YdSelectGroupBase } from './YdSelectGroup.vue';
export { default as YdSelectItemBase } from './YdSelectItem.vue';
export { default as YdSelectItemTextBase } from './YdSelectItemText.vue';
export { default as YdSelectLabelBase } from './YdSelectLabel.vue';
export { default as YdSelectSeparatorBase } from './YdSelectSeparator.vue';
export { default as YdSelectTriggerBase } from './YdSelectTrigger.vue';
export { default as YdSelectValueBase } from './YdSelectValue.vue';
