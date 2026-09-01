/**
 * form-ui 包出口：导出初始化函数、核心类型、useYDSZForm 与 zod 命名空间。
 *
 * 把 zod 以 `export * as z` 一并透出，让业务编写 Schema 校验规则时无需单独安装，
 * 也不会因版本不一致产生两个 zod 实例（会导致 instanceof 与类型判定失败）。
 * Schema 类型以别名 YDSZFormSchema 导出，便于消费方与内部 FormSchema 区分。
 * 表单使用入口由 useYDSZForm 组合式 API 承担。
 *
 * @path comm\@core\ui-kit\form-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { setupYDSZForm } from './config';

export type {
  BaseFormComponentType,
  ExtendedFormApi,
  YDSZFormProps,
  FormSchema as YDSZFormSchema,
} from './types';

export * from './use-YDSZ-form';
// export { default as YDSZForm } from './YDSZ-form.vue';
export * as z from 'zod';

