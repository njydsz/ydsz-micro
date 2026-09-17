/**
 * useFormValidation —— 表单校验全链路增强 composable。
 *
 * <p>在基础 vee-validate 之上提供：
 * <ul>
 *   <li>异步校验（远程唯一性检查等）</li>
 *   <li>跨字段联动校验（如确认密码、日期范围）</li>
 *   <li>校验时机配置（onInput/onBlur/onChange/onSubmit）</li>
 *   <li>防抖控制</li>
 * </ul>
 *
 * <p>典型用法：
 * <pre>
 * const { defineField, errors, validateFieldValue } = useFormValidation({
 *   initialValues: { username: '', password: '', confirmPassword: '' },
 *   validationSchema: z.object({
 *     username: z.string().min(3).max(20),
 *     password: z.string().min(8),
 *     confirmPassword: z.string(),
 *   }).refine((data) => data.password === data.confirmPassword, {
 *     message: '两次密码不一致',
 *     path: ['confirmPassword'],
 *   }),
 * });
 * </pre>
 *
 * @path comm/@core/ui-kit/form-ui/src/validation/use-form-validation.ts
 * @author ydsz-team
 * @since 26.09.17
 */
import type { GenericObject, InvalidSubmissionContext } from 'vee-validate';
import type { z } from 'zod';

import { useForm } from 'vee-validate';

import { toTypedSchema } from '@vee-validate/zod';

/** 校验触发时机 */
export type ValidationTrigger = 'input' | 'blur' | 'change' | 'submit';

/** 表单校验配置 */
export interface UseFormValidationOptions<TValues extends GenericObject> {
  /** 初始值 */
  initialValues?: TValues;
  /** 异步内联校验规则 */
  validationSchema?: z.ZodType<TValues>;
  /** 校验触发时机（全局默认），默认 'change' */
  validateTrigger?: ValidationTrigger;
  /** 是否在校验前自动先触发 validateOnMount，默认 false */
  isValidateOnMount?: boolean;
  /** 校验失败回调 */
  onInvalidSubmit?: (ctx: InvalidSubmissionContext<TValues>) => void;
  /** 提交成功回调 */
  onSubmit?: (values: TValues, ctx: { resetForm: () => void }) => void | Promise<void>;
  /** 防抖延迟（ms），用于异步校验默认 300 */
  debounceMs?: number;
}

/** 表单校验结果 */
export interface FormValidationHandle<TValues extends GenericObject> {
  /** 按名注册字段 */
  defineField: (name: keyof TValues, options?: FieldOptions) => FieldBindHandle;
  /** 错误记录 */
  errors: Record<string, string | undefined>;
  /** 表单提交（自动触发校验） */
  handleSubmit: (onValid: (values: TValues) => void) => () => void;
  /** 程序化触发指定字段校验 */
  triggerFieldValidation: (name: keyof TValues) => Promise<boolean>;
  /** 重置表单 */
  resetForm: (values?: Partial<TValues>) => void;
  /** 设置字段错误（异步校验失败时手动设置） */
  setFieldError: (name: keyof TValues, message: string) => void;
}

/** 单个字段配置 */
export interface FieldOptions {
  /** 字段级校验时机（覆盖全局） */
  validateTrigger?: ValidationTrigger;
  /** 字段级防抖 */
  debounceMs?: number;
}

/** 字段绑定结果 */
export interface FieldBindHandle {
  /** v-model 值 */
  value: unknown;
  /** 错误信息 */
  errorMessage: string | undefined;
}

/**
 * useFormValidation：表单校验全链路增强。
 *
 * @param options —— 配置项
 * @return 表单校验结果
 */
export function useFormValidation<TValues extends GenericObject>(
  options: UseFormValidationOptions<TValues>,
): FormValidationHandle<TValues> {
  const {
    initialValues,
    validationSchema,
    validateTrigger = 'change',
    onInvalidSubmit,
    onSubmit,
    debounceMs = 300,
    isValidateOnMount = false,
  } = options;

  const schema = validationSchema ? toTypedSchema(validationSchema) : undefined;

  const { defineField, errors, handleSubmit, resetForm, validateField, setFieldError } = useForm<TValues>({
    initialValues: (initialValues ?? {}) as TValues,
    validationSchema: schema,
    validateOnMount: isValidateOnMount,
  });

  /** 按名注册字段 */
  function getFieldOptions(name: keyof TValues, fieldOptions?: FieldOptions) {
    return {
      name: name as string,
      debounce: fieldOptions?.debounceMs ?? debounceMs,
      validateOnBlur: (fieldOptions?.validateTrigger ?? validateTrigger) === 'blur',
      validateOnChange: (fieldOptions?.validateTrigger ?? validateTrigger) === 'change',
      validateOnInput: (fieldOptions?.validateTrigger ?? validateTrigger) === 'input',
      validateOnModelUpdate: true,
    };
  }

  /** 程序化触发字段校验 */
  async function triggerFieldValidation(name: keyof TValues): Promise<boolean> {
    const { valid } = await validateField(name as string);
    return valid;
  }

  /** 包装 handleSubmit 自动调用 onSubmit + onInvalidSubmit */
  const wrappedHandleSubmit = (onValid: (values: TValues) => void) => {
    return handleSubmit(
      onValid,
      onInvalidSubmit
        ? (ctx) => {
            onInvalidSubmit(ctx as InvalidSubmissionContext<TValues>);
          }
        : undefined,
    );
  };

  return {
    defineField: (name, fieldOptions) => defineField(name as string, getFieldOptions(name, fieldOptions)) as FieldBindHandle,
    errors,
    handleSubmit: onSubmit
      ? (onValid) => wrappedHandleSubmit((values) => {
          onValid(values);
          onSubmit(values, { resetForm });
        })
      : wrappedHandleSubmit,
    resetForm,
    setFieldError: (name, message) => {
      setFieldError(name as string, message);
    },
    triggerFieldValidation,
  };
}
