/**
 * ydsz-ui unplugin-vue-components Resolver —— 自动按需导入组件。
 *
 * 用法（vite.config.ts）:
 * ```ts
 * import Components from 'unplugin-vue-components/vite'
 * import { YdszUiResolver } from '@ydsz-core/ydsz-ui/resolver'
 *
 * export default defineConfig({
 *   plugins: [
 *     Components({ resolvers: [YdszUiResolver()] })
 *   ]
 * })
 * ```
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/resolver.ts
 * @author ydsz-team
 * @since 26.10.10
 */

import type { ComponentResolver } from 'unplugin-vue-components/types'
import type { Directive } from 'vue'

import { vRipple } from './directives/v-ripple'
import { vClickOutside } from './directives/v-click-outside'

import { YDSZ_UI_COMPONENT_NAMES } from './component-names'

export interface YdszUiResolverOptions {
  /**
   * 式样版本
   * @default 'default'
   */
  style?: 'default'
  /**
   * 指令名称前缀
   * @default 'v'
   */
  prefix?: string
  /**
   * 是否按需自动导入全局自定义指令（v-ripple、v-click-outside）
   * @default true
   */
  directives?: boolean
}

/** ydsz-ui 组件名称前缀 */
const COMPONENT_PREFIX = 'Yd'

/** 名册集合化，供 resolve 做 O(1) 命中判断 */
const COMPONENT_NAME_SET = new Set(YDSZ_UI_COMPONENT_NAMES)

/** 指令名称 → 指令对象的映射 */
const DIRECTIVE_MAP: Record<string, () => Directive> = {
  ripple: () => vRipple,
  clickoutside: () => vClickOutside,
}

/**
 * 把模板里出现的指令写法归一化到 DIRECTIVE_MAP 的键。
 *
 * <p>unplugin-vue-components 可能传入 'v-ripple'、'VRipple' 或裸名 'ripple'，
 * 只剥前缀会留下 '-ripple' 这类带分隔符的结果，因此统一去掉分隔符再小写。
 *
 * @param raw - 模板中的指令名
 * @param prefix - 指令前缀，默认 v
 * @returns 归一化后的查找键
 */
function normalizeDirectiveKey(raw: string, prefix: string): string {
  const lower = raw.toLowerCase()
  const body = lower.startsWith(prefix.toLowerCase()) ? lower.slice(prefix.length) : lower
  return body.replace(/[-_]/g, '')
}

export function YdszUiResolver(options: YdszUiResolverOptions = {}): ComponentResolver[] {
  const enableDirectives = options.directives !== false

  const resolvers: ComponentResolver[] = [
    {
      type: 'component',
      resolve: (componentName: string) => {
        // 名册外的 Yd 前缀名字必须返回 undefined，否则会生成指向不存在导出的 import。
        if (componentName.startsWith(COMPONENT_PREFIX) && COMPONENT_NAME_SET.has(componentName)) {
          return {
            from: '@ydsz-core/ydsz-ui',
            name: componentName,
          }
        }
        return undefined
      },
    },
  ]

  if (enableDirectives) {
    const prefix = options.prefix ?? 'v'
    resolvers.push({
      type: 'directive',
      resolve: (name: string) => {
        const found = DIRECTIVE_MAP[normalizeDirectiveKey(name, prefix)]
        if (found) {
          return found()
        }
        return undefined
      },
    })
  }

  return resolvers
}
