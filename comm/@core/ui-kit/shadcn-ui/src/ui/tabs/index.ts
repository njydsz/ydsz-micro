/**
 * 标签页四件套的出口，并额外透出 radix-vue 的 TabsIndicator。
 *
 * Indicator 用于实现「滑块跟随」型标签栏；
 * 它依赖 radix 暴露的 CSS 变量，只有放在 TabsList 内部才有效。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\tabs\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as Tabs } from './Tabs.vue';
export { default as TabsContent } from './TabsContent.vue';
export { default as TabsList } from './TabsList.vue';
export { default as TabsTrigger } from './TabsTrigger.vue';
export { TabsIndicator } from 'radix-vue';
