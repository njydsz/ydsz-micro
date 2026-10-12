/**
 * Calendar 快捷选项 composable。
 *
 * 提供预设的日期快捷选择：today / yesterday / tomorrow / thisWeek / lastWeek / thisMonth / lastMonth。
 * 调用方可通过 shortcuts prop 传入 YdCalendar 组件。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\calendar\use-calendar-shortcuts.ts
 * @author ydsz-team
 * @since 26.09.24
 */

/**
 * 日历快捷选项定义。
 */
export interface CalendarShortcut {
  /** 展示标签（建议使用 i18n key 或已翻译文本） */
  readonly label: string;
  /** 返回对应的日期或日期范围 */
  readonly value: () => Date | readonly [Date, Date];
}

/**
 * 获取当天 00:00 的 Date 对象。
 *
 * @param date — 可选基准日期，默认为今天
 * @returns 基准日期的 00:00 副本
 *
 * @example
 * const today = startOfDay(); // 今天 00:00
 */
function startOfDay(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * 创建 useCalendarShortcuts composable。
 *
 * @param locale — 当前语言标签（如 'zh-CN'、'en-US'），用于生成本地化标签
 * @returns shortcuts 预设快捷选项数组
 *
 * @example
 * const { shortcuts } = useCalendarShortcuts('zh-CN');
 * // shortcuts 可直接传给 YdCalendar 的 shortcuts prop
 */
export function useCalendarShortcuts(locale: string = 'zh-CN'): {
  shortcuts: ReadonlyArray<CalendarShortcut>;
} {
  const CalendarShortcut = (label: string, value: () => Date | readonly [Date, Date]): CalendarShortcut => ({
    label,
    value,
  });

  const shortcuts: ReadonlyArray<CalendarShortcut> = [
    CalendarShortcut(locale.startsWith('en') ? 'Today' : '今天', () => startOfDay()),
    CalendarShortcut(locale.startsWith('en') ? 'Yesterday' : '昨天', () => {
      const d = startOfDay();
      d.setDate(d.getDate() - 1);
      return d;
    }),
    CalendarShortcut(locale.startsWith('en') ? 'Tomorrow' : '明天', () => {
      const d = startOfDay();
      d.setDate(d.getDate() + 1);
      return d;
    }),
    CalendarShortcut(locale.startsWith('en') ? 'This Week' : '本周', () => {
      const now = new Date();
      const day = now.getDay() === 0 ? 7 : now.getDay(); // 周一=1 ... 周日=7
      const monday = startOfDay(now);
      monday.setDate(monday.getDate() - (day - 1));
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      return [monday, sunday] as const;
    }),
    CalendarShortcut(locale.startsWith('en') ? 'Last Week' : '上周', () => {
      const now = new Date();
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const thisMonday = startOfDay(now);
      thisMonday.setDate(thisMonday.getDate() - (day - 1));
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastSunday.getDate() + 6);
      return [lastMonday, lastSunday] as const;
    }),
    CalendarShortcut(locale.startsWith('en') ? 'This Month' : '本月', () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return [first, last] as const;
    }),
    CalendarShortcut(locale.startsWith('en') ? 'Last Month' : '上月', () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return [first, last] as const;
    }),
  ];

  return { shortcuts };
}
