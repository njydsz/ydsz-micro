/**
 * 侧边栏挂件的出口：导出折叠按钮与固定按钮。
 *
 * 两者都以 v-model 与侧边栏的折叠 / 悬浮状态双向绑定，因此不直接依赖布局 store，
 * 便于在自定义布局中复用。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\widgets\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as SidebarCollapseButton } from './sidebar-collapse-button.vue';
export { default as SidebarFixedButton } from './sidebar-fixed-button.vue';

