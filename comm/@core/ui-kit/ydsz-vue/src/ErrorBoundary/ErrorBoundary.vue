<script lang="ts" setup>
/**
 * ErrorBoundary — Vue 组件错误边界。
 *
 * 捕获子组件树中的 JavaScript 错误，展示友好的错误 UI，避免白屏。
 * 基于 Vue 3 的 `onErrorCaptured` 钩子实现。
 *
 * @path comm\@core\ui-kit\ydsz-vue\src\ErrorBoundary\ErrorBoundary.vue
 * @author ydsz-team
 * @since 1.0.0
 *
 * @example
 * ```vue
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example 自定义错误 UI
 * ```vue
 * <ErrorBoundary :fallback="CustomFallback">
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
import { onErrorCaptured, ref, type VNodeChild } from 'vue';

interface ErrorBoundaryProps {
  /**
   * 自定义错误 UI 渲染函数，接收错误信息与重置函数。
   */
  fallback?: (error: Error, reset: () => void) => VNodeChild;
}

const props = defineProps<ErrorBoundaryProps>();

const error = ref<Error | null>(null);

onErrorCaptured((err: unknown) => {
  // 只捕获当前组件树内的错误，不向上传播
  if (err instanceof Error) {
    error.value = err;
    // 防止错误继续传播到全局
    return false;
  }
  // 非 Error 类型错误交给全局处理
  return true;
});

function reset() {
  error.value = null;
}

function handleRetry() {
  reset();
}

// 暴露 reset 方法给父组件
defineExpose({
  reset,
});
</script>

<template>
  <!-- 错误状态：展示错误 UI -->
  <div v-if="error" class="ydsz-error-boundary">
    <slot
      v-if="props.fallback"
      :error="error"
      :reset="handleRetry"
    >
      {{ props.fallback(error, handleRetry) }}
    </slot>
    <div v-else class="ydsz-error-boundary__content">
      <div class="ydsz-error-boundary__icon">⚠️</div>
      <h3 class="ydsz-error-boundary__title">页面出现异常</h3>
      <p class="ydsz-error-boundary__message">
        {{ error.message || '发生了未知错误，请稍后重试' }}
      </p>
      <div class="ydsz-error-boundary__actions">
        <button
          type="button"
          class="ydsz-error-boundary__retry-btn"
          @click="handleRetry"
        >
          重试
        </button>
      </div>
    </div>
  </div>

  <!-- 正常状态：渲染子组件 -->
  <slot v-else />
</template>

<style scoped>
.ydsz-error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 24px;
}

.ydsz-error-boundary__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.ydsz-error-boundary__icon {
  font-size: 48px;
}

.ydsz-error-boundary__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-color-danger, #f56c6c);
}

.ydsz-error-boundary__message {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
  max-width: 400px;
}

.ydsz-error-boundary__actions {
  margin-top: 8px;
}

.ydsz-error-boundary__retry-btn {
  padding: 8px 24px;
  font-size: 14px;
  color: #fff;
  background: var(--el-color-primary, #409eff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ydsz-error-boundary__retry-btn:hover {
  opacity: 0.9;
}
</style>
