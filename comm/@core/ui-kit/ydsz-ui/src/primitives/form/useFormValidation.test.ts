/**
 * @file useFormValidation.test.ts
 * @description useFormValidation composable 测试——防抖校验 / 分档 / 跨字段联动。
 *
 * <p>云顶编码规范 §14 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\form\useFormValidation.test.ts
 * @author ydsz-team
 * @since 5.6.0 (26.09.17 扩展依赖联动测试)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFormValidation, type ValidateOnMode } from './useFormValidation'

describe('useFormValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应返回防抖校验函数和立即校验函数', () => {
    const handle = useFormValidation()
    expect(typeof handle.debouncedValidate).toBe('function')
    expect(typeof handle.validateField).toBe('function')
    expect(handle.mode).toBeDefined()
    expect(handle.isPending).toBeDefined()
  })

  it('默认校验模式应为 blur', () => {
    const handle = useFormValidation()
    expect(handle.mode.value).toBe('blur')
  })

  it('应支持所有校验触发模式', () => {
    const modes: ValidateOnMode[] = ['blur', 'change', 'input', 'submit']
    const handle = useFormValidation()
    for (const m of modes) {
      handle.mode.value = m
      expect(handle.mode.value).toBe(m)
    }
  })

  it('validateField 在无 verify 函数时应视为通过（无错误）', async () => {
    const handle = useFormValidation()
    const ok = await handle.validateField('anyField')
    expect(ok).toBe(true)
  })

  it('有错误时 validateField 应返回 false', async () => {
    const mockValidate = vi.fn().mockResolvedValue({ email: '邮箱格式不正确' })
    const handle = useFormValidation(mockValidate)
    const ok = await handle.validateField('email')
    expect(ok).toBe(false)
  })

  it('无对应错误时 validateField 应返回 true', async () => {
    const mockValidate = vi.fn().mockResolvedValue({ otherField: '错误信息' })
    const handle = useFormValidation(mockValidate)
    const ok = await handle.validateField('anyField')
    expect(ok).toBe(true)
  })

  it('debouncedValidate 应延迟调用 verify 函数（fake timers）', () => {
    const mockValidate = vi.fn().mockResolvedValue({})
    const handle = useFormValidation(mockValidate, { debounceMs: 50 })

    handle.debouncedValidate('field1')
    expect(mockValidate).not.toHaveBeenCalled()
    expect(handle.isPending.value).toBe(true)

    vi.advanceTimersByTime(50)
    expect(mockValidate).toHaveBeenCalledTimes(1)
  })

  it('debouncedValidate isPending 在防抖结束后恢复 false', async () => {
    const mockValidate = vi.fn().mockResolvedValue({})
    const handle = useFormValidation(mockValidate, { debounceMs: 30 })

    handle.debouncedValidate('f')
    expect(handle.isPending.value).toBe(true)

    await vi.advanceTimersByTimeAsync(50)
    expect(handle.isPending.value).toBe(false)
  })

  it('notifyFieldChange 触发依赖字段校验', async () => {
    const mockValidate = vi.fn().mockResolvedValue({ confirmPassword: '密码不一致' })
    const handle = useFormValidation(mockValidate, {
      dependencies: { password: ['confirmPassword'] },
    })

    handle.notifyFieldChange('password')
    // 需等待 microticks 让 async validateField 执行
    await vi.waitFor(() => {
      expect(mockValidate).toHaveBeenCalled()
    })
  })

  it('notifyFieldChange 对无依赖的字段不触发校验', () => {
    const mockValidate = vi.fn().mockResolvedValue({})
    const handle = useFormValidation(mockValidate, {
      dependencies: { password: ['confirmPassword'] },
    })

    handle.notifyFieldChange('username')
    expect(mockValidate).not.toHaveBeenCalled()
  })

  it('连续 debouncedValidate 取消防抖（只调用一次）', () => {
    const mockValidate = vi.fn().mockResolvedValue({})
    const handle = useFormValidation(mockValidate, { debounceMs: 100 })

    handle.debouncedValidate('a')
    handle.debouncedValidate('b')
    handle.debouncedValidate('c')

    vi.advanceTimersByTime(50)
    expect(mockValidate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(mockValidate).toHaveBeenCalledTimes(1)
  })

  it('应支持自定义防抖延迟', () => {
    const handle = useFormValidation(undefined, { debounceMs: 1000 })
    expect(handle).toBeDefined()
  })
})
