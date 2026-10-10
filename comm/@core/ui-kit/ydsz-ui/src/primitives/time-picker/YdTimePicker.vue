<!--
 * YdTimePicker 时间选择器：时/分/秒三列滚轮面板。
 *
 * 功能覆盖：
 * - 12h / 24h 显示格式（use12Hours）
 * - 可配置格式 HH:mm 或 HH:mm:ss（format）
 * - 时/分/秒步进（hourStep / minuteStep / secondStep）
 * - 禁用时段（disabledHours/Minutes/Seconds）
 * - AM/PM 时段选择
 * - 表单集成（v-model）
 * - 占位符、清除按钮、禁用状态
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\time-picker\YdTimePicker.vue
 * @author ydsz-team
 * @since 26.09.24
-->
<script lang="ts" setup>
import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Clock, X } from 'lucide-vue-next';

import type { TimeFormat } from './use-time-picker';

interface Props {
  /** 自定义类名 */
  class?: string;
  /** 是否显示清除按钮 */
  allowClear?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 禁用的小时值列表 */
  disabledHours?: () => ReadonlyArray<number>;
  /** 禁用的分钟值列表（依赖当前小时） */
  disabledMinutes?: (hour: number) => ReadonlyArray<number>;
  /** 禁用的秒值列表（依赖当前小时和分钟） */
  disabledSeconds?: (hour: number, minute: number) => ReadonlyArray<number>;
  /** 时间格式，默认 HH:mm:ss */
  format?: TimeFormat;
  /** 小时步长 */
  hourStep?: number;
  /** 分钟步长 */
  minuteStep?: number;
  /** v-model 绑定值（HH:mm 或 HH:mm:ss 字符串） */
  modelValue?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 秒步长 */
  secondStep?: number;
  /** 尺寸 */
  size?: 'large' | 'middle' | 'small';
  /** 是否使用 12 小时制 */
  use12Hours?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  class: undefined,
  allowClear: true,
  disabled: false,
  disabledHours: undefined,
  disabledMinutes: undefined,
  disabledSeconds: undefined,
  format: 'HH:mm:ss',
  hourStep: 1,
  minuteStep: 1,
  modelValue: undefined,
  placeholder: '选择时间',
  secondStep: 1,
  size: 'middle',
  use12Hours: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
  change: [value: string];
}>();

const isOpen = ref<boolean>(false);

/** 解析当前值 → { hour, minute, second, period } */
const parsedTime = computed(() => {
  const fallback = { hour: 0, minute: 0, second: 0 as number, period: 'AM' as 'AM' | 'PM' };
  if (!props.modelValue) return fallback;
  const match = props.modelValue.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return fallback;
  const h = Number.parseInt(match[1] ?? '0', 10);
  return {
    hour: props.use12Hours ? (h % 12 === 0 ? 12 : h % 12) : h,
    minute: Number.parseInt(match[2] ?? '0', 10),
    second: Number.parseInt(match[3] ?? '0', 10),
    period: (h >= 12 ? 'PM' : 'AM') as 'AM' | 'PM',
  };
});

/** 格式化小时显示 */
function formatHour(hour: number): string {
  if (props.use12Hours) return String(hour % 12 === 0 ? 12 : hour % 12).padStart(2, '0');
  return String(hour).padStart(2, '0');
}

/** 小时选项 */
const hourOptions = computed(() => {
  const max = props.use12Hours ? 12 : 23;
  const min = props.use12Hours ? 1 : 0;
  const disabled = props.disabledHours?.() ?? [];
  const step = props.hourStep ?? 1;
  const opts: Array<{ value: number; label: string; disabled: boolean }> = [];
  for (let h = min; h <= max; h += step) {
    opts.push({ value: h, label: String(h).padStart(2, '0'), disabled: disabled.includes(h) });
  }
  return opts;
});

/** 分钟选项 */
const minuteOptions = computed(() => {
  const step = props.minuteStep ?? 1;
  const disabledCurrentHour = parsedTime.value.hour;
  const disabled = props.disabledMinutes?.(disabledCurrentHour) ?? [];
  const opts: Array<{ value: number; label: string; disabled: boolean }> = [];
  for (let m = 0; m <= 59; m += step) {
    opts.push({ value: m, label: String(m).padStart(2, '0'), disabled: disabled.includes(m) });
  }
  return opts;
});

/** 秒选项 */
const secondOptions = computed(() => {
  const step = props.secondStep ?? 1;
  const disabled = props.disabledSeconds?.(parsedTime.value.hour, parsedTime.value.minute) ?? [];
  const opts: Array<{ value: number; label: string; disabled: boolean }> = [];
  for (let s = 0; s <= 59; s += step) {
    opts.push({ value: s, label: String(s).padStart(2, '0'), disabled: disabled.includes(s) });
  }
  return opts;
});

