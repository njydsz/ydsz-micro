/**
 * ydsz-ui Nuxt 3 模块
 *
 * 用法（nuxt.config.ts）:
 * ```ts
 * export default defineNuxtConfig({
 *   modules: ['@ydsz-core/ydsz-ui/nuxt'],
 *   ydszUi: {
 *     autoRegister: true,
 *   },
 * })
 * ```
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\nuxt.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineNuxtModule, addPlugin, addComponent } from '@nuxt/kit'
import { name, version } from './package.json'

import { YDSZ_UI_COMPONENT_NAMES } from './component-names'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ModuleOptions {
  /** 是否自动注册所有 ydsz-ui 组件（默认 true） */
  autoRegister?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    compatibility: { nuxt: '^3.0.0' },
    configKey: 'ydszUi',
  },
  defaults: {
    autoRegister: true,
  },
  setup(options) {
    // 注册全局运行时插件（Ripple / ClickOutside 等指令）
    addPlugin({
      src: resolve(__dirname, 'runtime/use-directives.ts'),
      mode: 'client',
    })

    // 全量组件自动注册：名册来自 component-names.ts，与包根导出同源
    if (options.autoRegister) {
      for (const componentName of YDSZ_UI_COMPONENT_NAMES) {
        addComponent({
          export: componentName,
          filePath: '@ydsz-core/ydsz-ui',
          name: componentName,
        })
      }
    }
  },
})
