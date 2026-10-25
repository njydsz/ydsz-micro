<!--
 * Notification 单条通知卡片：标题 + 描述 + 级别图标的浮层条目。
 *
 * 支持：
 *  - 四种语义级别（success / info / warning / error）自动配色与图标
 *  - 自定义图标（传 Vue 组件或 #icon 插槽，不接受原始 HTML 字符串）
 *  - duration 到点自动关闭（0 表示常驻），悬停暂停并按剩余时间续算
 *  - 无障碍：success/info → role=status，warning/error → role=alert
 *
 * <p>排队与定位由宿主容器负责，本组件只消费 duration 这一条生命周期契约。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\notification\YdNotification.vue
 * @author ydsz-team
 * @since 5.7.0
-->
<script lang="ts" setup>
import type { Component } from 'vue';

import {
  AlertCircle,
  CheckCircle2,
  Info,
  type LucideIcon,
  X,
} from 'lucide-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { useLocale } from '../../locale/useLocale';
import type { NotificationProps, NotificationType } from './types';

const props = withDefaults(defineProps<NotificationProps>(), {
  class: undefined,
  description: undefined,
  duration: 4500,
  icon: undefined,
  showIcon: true,
  type: 'info',
});

const emit = defineEmits<{
  /** 关闭请求，回传条目 id 供宿主出队 */
  close: [id: string];
}>();

const { t } = useLocale();

/* ============================================================ */
/* 图标与配色                                                    */
/* ============================================================ */

const iconMap: Record<NotificationType, LucideIcon> = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
};

const iconClassMap: Record<NotificationType, string> = {
  error: 'text-red-500',
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-amber-500',
};

const borderClassMap: Record<NotificationType, string> = {
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
  success: 'border-l-green-500',
  warning: 'border-l-amber-500',
};

const currentIcon = computed<Component>(() => props.icon ?? iconMap[props.type ?? 'info']);

const containerClasses = computed(() =>
  cn(
    'pointer-events-auto flex items-start gap-3 rounded-md border-l-4 bg-background px-4 py-3 shadow-xl transition-all',
    'animate-in slide-in-from-right-full duration-300',
    borderClassMap[props.type ?? 'info'],
    props.class,
  ),
);

/** 告警级打断读屏，提示级礼貌播报 */
const a11yRole = computed<'alert' | 'status'>(() =>
  props.type === 'error' || props.type === 'warning' ? 'alert' : 'status',
);

/* ============================================================ */
/* 自动关闭计时                                                  */
/* ============================================================ */

const timer = ref<ReturnType<typeof setTimeout> | null>(null);

/** 暂停时剩余的毫秒数；null 表示未暂停 */
const remaining = ref<number | null>(null);

/** 本轮计时起始时间戳 */
let startedAt = 0;

function stopTimer(): void {
  if (timer.value !== null) {
    clearTimeout(timer.value);
    timer.value = null;
  }
}

/**
 * 从头或按剩余时间启动自动关闭计时。
 *
 * @returns 无
 */
function startAutoClose(): void {
  if (props.duration <= 0) return;
  const wait = remaining.value ?? props.duration;
  // 冻结本轮预算：再次悬停时按剩余量继续，而不是重新计满 duration
  remaining.value = wait;
  startedAt = Date.now();
  stopTimer();
  timer.value = setTimeout(() => {
    emit('close', props.id);
  }, wait);
}

/**
 * 暂停计时并记住剩余时间，避免鼠标划过就让通知续命一整轮。
 *
 * @returns 无
 */
function cancelAutoClose(): void {
  if (timer.value === null) return;
  remaining.value = Math.max(0, (remaining.value ?? props.duration) - (Date.now() - startedAt));
  stopTimer();
}

watch(
  () => props.duration,
  () => {
    remaining.value = null;
    stopTimer();
    startAutoClose();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<template>
  <div
    :class="containerClasses"
    :role="a11yRole"
    aria-atomic="true"
    @mouseenter="cancelAutoClose"
    @mouseleave="startAutoClose"
  >
    <!-- 级别图标（可被 icon prop 或 #icon 插槽覆盖） -->
    <slot name="icon" :type="props.type">
      <component
        :is="currentIcon"
        v-if="props.showIcon"
        :class="cn('mt-0.5 size-5 shrink-0', iconClassMap[props.type ?? 'info'])"
        aria-hidden="true"
      />
    </slot>

    <div class="flex-1">
      <p class="text-sm font-semibold text-foreground">
        {{ props.message }}
      </p>
      <p v-if="props.description" class="mt-0.5 text-xs text-muted-foreground">
        {{ props.description }}
      </p>
      <slot />
    </div>

    <button
      :aria-label="t('notification.closeAriaLabel')"
      class="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      type="button"
      @click="emit('close', props.id)"
    >
      <X class="size-4" aria-hidden="true" />
    </button>
  </div>
</template>
