/**
 * a11y 测试辅助 —— 为单测提供 role / aria 查询谓词。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/a11y/a11y-test-utils.ts
 * @author ydsz-team
 * @since 26.10.10
 */

import { ARIA_ROLE_CONTRACTS } from './aria-role-map'

/**
 * 验证组件根元素是否携带了 contract 要求的 role。
 */
export function expectRole(
  wrapper: Element,
  componentName: `${string}`,
  contract: typeof ARIA_ROLE_CONTRACTS[string] | undefined
): void {
  if (!contract) return
  const actual = wrapper.getAttribute('role')
  if (actual !== contract.role) {
    throw new Error(`[${componentName}] Expected role="${contract.role}" but got "${actual}"`)
  }
}

/**
 * 验证 contract 中声明的必要 ARIA 属性是否存在于元素。
 */
export function expectRequiredAriaAttrs(
  wrapper: Element,
  componentName: `${string}`,
  contract: typeof ARIA_ROLE_CONTRACTS[string] | undefined
): void {
  if (!contract?.requiredAttrs) return
  for (const attr of contract.requiredAttrs) {
    if (!wrapper.hasAttribute(attr)) {
      throw new Error(`Missing required attr "${attr}" on ${componentName}`)
    }
  }
}

export { ARIA_ROLE_CONTRACTS }
