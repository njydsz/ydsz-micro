/**
 * index 模块
 *
 * @path comm\@core\ui-kit\form-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { setupREMIForm } from './config';

export type {
  BaseFormComponentType,
  ExtendedFormApi,
  REMIFormProps,
  FormSchema as REMIFormSchema,
} from './types';

export * from './use-YDSZ-form';
// export { default as REMIForm } from './YDSZ-form.vue';
export * as z from 'zod';
