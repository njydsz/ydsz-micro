/**
 * 表单复合组件出口集合。
 *
 * <p>包含：
 * <ul>
 *   <li>YdForm —— 表单容器包装器，内置提交时自动聚焦首个错误字段</li>
 *   <li>YdFormItem / YdFormLabel / YdFormControl / YdFormDescription / YdFormMessage —— 复合组件</li>
 *   <li>Form / Field / FieldArray —— vee-validate 直接透传</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdFormControl } from './YdFormControl.vue';
export { default as YdFormDescription } from './YdFormDescription.vue';
export { default as YdFormItem } from './YdFormItem.vue';
export { default as YdFormLabel } from './YdFormLabel.vue';
export { default as YdFormMessage } from './YdFormMessage.vue';
export { default as YdForm } from './YdForm.vue';
export { FORM_ITEM_INJECTION_KEY } from './injectionKeys';
export { useFormField } from './useFormField';
export {
  Field as FormField,
  FieldArray as FormFieldArray,
  Form,
} from 'vee-validate';
