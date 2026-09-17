<!--
 * ToastProvider —— 全局 Toast 渲染容器。
 *
 * <p>订阅 useToastState 的 toasts 数组，渲染浮层队列。
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
import { computed } from 'vue';

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

/** 可见 toast（有过渡动画） */
const visibleToasts = computed(() => toasts.value);
</script>

<template>
  <!-- Toast Viewport：固定视口右上角 -->
  <div
    aria-live="polite"
    class="pointer-events-none fixed top-4 right-4 z-[var(--z-toast)] flex min-w-[320px] flex-col gap-3 outline-none"
  >
    <TransitionGroup name="ydsz-toast">
      <div
        v-for="item in visibleToasts"
        :key="item.id"
        :class="[
          'pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
          getVariantClass(item.variant ?? 'default'),
        ]"
        role="alert"
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
          @click="dismiss(item.id)"
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
