<script lang="ts" setup>
// @ts-nocheck
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  class?: any;
  /** 格式字符串 DD:HH:mm:ss */
  format?: string;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 目标时间（ms 时间戳） */
  target: number;
  /** 是否自动开始 */
  autoStart?: boolean;
  /** 数值是否高亮 */
  valueStyle?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true,
  format: 'DD:HH:mm:ss',
});

const emit = defineEmits<{
  finish: [];
  change: [timeLeft: number];
}>();

const timeLeft = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;

/** 分解天/时/分/秒 */
const parts = computed(() => {
  const total = Math.max(0, timeLeft.value);
  return {
    DD: Math.floor(total / 86400),
    HH: Math.floor((total % 86400) / 3600),
    mm: Math.floor((total % 3600) / 60),
    ss: total % 60,
  };
});

/** 格式化输出 */
const displayText = computed(() => {
  let result = props.format;
  for (const [key, val] of Object.entries(parts.value)) {
    result = result.replace(key, String(val).padStart(2, '0'));
  }
  return result;
});

function update(): void {
  const now = Date.now();
  timeLeft.value = Math.max(0, Math.floor((props.target - now) / 1000));
  emit('change', timeLeft.value);
  if (timeLeft.value <= 0) {
    emit('finish');
    clearInterval(timer);
    timer = undefined;
  }
}

onMounted(() => {
  update();
  if (props.autoStart) {
    timer = setInterval(update, 1000);
  }
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <span
    :class="cn('inline-flex items-center gap-1 font-mono text-sm tabular-nums', props.class)"
    role="timer"
    :aria-label="`倒计时 ${displayText}`"
  >
    <span v-if="props.prefix" class="text-muted-foreground">{{ props.prefix }}</span>
    <span :style="props.valueStyle" class="font-semibold">
      {{ displayText }}
    </span>
    <span v-if="props.suffix" class="text-muted-foreground">{{ props.suffix }}</span>
  </span>
</template>
