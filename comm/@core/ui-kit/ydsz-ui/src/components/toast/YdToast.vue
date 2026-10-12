<!--
 * Toast 单条通知组件：渲染一条带图标、标题、内容的轻量通知卡片。
 *
 * 支持：
 *  - 四种语义类型（success / info / warning / error）自动配色
 *  - 自定义图标覆盖
 *  - 常驻（life=0）或定时自动关闭
 *  - 手动关闭按钮（可配置）
 *  - 键盘可关闭（Escape）
 *  - 无障碍：role="alert"、aria-live="polite"
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\toast\YdToast.vue
 * @author ydsz-team
 * @since 26.10.11
-->
<script lang="ts" setup>
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
  /** 自定义图标（覆盖默认图标） */
  icon?: string;
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

/* ============================================================ */
/* 图标映射                                                       */
/* ============================================================ */

const iconMap: Record<ToastSeverity, LucideIcon> = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
};

const currentIcon = computed<LucideIcon | undefined>(() => {
  return iconMap[props.severity ?? 'info'];
});

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
/* 自动关闭                                                     */
/* ============================================================ */

const timer = ref<ReturnType<typeof setTimeout> | null>(null);

function startAutoClose(): void {
  if (props.life <= 0) return;
  timer.value = setTimeout(() => {
    emit('close');
  }, props.life);
}

function cancelAutoClose(): void {
  if (timer.value !== null) {
    clearTimeout(timer.value);
    timer.value = null;
  }
}

watch(
  () => props.life,
  () => {
    cancelAutoClose();
    startAutoClose();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  cancelAutoClose();
});

/* ============================================================ */
/* 键盘辅助                                                       */
/* ============================================================ */

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    emit('close');
  }
}
</script>

<template>
  <div
    :class="containerClasses"
    role="alert"
    aria-live="polite"
    aria-atomic="true"
    tabindex="0"
    @keydown="onKeyDown"
    @mouseenter="cancelAutoClose"
    @mouseleave="startAutoClose"
  >
    <!-- 类型图标 -->
    <component
      :is="currentIcon"
      v-if="!props.icon"
      class="mt-0.5 size-5 shrink-0"
      aria-hidden="true"
    />

    <!-- 自定义图标插槽 -->
    <div
      v-if="props.icon"
      class="mt-0.5 size-5 shrink-0"
      aria-hidden="true"
      v-html="props.icon"
    />

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
      aria-label="关闭"
      @click="emit('close')"
    >
      <X class="size-4" aria-hidden="true" />
    </button>

    <!-- 默认插槽：自定义内容 -->
    <slot />
  </div>
</template>
