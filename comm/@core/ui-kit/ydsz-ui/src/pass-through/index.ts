/**
 * ydsz-ui Pass Through (pt) 工具函数 —— 类 PrimeVue Pass Through 的 pt 解析器。
 *
 * pt 是用于覆盖组件内部节点 class/style 的透传配置，支持嵌套节点定位
 * 与 class/style 智能合并。
 *
 * 用法示例：
 * ```vue
 * <script setup lang="ts">
 * import { usePassThrough, mergePt } from '@ydsz-core/ydsz-ui/pass-through'
 *
 * const buttonPt = usePassThrough({
 *   class: 'my-custom-btn',
 *   style: { borderRadius: '8px' }
 * })
 *
 * // 或合并多个 pt 配置（如 root + 内部节点）
 * const merged = mergePt({
 *   root: { class: 'my-root' },
 *   label: { class: 'my-label' }
 * })
 * </script>
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\pass-through\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** pt 配置项：可包含 className、style 及任意自定义属性 */
export interface PtOptions {
  /** 要合并到该节点的 CSS 类名（字符串或字符串数组） */
  className?: string | string[]
  /** 要合并到该节点的内联样式 */
  style?: Record<string, string>
  /** 扩展属性，如 data-*、aria-* 等 */
  [key: string]: unknown
}

/** pt 合并结果 */
export interface PtResult {
  class: string
  style: string
  attrs: Record<string, string>
}

/**
 * 规范化 className 输入 —— 将 string | string[] 统一为去重后的字符串
 *
 * @param className - 原始 class 输入
 * @returns 去重后的 class 字符串
 */
function normalizeClass(className?: string | string[]): string {
  if (!className) return ''

  if (Array.isArray(className)) {
    return Array.from(new Set(className.flatMap(c => c.split(' ')))).filter(Boolean).join(' ')
  }

  return className.trim()
}

/**
 * 将 style 对象序列化为 CSS 字符串
 *
 * @param style - style 对象
 * @returns CSS 字符串（如 "color:red;font-size:14px;"）
 */
function styleToString(style?: Record<string, string>): string {
  if (!style) return ''

  return Object.entries(style)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${value}`)
    .join(';')
}

/**
 * 解析单个 pt 配置为合并后的 class/style/attrs
 *
 * @param pt - pt 配置对象
 * @returns 合并后的 PtResult
 *
 * @example
 * ```ts
 * usePassThrough({ className: 'foo bar', style: { color: 'red' } })
 * // => { class: 'foo bar', style: 'color:red;', attrs: {} }
 * ```
 */
export function usePassThrough(pt?: PtOptions): PtResult {
  if (!pt) {
    return { class: '', style: '', attrs: {} }
  }

  const { className, style, ...rest } = pt

  // 收集 attrs（排除 className 和 style）
  const attrs: Record<string, string> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === 'string') {
      attrs[key] = value
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      attrs[key] = String(value)
    }
  }

  return {
    class: normalizeClass(className),
    style: styleToString(style),
    attrs,
  }
}

/**
 * 按节点名合并多个 pt 配置 —— 同节点的同名属性自动合并
 *
 * @param record - 节点名到 PtOptions 的映射（undefined 节点会被忽略）
 * @returns 节点名到 PtResult 的映射
 *
 * @example
 * ```ts
 * mergePt({
 *   root: { className: 'base-root', style: { padding: '10px' } },
 *   label: { className: 'base-label' },
 *   input: undefined,  // 跳过
 * })
 * // → {
 * //     root: { class: 'base-root', style: 'padding:10px;', attrs: {} },
 * //     label: { class: 'base-label', style: '', attrs: {} },
 * //   }
 * ```
 */
export function mergePt(record: Record<string, PtOptions | undefined>): Record<string, PtResult> {
  const result: Record<string, PtResult> = {}

  for (const [nodeName, pt] of Object.entries(record)) {
    if (pt !== undefined) {
      result[nodeName] = usePassThrough(pt)
    }
  }

  return result
}

/**
 * 合并两套 pt 配置（用于全局默认 + 局部覆盖场景）
 *
 * - class 拼接（去重）
 * - style 后者覆盖前者
 * - attrs 合并
 *
 * @param base - 基础 pt 配置
 * @param override - 覆盖 pt 配置（优先级更高）
 * @returns 合并后的 PtResult
 */
export function extendPt(
  base: PtOptions | undefined,
  override: PtOptions | undefined,
): PtResult {
  const baseResult = usePassThrough(base)
  const overrideResult = usePassThrough(override)

  if (!baseResult.class && !baseResult.style) {
    return overrideResult
  }

  const baseClasses = baseResult.class ? new Set(baseResult.class.split(' ')) : new Set<string>()
  if (overrideResult.class) {
    for (const cls of overrideResult.class.split(' ')) {
      baseClasses.add(cls)
    }
  }

  return {
    class: Array.from(baseClasses).filter(Boolean).join(' '),
    style: overrideResult.style || baseResult.style,
    attrs: { ...baseResult.attrs, ...overrideResult.attrs },
  }
}
