/**
 * ydsz-ui 全局自定义指令集合（基础设施层）
 *
 * 通过 unplugin-vue-components 按需自动导入：在 vite.config.ts 中配置 `YdszUiResolver()`
 * 后，模板中直接使用 v-ripple / v-click-outside，无需手动 import。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/directives/index.ts
 * @author ydsz-team
 * @since 26.10.10
 */

export { vRipple } from './v-ripple'
export { vClickOutside } from './v-click-outside'
export type { RippleOptions } from './v-ripple'
export type { ClickOutsideHandler } from './v-click-outside'
