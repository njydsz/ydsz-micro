<!--
 * 可视化 Cron 表达式构建器组件
 *
 * <p>v-model 双向绑定 cron 字符串（6 位标准表达式，格式：秒 分 时 日 月 周）。
 * 提供预设队列 + 5 个维度 Tab 可视化编辑 + 预览区（含中文解释与接下来 5 次触发时间），
 * 并可在可视化与纯文本模式间切换。
 *
 * @path apps\cronjob-web\src\components\cron-builder\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup name="CronBuilder">
import {
  YdButton,
  YdCheckbox,
  YdInput,
  YdInputNumber,
  YdLabel,
  YdRadioGroup,
  YdRadioGroupItem,
  YdSelect,
  YdSelectContent,
  YdSelectItem,
  YdSelectTrigger,
  YdTabs,
  YdTabsContent,
  YdTabsList,
  YdTabsTrigger,
} from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { createLogger } from '@ydsz-core/shared/utils';
import cronstrue from 'cronstrue/i18n';
import dayjs from 'dayjs';

const logger = createLogger('cron-builder');

/* ------------------------------------------------------------------ */
/* Props / Emit                                                         */
/* ------------------------------------------------------------------ */

const props = withDefaults(
  defineProps<{
    /** v-model:cron 字符串 */
    modelValue?: string;
    /** 是否禁用整个构建器 */
    disabled?: boolean;
    /** 是否展示预设按钮区 */
    showPresets?: boolean;
    /** 展示模式：'visual' | 'text' | undefined（可切换） */
    mode?: 'visual' | 'text';
  }>(),
  {
    modelValue: '* * * * *',
    disabled: false,
    showPresets: true,
    mode: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t, locale } = useI18n();

/* ------------------------------------------------------------------ */
/* 类型定义                                                              */
/* ------------------------------------------------------------------ */

/** 单选选项类型 */
interface RadioOption {
  label: string;
  value: number;
}

/* ------------------------------------------------------------------ */
/* 内部状态                                                              */
/* ------------------------------------------------------------------ */

/** 当前使用的模式 */
const currentMode = ref<'visual' | 'text'>(props.mode ?? 'visual');

/** 通用时间部分状态 */
interface SimplePartState {
  /** every | everyN | specific | range | interval */
  mode: string;
  everyN?: number;
  specific: number[];
  rangeFrom?: number;
  rangeTo?: number;
  intervalFrom?: number;
  intervalStep?: number;
}

interface DayPartState {
  /** every | everyN | byWeekday | lastDay | workday | nearestWorkday */
  dayMode: string;
  everyN?: number;
  specific: number[];
  workdayDay?: number;
  nearestWorkdayDay?: number;
}

interface WeekPartState {
  /** every | specific | ordinal | last | range */
  mode: string;
  specific: number[];
  ordinalDay?: string;
  ordinalWeek?: string;
  lastDay?: string;
  rangeFrom?: number;
  rangeTo?: number;
}

interface CronState {
  minute: SimplePartState;
  hour: SimplePartState;
  day: DayPartState;
  month: SimplePartState;
  week: WeekPartState;
}

function defaultCronState(): CronState {
  return {
    minute: { mode: 'every', specific: [], everyN: 1, intervalFrom: 0, intervalStep: 1 },
    hour: { mode: 'every', specific: [], intervalFrom: 0, intervalStep: 1 },
    day: { dayMode: 'every', everyN: 1, specific: [], workdayDay: 1, nearestWorkdayDay: 15 },
    month: { mode: 'every', specific: [], intervalFrom: 1, intervalStep: 1 },
    week: { mode: 'every', specific: [], ordinalDay: '1', ordinalWeek: '1', lastDay: '5', rangeFrom: 1, rangeTo: 5 },
  };
}

const state = reactive<CronState>(defaultCronState());

/* ------------------------------------------------------------------ */
/* Tab 选项                                                             */
/* ------------------------------------------------------------------ */

type TabKey = 'minute' | 'hour' | 'day' | 'month' | 'week';
const activeTab = ref<TabKey>('minute');

/* ------------------------------------------------------------------ */
/* 预设                                                                 */
/* ------------------------------------------------------------------ */

interface CronPreset {
  labelKey: string;
  cron: string;
}

const PRESETS: CronPreset[] = [
  { labelKey: 'cronBuilder.presetEveryMinute', cron: '0 * * * * *' },
  { labelKey: 'cronBuilder.presetEvery5Minutes', cron: '0 */5 * * * *' },
  { labelKey: 'cronBuilder.presetEvery15Minutes', cron: '0 */15 * * * *' },
  { labelKey: 'cronBuilder.presetEvery30Minutes', cron: '0 */30 * * * *' },
  { labelKey: 'cronBuilder.presetEveryHour', cron: '0 0 * * * *' },
  { labelKey: 'cronBuilder.presetMidnight', cron: '0 0 0 * * *' },
  { labelKey: 'cronBuilder.presetEveryDay9AM', cron: '0 0 9 * * *' },
  { labelKey: 'cronBuilder.presetWeekday9AM', cron: '0 0 9 * * 1-5' },
  { labelKey: 'cronBuilder.presetEveryMonday', cron: '0 0 0 * * 1' },
  { labelKey: 'cronBuilder.presetEverySunday', cron: '0 0 0 * * 0' },
  { labelKey: 'cronBuilder.presetFirstOfMonth', cron: '0 0 0 1 * *' },
  { labelKey: 'cronBuilder.presetLastDayOfMonth', cron: '0 0 0 L * *' },
];

function applyPreset(cron: string): void {
  emit('update:modelValue', cron);
  parseCronToState(cron);
}

/* ------------------------------------------------------------------ */
/* Cron 生成                                                            */
/* ------------------------------------------------------------------ */

function buildSimplePart(part: SimplePartState, _type: 'minute' | 'hour' | 'month'): string {
  switch (part.mode) {
    case 'every':
      return '*';
    case 'everyN':
      return `*/${part.everyN ?? 1}`;
    case 'specific':
      return part.specific.length > 0 ? part.specific.join(',') : '*';
    case 'range': {
      const from = part.rangeFrom ?? 0;
      const to = part.rangeTo ?? 59;
      return `${from}-${to}`;
    }
    case 'interval': {
      const from = part.intervalFrom ?? 0;
      const step = part.intervalStep ?? 1;
      return `${from}/${step}`;
    }
    default:
      return '*';
  }
}

function buildDayPart(): string {
  const d = state.day;
  switch (d.dayMode) {
    case 'every':
      return '*';
    case 'everyN':
      return `*/${d.everyN ?? 1}`;
    case 'lastDay':
      return 'L';
    case 'workday':
      return `${d.workdayDay ?? 1}W`;
    case 'nearestWorkday':
      return `${d.nearestWorkdayDay ?? 15}W`;
    case 'byWeekday':
      return d.specific.length > 0 ? d.specific.join(',') : '?';
    default:
      return '*';
  }
}

function buildWeekPart(): string {
  const w = state.week;
  switch (w.mode) {
    case 'every':
      return '*';
    case 'specific':
      return w.specific.length > 0 ? w.specific.join(',') : '*';
    case 'ordinal':
      return `${w.ordinalDay ?? '1'}#${w.ordinalWeek ?? '1'}`;
    case 'last':
      return `${w.lastDay ?? '5'}L`;
    case 'range': {
      const from = w.rangeFrom ?? 1;
      const to = w.rangeTo ?? 5;
      return `${from}-${to}`;
    }
    default:
      return '*';
  }
}

function buildCron(): string {
  const second = '0';
  const minute = buildSimplePart(state.minute, 'minute');
  const hour = buildSimplePart(state.hour, 'hour');
  const day = buildDayPart();
  const month = buildSimplePart(state.month, 'month');
  const week = buildWeekPart();

  // day=?, week=* 或 day=*, week=? 互斥兼容
  const finalDay = day === '?' ? '*' : day;
  const finalWeek = day === '?' ? '*' : week;

  return `${second} ${minute} ${hour} ${finalDay} ${month} ${finalWeek}`;
}

/* ------------------------------------------------------------------ */
/* 解析 cron -> state                                                   */
/* ------------------------------------------------------------------ */

function parseCronToState(cron: string): void {
  if (!cron) return;
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 7) {
    logger.warn('Cron 表达式格式不正确', cron);
    return;
  }

  const offset = parts.length === 6 ? 1 : 0;
  const m = parts[offset];
  const h = parts[offset + 1];
  const d = parts[offset + 2];
  const mo = parts[offset + 3];
  const w = parts[offset + 4];
  if (m) parseSimplePart(m, state.minute);
  if (h) parseSimplePart(h, state.hour);
  if (d) parseDayPart(d);
  if (mo) parseSimplePart(mo, state.month);
  if (w) parseWeekPart(w);
}

