/**
 * form-ui 的类型定义统一入口。
 *
 * 为控制单文件行数，类型定义已按职责拆分为：
 * - types-core.ts：核心类型（FormLayout / FormSchema / FormItemDependencies 等）
 * - types-schema.ts：Schema 与字段配置（FormSchema / FormFieldProps / FormCommonConfig 等）
 * - types-components.ts：组件配置与渲染（FormRenderProps / YDSZFormProps / YDSZFormAdapterOptions 等）
 *
 * 本文件作为统一 barrel 导出，保持向后兼容。
 *
 * @path comm/@core/ui-kit/form-ui/src/types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

// ===== 核心类型 =====
export type {
  BaseFormComponentType,
  CustomRenderType,
  FormActions,
  FormFieldOptions,
  FormItemClassType,
  FormItemDependencies,
  FormLayout,
  FormSchemaRuleType,
  FormShape,
  MaybeComponentPropKey,
  MaybeComponentProps,
  WrapperClassType,
} from './types-core';

// ===== Schema 与字段配置 =====
export type {
  ArrayToStringFields,
  FieldMappingTime,
  FormCommonConfig,
  FormFieldProps,
  FormSchema,
  HandleResetFn,
  HandleSubmitFn,
} from './types-schema';

// ===== 组件配置与渲染 =====
export type {
  ActionButtonOptions,
  FormRenderProps,
  YDSZFormAdapterOptions,
  YDSZFormProps,
} from './types-components';

