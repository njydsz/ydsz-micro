// cspell:words orderlist
/**
 * OrderList（单列拖拽排序）—— 公共类型定义。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\order-list\order-list-types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 排序项：任意对象，通过 optionLabel 映射 */
export interface OrderListItem {
  [key: string]: unknown;
}

/** OrderList 组件 props */
export interface OrderListProps {
  /** 自定义类名 */
  class?: unknown;
  /** 是否启用拖拽重排序 */
  dragdrop?: boolean;
  /** 是否显示搜索过滤 */
  filter?: boolean;
  /** v-model：排序列表 */
  modelValue?: OrderListItem[];
  /** 显示字段（默认遍历所有字段 join） */
  optionLabel?: string;
}

/**
 * OrderList 组件 emits。
 *
 * 所有事件载荷文案均通过 useComponentI18n 国际化处理。
 */
export interface OrderListEmits {
  /** v-model 更新 */
  (e: 'update:modelValue', value: OrderListItem[]): void;
  /** 拖拽重排序完成 */
  (e: 'reorder', event: { value: OrderListItem[]; fromIndex: number; toIndex: number }): void;
}
