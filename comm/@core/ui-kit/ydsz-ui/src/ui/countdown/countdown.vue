<script setup lang="ts">
/**
* Countdown（countdown）组件：倒计时实时展示，对标 Element Plus Statistic.Countdown。
* 
 * @author ydsz-ai
 * @since 1.0.0
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { CountdownEmits, CountdownProps, CountdownTime } from './countdown-types';

defineOptions({ name: 'YdCountdown' });

const props = withDefaults(defineProps<CountdownProps>(), {
  format: 'HH:mm:ss',
});

const emit = defineEmits<CountdownEmits>();

/** 剩余毫秒数 */
const remaining = ref(0);
/** 定时器句柄 */
let timerId: ReturnType<typeof setInterval> | null = null;
/** 是否已触发 finish */
let finished = false;

/**
 * 将 props.value 转为毫秒时间戳。
 */
function resolveTimestamp(value: number | Date | undefined): number {
  if (value == null) return 0;
  if (value instanceof Date) return value.getTime();
  return value;
}

/**
 * 根据目标时间戳计算剩余毫秒数。
 */
function computeRemaining(targetTimestamp: number): number {
  return Math.max(0, targetTimestamp - Date.now());
}

/**
 * 将毫秒数分解为时间分量对象。
 */
function parseTime(ms: number): CountdownTime {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    milliseconds: ms % 1000,
  };
}

/**
 * 若目标时间戳已过期则返回 false，否则 true。
 */
function isActive(targetTimestamp: number): boolean {
  return targetTimestamp > Date.now();
}

/**
 * 重置并启动计时器。
 */
function restart(): void {
  stop();
  finished = false;

  const target = resolveTimestamp(props.value);
  if (!target || !isActive(target)) {
    remaining.value = 0;
    return;
  }

  remaining.value = computeRemaining(target);

  // 首次同步触发 change
  emit('change', parseTime(remaining.value));

  timerId = setInterval(tick, 100);
}

/**
 * 每次定时触发的更新逻辑。
 */
function tick(): void {
  remaining.value = computeRemaining(resolveTimestamp(props.value));

  if (remaining.value <= 0) {
    remaining.value = 0;
    stop();
    if (!finished) {
      finished = true;
      emit('finish');
    }
    return;
  }

  emit('change', parseTime(remaining.value));
}

/**
 * 停止定时器。
 */
function stop(): void {
  if (timerId != null) {
    clearInterval(timerId);
    timerId = null;
  }
}

/** 两位数补零。 */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 三位数补零。 */
function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

/**
 * 根据 format 模板，将格式标记替换为对应的时间数值。
 */
function formatTemplate(time: CountdownTime, tpl: string): string {
  return tpl
    .replace(/SSS/g, pad3(time.milliseconds))
    .replace(/DD/g, pad2(time.days))
    .replace(/HH/g, pad2(time.hours))
    .replace(/mm/g, pad2(time.minutes))
    .replace(/ss/g, pad2(time.seconds));
}

/** 当前格式化后的时间字符串（仅数值部分，不含前后缀）。 */
const formattedValue = computed<string>(
  () => formatTemplate(parseTime(remaining.value), props.format ?? 'HH:mm:ss'),
);

onMounted(() => {
  restart();
});

watch(
  () => props.value,
  () => {
    restart();
  },
);

onBeforeUnmount(() => {
  stop();
});
</script>

<template>
  <div :class="['yd-countdown', props.class]">
    <!-- 标题插槽 -->
    <span v-if="props.title || $slots.title" class="yd-countdown__title">
      <slot name="title">{{ props.title }}</slot>
    </span>

    <!-- 前缀插槽 -->
    <span v-if="props.prefix || $slots.prefix" class="yd-countdown__prefix">
      <slot name="prefix">{{ props.prefix }}</slot>
    </span>

    <!-- 数值显示 -->
    <span class="yd-countdown__content" :style="props.valueStyle">
      <slot :time="parseTime(remaining)" :display="formattedValue">
        {{ formattedValue }}
      </slot>
    </span>

    <!-- 后缀插槽 -->
    <span v-if="props.suffix || $slots.suffix" class="yd-countdown__suffix">
      <slot name="suffix">{{ props.suffix }}</slot>
    </span>
  </div>
</template>

<style scoped>
.yd-countdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--yd-countdown-font-family, inherit);
  color: var(--yd-countdown-color, var(--yd-text-primary, #303133));
}

.yd-countdown__title {
  font-size: 14px;
  color: var(--yd-countdown-title-color, var(--yd-text-secondary, #606266));
}

.yd-countdown__prefix {
  font-size: 14px;
  color: var(--yd-countdown-prefix-color, var(--yd-text-secondary, #606266));
}

.yd-countdown__content {
  font-size: var(--yd-countdown-font-size, 28px);
  font-weight: var(--yd-countdown-font-weight, 600);
  letter-spacing: 1px;
  color: var(--yd-countdown-content-color, #409eff);
  font-variant-numeric: tabular-nums;
}

.yd-countdown__suffix {
  font-size: 14px;
  color: var(--yd-countdown-suffix-color, var(--yd-text-secondary, #606266));
}
</style>
