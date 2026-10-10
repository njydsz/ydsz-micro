/**
 * useTimePicker composable —— 管理时间选择状态（时/分/秒）。
 *
 * 提供解析、步进、禁用列生成等能力，供 YdTimePicker 组件消费。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\time-picker\use-time-picker.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/** 时间格式类型 */
export type TimeFormat = 'HH:mm' | 'HH:mm:ss';

/** 解析后的时间状态 */
export interface ParsedTime {
  /** 小时 (0-23) */
  readonly hour: number;
  /** 分钟 (0-59) */
  readonly minute: number;
  /** 秒 (0-59) */
  readonly second: number;
  /** 时段 (AM/PM)，仅 12 小时制时有效 */
  readonly period: 'AM' | 'PM';
}

/** 时间选项条目 */
export interface TimeOption {
  /** 选项值 */
  readonly value: number;
  /** 展示标签 */
  readonly label: string;
  /** 是否禁用 */
  readonly disabled: boolean;
}

/** useTimePicker Options */
export interface UseTimePickerOptions {
  /** 受控值（HH:mm 或 HH:mm:ss 字符串） */
  modelValue?: string;
  /** 时间格式 */
  format?: TimeFormat;
  /** 是否 12 小时制 */
  use12Hours?: boolean;
  /** 小时步长 */
  hourStep?: number;
  /** 分钟步长 */
  minuteStep?: number;
  /** 秒步长 */
  secondStep?: number;
  /** 禁用的小时列表工厂 */
  disabledHours?: () => ReadonlyArray<number>;
  /** 禁用的分钟列表工厂 */
  disabledMinutes?: (hour: number) => ReadonlyArray<number>;
  /** 禁用的秒列表工厂 */
  disabledSeconds?: (hour: number, minute: number) => ReadonlyArray<number>;
}

/** useTimePicker Return */
export interface UseTimePickerReturn {
  /** 解析后的当前时间 */
  readonly parsedTime: ParsedTime;
  /** 小时选项列表 */
  readonly hourOptions: ReadonlyArray<TimeOption>;
  /** 分钟选项列表 */
  readonly minuteOptions: ReadonlyArray<TimeOption>;
  /** 秒选项列表 */
  readonly secondOptions: ReadonlyArray<TimeOption>;
  /** 格式化小时显示（12h 模式下转换） */
  readonly formatHour: (hour: number) => string;
  /** 是否显示秒列 */
  readonly showSeconds: boolean;
  /** 设置小时 */
  setHour: (hour: number) => string;
  /** 设置分钟 */
  setMinute: (minute: number) => string;
  /** 设置秒 */
  setSecond: (second: number) => string;
  /** 设置时段 AM/PM */
  setPeriod: (period: 'AM' | 'PM') => string;
}

/**
 * useTimePicker composable。
 *
 * @param options — 配置选项
 * @return 时间控制方法与选项数据
 *
 * @example
 * const { parsedTime, hourOptions, setHour } = useTimePicker({
 *   modelValue: '09:30:00',
 *   format: 'HH:mm:ss',
 *   use12Hours: false,
 * });
 */
export function useTimePicker(options: UseTimePickerOptions = {}): UseTimePickerReturn {
  const {
    modelValue,
    format = 'HH:mm:ss',
    use12Hours = false,
    hourStep = 1,
    minuteStep = 1,
    secondStep = 1,
    disabledHours,
    disabledMinutes,
    disabledSeconds,
  } = options;

  const showSeconds = format === 'HH:mm:ss';

  /**
   * 解析时间字符串为结构对象。
   *
   * @param value — HH:mm 或 HH:mm:ss 格式字符串
   * @returns 解析后的时间状态
   */
  function parse(value: string | undefined): ParsedTime {
    const fallback: ParsedTime = { hour: 0, minute: 0, second: 0, period: 'AM' };
    if (!value) return fallback;
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
    if (!match) return fallback;
    return {
      hour: Number.parseInt(match[1] ?? '0', 10),
      minute: Number.parseInt(match[2] ?? '0', 10),
      second: Number.parseInt(match[3] ?? '0', 10),
      period: (match[4]?.toUpperCase() as 'AM' | 'PM') ?? 'AM',
    };
  }

  const parsedTime = parse(modelValue);

  /**
   * 格式化小时显示（12h 转换）。
   *
   * @param hour — 24 小时制小时数
   * @returns 格式化后的显示字符串
   */
  function formatHour(hour: number): string {
    if (use12Hours) return String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, '0');
    return String(hour).padStart(2, '0');
  }

  /**
   * 生成时间选项列表。
   *
   * @param max — 最大值
   * @param step — 步长
   * @param isDisabled — 是否禁用的判定函数
   * @returns 选项列表
   */
  function buildOptions(max: number, step: number, isDisabled: (v: number) => boolean): TimeOption[] {
    const opts: TimeOption[] = [];
    for (let v = 0; v <= max; v += step) {
      opts.push({ value: v, label: String(v).padStart(2, '0'), disabled: isDisabled(v) });
    }
    return opts;
  }

  const maxHour = use12Hours ? 12 : 23;
  const minHour = use12Hours ? 1 : 0;
  // 构建小时选项时需考虑 12 小时制的 1-12 范围
  const hourOptions: TimeOption[] = (() => {
    const disabled = disabledHours?.() ?? [];
    const opts: TimeOption[] = [];
    for (let h = minHour; h <= maxHour; h += hourStep) {
      opts.push({ value: h, label: String(h).padStart(2, '0'), disabled: disabled.includes(h) });
    }
    return opts;
  })();

  const minuteOptions = buildOptions(59, minuteStep, (m) =>
    (disabledMinutes?.(parsedTime.hour) ?? []).includes(m),
  );

  const secondOptions = buildOptions(59, secondStep, (s) =>
    (disabledSeconds?.(parsedTime.hour, parsedTime.minute) ?? []).includes(s),
  );

  /**
   * 组装并返回时间字符串。
   */
  function assembleTime(hour: number, minute: number, second: number): string {
    const parts = [formatHour(hour), String(minute).padStart(2, '0')];
    if (showSeconds) parts.push(String(second).padStart(2, '0'));
    return parts.join(':');
  }

  /**
   * 将 12 小时制的小时转换为 24 小时制。
   */
  function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
    if (!use12Hours) return hour12;
    return period === 'PM' ? (hour12 % 12) + 12 : hour12 % 12;
  }

  function setHour(hour: number): string {
    const h24 = to24Hour(hour, parsedTime.period);
    return assembleTime(h24, parsedTime.minute, parsedTime.second);
  }

  function setMinute(minute: number): string {
    return assembleTime(parsedTime.hour, minute, parsedTime.second);
  }

  function setSecond(second: number): string {
    return assembleTime(parsedTime.hour, parsedTime.minute, second);
  }

  function setPeriod(period: 'AM' | 'PM'): string {
    const h24 = to24Hour(parsedTime.hour, period);
    return assembleTime(h24, parsedTime.minute, parsedTime.second);
  }

  return {
    parsedTime,
    hourOptions,
    minuteOptions,
    secondOptions,
    formatHour,
    showSeconds,
    setHour,
    setMinute,
    setSecond,
    setPeriod,
  };
}
