/**
 * @file useFormValidation.ts
 * @description 表单校验辅助 composable——校验时机分档 + 异步去抖 + 跨字段联动。
 *
 * <p>P0-G 补齐「校验全链路」：
 * <ul>
 *   <li>校验时机分档 mode: 'blur' | 'change' | 'input' | 'submit'</li>
 *   <li>防抖校验（debouncedValidate）—— 异步校验去抖，默认 300ms</li>
 *   <li>手动触发指定字段校验（validateField）—— 用于跨字段联动</li>
 *   <li>依赖字段联动（dependencies）—— 字段 A 变化时自动触发字段 B 校验</li>
 * </ul>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\form\useFormValidation.ts
 * @author ydsz-team
 * @since 1.0.0 (26.09.17 修复 vueuse 13.x 兼容性 + 新增 dependencies 联动)
 */

import type { Ref } from 'vue'

import { ref } from 'vue'

/** 校验触发时机 */
export type ValidateOnMode = 'blur' | 'change' | 'input' | 'submit'

/** useFormValidation 配置项 */
export interface UseFormValidationOptions {
  /** 防抖延迟（毫秒），默认 300 */
  debounceMs?: number
  /**
   * 跨字段联动配置：fieldName → 依赖该字段的其他字段列表。
   * 当 fieldName 的值变化时，自动 validate 其依赖字段。
   *
   * @example
   * ```ts
   * dependencies: { password: ['confirmPassword'] }
   * // password 变化时自动触发 confirmPassword 校验
   * ```
   */
  dependencies?: Record<string, string[]>
}

/**
 * useFormValidation 返回的句柄。
 */
export interface FormValidationHandle {
  /** 防抖校验指定字段 */
  debouncedValidate: (fieldName: string) => void
  /** 立即校验指定字段 */
  validateField: (fieldName: string) => Promise<boolean>
  /** 触发字段变化联动（通知依赖该字段的其他字段校验） */
  notifyFieldChange: (fieldName: string) => void
  /** 当前校验时机模式 */
  mode: Ref<ValidateOnMode>
  /** 当前是否正在 debounce 等待 */
  isPending: Ref<boolean>
}

/**
 * useFormValidation —— 创建防抖校验句柄。
 *
 * 手动 setTimeout 实现防抖（避免 @vueuse/core useDebounceFn 在 13.x 版本
 * 返回纯函数无 cancel 的问题）。
 *
 * @param veeValidate - vee-validate 的 validate 函数（从 useFormContext 获取）
 * @param options - 配置项（debounceMs / dependencies）
 * @return 校验句柄
 *
 * @example
 * ```ts
 * const { debouncedValidate, notifyFieldChange, mode } = useFormValidation(
 *   () => validate(),
 *   {
 *     debounceMs: 300,
 *     dependencies: { password: ['confirmPassword'] },
 *   },
 * )
 * ```
 */
export function useFormValidation(
  veeValidate?: () => Promise<Record<string, string>>,
  options: UseFormValidationOptions = {},
): FormValidationHandle {
  const { debounceMs = 300, dependencies = {} } = options

  const mode = ref<ValidateOnMode>('blur')
  const isPending = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  /** 清理防抖计时器 */
  function disposeTimer(): void {
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      debounceTimer = null
      isPending.value = false
    }
  }

  /** 防抖校验指定字段 */
  function debouncedValidate(fieldName: string): void {
    disposeTimer()
    isPending.value = true
    debounceTimer = setTimeout(() => {
      void (async (): Promise<void> => {
        try {
          await veeValidate?.()
        }
        finally {
          isPending.value = false
          debounceTimer = null
        }
      })()
    }, debounceMs)
    void fieldName // 保留参数用于未来字段级校验
  }

  /** 立即校验指定字段（返回是否有错） */
  async function validateField(fieldName: string): Promise<boolean> {
    const errors = (await veeValidate?.()) ?? {}
    return !errors[fieldName]
  }

  /**
   * 联动处理：fieldName 值变化 → 触发其依赖字段的校验。
   *
   * 业务调用点：@input / @change 事件处理函数中调用
   * `notifyFieldChange('password')` → 触发 confirmPassword 校验。
   */
  function notifyFieldChange(fieldName: string): void {
    const dependents = dependencies[fieldName]
    if (!dependents || dependents.length === 0)
      return
    for (const dep of dependents) {
      void validateField(dep)
    }
  }

  return {
    debouncedValidate,
    notifyFieldChange,
    validateField,
    mode,
    isPending,
  }
}