function parseSimplePart(str: string, part: SimplePartState): void {
  if (str === '*') {
    part.mode = 'every';
  } else if (str.startsWith('*/')) {
    part.mode = 'everyN';
    part.everyN = Number.parseInt(str.slice(2), 10) || 1;
  } else if (str.includes('/')) {
    part.mode = 'interval';
    const parts = str.split('/');
    part.intervalFrom = Number.parseInt(parts[0] ?? '0', 10) || 0;
    part.intervalStep = Number.parseInt(parts[1] ?? '1', 10) || 1;
  } else if (str.includes('-')) {
    part.mode = 'range';
    const parts = str.split('-');
    part.rangeFrom = Number.parseInt(parts[0] ?? '0', 10) || 0;
    part.rangeTo = Number.parseInt(parts[1] ?? '59', 10) || 59;
  } else if (str.includes(',')) {
    part.mode = 'specific';
    part.specific = str.split(',').map((s) => Number.parseInt(s, 10)).filter((n) => !Number.isNaN(n));
  } else {
    part.mode = 'specific';
    const n = Number.parseInt(str, 10);
    part.specific = Number.isNaN(n) ? [] : [n];
  }
}

function parseDayPart(str: string): void {
  const d = state.day;
  if (str === '*' || str === '?') {
    d.dayMode = 'every';
  } else if (str === 'L') {
    d.dayMode = 'lastDay';
  } else if (str.includes('W')) {
    const num = Number.parseInt(str.replace('W', ''), 10) || 1;
    if (str.startsWith(`${num}W`)) {
      d.dayMode = 'nearestWorkday';
      d.nearestWorkdayDay = num;
    } else {
      d.dayMode = 'workday';
      d.workdayDay = num;
    }
    d.specific = [num];
  } else if (str.startsWith('*/')) {
    d.dayMode = 'everyN';
    d.everyN = Number.parseInt(str.slice(2), 10) || 1;
  } else if (str.includes(',')) {
    d.dayMode = 'byWeekday';
    d.specific = str.split(',').map((s) => Number.parseInt(s, 10)).filter((n) => !Number.isNaN(n));
  } else {
    d.dayMode = 'every';
    const n = Number.parseInt(str, 10);
    d.specific = Number.isNaN(n) ? [] : [n];
  }
}

