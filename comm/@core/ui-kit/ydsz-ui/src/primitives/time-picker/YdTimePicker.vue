<!--
 * TimePicker 时间选择器：时/分/秒三列滚轮或步进输入。
 *
 * 功能覆盖：
 * - 12h / 24h 显示格式（use12Hours）
 * - 时/分/秒步进（hourStep / minuteStep / secondStep）
 * - 禁用时段（disabledHours/Minutes/Seconds）
 * - 附加值（"suffix" 如 "AM/PM" 选择）
 * - 表单集成（v-model:value）
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\time-picker\YdTimePicker.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup">
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Clock } from 'lucide-vue-next';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否显示清除按钮 */
  allowClear?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 禁用的小时列表 */
  disabledHours?: () => number[];
  /** 禁用的分钟列表 */
  disabledMinutes?: (hour: number) => number[];
  /** 禁用的秒列表 */
  disabledSeconds?: (hour: number, minute: number) => number[];
  /** 小时步进 */
  hourStep?: number;
  /** 分钟步进 */
  minuteStep?: number;
  /** 占位符 */
  placeholder?: string;
  /** 秒步进 */
  secondStep?: number;
  /** 尺寸 */
  size?: 'large' | 'middle' | 'small';
  /** 选中值（HH:mm:ss 字符串，受控） */
  value?: string;
  /** 是否使用 12 小时制 */
  use12Hours?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: true,
  disabled: false,
  disabledHours: undefined,
  disabledMinutes: undefined,
  disabledSeconds: undefined,
  hourStep: 1,
  minuteStep: 1,
  placeholder: '选择时间',
  secondStep: 1,
  use12Hours: false,
});

const emit = defineEmits<{
  change: [timeString: string];
  'update:value': [timeString: string];
}>();

const isOpen = ref(false);

/** 解析当前值 → { hour, minute, second, period } */
const parsedTime = computed(() => {
  const fallback = { hour: 0, minute: 0, period: 'AM' as 'AM' | 'PM', second: 0 };
  if (!props.value) return fallback;
  const match = props.value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return fallback;
  return {
    hour: Number.parseInt(match[1] ?? '0', 10),
    minute: Number.parseInt(match[2] ?? '0', 10),
    period: (match[4]?.toUpperCase() as 'AM' | 'PM') ?? 'AM',
    second: Number.parseInt(match[3] ?? '0', 10),
  };
});

const hourOptions = computed(() => {
  const max = props.use12Hours ? 12 : 23;
  const min = props.use12Hours ? 1 : 0;
  const disabled = props.disabledHours?.() ?? [];
  const step = props.hourStep ?? 1;

  return Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => {
    const hour = min + i * step;
    return {
      disabled: disabled.includes(hour),
      label: String(hour).padStart(2, '0'),
      value: hour,
    };
  });
});

const minuteOptions = computed(() => {
  const step = props.minuteStep ?? 1;
  const disabledCurrentHour = parsedTime.value.hour;
  const disabled = props.disabledMinutes?.(disabledCurrentHour) ?? [];

  return Array.from({ length: Math.floor(59 / step) + 1 }, (_, i) => {
    const minute = i * step;
    return {
      disabled: disabled.includes(minute),
      label: String(minute).padStart(2, '0'),
      value: minute,
    };
  });
});

const secondOptions = computed(() => {
  const step = props.secondStep ?? 1;
  const disabled = props.disabledSeconds?.(parsedTime.value.hour, parsedTime.value.minute) ?? [];

  return Array.from({ length: Math.floor(59 / step) + 1 }, (_, i) => {
    const second = i * step;
    return {
      disabled: disabled.includes(second),
      label: String(second).padStart(2, '0'),
      value: second,
    };
  });
});

function formatHour(hour: number): string {
  if (props.use12Hours) return String(hour % 12 === 0 ? 12 : (hour % 12)).padStart(2, '0');
  return String(hour).padStart(2, '0');
}

function handleHourChange(hour: number): void {
  const current = parsedTime.value;
  const newHour = props.use12Hours
    ? current.period === 'PM' ? (hour % 12) + 12 : hour % 12
    : hour;
  emitChange(newHour, current.minute, current.second);
}

function handleMinuteChange(minute: number): void {
  const current = parsedTime.value;
  emitChange(current.hour, minute, current.second);
}

function handleSecondChange(second: number): void {
  const current = parsedTime.value;
  emitChange(current.hour, current.minute, second);
}

function handlePeriodChange(period: 'AM' | 'PM'): void {
  const current = parsedTime.value;
  const h = period === 'PM' ? (current.hour % 12) + 12 : current.hour % 12;
  emitChange(h, current.minute, current.second);
}

