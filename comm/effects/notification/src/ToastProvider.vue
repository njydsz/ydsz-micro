<!--
 * ToastProvider —— 全局 Toast 渲染容器。
 *
 * <p>订阅 useToastState 的 toasts 数组，渲染浮层队列，并负责生命周期：
 * duration>0 的条目到点自动出队，鼠标悬停在整个浮层上时暂停计时、移出按剩余时间续算。
 * 必须在 App 根组件挂载整个应用才有生效。
 *
 * <p>定位策略：fixed 覆盖视口顶部/右侧，按 --z-toast 层级悬浮。
 * 动效由 Tailwind 工具类 + CSS 变量 --duration-enter / --duration-leave 驱动。
 *
 * @path comm/effects/notification/src/ToastProvider.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { onBeforeUnmount, ref, watch } from 'vue';

import { useSimpleLocale } from '@ydsz-core/composables';

import { getGlobalToastState } from './toast-state';

/** 订阅全局 Toast 状态 */
const { toasts, dismiss } = getGlobalToastState();

const { $t } = useSimpleLocale();

/** 语义等级 -> 样式类映射 */
const variantClassMap: Record<string, string> = {
  default: 'border-border bg-background text-foreground',
  info: 'border-blue-500/30 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100',
  success: 'border-green-500/30 bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-100',
  warning: 'border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100',
  error: 'border-red-500/30 bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-100',
};

/** 计算 toast 容器样式类 */
const getVariantClass = (variant: string): string => {
  return variantClassMap[variant] ?? variantClassMap.default;
};

/** 告警级用 role=alert（打断读屏），提示级用 role=status（礼貌播报） */
const getRole = (variant: string): 'alert' | 'status' => {
  return variant === 'error' || variant === 'warning' ? 'alert' : 'status';
};

/* ============================================================ */
/* 自动关闭计时：按 id 维护剩余时间，支持悬停暂停                    */
/* ============================================================ */

/** 每条 toast 的待触发定时器 */
const timers = new Map<number, ReturnType<typeof setTimeout>>();

/** 暂停时记录的剩余毫秒数 */
const remaining = new Map<number, number>();

/** 本轮计时起始时间戳 */
const startedAt = new Map<number, number>();

/** 视口悬浮态，仅用于模板可读 */
const isPaused = ref(false);

/**
 * 为一条 toast 启动（或按剩余时间续算）自动关闭计时。
 *
 * @param id - toast id
 * @param duration - 总时长毫秒，<=0 表示常驻
 * @returns 无
 */
function schedule(id: number, duration: number): void {
  if (duration <= 0) return;
  const wait = remaining.get(id) ?? duration;
  remaining.set(id, wait);
  startedAt.set(id, Date.now());
  clearTimer(id);
  timers.set(id, setTimeout(() => removeItem(id), wait));
}

/**
 * 暂停计时并记住剩余时间。
 *
 * @param id - toast id
 * @returns 无
 */
function pause(id: number): void {
  const timer = timers.get(id);
  if (timer === undefined) return;
  remaining.set(id, Math.max(0, (remaining.get(id) ?? 0) - (Date.now() - (startedAt.get(id) ?? Date.now()))));
  clearTimer(id);
}

/** 出队并清理该条目的全部计时状态 */
function removeItem(id: number): void {
  clearTimer(id);
  remaining.delete(id);
  startedAt.delete(id);
  dismiss(id);
}

function clearTimer(id: number): void {
  const timer = timers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

watch(
  toasts,
  (list) => {
    const alive = new Set(list.map((item) => item.id));
    for (const id of timers.keys()) {
      // 队列已被外部 dismiss 的条目不该继续挂着定时器
      if (!alive.has(id)) {
        clearTimer(id);
        remaining.delete(id);
        startedAt.delete(id);
      }
    }
    for (const item of list) {
      if (!timers.has(item.id) && !isPaused.value) {
        schedule(item.id, item.duration ?? 0);
      }
    }
  },
  { immediate: true },
);

function pauseAll(): void {
  isPaused.value = true;
  for (const item of toasts.value) pause(item.id);
}

function resumeAll(): void {
  isPaused.value = false;
  for (const item of toasts.value) schedule(item.id, item.duration ?? 0);
}

onBeforeUnmount(() => {
  for (const id of [...timers.keys()]) clearTimer(id);
  timers.clear();
  remaining.clear();
  startedAt.clear();
});
</script>

<template>
  <!-- Toast Viewport：固定视口右上角 -->
  <div
    aria-live="polite"
    class="pointer-events-none fixed top-4 right-4 z-[var(--z-toast)] flex min-w-[320px] flex-col gap-3 outline-none"
    @mouseenter="pauseAll"
    @mouseleave="resumeAll"
  >
    <TransitionGroup name="ydsz-toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        :class="[
          'pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
          getVariantClass(item.variant ?? 'default'),
        ]"
        :role="getRole(item.variant ?? 'default')"
        aria-atomic="true"
      >
        <!-- 文本区 -->
        <div class="flex-1">
          <p class="text-sm font-medium leading-5">
            {{ item.title }}
          </p>
          <p
            v-if="item.description"
            class="mt-1 text-sm opacity-80 leading-5"
          >
            {{ item.description }}
          </p>
        </div>

        <!-- 关闭按钮 -->
        <button
          :aria-label="$t('common.close')"
          class="-mr-1 -mt-1 rounded-md p-1 opacity-50 transition-opacity hover:opacity-100 focus:opacity-100"
          type="button"
          @click="removeItem(item.id)"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ydsz-toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.ydsz-toast-enter-active {
  transition:
    transform var(--duration-enter) var(--ease-spring),
    opacity var(--duration-enter) var(--ease-out);
}
.ydsz-toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.ydsz-toast-leave-active {
  transition:
    transform var(--duration-leave) var(--ease-in),
    opacity var(--duration-leave) var(--ease-in);
}
.ydsz-toast-move {
  transition: transform var(--duration-default) var(--ease-out);
}
</style>
