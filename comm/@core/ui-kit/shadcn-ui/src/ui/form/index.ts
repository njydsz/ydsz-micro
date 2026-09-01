/**
 * 表单字段辅助组件的出口（FormItem / FormLabel / FormControl / FormDescription / FormMessage）。
 *
 * 同时导出 FORM_ITEM_INJECTION_KEY 与 useFormField，
 * 供自定义输入组件接入同一套 id 与 aria 关联逻辑 ——
 * 这是把第三方控件包装成「表单友好」组件的唯一入口。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as FormControl } from './FormControl.vue';
export { default as FormDescription } from './FormDescription.vue';
export { default as FormItem } from './FormItem.vue';
export { default as FormLabel } from './FormLabel.vue';
export { default as FormMessage } from './FormMessage.vue';
export { FORM_ITEM_INJECTION_KEY } from './injectionKeys';
export {
  Form,
  Field as FormField,
  FieldArray as FormFieldArray,
} from 'vee-validate';
