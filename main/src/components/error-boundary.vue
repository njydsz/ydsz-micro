<!--
 * 错误边界组件（ErrorBoundary）
 *
 * 捕获子组件树中的渲染异常，展示降级 UI + 重试按钮，
 * 防止组件 throw 导致整片区域白屏。
 *
 * 使用方式：
 *   <ErrorBoundary name="区域标识">
 *     <SomeComponent />
 *   </ErrorBoundary>
 *
 * @path main\src\components\error-boundary.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { onErrorCaptured, ref } from 'vue';

defineOptions({ name: 'ErrorBoundary' });

const props = withDefaults(defineProps<{
  /** 边界标识（用于日志） */
  name?: string;
}>(), {
  name: 'unknown',
});

const hasError = ref(false);
const errorInfo = ref<Error | null>(null);

/** 开发模式标志 — 用于在模板中条件渲染错误详情 */
const isDev = import.meta.env.DEV;

onErrorCaptured((err: unknown) => {
  hasError.value = true;
  errorInfo.value = err instanceof Error ? err : new Error(String(err));
  console.error(`[ErrorBoundary:${props.name}]`, err);
  return false; // 阻止错误继续向上传播
});

function handleRetry(): void {
  hasError.value = false;
  errorInfo.value = null;
}
</script>

<template>
  <div v-if="hasError" class="flex flex-col items-center justify-center rounded-lg p-8">
    <div class="i-lucide-alert-circle mb-4 text-4xl text-red-500" />
    <p class="text-base-content/60 mb-4 text-sm">
      此区域加载异常，请重试
    </p>
    <button
      type="button"
      class="btn btn-outline btn-sm"
      aria-label="重试加载"
      @click="handleRetry"
    >
      <span class="i-lucide-refresh-cw mr-1" />
      重试
    </button>
    <p v-if="errorInfo && isDev" class="text-base-content/40 mt-4 max-w-md break-all text-xs">
      {{ errorInfo.message }}
    </p>
  </div>
  <slot v-else />
</template>
