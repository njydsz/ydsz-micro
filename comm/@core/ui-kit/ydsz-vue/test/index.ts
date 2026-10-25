/**
 * ydsz-vue 测试助手 —— 供本包各 .test.ts 文件复用的交互工具。
 *
 * <p>放在 `src` 之外：本包以源码形式发布（`files: ["src"]`），
 * 测试助手不应进入产物。
 *
 * @path comm\@core\ui-kit\ydsz-vue\test\index.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import { vi } from 'vitest'

/**
 * 等待若干毫秒，用于驱动依赖定时器 / nextTick 的过渡与 Presence 逻辑。
 *
 * @param ms 等待时长（毫秒）
 * @returns 在 ms 后 resolve 的 Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 表单 submit 捕获器（ spying 版）。
 *
 * <p>用例把 `handleSubmit` 作为 `<form @submit>` 的处理函数注入，
 * 再断言 `mock.results[n].value` —— 即该次提交时表单内的键值对。
 * 未选中 / 未禁用的复选框不会进入 FormData，因此可用来验证原生表单语义。
 */
export const handleSubmit = vi.fn((event: Event) => {
  event.preventDefault()
  const form = event.target as HTMLFormElement
  return Object.fromEntries(new FormData(form).entries())
})