function parseWeekPart(str: string): void {
  const w = state.week;
  if (str === '*' || str === '?') {
    w.mode = 'every';
  } else if (str.includes('L')) {
    w.mode = 'last';
    w.lastDay = String(Number.parseInt(str.replace('L', ''), 10) || 5);
  } else if (str.includes('#')) {
    w.mode = 'ordinal';
    const parts = str.split('#');
    w.ordinalDay = String(Number.parseInt(parts[0] ?? '1', 10) || 1);
    w.ordinalWeek = String(Number.parseInt(parts[1] ?? '1', 10) || 1);
  } else if (str.includes('-')) {
    w.mode = 'range';
    const parts = str.split('-');
    w.rangeFrom = Number.parseInt(parts[0] ?? '1', 10) || 1;
    w.rangeTo = Number.parseInt(parts[1] ?? '5', 10) || 5;
  } else if (str.includes(',')) {
    w.mode = 'specific';
    w.specific = str.split(',').map((s) => Number.parseInt(s, 10)).filter((n) => !Number.isNaN(n));
  } else {
    w.mode = 'specific';
    const n = Number.parseInt(str, 10);
    w.specific = Number.isNaN(n) ? [] : [n];
  }
}

/* ------------------------------------------------------------------ */
/* Preview                                                              */
/* ------------------------------------------------------------------ */

const cronExpression = computed({
  get: () => props.modelValue ?? '',
  set: (val: string) => emit('update:modelValue', val),
});

/** 中文/国际化解释 */
const cronDescription = computed(() => {
  try {
    const loc = locale.value === 'zh-CN' ? 'zh_CN' as const
      : locale.value === 'ja-JP' ? 'ja' as const
        : locale.value === 'ko-KR' ? 'ko' as const
          : locale.value === 'fr-FR' ? 'fr' as const
            : locale.value === 'es-ES' ? 'es' as const
              : 'en';
    return cronstrue.toString(cronExpression.value, {
      locale: loc,
      use24HourTimeFormat: true,
    });
  } catch {
    return t('cronBuilder.invalidCron');
  }
});

