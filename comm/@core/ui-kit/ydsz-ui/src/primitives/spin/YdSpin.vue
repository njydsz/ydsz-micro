<!--
 * Spin 加载中：包裹内容区域表达加载状态。
 *
 * 设计要点：
 * - wrapper 模式：展示 spinner 并覆盖内容区（透明度降低）
 * - 支持 delay 延迟显示，避免闪烁
 * - 支持 fullscreen 整页加载
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\spin\YdSpin.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { Loader2 } from 'lucide-vue-next';

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否全屏 */
  fullscreen?: boolean;
  /** 延迟显示（ms） */
  delay?: number;
  /** 尺寸 */
  size?: 'default' | 'large' | 'small';
  /** 是否激活 */
  spinning?: boolean;
  /** 描述文案 */
  tip?: string;
}

const props = withDefaults(defineProps<Props>(), {
  delay: 0,
  fullscreen: false,
  size: 'default',
  spinning: true,
  tip: '',
});

const shouldRender = ref(props.spinning && props.delay === 0);
let delayTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  if (props.spinning && props.delay > 0) {
    delayTimer = setTimeout(() => {
      shouldRender.value = true;
    }, props.delay);
  }
});

onUnmounted(() => {
  if (delayTimer) clearTimeout(delayTimer);
});

const spinnerSize = computed(() => {
  switch (props.size) {
    case 'large':
      return 'size-6';
    case 'small':
      return 'size-3.5';
    default:
      return 'size-5';
  }
});
</script>

<template>
  <!-- 全屏模式 -->
  <div
    v-if="props.fullscreen"
    :class="
      cn(
        'fixed inset-0 z-[var(--z-backdrop)] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
        props.class,
      )
    "
    role="status"
    aria-live="polite"
  >
    <Loader2 :class="cn('animate-spin text-primary', spinnerSize)" />
    <p v-if="props.tip" class="text-muted-foreground mt-3 text-sm">{{ props.tip }}</p>
  </div>

  <!-- 包裹模式 -->
  <div v-else :class="cn('relative inline-flex', props.class)">
    <!-- 加载态遮罩 -->
    <div
      v-if="props.spinning"
      :class="
        cn(
          'absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[1px] transition-opacity',
          shouldRender ? 'opacity-100' : 'opacity-0',
        )
      "
      role="status"
      aria-live="polite"
    >
      <Loader2 :class="cn('animate-spin text-primary', spinnerSize)" />
      <span v-if="props.tip" class="text-muted-foreground mt-1.5 text-xs">{{ props.tip }}</span>
    </div>
    <!-- 内容 -->
    <div :class="cn('flex-1', props.spinning && 'pointer-events-none')">
      <slot></slot>
    </div>
  </div>
</template>
