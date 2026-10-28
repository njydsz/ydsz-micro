// cspell:words picklist
/**
 * PickList（双栏穿梭列表）—— 公共类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\pick-list\pick-list-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 穿梭项：任意对象，通过 optionLabel / optionValue 映射 */
export interface PickListItem {
  [key: string]: unknown;
}

/** PickList 组件 props */
export interface PickListProps {
  /** 自定义类名 */
  class?: unknown;
  /** 是否启用拖拽重排序 */
  dragdrop?: boolean;
  /** 是否显示搜索过滤 */
  filter?: boolean;
  /** 过滤字段（默认遍历所有字段） */
  filterBy?: string;
  /** v-model：[source, target] */
  modelValue?: [PickListItem[], PickListItem[]];
  /** 显示字段（默认遍历所有字段 join） */
  optionLabel?: string;
  /** value 字段（用于 trackBy） */
  optionValue?: string;
  /** 响应式布局（窄屏上下排列） */
  responsive?: boolean;
  /** 斑马纹 */
  striped?: boolean;
  /** 左侧面板自定义类名 */
  sourceClass?: unknown;
  /** 左侧标题 */
  sourceHeader?: string;
  /** 右侧面板自定义类名 */
  targetClass?: unknown;
  /** 右侧标题 */
  targetHeader?: string;
}

/**
 * PickList 组件 emits。
 *
 * 所有事件载荷文案均通过 useLocale 词典国际化处理。
 */
export interface PickListEmits {
  /** v-model 更新 */
  (e: 'update:modelValue', value: [PickListItem[], PickListItem[]]): void;
  /** 拖拽重排序完成（source 侧） */
  (e: 'reorder', event: { originalEvent: Event; value: PickListItem[]; fromIndex: number; toIndex: number }): void;
  /** 选中项移动到目标 */
  (e: 'move-to-target', event: { items: PickListItem[] }): void;
  /** 选中项移回来源 */
  (e: 'move-to-source', event: { items: PickListItem[] }): void;
  /** 全部移动到目标 */
  (e: 'move-all-to-target', event: { items: PickListItem[] }): void;
  /** 全部移回来源 */
  (e: 'move-all-to-source', event: { items: PickListItem[] }): void;
}