const showSeconds = computed(() => props.format === 'HH:mm:ss');

/** 组装时间字符串 */
function assembleTime(hour: number, minute: number, second: number): string {
  const parts = [formatHour(hour), String(minute).padStart(2, '0')];
  if (showSeconds.value) parts.push(String(second).padStart(2, '0'));
  return parts.join(':');
}

/** 转换 12h → 24h */
function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (!props.use12Hours) return hour12;
  return period === 'PM' ? (hour12 % 12) + 12 : hour12 % 12;
}

function emitChange(timeStr: string): void {
  emit('update:modelValue', timeStr);
  emit('change', timeStr);
}

function handleHourChange(hour: number): void {
  const current = parsedTime.value;
  const h24 = to24Hour(hour, current.period);
  emitChange(assembleTime(h24, current.minute, current.second));
}

function handleMinuteChange(minute: number): void {
  const current = parsedTime.value;
  emitChange(assembleTime(current.hour, minute, current.second));
}

function handleSecondChange(second: number): void {
  const current = parsedTime.value;
  emitChange(assembleTime(current.hour, current.minute, second));
}

function handlePeriodChange(period: 'AM' | 'PM'): void {
  const current = parsedTime.value;
  const h24 = to24Hour(current.hour, period);
  emitChange(assembleTime(h24, current.minute, current.second));
}

function togglePanel(): void {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function clearValue(event: MouseEvent): void {
  event.stopPropagation();
  emit('update:modelValue', undefined);
  emit('change', '');
}

/** 判断小时是否选中 */
function isHourSelected(hour: number): boolean {
  const pt = parsedTime.value;
  if (props.use12Hours) {
    return (pt.hour % 12 === 0 ? 12 : pt.hour % 12) === hour;
  }
  return pt.hour === hour;
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
          !props.modelValue && 'text-muted-foreground',
        )
      "
      :disabled="props.disabled"
      type="button"
      @click="togglePanel"
    >
      <span class="flex items-center gap-1.5">
        <Clock class="text-muted-foreground size-4" />
        <span>{{ props.modelValue || props.placeholder }}</span>
      </span>
      <span
        v-if="props.allowClear && props.modelValue"
        role="button"
        tabindex="0"
        aria-label="清除时间"
        class="text-muted-foreground hover:text-foreground"
        @click="clearValue"
        @keydown.enter.prevent="clearValue($event)"
      >
        <X class="size-3.5" />
      </span>
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
          :class="
            cn(
              'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
              isHourSelected(opt.value) && 'bg-primary text-primary-foreground font-semibold',
              opt.disabled && 'cursor-not-allowed opacity-30',
              !opt.disabled && !isHourSelected(opt.value) && 'hover:bg-muted',
            )
          "
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
          :class="
            cn(
              'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
              parsedTime.minute === opt.value && 'bg-primary text-primary-foreground font-semibold',
              opt.disabled && 'cursor-not-allowed opacity-30',
              !opt.disabled && parsedTime.minute !== opt.value && 'hover:bg-muted',
            )
          "
          role="option"
          @click="opt.disabled ? undefined : handleMinuteChange(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>

      <!-- 秒列（format=HH:mm:ss 时显示） -->
      <ul v-if="showSeconds" class="h-52 w-16 overflow-y-auto py-1" role="listbox" aria-label="秒">
        <li
          v-for="opt in secondOptions"
          :key="opt.value"
          :aria-selected="parsedTime.second === opt.value"
          :class="
            cn(
              'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
              parsedTime.second === opt.value && 'bg-primary text-primary-foreground font-semibold',
              opt.disabled && 'cursor-not-allowed opacity-30',
              !opt.disabled && parsedTime.second !== opt.value && 'hover:bg-muted',
            )
          "
          role="option"
          @click="opt.disabled ? undefined : handleSecondChange(opt.value)"
        >
          {{ opt.label }}
        </li>
      </ul>

      <!-- AM/PM 列（12 小时模式） -->
      <ul v-if="props.use12Hours" class="h-52 w-14 overflow-y-auto border-l py-1" role="listbox" aria-label="上午/下午">
        <li
          v-for="p in (['AM', 'PM'] as const)"
          :key="p"
          :aria-selected="parsedTime.period === p"
          :class="
            cn(
              'cursor-pointer px-3 py-1.5 text-center text-sm transition-colors',
              parsedTime.period === p && 'bg-primary text-primary-foreground font-semibold',
              parsedTime.period !== p && 'hover:bg-muted',
            )
          "
          role="option"
          @click="handlePeriodChange(p)"
        >
          {{ p }}
        </li>
      </ul>
    </div>
  </div>
</template>
