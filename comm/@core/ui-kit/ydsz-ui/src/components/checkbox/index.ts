/**
 * 复选框的出口：导出 YdCheckboxSmart。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\checkbox\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdCheckboxSmart } from './YdCheckboxSmart.vue';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdCheckbox } from './YdCheckbox.vue';
export { default as ydCheckbox } from './checkbox.vue';
export type { CheckboxProps } from './checkbox-types';

// 兼容旧引用名（表单 UI 侧仍以 *Base 命名消费原子组件）
export { default as YdCheckboxBase } from './YdCheckbox.vue';
