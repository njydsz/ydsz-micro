/**
 * 表单渲染层的出口：导出 Form 主组件与 FormField / FormLabel 两个子组件。
 *
 * 仅透出这三个入口，联动（dependencies）与展开（expandable）等内部实现不对外
 * 暴露，便于后续重构渲染器内部而不影响消费方。
 *
 * @path comm\@core\ui-kit\form-ui\src\form-render\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as FormField } from './form-field.vue';
export { default as FormLabel } from './form-label.vue';
export { default as Form } from './form.vue';

