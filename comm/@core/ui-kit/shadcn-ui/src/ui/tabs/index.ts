/**
 * 标签页四件套的出口，并额外透出 radix-vue 的 TabsIndicator。
 *
 * Indicator 用于实现「滑块跟随」型标签栏；
 * 它依赖 radix 暴露的 CSS 变量，只有放在 YdTabsList 内部才有效。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tabs\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as YdTabs } from './YdTabs.vue';
export { default as YdTabsContent } from './YdTabsContent.vue';
export { default as YdTabsList } from './YdTabsList.vue';
export { default as YdTabsTrigger } from './YdTabsTrigger.vue';
export { TabsIndicator } from 'radix-vue';
