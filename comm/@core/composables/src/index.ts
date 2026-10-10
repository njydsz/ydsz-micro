/**
 * Vue 组合式函数统一导出入口，聚合所有 composable 能力。
 *
 * @path comm\@core\composables\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @deprecated 本包 composables 已迁移收敛至 @ydsz-core/ydsz-ui，
 * 后续横向能力（useCrossTabState、usePriorityValue 等）请使用新入口。
 * 本文件仅保留向后兼容导出，存量业务可继续使用，新增需求请切到新入口。
 */
export * from './use-cross-tab-state';
export * from './use-form-draft';
export * from './use-is-mobile';
export * from './use-layout-style';
export * from './use-namespace';
export * from './use-optimistic-update';
export * from './use-priority-value';
export * from './use-scroll-lock';
export * from './use-simple-locale';
export * from './use-sortable';
export {
  useEmitAsProps,
  useForwardExpose,
  useForwardProps,
  useForwardPropsEmits,
} from '@ydsz-core/ydsz-vue';
