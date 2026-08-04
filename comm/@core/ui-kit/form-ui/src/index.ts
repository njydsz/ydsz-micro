/**
 * index 模块
 *
 * @path comm\@core\ui-kit\form-ui\src\index.ts
 * @author remi-team
 * @since 1.0.0
 */
export { setupREMIForm } from './config';

export type {
  BaseFormComponentType,
  ExtendedFormApi,
  REMIFormProps,
  FormSchema as REMIFormSchema,
} from './types';

export * from './use-remi-form';
// export { default as REMIForm } from './remi-form.vue';
export * as z from 'zod';
