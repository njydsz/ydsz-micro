/**
 * 通用组合式函数（hooks）的统一导出入口。
 *
 * 汇集应用配置、最大化切换、主题设计令牌、鼠标悬停、前端分页、标签栏、
 * 水印等复用逻辑，供业务侧按需从 @ydsz/hooks 导入使用。
 *
 * @path comm\effects\hooks\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
export * from './use-app-config';
export * from './use-content-maximize';
export * from './use-design-tokens';
export * from './use-hover-toggle';
export * from './use-pagination';
export * from './use-refresh';
export * from './use-tabs';
export * from './use-watermark';

/**
 * @deprecated
 * 本 re-export 来自 `@ydsz-core/composables`，该包已废弃并整体迁移至
 * `@ydsz-core/ydsz-ui`。请使用 `@ydsz-core/ydsz-ui` 作为统一入口，
 * 或按需直接从原始包（如 `@ydsz-core/ydsz-vue`）导入，避免经由
 * 已废弃的 composables 中转造成理解成本。
 *
 * 迁移路径：
 * - 曾通过本行导出的 useCrossTabState / usePriorityValue /
 *   useOptimisticUpdate 等横向能力 → @ydsz-core/ydsz-ui
 * - useEmitAsProps / useForwardExpose / useForwardProps /
 *   useForwardPropsEmits → @ydsz-core/ydsz-vue
 */
export * from '@ydsz-core/composables';
