/**
 * @file ydzs-vue 总入口
 * @description YDSZ Headless UI —— 基于 radix-vue@1.9.17 内化的无头组件层。
 *              本包仅包含 ydsz-ui 60 个文件实际引用的组件族与工具函数，
 *              未引用的组件族（Calendar / Combobox / Toast 等）不纳入。
 * @author YDSZ Team
 * @license MIT (derived from radix-vue@1.9.17)
 * @since 26.09.17
 */

export * from './Accordion'
export * from './AlertDialog'
export * from './Avatar'
export * from './Checkbox'
export * from './Collapsible'
export * from './ContextMenu'
export * from './Dialog'
export * from './DropdownMenu'
export * from './HoverCard'
export * from './Label'
export * from './Menu'
export * from './NumberField'
export * from './Pagination'
export * from './PinInput'
export * from './Popover'
export * from './Progress'
export * from './RadioGroup'
export * from './ScrollArea'
export * from './Select'
export * from './Separator'
export * from './Slider'
export * from './Splitter'
export * from './Switch'
export * from './Tabs'
export * from './Toggle'
export * from './ToggleGroup'
export * from './Tooltip'
export * from './Tree'

// composables (ydsz 业务特化)
export { useControlledState } from './composables/use-controlled-state'
export type {
  ControlledStateHandle,
  UseControlledStateOptions,
} from './composables/use-controlled-state'

export { useDebouncedSearch } from './composables/use-debounced-search'
export type {
  UseDebouncedSearchHandle,
  UseDebouncedSearchOptions,
} from './composables/use-debounced-search'

export { useTenantAwareSelection } from './composables/use-tenant-aware'
export type {
  UseTenantAwareHandle,
  UseTenantAwareOptions,
} from './composables/use-tenant-aware'

// utilities
export { Primitive, Slot, type PrimitiveProps, type AsTag } from './Primitive'
export { VisuallyHidden, type VisuallyHiddenProps } from './VisuallyHidden'
export {
  useEmitAsProps,
  useForwardProps,
  useForwardPropsEmits,
  useForwardExpose,
  useId,
  useStateMachine,
  useBodyScrollLock,
  useDateFormatter,
  withDefault,
  createContext,
  type Formatter,
  type DateRange,
} from './shared'
