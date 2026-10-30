/**
 * Vue 组合式函数统一导出入口，聚合所有 composable 能力。
 *
 * @path comm\@core\composables\src\index.ts
 * @author ydsz-team
 * @since 1.0.0
 *
 * @deprecated
 * 本包 composables 已整体迁移至 `@ydsz-core/ydsz-ui`，后续横向能力
 * （useCrossTabState、usePriorityValue、useOptimisticUpdate 等）请使用新入口。
 * 本文件仅保留向后兼容导出，存量业务可继续使用，新增需求请切换到
 * `@ydsz-core/ydsz-ui`。
 *
 * 迁移路径：
 * - useCrossTabState          → @ydsz-core/ydsz-ui
 * - useFormDraft              → @ydsz-core/ydsz-ui
 * - useIsMobile               → @ydsz-core/ydsz-ui
 * - useLayoutStyle            → @ydsz-core/ydsz-ui
 * - useNamespace              → @ydsz-core/ydsz-ui
 * - useOptimisticUpdate       → @ydsz-core/ydsz-ui
 * - usePriorityValue          → @ydsz-core/ydsz-ui
 * - useScrollLock             → @ydsz-core/ydsz-ui
 * - usePreferenceIo           → @ydsz-core/ydsz-ui
 * - useSimpleLocale           → @ydsz-core/ydsz-ui
 * - useSortable               → @ydsz-core/ydsz-ui
 * - useTableColumnPreference  → @ydsz-core/ydsz-ui
 * - useEmitAsProps            → @ydsz-core/ydsz-vue
 * - useForwardExpose          → @ydsz-core/ydsz-vue
 * - useForwardProps           → @ydsz-core/ydsz-vue
 * - useForwardPropsEmits      → @ydsz-core/ydsz-vue
 */
export * from './use-cross-tab-state';
export * from './use-form-draft';
export * from './use-is-mobile';
export * from './use-layout-style';
export * from './use-namespace';
export * from './use-optimistic-update';
export * from './use-priority-value';
export * from './use-scroll-lock';
export * from './use-preference-io';
export * from './use-simple-locale';
export * from './use-sortable';
export * from './use-table-column-preference';
export {
  useEmitAsProps,
  useForwardExpose,
  useForwardProps,
  useForwardPropsEmits,
} from '@ydsz-core/ydsz-vue';
