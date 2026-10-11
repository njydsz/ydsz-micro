/**
 * Range 日期联动禁用 —— 自动禁用不合规日期。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-range-link.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import type { Ref } from 'vue';

export interface UseRangeLinkOptions {
  /** 当前选中范围（[start, end]，可能只有 start） */
  modelValue: Ref<[Date | null, Date | null]>;
  /** 启用联动禁用（默认 true） */
  linked?: boolean;
  /** 最小间隔天数 */
  minSpan?: number;
  /** 最大间隔天数 */
  maxSpan?: number;
  /** 允许的 range 模式：'day' | 'week' | 'month' | 'quarter' | 'year' */
  rangeMode?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  /** 自定义禁用判断 */
  extraDisabled?: (date: Date, range: [Date | null, Date | null]) => boolean;
}

export function useRangeLink(options: UseRangeLinkOptions) {
  const { modelValue, linked = true, minSpan, maxSpan, rangeMode, extraDisabled } = options;

  /**
   * disabledDate 函数 —— 传给 YdRangePicker 使用
   */
  function linkedDisabledDate(date: Date): boolean {
    if (!linked) return extraDisabled?.(date, modelValue.value) ?? false;

    const [start, end] = modelValue.value;

    // 只选了 start 时：限制 end 的可选范围
    if (start && !end) {
      // minSpan: end 必须 >= start + minSpan days
      if (minSpan) {
        const minDate = new Date(start);
        minDate.setDate(minDate.getDate() + minSpan);
        minDate.setHours(0, 0, 0, 0);
        if (date < minDate) return true;
      }
      // maxSpan: end 必须 <= start + maxSpan days
      if (maxSpan) {
        const maxDate = new Date(start);
        maxDate.setDate(maxDate.getDate() + maxSpan);
        maxDate.setHours(23, 59, 59, 999);
        if (date > maxDate) return true;
      }
    }

    // rangeMode 约束：选中 start 后，只允许在同周期内选 end
    if (rangeMode && start && !end) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      const normalizedStart = new Date(start);
      normalizedStart.setHours(0, 0, 0, 0);

      switch (rangeMode) {
        case 'day': {
          // 只能选择同一天
          if (normalizedDate.getTime() !== normalizedStart.getTime()) return true;
          break;
        }
        case 'week': {
          // 只能在同一周内
          const dayOfWeek = normalizedStart.getDay();
          const startOfWeek = new Date(normalizedStart);
          startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          if (normalizedDate < startOfWeek || normalizedDate > endOfWeek) return true;
          break;
        }
        case 'month': {
          // 只能在同一月内
          if (
            normalizedDate.getMonth() !== normalizedStart.getMonth()
            || normalizedDate.getFullYear() !== normalizedStart.getFullYear()
          ) return true;
          break;
        }
        case 'quarter': {
          // 同一季度
          const getQuarter = (d: Date) => Math.floor(d.getMonth() / 3);
          if (
            getQuarter(normalizedDate) !== getQuarter(normalizedStart)
            || normalizedDate.getFullYear() !== normalizedStart.getFullYear()
          ) return true;
          break;
        }
        case 'year': {
          // 同一年
          if (normalizedDate.getFullYear() !== normalizedStart.getFullYear()) return true;
          break;
        }
      }
    }

    return extraDisabled?.(date, modelValue.value) ?? false;
  }

  /**
   * 自动完成 range（根据 rangeMode 自动设置 end）
   */
  function autoCompleteRange(start: Date): [Date, Date] | null {
    if (!rangeMode) return null;
    const end = new Date(start);
    switch (rangeMode) {
      case 'day':
        end.setDate(end.getDate() + 0);
        break;
      case 'week':
        end.setDate(end.getDate() + 6);
        break;
      case 'month':
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'quarter':
        end.setMonth(end.getMonth() + 3);
        end.setDate(0);
        break;
      case 'year':
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(0);
        break;
    }
    return [start, end];
  }

  return {
    linkedDisabledDate,
    autoCompleteRange,
  };
}
