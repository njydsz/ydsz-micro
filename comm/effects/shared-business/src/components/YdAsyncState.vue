<!--
 * async-state 通用容器组件
 *
 * 使用自研 YdButtonBase + 自绘 skeleton placeholder，零 element-plus 依赖。
 *
 * @path comm\effects\shared-business\src\components\async-state.vue
 * @author ydsz-team
 * @since 1.1.0
-->
<script lang="ts" setup>
/**
 * 异步状态容器 — 根据 loading/error/empty/data 自动切换展示
 *
 * 用法：
 * ```vue
 * <YdAsyncState :loading="loading" :error="error" :empty="list.length === 0">
 *   <!-- 数据就绪后的默认插槽 -->
 *   <vxe-grid :data="list" />
 * </YdAsyncState>
 * ```
 */
import { computed } from 'vue';

import { AlertCircle } from 'lucide-vue-next';

import { YdButtonBase } from '@ydsz-core/shadcn-ui';

interface Props {
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息（非空即错误态） */
  error?: string | Error | null;
  /** 是否空数据 */
  empty?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 错误标题 */
  errorTitle?: string;
  /** 骨架屏行数 */
  skeletonRows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  empty: false,
  emptyText: '暂无数据',
  errorTitle: '加载失败',
  skeletonRows: 6,
});

defineEmits<{
  retry: [];
}>();

const skeletonRowArray = computed<number[]>(() =>
  Array.from({ length: props.skeletonRows }, (_, index) => index),
);
</script>

<template>
  <!-- 加载中：自绘骨架占位 -->
  <div
    v-if="loading"
    class="async-state__skeleton"
    aria-busy="true"
    aria-label="加载中"
    role="status"
  >
    <div
      v-for="row in skeletonRowArray"
      :key="row"
      class="async-state__skeleton-row"
    />
  </div>

  <!-- 错误态 -->
  <div v-else-if="error" class="async-state">
    <div class="async-state__error">
      <div class="async-state__icon" aria-hidden="true">
        <AlertCircle :size="28" />
      </div>
      <p class="async-state__error-title">{{ errorTitle }}</p>
      <p
        v-if="typeof error === 'string'"
        class="async-state__msg"
      >
        {{ error }}
      </p>
      <YdButtonBase
        size="sm"
        @click="$emit('retry')"
      >
        重试
      </YdButtonBase>
    </div>
  </div>

  <!-- 空态 -->
  <div v-else-if="empty" class="async-state">
    <div class="async-state__empty">
      <p class="async-state__empty-text">{{ emptyText }}</p>
      <slot name="empty" />
    </div>
  </div>

  <!-- 数据态 -->
  <slot v-else />
</template>

<style scoped>
.async-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.async-state__error,
.async-state__empty {
  text-align: center;
  color: hsl(var(--txt-tertiary, #909399));
}

.async-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background-color: hsl(var(--destructive-50, #fef2f2));
  color: hsl(var(--destructive-500, #ef4444));
}

.async-state__error-title {
  margin: 0 0 4px;
  font-weight: 600;
  color: hsl(var(--txt-primary, #1f2937));
}

.async-state__msg {
  font-size: 12px;
  margin: 0 0 12px;
}

.async-state__empty {
  padding: 24px 0;
}

.async-state__empty-text {
  margin: 0;
}

/* 自绘骨架占位（简化 shimmer） */
.async-state__skeleton {
  width: 100%;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.async-state__skeleton-row {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    hsl(var(--neutral-100, #f3f4f6)) 25%,
    hsl(var(--neutral-50, #f9fafb)) 50%,
    hsl(var(--neutral-100, #f3f4f6)) 75%
  );
  background-size: 200% 100%;
  animation: async-skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes async-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
