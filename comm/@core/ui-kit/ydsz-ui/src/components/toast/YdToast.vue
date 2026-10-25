<!--
 * Toast 单条通知组件：渲染一条带图标、标题、内容的轻量通知卡片。
 *
 * 支持：
 *  - 四种语义类型（success / info / warning / error）自动配色
 *  - 自定义图标（传 Vue 组件或 #icon 插槽，不接受原始 HTML 字符串）
 *  - 常驻（life=0）或定时自动关闭
 *  - 手动关闭按钮（可配置）
 *  - 悬停暂停计时：恢复时用剩余时间而非重新计时
 *  - 无障碍：success/info → role=status，warning/error → role=alert
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\YdToast.vue
 * @author ydsz-team
 * @since 26.10.11
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

import { extendPt } from '../../pass-through';
import type { PtOptions } from '../../pass-through';
import { useLocale } from '../../locale/useLocale';
import type { ToastSeverity } from './types';

/* ============================================================ */
/* Props                                                          */
/* ============================================================ */

interface Props {
  /** 严重级别 */
  severity?: ToastSeverity;
  /** 标题 */
  summary?: string;
  /** 内容详情 */
  detail?: string;
  /** 自定义图标组件（覆盖默认图标） */
  icon?: Component;
  /** 持续时长（毫秒），0 表示常驻 */
  life?: number;
  /** 是否可关闭 */
  closable?: boolean;
  /** 是否进入动画 */
  animate?: boolean;
  /** Pass-Through 配置 */
  pt?: PtOptions;
}

const props = withDefaults(defineProps<Props>(), {
  animate: true,
  closable: true,
  detail: undefined,
  icon: undefined,
  life: 4500,
  pt: undefined,
  severity: 'info',
  summary: undefined,
});

/* ============================================================ */
/* Emit                                                           */
/* ============================================================ */

const emit = defineEmits<{
  /** 关闭事件，由父组件（容器）处理移除 */
  close: [];
}>();

const { t } = useLocale();

/* ============================================================ */
/* 图标映射                                                       */
/* ============================================================ */

const iconMap: Record<ToastSeverity, LucideIcon> = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
};

const currentIcon = computed<Component>(() => props.icon ?? iconMap[props.severity ?? 'info']);

/* ============================================================ */
/* 配色与类名                                                     */
/* ============================================================ */

const colorMap: Record<ToastSeverity, string> = {
  error: 'text-destructive bg-destructive/10 border-l-destructive',
  info: 'text-blue-500 bg-blue-500/10 border-l-blue-500',
  success: 'text-green-500 bg-green-500/10 border-l-green-500',
  warning: 'text-amber-500 bg-amber-500/10 border-l-amber-500',
};

const containerClasses = computed(() => {
  const base = cn(
    'pointer-events-auto relative flex w-full max-w-sm items-start gap-3 border-l-4 rounded-md px-4 py-3 shadow-lg transition-all',
    props.animate && 'animate-in slide-in-from-right-full duration-300',
    colorMap[props.severity ?? 'info'],
  );

  const ptBase = props.pt ? extendPt(undefined, props.pt) : null;
  return ptBase ? cn(base, ptBase.class) : base;
});

/* ============================================================ */
/* 无障碍角色                                                     */
/* ============================================================ */

/** 提示性级别用 role=status（礼貌播报），告警级用 role=alert（打断播报） */
const a11yRole = computed<'alert' | 'status'>(() =>
  props.severity === 'error' || props.severity === 'warning' ? 'alert' : 'status',
);

/* ============================================================ */
/* 自动关闭                                                     */
/* ============================================================ */

const timer = ref<ReturnType<typeof setTimeout> | null>(null);

/** 暂停时剩余的毫秒数；null 表示未暂停 */
const remaining = ref<number | null>(null);

/** 本轮计时的起始时间戳 */
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
  if (props.life <= 0) return;
  const wait = remaining.value ?? props.life;
  // 冻结本轮预算：再次悬停时按剩余量继续，而不是重新计满 life
  remaining.value = wait;
  startedAt = Date.now();
  stopTimer();
  timer.value = setTimeout(() => {
    emit('close');
  }, wait);
}

/**
 * 暂停计时并记住剩余时间，避免鼠标划过就让 toast 续命一整轮。
 *
 * @returns 无
 */
function cancelAutoClose(): void {
  if (timer.value === null) return;
  remaining.value = Math.max(0, (remaining.value ?? props.life) - (Date.now() - startedAt));
  stopTimer();
}

watch(
  () => props.life,
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

/* ============================================================ */
/* 键盘辅助                                                       */
/* ============================================================ */

/**
 * 焦点位于 toast 内部（关闭按钮）时按 Escape 关闭。
 *
 * @param event - 键盘事件
 * @returns 无
 */
function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close');
  }
}
</script>

<template>
  <div
    :class="containerClasses"
    :role="a11yRole"
    aria-atomic="true"
    @keydown="onKeyDown"
    @mouseenter="cancelAutoClose"
    @mouseleave="startAutoClose"
  >
    <!-- 类型图标（默认按 severity 取 Lucide 图标，可被 icon prop 或插槽覆盖） -->
    <slot name="icon" :severity="props.severity">
      <component
        :is="currentIcon"
        class="mt-0.5 size-5 shrink-0"
        aria-hidden="true"
      />
    </slot>

    <!-- 内容区 -->
    <div class="flex-1 space-y-0.5">
      <p
        v-if="props.summary"
        class="text-sm font-semibold leading-tight text-foreground"
      >
        {{ props.summary }}
      </p>
      <p
        class="text-sm text-muted-foreground"
        :class="{ 'font-medium': !props.summary }"
      >
        {{ props.detail }}
      </p>
    </div>

    <!-- 关闭按钮 -->
    <button
      v-if="props.closable"
      type="button"
      class="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :aria-label="t('common.close')"
      @click="emit('close')"
    >
      <X class="size-4" aria-hidden="true" />
    </button>

    <!-- 默认插槽：自定义内容 -->
    <slot />
  </div>
</template>
