/**
 * 子路径入口：@ydsz-core/ui/form
 *
 * 表单引擎 — YdForm 组件、setupYdForm 初始化、useYdForm composable、
 * zod 透出、OpenAPI Schema → 表单字段映射。
 *
 * @module @ydsz-core/ui/form
 */
export { setupYdForm } from '@ydsz-core/form-ui';
export type {
  YdBaseFormComponentType,
  YdExtendedFormApi,
  YdFormProps,
  YdFormSchema,
  YdFormAdapterOptions,
} from '@ydsz-core/form-ui';
export { useYdForm } from '@ydsz-core/form-ui';
export * as z from '@ydsz-core/form-ui';
export {
  openApiSchemaToComponentType,
  openApiSchemaToFormFields,
  toFormItemRules,
  toFormRules,
} from '@ydsz-core/form-ui';
export type {
  ComponentFieldConfig,
  ComponentMappingOptions,
  OpenApiValidationMeta,
  ToRulesOptions,
} from '@ydsz-core/form-ui';
