<!--
 * 网络状态监控组件 — 检测网络异常并展示友好提示
 *
 * 功能：
 * - 实时监测网络连接状态（online/offline）
 * - 网络恢复时自动隐藏提示
 * - 提供手动重试按钮
 * - 支持自定义提示文案和样式
 *
 * 使用 lucide-vue-next + 自研 Button 组件，零 element-plus 依赖。
 *
 * @example
 * ```vue
 * <YdNetworkStatus />
 * <YdNetworkStatus message="网络连接失败" show-retry @retry="reconnect" />
 * ```
 *
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-vue-next';

import { cn } from '@ydsz-core/shared/utils';

import { Button } from '@ydsz-core/shadcn-ui';

defineOptions({ name: 'YdNetworkStatus' });

const props = withDefaults(
  defineProps<{
    /** 离线提示文案 */
    offlineMessage?: string;
    /** 是否展示重试按钮 */
    showRetry?: boolean;
    /** 提示类型 */
    type?: 'error' | 'warning' | 'info';
  }>(),
  {
    offlineMessage: '网络连接已断开，请检查网络设置',
    showRetry: true,
    type: 'error',
  },
);

const emit = defineEmits<{
  retry: [];
  online: [];
  offline: [];
}>();

const isOnline = ref(navigator.onLine);
const showBanner = ref(false);
const isRetrying = ref(false);

/** 是否展示离线提示 */
const isOffline = computed(() => !isOnline.value && showBanner.value);

/** 状态色系与图标映射 */
const tone = computed(() => {
  const map: Record<'error' | 'warning' | 'info', {
    bg: string;
    border: string;
    icon: typeof AlertCircle;
    iconColor: string;
    text: string;
  }> = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      text: 'text-red-900',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      text: 'text-amber-900',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
      text: 'text-blue-900',
    },
  };
  return map[props.type];
});

/** 状态标签右侧图标 */
const StatusIcon = computed(() => tone.value.icon);

/**
 * 关闭提示（用户手动 dismiss）
 *
 * 注意：仅隐藏当前 banner，下一次 offline 事件会再次弹出。
 */
function handleClose(): void {
  showBanner.value = false;
}

/** 重新检测网络 */
function handleRetry(): void {
  isRetrying.value = true;
  emit('retry');
  // 1.5s 后兜底关闭 loading，避免调用方未恢复时 UI 卡死
  window.setTimeout(() => {
    isRetrying.value = false;
  }, 1500);
}

/** 网络恢复事件处理 */
function handleOnline(): void {
  isOnline.value = true;
  showBanner.value = false;
  isRetrying.value = false;
  emit('online');
}

/** 网络断开事件处理 */
function handleOffline(): void {
  isOnline.value = false;
  showBanner.value = true;
  emit('offline');
}

onMounted(() => {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 初始状态检测
  if (!navigator.onLine) {
    showBanner.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});
</script>

<template>
  <Transition name="network-status-fade">
    <div
      v-if="isOffline"
      class="network-status"
      role="alert"
      aria-live="assertive"
    >
      <div
        :class="
          cn(
            'network-status__banner',
            'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
            tone.bg,
            tone.border,
          )
        "
      >
        <!-- 状态图标 -->
        <component
          :is="StatusIcon"
          :class="cn('mt-0.5 shrink-0', tone.iconColor)"
          :size="18"
          aria-hidden="true"
        />

        <!-- 提示文案 + 操作区 -->
        <div class="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-1">
            <span
              :class="cn('text-sm font-medium', tone.text)"
            >
              {{ offlineMessage }}
            </span>
            <span
              v-if="showRetry"
              class="text-xs text-text-secondary"
            >
              请检查您的网络连接后重试。
            </span>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex shrink-0 items-center gap-2">
            <Button
              v-if="showRetry"
              :disabled="isRetrying"
              size="sm"
              variant="outline"
              @click="handleRetry"
            >
              <Loader2
                v-if="isRetrying"
                :size="14"
                class="mr-1 animate-spin"
              />
              {{ isRetrying ? '重试中…' : '重试连接' }}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              class="text-text-secondary"
              aria-label="关闭"
              @click="handleClose"
            >
              <CheckCircle2 :size="14" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.network-status {
  position: fixed;
  top: 16px;
  left: 50%;
  z-index: 9999;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  pointer-events: none;
}

.network-status__banner {
  pointer-events: auto;
}

/* 过渡动画 */
.network-status-fade-enter-active,
.network-status-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.network-status-fade-enter-from,
.network-status-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
