/**
 * useFormValidation —— 表单校验辅助 composable，提供防抖校验和跨字段联动校验。
 *
 * <p>P0-5 补齐「校验全链路」：
 * <ul>
 *   <li>防抖校验（debouncedValidate）—— 用户停止输入 N ms 后再触发校验，避免频繁请求</li>
 *   <li>手动触发指定字段校验（validateField）—— 用于跨字段联动</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\useFormValidation.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Ref } from 'vue';

import { ref } from 'vue';

import { debounce } from 'lodash-es';

/** 校验触发时机 */
export type ValidateOnMode = 'blur' | 'change' | 'input' | 'submit';

/** useFormValidation 配置项 */
export interface UseFormValidationOptions {
  /** 防抖延迟（毫秒），默认 300 */
  debounceMs?: number;
}

/**
 * useFormValidation 返回的句柄。
 */
export interface FormValidationHandle {
  /** 防抖校验指定字段 */
  debouncedValidate: (fieldName: string) => void;
  /** 立即校验指定字段 */
  validateField: (fieldName: string) => Promise<boolean>;
  /** 当前校验时机模式 */
  mode: Ref<ValidateOnMode>;
}

/**
 * useFormValidation —— 创建防抖校验句柄。
 *
 * @param veeValidate - vee-validate 的 validate 函数（从 useFormContext 获取）
 * @param options - 配置项
 * @return 校验句柄
 *
 * @example
 * ```ts
 * const { debouncedValidate, mode } = useFormValidation(validate, { debounceMs: 500 });
 *
 * // 输入框 @input 事件
 * function onInput() {
 *   debouncedValidate('email');
 * }
 * ```
 */
export function useFormValidation(
  veeValidate?: () => Promise<Record<string, string>>,
  options: UseFormValidationOptions = {},
): FormValidationHandle {
  const { debounceMs = 300 } = options;
  const mode = ref<ValidateOnMode>('blur');

  const debouncedValidate = debounce((_fieldName: string) => {
    veeValidate?.();
  }, debounceMs);

  async function validateField(fieldName: string): Promise<boolean> {
    const errors = (await veeValidate?.()) ?? {};
    return !errors[fieldName];
  }

  return {
    debouncedValidate,
    mode,
    validateField,
  };
}
