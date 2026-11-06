/**
 * 日期选择状态与提交逻辑。
 *
 * <p>从 YdDatePicker.vue 抽离，控制单文件脚本行数（SFC-006）。
 * 覆盖单选 / 范围 / 多选三种模式的点击处理与提交。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\date-picker\use-date-selection.ts
 * @author ydsz-team
 * @since 26.11.06
 */
import type { DatePickerValue } from './types';

import { ref, type ComputedRef, type Ref } from 'vue';

import { formatByGrain } from './date-utils';

/** 选择提交事件 */
export interface DateSelectionEmit {
  (event: 'update:modelValue', value: DatePickerValue): void;
  (event: 'change', value: DatePickerValue): void;
}

/**
 * 日期选择状态组合式函数。
 *
 * @param modelValue - 受控值
 * @param options - 配置项
 * @returns 选择状态与点击处理函数
 */
export function useDateSelection(
  modelValue: Ref<DatePickerValue>,
  emit: DateSelectionEmit,
  options: {
    /** 是否范围模式 */
    isRange: ComputedRef<boolean>;
    /** 是否多选模式 */
    isMultiple: ComputedRef<boolean>;
    /** 基础粒度 */
    baseGrain: ComputedRef<'date' | 'month' | 'year'>;
    /** 弹层开关 */
    isOpen: Ref<boolean>;
    /** 多选已选集合 */
    multipleSelection: ComputedRef<string[]>;
  },
) {
  /** range 起始值 */
  const rangeStartValue = ref<string | undefined>(undefined);
  /** range 结束值 */
  const rangeEndValue = ref<string | undefined>(undefined);
  /** range 悬停预览 */
  const rangeHoverValue = ref<string | undefined>(undefined);

  /**
   * 同步已选范围到本地状态。
   *
   * @returns 无
   */
  function syncRangeFromModel(): void {
    if (options.isRange.value) {
      const tuple = modelValue.value as readonly [string, string] | undefined;
      if (tuple) {
        rangeStartValue.value = tuple[0];
        rangeEndValue.value = tuple[1];
      }
    }
  }

  /**
   * 值格式化（用于 range 提交）。
   *
   * @param start - 起始值
   * @param end - 结束值
   * @returns 规范化后的元组
   */
  function normalizeRange(start: string, end: string): [string, string] {
    return start <= end ? [start, end] : [end, start];
  }

  /**
   * 提交单选值。
   *
   * @param value - 值
   * @returns 无
   */
  function commitSingle(value: string): void {
    emit('update:modelValue', value as unknown as DatePickerValue);
    emit('change', value as unknown as DatePickerValue);
    options.isOpen.value = false;
  }

  /**
   * 提交范围值。
   *
   * @param start - 起始值
   * @param end - 结束值
   * @returns 无
   */
  function commitRange(start: string, end: string): void {
    const [lo, hi] = normalizeRange(start, end);
    const value: [string, string] = [lo, hi];
    rangeStartValue.value = lo;
    rangeEndValue.value = hi;
    rangeHoverValue.value = undefined;
    emit('update:modelValue', value as unknown as DatePickerValue);
    emit('change', value as unknown as DatePickerValue);
    options.isOpen.value = false;
  }

  /**
   * 通用选择处理（日/月/年视图共用）。
   *
   * @param key - 格式化后的值
   * @returns 无
   */
  function handleSelect(key: string): void {
    if (options.isMultiple.value) {
      const current = options.multipleSelection.value;
      const next = current.includes(key) ? current.filter((v) => v !== key) : [...current, key];
      emit('update:modelValue', next as unknown as DatePickerValue);
      emit('change', next as unknown as DatePickerValue);
      return;
    }

    if (!options.isRange.value) {
      commitSingle(key);
      return;
    }

    if (!rangeStartValue.value) {
      rangeStartValue.value = key;
      rangeEndValue.value = undefined;
      rangeHoverValue.value = undefined;
      return;
    }
    if (!rangeEndValue.value) {
      commitRange(rangeStartValue.value, key);
      return;
    }
    // 已有一组范围：开启新一轮
    rangeStartValue.value = key;
    rangeEndValue.value = undefined;
    rangeHoverValue.value = undefined;
  }

  /**
   * 日视图点击处理。
   *
   * @param date - 选中的日期对象
   * @returns 无
   */
  function handleDaySelect(date: Date): void {
    handleSelect(formatByGrain(date, options.baseGrain.value));
  }

  /**
   * 月份视图点击处理。
   *
   * @param date - 选中的日期对象
   * @returns 无
   */
  function handleMonthSelect(date: Date): void {
    handleSelect(formatByGrain(date, 'month'));
  }

  /**
   * 年份视图点击处理。
   *
   * @param date - 选中的日期对象
   * @returns 无
   */
  function handleYearSelect(date: Date): void {
    handleSelect(formatByGrain(date, 'year'));
  }

  /**
   * 季度视图点击处理。
   *
   * @param date - 选中的日期对象
   * @returns 无
   */
  function handleQuarterSelect(date: Date): void {
    const key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    commitSingle(key);
  }

  /**
   * 范围悬停预览。
   *
   * @param date - 悬停日期
   * @returns 无
   */
  function handleHover(date: Date): void {
    if (options.isRange.value && rangeStartValue.value && !rangeEndValue.value) {
      rangeHoverValue.value = formatByGrain(date, options.baseGrain.value);
    }
  }

  return {
    rangeStartValue,
    rangeEndValue,
    rangeHoverValue,
    syncRangeFromModel,
    handleDaySelect,
    handleMonthSelect,
    handleYearSelect,
    handleQuarterSelect,
    handleHover,
  };
}
