<!--
 * 网络状态反馈组件（现代化样式）
 * 响应式追踪网络状态，条件触发顶部提示：
 * - 离线：红色提示，提供「重试」按钮
 * - 慢速/2g：黄色提示
 * - 省流量模式：蓝色提示
 * - 网络恢复：绿色提示（3s 后自动消失）
 *
 * @path main/src/components/network-alert.vue
 * @author ydsz-team
 * @since 4.0.0
-->
<template>
  <Transition name="network-alert">
    <div
      v-if="visible"
      :class="['network-alert', `is-${severity}`]"
      role="alert"
      aria-live="assertive"
      :aria-label="text"
    >
      <LucideIcon :name="iconName" :size="16" class="icon" />
      <span class="text">{{ text }}</span>
      <button v-if="severity === 'error'" class="retry" @click="handleRetry">
        重试
      </button>
      <button
        v-else
        class="close"
        aria-label="关闭"
        @click="justRecovered = false"
      >
        ×
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useNetworkStatus } from "#/hooks/use-network-status";

const { networkStatus } = useNetworkStatus();
const justRecovered = ref(false);

/** 网络恢复提示的自动隐藏定时器 */
let recoveryTimer: ReturnType<typeof setTimeout> | undefined;

const severity = computed<"info" | "warning" | "error" | "success" | "none">(
  () => {
    if (!networkStatus.value.isOnline) return "error";
    if (networkStatus.value.isSaveData) return "warning";
    if (networkStatus.value.effectiveType === "2g") return "warning";
    return "none";
  },
);

const visible = computed(
  () => severity.value !== "none" || justRecovered.value,
);

const text = computed(() => {
  if (justRecovered.value) return "网络已恢复";
  switch (severity.value) {
    case "error":
      return "网络已断开，部分操作可能失败";
    case "warning":
      return networkStatus.value.isSaveData
        ? "已开启省流量模式，部分动画与预加载已禁用"
        : "当前网络较慢，加载可能延迟";
    default:
      return "";
  }
});

const iconName = computed(() => {
  if (justRecovered.value) return "lucide:wifi";
  switch (severity.value) {
    case "error":
      return "lucide:wifi-off";
    case "warning":
      return "lucide:alert-triangle";
    default:
      return "";
  }
});

const handleRetry = () => {
  window.location.reload();
};

watch(
  () => networkStatus.value.isOnline,
  (online, prev) => {
    if (online && prev === false) {
      justRecovered.value = true;
      clearTimeout(recoveryTimer);
      recoveryTimer = setTimeout(() => {
        justRecovered.value = false;
      }, 3000);
    }
  },
);

onUnmounted(() => {
  clearTimeout(recoveryTimer);
});
</script>

<style scoped>
.network-alert {
  position: fixed;
  top: var(--space-inline);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-inline);
  padding: var(--space-inline) var(--space-group);
  font-size: var(--text-13);
  font-weight: 500;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay-100);
  backdrop-filter: var(--backdrop-blur);
  max-width: 90vw;
}

.network-alert.is-error {
  color: hsl(var(--destructive-500));
  background-color: hsl(var(--destructive-50));
  border-color: hsl(var(--destructive-100));
}

.network-alert.is-warning {
  color: hsl(var(--warning-600));
  background-color: hsl(var(--warning-50));
  border-color: hsl(var(--warning-100));
}

.network-alert.is-success {
  color: hsl(var(--success-600));
  background-color: hsl(var(--success-50));
  border-color: hsl(var(--success-100));
}

.icon {
  flex-shrink: 0;
}

.text {
  flex: 1;
  max-width: 600px;
}

.retry,
.close {
  padding: var(--space-tight) var(--space-inline);
  border: 1px solid currentcolor;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  color: inherit;
  font-size: var(--text-12);
  transition: opacity var(--duration-fast) var(--ease-out);
}

.close {
  border: none;
  font-size: var(--text-18);
  line-height: 1;
  padding: 0 var(--space-tight);
}

.retry:hover,
.close:hover {
  opacity: 0.7;
}

.network-alert-enter-active {
  transition: all var(--duration-default) var(--ease-spring);
  animation: fade-in-down var(--duration-default) var(--ease-spring) forwards;
}

.network-alert-leave-active {
  transition: all var(--duration-fast) var(--ease-in);
  animation: fade-out var(--duration-fast) var(--ease-in) forwards;
}

.network-alert-enter-from,
.network-alert-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
