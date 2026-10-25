/**
 * Select 家族出口。
 *
 * <p>两层结构：
 *  - YdSelectSmart —— options 驱动的业务选择器（单选/多选/搜索/虚拟滚动/键盘导航）；
 *  - YdSelect + YdSelectItem… —— radix 组合式三件套，供需要自定义面板结构的场景使用。
 *
 * <p>已下线的并行实现：YdVSelect / YdVSelectTrigger / YdSelectVirtualContent（虚拟滚动与
 * 键盘能力已并入 YdSelectSmart）、select.vue（原生 select 骨架，无任何调用方）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdSelectSmart } from './YdSelectSmart.vue';
export type { SelectSmartOption } from './YdSelectSmart.vue';

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
export { default as YdOption } from './YdOption.vue';

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
