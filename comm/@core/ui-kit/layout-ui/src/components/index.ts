/**
 * 布局组件的统一出口：导出 Content / Footer / Header / Sidebar / Tabbar。
 *
 * 五个区块彼此独立导出，由使用方按需组合，而不是提供一个大而全的 Layout 组件 ——
 * 不同应用的区块数量与排布顺序差异较大，固定组合反而需要一堆布尔开关去裁剪。
 * 各区块的显示与否统一用「负 margin 收起」而非 v-if 销毁，见下方组件说明。
 *
 * @path comm\@core\ui-kit\layout-ui\src\components\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export { default as LayoutContent } from './layout-content.vue';
export { default as LayoutFooter } from './layout-footer.vue';
export { default as LayoutHeader } from './layout-header.vue';
export { default as LayoutSidebar } from './layout-sidebar.vue';
export { default as LayoutTabbar } from './layout-tabbar.vue';

