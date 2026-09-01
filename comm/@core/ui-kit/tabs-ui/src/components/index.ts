/**
 * 两种标签栏实现的出口：Tabs（常规）与 TabsChrome（浏览器标签风格）。
 *
 * 两者 props 完全一致、可互换，由 TabsView 按 styleType 选择渲染哪一个；
 * 不合并成一个组件是因为两套风格的 DOM 结构与间距计算差异过大，
 * 合在一起会变成满屏条件分支。
 *
 * @path comm\@core\ui-kit\tabs-ui\src\components\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as TabsChrome } from './tabs-chrome/tabs.vue';
export { default as Tabs } from './tabs/tabs.vue';