function emitChange(hour: number, minute: number, second: number): void {
  const formatted = `${formatHour(hour)}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  emit('update:value', formatted);
  emit('change', formatted);
}

function togglePanel(): void {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function clearValue(event: MouseEvent): void {
  event.stopPropagation();
  emit('update:value', '');
  emit('change', '');
}

/** 判断小时是否选中（模板中提取的复杂表达式） */
function isHourSelected(hour: number): boolean {
  if (parsedTime.value.hour === hour) return true;
  if (props.use12Hours) return (parsedTime.value.hour % 12 === 0 ? 12 : parsedTime.value.hour % 12) === hour;
  return false;
}

/** 小时选项样式类（模板中提取的复杂表达式） */
function getHourClass(opt: { disabled: boolean; value: number }): string {
  return cn(
    'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
    parsedTime.value.hour === opt.value && 'bg-primary text-primary-foreground font-semibold',
    opt.disabled && 'cursor-not-allowed opacity-30',
    !opt.disabled && parsedTime.value.hour !== opt.value && 'hover:bg-muted',
  );
}

/** 分钟选项样式类 */
function getMinuteClass(opt: { disabled: boolean; value: number }): string {
  return cn(
    'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
    parsedTime.value.minute === opt.value && 'bg-primary text-primary-foreground font-semibold',
    opt.disabled && 'cursor-not-allowed opacity-30',
    !opt.disabled && parsedTime.value.minute !== opt.value && 'hover:bg-muted',
  );
}

/** 秒选项样式类 */
function getSecondClass(opt: { disabled: boolean; value: number }): string {
  return cn(
    'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
    parsedTime.value.second === opt.value && 'bg-primary text-primary-foreground font-semibold',
    opt.disabled && 'cursor-not-allowed opacity-30',
    !opt.disabled && parsedTime.value.second !== opt.value && 'hover:bg-muted',
  );
}

/** 时段列样式类 */
function getPeriodClass(period: string): string {
  return cn(
    'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
    parsedTime.value.period === period && 'bg-primary text-primary-foreground font-semibold',
    parsedTime.value.period !== period && 'hover:bg-muted',
  );
}

const sizeClass: Record<string, string> = {
  large: 'h-10 px-3',
  middle: 'h-9 px-3',
  small: 'h-8 px-2 text-sm',
};
</script>

<template>
  <div :class="cn('relative', props.class)">
    <!-- 触发器 -->
    <button
      :aria-expanded="isOpen"
      :aria-label="'时间选择器'"
      :class="
        cn(
          'flex w-full items-center justify-between gap-2 rounded-md border transition-colors',
          sizeClass[props.size ?? 'middle'],
          isOpen ? 'border-primary ring-2 ring-ring' : 'hover:border-muted-foreground/50',
          !props.value && 'text-muted-foreground',
        )
      "
      :disabled="props.disabled"
      type="button"
      @click="togglePanel"
    >
      <span class="flex items-center gap-1.5">
        <Clock class="text-muted-foreground size-4" />
        <span>{{ props.value || props.placeholder }}</span>
      </span>
      <button
        v-if="props.allowClear && props.value"
        type="button"
        class="text-muted-foreground hover:text-foreground"
        aria-label="清除时间"
        @click="clearValue"
      >
        ✕
      </button>
    </button>

    <!-- 面板 -->
    <div
      v-if="isOpen"
      class="bg-background absolute left-0 top-full z-50 mt-1 flex rounded-lg border shadow-lg"
      role="listbox"
      @keydown.escape="isOpen = false"
    >
      <!-- 小时列 -->
      <ul class="h-52 w-16 overflow-y-auto border-r py-1" role="listbox" aria-label="小时">
        <li
          v-for="opt in hourOptions"
          :key="opt.value"
          :aria-selected="isHourSelected(opt.value)"
          :class="getHourClass(opt)"
          role="option"
          @click="opt.disabled ? undefined : handleHourChange(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>

      <!-- 分钟列 -->
      <ul class="h-52 w-16 overflow-y-auto border-r py-1" role="listbox" aria-label="分钟">
        <li
          v-for="opt in minuteOptions"
          :key="opt.value"
          :aria-selected="parsedTime.minute === opt.value"
          :class="getMinuteClass(opt)"
          role="option"
          @click="opt.disabled ? undefined : handleMinuteChange(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>

      <!-- 秒列 -->
      <ul class="h-52 w-16 overflow-y-auto py-1" role="listbox" aria-label="秒">
        <li
          v-for="opt in secondOptions"
          :key="opt.value"
          :aria-selected="parsedTime.second === opt.value"
          :class="getSecondClass(opt)"
          role="option"
          @click="opt.disabled ? undefined : handleSecondChange(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>

      <!-- AM/PM 列（12 小时模式） -->
      <ul v-if="props.use12Hours" class="h-52 w-14 overflow-y-auto border-l py-1" role="listbox" aria-label="上午/下午">
        <li
          v-for="p in ['AM', 'PM'] as const"
          :key="p"
          :aria-selected="parsedTime.period === p"
          :class="getPeriodClass(p)"
          role="option"
          @click="handlePeriodChange(p)"
        >
          {{ p }}
        </li>
      </ul>
    </div>
  </div>
</template>
