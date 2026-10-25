/**
 * Calendar 组件 barrel。
 *
 * @author ydsz-ai
 * @since 1.0.0
 */
export { default as ydCalendar } from './calendar.vue';
export type { CalendarProps } from './calendar-types';

// merged from pre-refactor ui/ + primitives/ barrels
export { default as YdCalendar } from './YdCalendar.vue';
export type { CalendarShortcut } from './use-calendar-shortcuts';
export { useCalendarShortcuts } from './use-calendar-shortcuts';