/** 接下来 N 次触发时间 */
const nextRunTimes = computed<string[]>(() => {
  const expr = cronExpression.value;
  if (!expr) return [];
  try {
    const parts = expr.trim().split(/\s+/);
    if (parts.length < 5) return [];
    const offset = parts.length === 6 ? 1 : 0;
    const mField = parts[offset] ?? '*';
    const hField = parts[offset + 1] ?? '0';

    const hours = parseHours(hField);
    const minutes = parseMinutes(mField);

    if (hours.length === 0 || minutes.length === 0) return [];

    const runs: string[] = [];
    const start = dayjs().add(1, 'minute').startOf('minute').toDate();

    let cursor = new Date(start.getTime());
    let safetyLimit = 0;

    while (runs.length < 5 && safetyLimit < 366 * 24 * 60) {
      if (hours.includes(cursor.getHours()) && minutes.includes(cursor.getMinutes())) {
        runs.push(dayjs(cursor).format('YYYY-MM-DD HH:mm'));
      }
      cursor = new Date(cursor.getTime() + 60_000);
      safetyLimit++;
    }

    return runs;
  } catch {
    return [];
  }
});

function parseHours(str: string): number[] {
  if (str === '*' || str === '?') return Array.from({ length: 24 }, (_, i) => i);
  if (str.startsWith('*/')) {
    const step = Number.parseInt(str.slice(2), 10) || 1;
    return Array.from({ length: Math.ceil(24 / step) }, (_, i) => i * step);
  }
  if (str.includes('-')) {
    const parts = str.split('-').map(Number);
    const a = parts[0] ?? 0;
    const b = parts[1] ?? 23;
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  if (str.includes(',')) {
    return str.split(',').map(Number);
  }
  const n = Number.parseInt(str, 10);
  return Number.isNaN(n) ? [] : [n];
}

function parseMinutes(str: string): number[] {
  if (str === '*' || str === '?') return [0];
  if (str.startsWith('*/')) {
    const step = Number.parseInt(str.slice(2), 10) || 1;
    return Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  }
  if (str.includes('-')) {
    const parts = str.split('-').map(Number);
    const a = parts[0] ?? 0;
    const b = parts[1] ?? 59;
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  if (str.includes(',')) {
    return str.split(',').map(Number);
  }
  const n = Number.parseInt(str, 10);
  return Number.isNaN(n) ? [] : [n];
}

/* ------------------------------------------------------------------ */
/* 双向同步                                                             */
/* ------------------------------------------------------------------ */

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      try {
        parseCronToState(val);
      } catch (e) {
        logger.warn('解析 cron 表达式失败', val, e);
      }
    }
  },
  { immediate: true },
);

watch(
  () => ({ ...state }),
  () => {
    if (currentMode.value === 'visual') {
      const newCron = buildCron();
      if (newCron !== props.modelValue) {
        emit('update:modelValue', newCron);
      }
    }
  },
  { deep: true },
);

/* ------------------------------------------------------------------ */
/* 切换模式                                                             */
/* ------------------------------------------------------------------ */

function switchMode(mode: 'visual' | 'text'): void {
  if (props.mode) return;
  currentMode.value = mode;
}

/* ------------------------------------------------------------------ */
/* 多选选项                                                             */
/* ------------------------------------------------------------------ */

const MINUTE_OPTIONS: RadioOption[] = Array.from({ length: 60 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: i,
}));

const HOUR_OPTIONS: RadioOption[] = Array.from({ length: 24 }, (_, i) => ({
  label: String(i).padStart(2, '0'),
  value: i,
}));

const MONTH_OPTIONS: RadioOption[] = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1,
}));

/** 周几选项（字符串值供 YdSelect 使用） */
const WEEKDAY_OPTIONS_STR: Array<{ label: string; value: string }> = [
  { label: '1 (一)', value: '1' },
  { label: '2 (二)', value: '2' },
  { label: '3 (三)', value: '3' },
  { label: '4 (四)', value: '4' },
  { label: '5 (五)', value: '5' },
  { label: '6 (六)', value: '6' },
  { label: '0 (日)', value: '0' },
];

const WEEKDAY_OPTIONS: RadioOption[] = [
  { label: '1 (一)', value: 1 },
  { label: '2 (二)', value: 2 },
  { label: '3 (三)', value: 3 },
  { label: '4 (四)', value: 4 },
  { label: '5 (五)', value: 5 },
  { label: '6 (六)', value: 6 },
  { label: '0 (日)', value: 0 },
];

