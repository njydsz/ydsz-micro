<!--
 * Typography.Ellipsis：文本省略自适应 Tooltip。
 *
 * 自动检测文字是否溢出容器：溢出时用 Tooltip 包裹显示全文，
 * 不溢出时纯文本展示。支持单行/多行省略与复制按钮。
 *
 * 使用 ResizeObserver 在容器尺寸变化时重新检测溢出状态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\typography\YdEllipsis.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts">
// @ts-nocheck
export type EllipsisPlacement = 'top' | 'right' | 'bottom' | 'left';
</script>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface Props {
  /** 要显示的文本内容 */
  content: string;
  /** 最大行数，1 = 单行省略（默认 1） */
  lines?: number;
  /** 容器宽度（不传则自动 fill parent） */
  width?: number | string;
  /** 是否显示 Tooltip（默认 true） */
  tooltip?: boolean;
  /** Tooltip 位置 */
  placement?: EllipsisPlacement;
  /** 是否带复制按钮 */
  copyable?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<Props>(), {
  lines: 1,
  width: undefined,
  tooltip: true,
  placement: 'top',
  copyable: false,
});

const emit = defineEmits<{
  copy: [text: string];
}>();

const textRef = ref<HTMLElement | null>(null);
const isOverflowing = ref(false);
const isClient = ref(false);
const tooltipOpen = ref(false);

let resizeObserver: ResizeObserver | null = null;

/**
 * 检测单行溢出：scrollWidth > clientWidth
 * 检测多行溢出：scrollHeight > clientHeight
 */
function checkOverflow(): void {
  const el = textRef.value;
  if (!el) return;

  if (props.lines === 1) {
    isOverflowing.value = el.scrollWidth > el.clientWidth + 1;
  } else {
    isOverflowing.value = el.scrollHeight > el.clientHeight + 1;
  }
}

function handleCopy(): void {
  const text = props.content;
  if (text && navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => emit('copy', text));
  }
}

onMounted(() => {
  isClient.value = true;
  nextTick(() => {
    checkOverflow();
    const el = textRef.value;
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkOverflow();
      });
      resizeObserver.observe(el);
    }
  });
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

watch(() => props.content, () => {
  nextTick(checkOverflow);
});

watch(() => props.lines, () => {
  nextTick(checkOverflow);
});

const tooltipPositionClass: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
};

function resolveWidth(): string | undefined {
  if (props.width === undefined) return undefined;
  return typeof props.width === 'number' ? `${props.width}px` : props.width;
}
</script>

<template>
  <!-- 溢出且有 Tooltip -->
  <span
    v-if="isOverflowing && props.tooltip"
    :class="cn('relative inline-block w-full', props.class)"
    :style="{ width: resolveWidth() }"
    @mouseenter="tooltipOpen = true"
    @mouseleave="tooltipOpen = false"
    @focus="tooltipOpen = true"
    @blur="tooltipOpen = false"
  >
    <!-- 文本主体 -->
    <span
      ref="textRef"
      :class="
        cn(
          'block',
          lines === 1
            ? 'overflow-hidden text-ellipsis whitespace-nowrap'
            : '',
        )
      "
      :style="lines > 1 ? { display: '-webkit-box', '-webkit-line-clamp': lines, '-webkit-box-orient': 'vertical', overflow: 'hidden' } as any : undefined"
    >
      {{ props.content }}
    </span>

    <!-- Tooltip 气泡 -->
    <span
      :class="
        cn(
          'pointer-events-none absolute z-50 max-w-xs whitespace-normal break-words rounded-md px-3 py-1.5 text-xs',
          'bg-surface-3 text-text-primary border border-border-subtle shadow-raised-md',
          'transition-opacity duration-150',
          tooltipOpen ? 'opacity-100' : 'opacity-0',
          tooltipPositionClass[props.placement],
        )
      "
      role="tooltip"
    >
      {{ props.content }}
    </span>

    <!-- 复制按钮 -->
    <button
      v-if="props.copyable"
      :aria-label="'复制文本'"
      class="text-muted-foreground hover:text-foreground ml-1 align-baseline text-xs"
      type="button"
      @click="handleCopy"
    >
      <svg aria-hidden="true" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  </span>

  <!-- 不溢出或不用 Tooltip：纯文本 -->
  <span
    v-else
    :class="cn('inline-block w-full', props.class)"
    :style="{ width: resolveWidth() }"
  >
    <span
      ref="textRef"
      :class="
        cn(
          'block',
          lines === 1
            ? 'overflow-hidden text-ellipsis whitespace-nowrap'
            : '',
        )
      "
      :style="lines > 1 ? { display: '-webkit-box', '-webkit-line-clamp': lines, '-webkit-box-orient': 'vertical', overflow: 'hidden' } as any : undefined"
    >
      {{ props.content }}
    </span>

    <!-- 复制按钮 -->
    <button
      v-if="props.copyable"
      :aria-label="'复制文本'"
      class="text-muted-foreground hover:text-foreground ml-1 align-baseline text-xs"
      type="button"
      @click="handleCopy"
    >
      <svg aria-hidden="true" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  </span>
</template>
