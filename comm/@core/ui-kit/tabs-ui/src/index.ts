/**
 * tabs-ui 的包出口：TabsView 组件、右侧工具按钮，以及右键菜单项的类型。
 *
 * IContextMenuItem 从 shadcn-ui 转出而非重新定义，
 * 是为了保证右键菜单的实现与项目里其它下拉菜单保持同一套数据结构。
 *
 * @path comm\@core\ui-kit\tabs-ui\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './components/widgets';
export { default as TabsView } from './tabs-view.vue';
export type { IContextMenuItem } from '@YDSZ-core/shadcn-ui';