const ORDINAL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '1st', value: '1' },
  { label: '2nd', value: '2' },
  { label: '3rd', value: '3' },
  { label: '4th', value: '4' },
];

defineOptions({ name: 'CronBuilder' });
</script>

<template>
  <div class="w-full rounded-md border p-4">
    <!-- ====== 头部模式切换 ====== -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-sm font-medium">{{ t('cronBuilder.title') }}</span>
      <div class="flex gap-1">
        <YdButton
          :variant="currentMode === 'visual' ? 'default' : 'outline'"
          size="sm"
          :disabled="!!props.mode && props.mode !== 'visual'"
          @click="switchMode('visual')"
        >
          {{ t('cronBuilder.switchToVisual') }}
        </YdButton>
        <YdButton
          :variant="currentMode === 'text' ? 'default' : 'outline'"
          size="sm"
          :disabled="!!props.mode && props.mode !== 'text'"
          @click="switchMode('text')"
        >
          {{ t('cronBuilder.switchToText') }}
        </YdButton>
      </div>
    </div>

    <!-- ====== 模式 A：纯文本 ====== -->
    <div v-if="currentMode === 'text'" class="space-y-2">
      <YdInput
        v-model="cronExpression"
        :placeholder="t('cronBuilder.textInputPlaceholder')"
        :disabled="props.disabled"
        class="font-mono"
      />
      <div v-if="cronDescription" class="text-xs text-muted-foreground">
        {{ cronDescription }}
      </div>
    </div>

    <!-- ====== 模式 B：可视化 ====== -->
    <div v-else class="space-y-3">
      <!-- 预设按钮 -->
      <div v-if="props.showPresets" class="space-y-1">
        <div class="text-xs font-medium text-muted-foreground">{{ t('cronBuilder.preset') }}</div>
        <div class="flex flex-wrap gap-1">
          <YdButton
            v-for="preset in PRESETS"
            :key="preset.cron"
            variant="outline"
            size="sm"
            :disabled="props.disabled"
            @click="applyPreset(preset.cron)"
          >
            {{ t(preset.labelKey) }}
          </YdButton>
        </div>
      </div>

      <!-- Tab 可视化编辑 -->
      <YdTabs v-model="activeTab" class="w-full">
        <YdTabsList class="grid w-full grid-cols-5">
          <YdTabsTrigger value="minute">{{ t('cronBuilder.tabMinute') }}</YdTabsTrigger>
          <YdTabsTrigger value="hour">{{ t('cronBuilder.tabHour') }}</YdTabsTrigger>
          <YdTabsTrigger value="day">{{ t('cronBuilder.tabDay') }}</YdTabsTrigger>
          <YdTabsTrigger value="month">{{ t('cronBuilder.tabMonth') }}</YdTabsTrigger>
          <YdTabsTrigger value="week">{{ t('cronBuilder.tabWeek') }}</YdTabsTrigger>
        </YdTabsList>

        <!-- ===== 分钟 Tab ===== -->
        <YdTabsContent value="minute" class="space-y-2">
          <YdRadioGroup v-model="state.minute.mode" :disabled="props.disabled" class="space-y-2">
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="every" id="min-every" />
              <YdLabel for="min-every">{{ t('cronBuilder.minuteEvery') }}</YdLabel>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="everyN" id="min-everyN" />
              <YdLabel for="min-everyN">{{ t('cronBuilder.every') }}</YdLabel>
              <YdInputNumber
                v-model="state.minute.everyN"
                :min="1"
                :max="59"
                :disabled="props.disabled || state.minute.mode !== 'everyN'"
                class="w-20"
              />
              <span class="text-xs">{{ t('cronBuilder.minutes') }}</span>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="range" id="min-range" />
              <YdLabel for="min-range">{{ t('cronBuilder.minuteRange') }}</YdLabel>
              <YdInputNumber
                v-model="state.minute.rangeFrom"
                :min="0"
                :max="59"
                :disabled="props.disabled || state.minute.mode !== 'range'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.to') }}</YdLabel>
              <YdInputNumber
                v-model="state.minute.rangeTo"
                :min="0"
                :max="59"
                :disabled="props.disabled || state.minute.mode !== 'range'"
                class="w-16"
              />
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="interval" id="min-interval" />
              <YdLabel for="min-interval" class="text-xs">{{ t('cronBuilder.minuteInterval') }}</YdLabel>
              <YdLabel class="text-xs">{{ t('cronBuilder.every') }}</YdLabel>
              <YdInputNumber
                v-model="state.minute.intervalStep"
                :min="1"
                :max="59"
                :disabled="props.disabled || state.minute.mode !== 'interval'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.minutes') }}</YdLabel>
              <YdLabel class="text-xs">{{ t('cronBuilder.to') }}</YdLabel>
              <YdInputNumber
                v-model="state.minute.intervalFrom"
                :min="0"
                :max="59"
                :disabled="props.disabled || state.minute.mode !== 'interval'"
                class="w-16"
              />
              {{ t('cronBuilder.minutes') }}
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <YdRadioGroupItem value="specific" id="min-specific" />
                <YdLabel for="min-specific">{{ t('cronBuilder.minuteSpecific') }}</YdLabel>
              </div>
              <div v-if="state.minute.mode === 'specific'" class="ml-6 flex flex-wrap gap-1">
                <template v-for="opt in MINUTE_OPTIONS" :key="opt.value">
                  <div class="flex items-center">
                    <YdCheckbox
                      :checked="state.minute.specific.includes(opt.value)"
                      :disabled="props.disabled"
                      @update:checked="(checked: boolean) => {
                        if (checked) state.minute.specific.push(opt.value);
                        else state.minute.specific = state.minute.specific.filter((v: number) => v !== opt.value);
                      }"
                    />
                    <YdLabel class="ml-1 text-xs">{{ opt.label }}</YdLabel>
                  </div>
                </template>
              </div>
            </div>
          </YdRadioGroup>
        </YdTabsContent>

        <!-- ===== 小时 Tab ===== -->
        <YdTabsContent value="hour" class="space-y-2">
          <YdRadioGroup v-model="state.hour.mode" :disabled="props.disabled" class="space-y-2">
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="every" id="hour-every" />
              <YdLabel for="hour-every">{{ t('cronBuilder.hourEvery') }}</YdLabel>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="interval" id="hour-interval" />
              <YdLabel for="hour-interval" class="text-xs">{{ t('cronBuilder.hourInterval') }}</YdLabel>
              <YdLabel class="text-xs">{{ t('cronBuilder.every') }}</YdLabel>
              <YdInputNumber
                v-model="state.hour.intervalStep"
                :min="1"
                :max="23"
                :disabled="props.disabled || state.hour.mode !== 'interval'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.hours') }}</YdLabel>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <YdRadioGroupItem value="specific" id="hour-specific" />
                <YdLabel for="hour-specific">{{ t('cronBuilder.hourSpecific') }}</YdLabel>
              </div>
              <div v-if="state.hour.mode === 'specific'" class="ml-6 flex flex-wrap gap-1">
                <template v-for="opt in HOUR_OPTIONS" :key="opt.value">
                  <div class="flex items-center">
                    <YdCheckbox
                      :checked="state.hour.specific.includes(opt.value)"
                      :disabled="props.disabled"
                      @update:checked="(checked: boolean) => {
                        if (checked) state.hour.specific.push(opt.value);
                        else state.hour.specific = state.hour.specific.filter((v: number) => v !== opt.value);
                      }"
                    />
                    <YdLabel class="ml-1 text-xs">{{ opt.label }}</YdLabel>
                  </div>
                </template>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="range" id="hour-range" />
              <YdLabel for="hour-range">{{ t('cronBuilder.minuteRange') }}</YdLabel>
              <YdInputNumber
                v-model="state.hour.rangeFrom"
                :min="0"
                :max="23"
                :disabled="props.disabled || state.hour.mode !== 'range'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.to') }}</YdLabel>
              <YdInputNumber
                v-model="state.hour.rangeTo"
                :min="0"
                :max="23"
                :disabled="props.disabled || state.hour.mode !== 'range'"
                class="w-16"
              />
              {{ t('cronBuilder.hours') }}
            </div>
          </YdRadioGroup>
        </YdTabsContent>

        <!-- ===== 日 Tab ===== -->
        <YdTabsContent value="day" class="space-y-2">
          <YdRadioGroup v-model="state.day.dayMode" :disabled="props.disabled" class="space-y-2">
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="every" id="day-every" />
              <YdLabel for="day-every">{{ t('cronBuilder.dayEvery') }}</YdLabel>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="everyN" id="day-everyN" />
              <YdLabel for="day-everyN">{{ t('cronBuilder.every') }}</YdLabel>
              <YdInputNumber
                v-model="state.day.everyN"
                :min="1"
                :max="31"
                :disabled="props.disabled || state.day.dayMode !== 'everyN'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.days') }}</YdLabel>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="lastDay" id="day-last" />
              <YdLabel for="day-last">{{ t('cronBuilder.dayLastDay') }}</YdLabel>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="nearestWorkday" id="day-nearwork" />
              <YdLabel for="day-nearwork">{{ t('cronBuilder.dayNearestWorkday') }}</YdLabel>
              {{ t('cronBuilder.to') }}
              <YdInputNumber
                v-model="state.day.nearestWorkdayDay"
                :min="1"
                :max="31"
                :disabled="props.disabled || state.day.dayMode !== 'nearestWorkday'"
                class="w-16"
              />
              {{ t('cronBuilder.days') }}
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="workday" id="day-work" />
              <YdLabel for="day-work">{{ t('cronBuilder.dayWorkday') }}</YdLabel>
              <YdInputNumber
                v-model="state.day.workdayDay"
                :min="1"
                :max="31"
                :disabled="props.disabled || state.day.dayMode !== 'workday'"
                class="w-16"
              />
              {{ t('cronBuilder.days') }}
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <YdRadioGroupItem value="byWeekday" id="day-weekday" />
                <YdLabel for="day-weekday">{{ t('cronBuilder.dayByWeekday') }}</YdLabel>
              </div>
              <div v-if="state.day.dayMode === 'byWeekday'" class="ml-6 flex flex-wrap gap-2">
                <template v-for="opt in WEEKDAY_OPTIONS" :key="opt.value">
                  <div class="flex items-center">
                    <YdCheckbox
                      :checked="state.day.specific.includes(opt.value)"
                      :disabled="props.disabled"
                      @update:checked="(checked: boolean) => {
                        if (checked) state.day.specific.push(opt.value);
                        else state.day.specific = state.day.specific.filter((v: number) => v !== opt.value);
                      }"
                    />
                    <YdLabel class="text-xs">{{ opt.label }}</YdLabel>
                  </div>
                </template>
              </div>
            </div>
          </YdRadioGroup>
        </YdTabsContent>

        <!-- ===== 月 Tab ===== -->
        <YdTabsContent value="month" class="space-y-2">
          <YdRadioGroup v-model="state.month.mode" :disabled="props.disabled" class="space-y-2">
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="every" id="month-every" />
              <YdLabel for="month-every">{{ t('cronBuilder.monthEvery') }}</YdLabel>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="interval" id="month-interval" />
              <YdLabel for="month-interval" class="text-xs">{{ t('cronBuilder.monthInterval') }}</YdLabel>
              <YdLabel class="text-xs">{{ t('cronBuilder.every') }}</YdLabel>
              <YdInputNumber
                v-model="state.month.intervalStep"
                :min="1"
                :max="12"
                :disabled="props.disabled || state.month.mode !== 'interval'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.days') }}</YdLabel>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <YdRadioGroupItem value="specific" id="month-specific" />
                <YdLabel for="month-specific">{{ t('cronBuilder.monthSpecific') }}</YdLabel>
              </div>
              <div v-if="state.month.mode === 'specific'" class="ml-6 flex flex-wrap gap-1">
                <template v-for="opt in MONTH_OPTIONS" :key="opt.value">
                  <div class="flex items-center">
                    <YdCheckbox
                      :checked="state.month.specific.includes(opt.value)"
                      :disabled="props.disabled"
                      @update:checked="(checked: boolean) => {
                        if (checked) state.month.specific.push(opt.value);
                        else state.month.specific = state.month.specific.filter((v: number) => v !== opt.value);
                      }"
                    />
                    <YdLabel class="ml-1 text-xs">{{ opt.label }}</YdLabel>
                  </div>
                </template>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="range" id="month-range" />
              <YdLabel for="month-range">{{ t('cronBuilder.weekRange') }}</YdLabel>
              <YdInputNumber
                v-model="state.month.rangeFrom"
                :min="1"
                :max="12"
                :disabled="props.disabled || state.month.mode !== 'range'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.to') }}</YdLabel>
              <YdInputNumber
                v-model="state.month.rangeTo"
                :min="1"
                :max="12"
                :disabled="props.disabled || state.month.mode !== 'range'"
                class="w-16"
              />
            </div>
          </YdRadioGroup>
        </YdTabsContent>

        <!-- ===== 周 Tab ===== -->
        <YdTabsContent value="week" class="space-y-2">
          <YdRadioGroup v-model="state.week.mode" :disabled="props.disabled" class="space-y-2">
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="every" id="week-every" />
              <YdLabel for="week-every">{{ t('cronBuilder.weekEvery') }}</YdLabel>
            </div>
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <YdRadioGroupItem value="specific" id="week-specific" />
                <YdLabel for="week-specific">{{ t('cronBuilder.weekSpecific') }}</YdLabel>
              </div>
              <div v-if="state.week.mode === 'specific'" class="ml-6 flex flex-wrap gap-2">
                <template v-for="opt in WEEKDAY_OPTIONS" :key="opt.value">
                  <div class="flex items-center">
                    <YdCheckbox
                      :checked="state.week.specific.includes(opt.value)"
                      :disabled="props.disabled"
                      @update:checked="(checked: boolean) => {
                        if (checked) state.week.specific.push(opt.value);
                        else state.week.specific = state.week.specific.filter((v: number) => v !== opt.value);
                      }"
                    />
                    <YdLabel class="text-xs">{{ opt.label }}</YdLabel>
                  </div>
                </template>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <YdRadioGroupItem value="ordinal" id="week-ordinal" />
              <YdLabel for="week-ordinal" class="text-xs">
                {{ t('cronBuilder.weekOrdinal') }}
              </YdLabel>
              <YdSelect
                v-model="state.week.ordinalWeek"
                :disabled="props.disabled || state.week.mode !== 'ordinal'"
              >
                <YdSelectTrigger class="w-16" />
                <YdSelectContent>
                  <YdSelectItem
                    v-for="opt in ORDINAL_OPTIONS"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </YdSelectItem>
                </YdSelectContent>
              </YdSelect>
              <YdSelect
                v-model="state.week.ordinalDay"
                :disabled="props.disabled || state.week.mode !== 'ordinal'"
              >
                <YdSelectTrigger class="w-20" />
                <YdSelectContent>
                  <YdSelectItem
                    v-for="opt in WEEKDAY_OPTIONS_STR"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </YdSelectItem>
                </YdSelectContent>
              </YdSelect>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="last" id="week-last" />
              <YdLabel for="week-last">{{ t('cronBuilder.weekLast') }}</YdLabel>
              <YdSelect
                v-model="state.week.lastDay"
                :disabled="props.disabled || state.week.mode !== 'last'"
              >
                <YdSelectTrigger class="w-20" />
                <YdSelectContent>
                  <YdSelectItem
                    v-for="opt in WEEKDAY_OPTIONS_STR"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </YdSelectItem>
                </YdSelectContent>
              </YdSelect>
            </div>
            <div class="flex items-center gap-2">
              <YdRadioGroupItem value="range" id="week-range" />
              <YdLabel for="week-range">{{ t('cronBuilder.weekRange') }}</YdLabel>
              <YdInputNumber
                v-model="state.week.rangeFrom"
                :min="0"
                :max="6"
                :disabled="props.disabled || state.week.mode !== 'range'"
                class="w-16"
              />
              <YdLabel class="text-xs">{{ t('cronBuilder.to') }}</YdLabel>
              <YdInputNumber
                v-model="state.week.rangeTo"
                :min="0"
                :max="6"
                :disabled="props.disabled || state.week.mode !== 'range'"
                class="w-16"
              />
            </div>
          </YdRadioGroup>
        </YdTabsContent>
      </YdTabs>

      <!-- ====== 预览区 ====== -->
      <div class="mt-3 space-y-2 rounded bg-muted/40 p-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium">{{ t('cronBuilder.preview') }}</span>
          <span class="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
            {{ cronExpression }}
          </span>
        </div>
        <div class="text-xs text-muted-foreground">
          {{ t('cronBuilder.previewDescription') }}: {{ cronDescription }}
        </div>
        <div v-if="nextRunTimes.length > 0" class="space-y-1">
          <div class="text-xs font-medium">{{ t('cronBuilder.previewNextRuns') }}</div>
          <ul class="ml-3 space-y-0.5">
            <li v-for="(run, idx) in nextRunTimes" :key="idx" class="font-mono text-xs text-muted-foreground">
              {{ run }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
