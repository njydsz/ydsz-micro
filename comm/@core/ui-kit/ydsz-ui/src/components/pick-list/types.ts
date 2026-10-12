/**
 * PickList（双栏穿梭列表）—— 业务组件层的 Props / Emits 类型定义。
 *
 * 基于现有 primitives/pick-list 的能力，以仿 PrimeVue 风格暴露更高层 API，
 * 降低业务方直接使用底层类型的心智负担。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\pick-list\types.ts
 * @author ydsz-team
 * @since 26.10.12
 */

/**
 * PickList 业务组件 props。
 *
 * 支持泛型 T 描述列表项结构，提供更严格的类型推导。
 */
export interface YdPickListProps<T extends Record<string, unknown>> {
  /** 源列表数据 */
  source?: T[]
  /** 目标列表数据 */
  target?: T[]
  /** 源列表标题 */
  sourceLabel?: string
  /** 目标列表标题 */
  targetLabel?: string
  /** 项显示字段或自定义取值函数 */
  itemLabel?: keyof T | ((item: T) => string)
  /** 是否启用拖拽排序 */
  dragdrop?: boolean
  /** 是否启用搜索过滤 */
  filter?: boolean
  /** 过滤字段（优先于全字段匹配） */
  filterBy?: string[]
  /** 自定义项渲染函数 */
  template?: (item: T) => string
}

/** 移动事件公共载荷 */
export interface PickListMoveEvent<T extends Record<string, unknown>> {
  /** 被移动的项 */
  items: T[]
}

/** PickList 组件 emits */
export interface PickListEmits<T extends Record<string, unknown>> {
  /** 选中项移到目标 */
  (e: 'move-to-target', event: PickListMoveEvent<T>): void
  /** 选中项移回来源 */
  (e: 'move-to-source', event: PickListMoveEvent<T>): void
  /** 全部移到目标 */
  (e: 'move-all-to-target', event: PickListMoveEvent<T>): void
  /** 全部移回来源 */
  (e: 'move-all-to-source', event: PickListMoveEvent<T>): void
}
