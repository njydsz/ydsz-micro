/**
 * 状态标签组件与其 cva 变体的出口。
 *
 * 变体一并导出，便于在表格单元格、时间轴等不便嵌套组件的位置
 * 直接用 badgeVariants 生成类名，保持配色与真实标签完全一致。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\badge\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './badge';

export { default as Badge } from './Badge.vue';
