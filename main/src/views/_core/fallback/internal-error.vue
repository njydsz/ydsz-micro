<!--
 * internal-error 页面组件 — 500 错误页，集成 Sentry 用户反馈
 *
 * @path main/src/views/_core/fallback/internal-error.vue
 * @author remi-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Fallback } from '@remi/common-ui';

import { ErrorFeedback } from '@remi/common-ui';

import { getBreadcrumbs, isSentryInitialized } from '@remi/monitor';

defineOptions({ name: 'InternalError' });

const feedbackRef = ref<InstanceType<typeof ErrorFeedback> | null>(null);

/** 错误上下文信息，将在反馈时附带 */
const errorContext = computed(() => ({
  traceId: '',
  message: '页面加载异常',
  breadcrumbs: getBreadcrumbs(),
  timestamp: Date.now(),
}));

/**
 * 错误处理：如果 Sentry 可用，显示用户反馈按钮
 */
onMounted(() => {
  // 监控：可在上报时携带更多信息
  if (isSentryInitialized()) {
    // Sentry 已就绪，可以显示反馈组件
  }
});
</script>

<template>
  <Fallback status="500">
    <template #action>
      <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
        <!-- 返回首页 -->
        <router-link
          to="/"
          class="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          返回首页
        </router-link>

        <!-- 刷新重试 -->
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          @click="() => location.reload()"
        >
          刷新重试
        </button>

        <!-- 错误反馈（仅在 Sentry 启用时显示） -->
        <ErrorFeedback
          v-if="isSentryInitialized()"
          ref="feedbackRef"
          :error-message="errorContext.message"
        />

        <!-- 未启用 Sentry 时的降级反馈 -->
        <a
          v-else
          href="mailto:support@example.com?subject=错误反馈&body=请描述您遇到的问题..."
          class="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          联系管理员
        </a>
      </div>
    </template>
  </Fallback>
</template>
