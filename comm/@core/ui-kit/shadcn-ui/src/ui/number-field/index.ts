/**
 * 数字输入框五件套的出口：容器、内容区、输入框与增减按钮。
 *
 * 增减按钮单独导出而非内置在容器里，是为了支持只保留一侧、
 * 或把按钮换成自定义图标等布局变体。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\number-field\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as NumberField } from './NumberField.vue';
export { default as NumberFieldContent } from './NumberFieldContent.vue';
export { default as NumberFieldDecrement } from './NumberFieldDecrement.vue';
export { default as NumberFieldIncrement } from './NumberFieldIncrement.vue';
export { default as NumberFieldInput } from './NumberFieldInput.vue';
