/**
 * use-select-headless：纯逻辑层，管理 YdSelectBase 的选择模式、字段解析与虚拟滚动联动。
 *
 * 设计目标：
 *  - 所有业务逻辑（字段解析、阈值判断、单/多选切换、滚动定位）从 SFC 中抽离；
 *  - 不持有任何样式 class 与 DOM 模板，完全可独立测试；
 *  - 上层 @see YdVSelect（styled）消费此 composable 并注入样式 class。
 *
 * 与 styled 组件的边界：
 *  - Headless 计算 "应该显示什么"、"当前选中是什么"、"虚拟滚动跳到哪"；
 *  - Styled 组件决定 "如何用 CSS 渲染" 与 "用户如何点击"。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\headless\use-select-headless.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, type MaybeRefOrGetter } from 'vue';

/**
 * Headless YdSelectBase 的配置项。
 */
export interface UseSelectHeadlessOptions<T extends Record<string, unknown>> {
  /** 选项数据源（响应式引用或 getter） */
  items: MaybeRefOrGetter<T[]>;
  /** 是否多选，默认 false */
  multiple?: MaybeRefOrGetter<boolean>;
  /** 超过此阈值启用虚拟滚动（项数），默认 100 */
  virtualThreshold?: MaybeRefOrGetter<number>;
  /** 从 item 中提取值的 accessor */
  getValue: (item: T) => string | number;
  /** 从 item 中提取 label 的 accessor */
  getLabel: (item: T) => string;
  /** 从 item 中提取唯一 key 的 accessor */
  getKey: (item: T, index: number) => string | number;
}

/**
 * Headless YdSelectBase 返回的句柄。
 */
export interface SelectHeadlessHandle<T extends Record<string, unknown>> {
  /** 规范化后的 items 数组（已处理响应式解包） */
  resolvedItems: MaybeRefOrGetter<T[]>;
  /** 是否启用虚拟滚动 */
  isVirtualEnabled: MaybeRefOrGetter<boolean>;
  /** 根据 value 找到对应 item 的 label（单选显示文本） */
  getLabelByValue: (value: string | number | undefined) => string;
  /** 切换某项的选中态（多选时追加/移除，单选时直接覆盖） */
  toggleItem: (
    currentValue: (string | number)[] | string | number | undefined,
    itemValue: string | number,
    multiple: boolean,
  ) => (string | number)[] | string | number | undefined;
  /** 执行清除后的值 */
  clearValue: (multiple: boolean) => (string | number)[] | undefined;
  /** 判断某项是否选中 */
  isSelected: (
    currentValue: (string | number)[] | string | number | undefined,
    itemValue: string | number,
    multiple: boolean,
  ) => boolean;
}

/**
 * 解包 MaybeRefOrGetter：统一返回原始值（在响应式上下文外也能获取）。
 * 兼容三种传入形式：
 *  - Ref / Reactive：返回 .value
 *  - Getter 函数：调用后返回
 *  - 字面量（plain value）：直接返回原值
 *
 * @param ref - 响应式引用、getter 或字面量
 * @return 当前值
 */
function unwrap<T>(ref: MaybeRefOrGetter<T>): T {
  if (typeof ref === 'function') {
    return (ref as () => T)();
  }
  // 有 .value 属性且不是函数，按 Ref 解包
  const candidate = ref as unknown;
  if (
    candidate !== null &&
    candidate !== undefined &&
    typeof candidate === 'object' &&
    'value' in (candidate as Record<string, unknown>)
  ) {
    return (candidate as { value: T }).value;
  }
  // 字面量（plain value）
  return ref as T;
}

/**
 * useSelectHeadless —— YdSelectBase 纯逻辑管理：字段解析、选择模式、虚拟阈值判断。
 *
 * @param options - 配置项
 * @return 逻辑句柄
 *
 * @example
 * ```ts
 * const items = ref([{ id: '1', name: 'A' }]);
 * const logic = useSelectHeadless({
 *   items,
 *   getValue: (i) => i.id,
 *   getLabel: (i) => i.name,
 *   getKey: (i) => i.id,
 * });
 * ```
 *
 * @since 1.0.0
 */
export function useSelectHeadless<T extends Record<string, unknown>>(
  options: UseSelectHeadlessOptions<T>,
): SelectHeadlessHandle<T> {
  const {
    items,
    virtualThreshold = 100,
    getValue,
    getLabel,
    getKey,
  } = options;

  /** 规范化后的 items（模板中可直接使用 v-for） */
  const resolvedItems = computed(() => unwrap(items));

  /** 是否启用虚拟滚动 */
  const isVirtualEnabled = computed(() => {
    const threshold = unwrap(virtualThreshold);
    return resolvedItems.value.length >= threshold;
  });

  /**
   * 根据 value 从 items 中查找 label。
   *
   * @param value - 目标 value
   * @return label 或空字符串
   */
  function getLabelByValue(value: string | number | undefined): string {
    if (value === undefined || value === null) return '';
    const found = resolvedItems.value.find((item) => getValue(item) === value);
    if (!found) return '';
    return String(getLabel(found));
  }

  /**
   * 切换选中态：多选追加/移除，单选直接覆盖。
   *
   * @param currentValue - 当前 v-model 值
   * @param itemValue - 被点击项的 value
   * @param multiple - 是否多选
   * @return 新的 v-model 值
   */
  function toggleItem(
    currentValue: (string | number)[] | string | number | undefined,
    itemValue: string | number,
    multiple: boolean,
  ): (string | number)[] | string | number | undefined {
    if (multiple) {
      const arr = Array.isArray(currentValue) ? [...currentValue] : [];
      const idx = arr.indexOf(itemValue);
      if (idx >= 0) {
        arr.splice(idx, 1);
      } else {
        arr.push(itemValue);
      }
      return arr;
    }
    // 单选：再次点击相同 value 视为取消
    return currentValue === itemValue ? undefined : itemValue;
  }

  /**
   * 清除后的值（多选返回空数组，单选返回 undefined）。
   *
   * @param multiple - 是否多选
   * @return 清空后的值
   */
  function clearValue(
    multiple: boolean,
  ): (string | number)[] | undefined {
    return multiple ? [] : undefined;
  }

  /**
   * 判断某项是否处于选中状态。
   *
   * @param currentValue - 当前 v-model 值
   * @param itemValue - 被判断项的 value
   * @param multiple - 是否多选
   * @return 是否选中
   */
  function isSelected(
    currentValue: (string | number)[] | string | number | undefined,
    itemValue: string | number,
    multiple: boolean,
  ): boolean {
    if (currentValue === undefined || currentValue === null) return false;
    if (multiple) {
      return Array.isArray(currentValue) && currentValue.includes(itemValue);
    }
    return currentValue === itemValue;
  }

  return {
    clearValue,
    getLabelByValue,
    getKey,
    isSelected,
    isVirtualEnabled,
    resolvedItems,
    toggleItem,
  };
}
