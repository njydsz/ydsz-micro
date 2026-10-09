<!--
 * micro-kernel 微前端子应用挂载容器组件 — 作为子应用的 DOM 挂载点
 *
 * v3.2: 直接订阅 microRuntime 生命周期钩子（替代 window 事件），
 *       细化加载阶段（loading/mounting/mounted/error/unmounting），
 *       通过 unsubscribe 在组件卸载时彻底清理，避免泄漏。
 * v3.3: 进一步细化生命周期（beforeLoad/afterLoad/beforeMount/afterMount），
 *       进度条按真实阶段推进（10% → 60% → 75% → 100%），
 *       PHASE_META 与错误遮罩文案全面 i18n 化，
 *       骨架屏类型优先取自子应用 manifest.routes，回退到 route.meta.skeletonType。
 * v4.1: 阶段状态机/骨架屏解析提取为 composable（use-subapp-phase / use-skeleton-resolver），
 *       移除依赖隐式副作用的空 watch（computed 已自动追踪 route.path）。
 * v4.4: 子应用切换丝滑过渡 — <Transition> 包裹挂载点，淡入 300ms，
 *       800ms 骨架屏延迟展示，离开前 snapshot 由 page-cache 捕获。
 *
 * @path main\src\views\_core\subapp\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";

import type { MicroAppConfig } from "@ydsz/micro-runtime";

import { createLogger } from "@ydsz-core/shared/utils";

import { microRuntime } from "#/bootstrap";
import { $t } from "#/locales";

import { useSubAppPhase } from "./composables/use-subapp-phase";
import { useSkeletonResolver } from "./composables/use-skeleton-resolver";

/** 模块级日志器 */
const logger = createLogger("SubAppContainer");

defineOptions({
  name: "SubAppContainer",
});

/** 子应用容器 DOM 引用（用于焦点管理） */
const subappContainerRef = ref<HTMLElement | null>(null);

/** 路由实例，用于读取 meta.skeletonType 与当前 path */
const route = useRoute();

/** 阶段状态机（阶段/进度/文案/无障碍公告/焦点管理） */
const {
  state,
  phaseText,
  screenReaderAnnouncement,
  showSkeleton: showSkeletonImmediate,
  showErrorMask,
  errorMaskTitle,
  errorMaskHint,
  setPhase,
  setError,
} = useSubAppPhase(subappContainerRef);

/**
 * 重试加载失败的子应用。
 *
 * 当前实现：先将阶段重置为 idle，再通过主应用 router 强制重新导航到当前路由，
 * 触发内核 beforeLoad → mount 流程重新执行。
 * P2-2: 错误遮罩增加「重新加载」按钮。
 */
function handleRetry(): void {
  const appName = state.activeAppName.value;
  if (!appName || !microRuntime) return;
  // 1. 重置错误阶段为 idle，让错误遮罩消失
  setPhase("idle", appName);
  // 2. 通过 router 重新导航到相同路径，触发内核重新加载子应用
  const currentPath = route.fullPath;
  void microRuntime.unmountApp(appName).then(() => {
    microRuntime!.navigateTo(currentPath);
  });
}

/** 骨架屏组件解析（computed 自动追踪 route.path，无需手动 watch） */
const pageSkeletonComponent = useSkeletonResolver(state.activeAppName, route);

/** 挂载点 key — 应用名变化时触发 <Transition> 过渡 */
const mountKey = ref(state.activeAppName.value || "empty");

/** 应用淡入动画标志 — afterMount 后置 true，触发 opacity 0→1 */
const isFadingIn = ref(false);

/** 延迟骨架屏标志 — beforeLoad 800ms 后若仍未 mounted 则置 true */
const showDelayedSkeleton = ref(false);

/** mounted 阶段重置定时器 */
let mountedResetTimer: ReturnType<typeof setTimeout> | undefined;

/** 骨架屏延迟定时器 */
let skeletonDelayTimer: ReturnType<typeof setTimeout> | undefined;

/** 取消订阅函数集合，组件卸载时统一调用 */
const unsubscribers: Array<() => void> = [];

/**
 * 判断是否展示延迟骨架屏。
 *
 * 延迟 800ms 后才在 loading/mounting 阶段展示骨架屏，
 * 避免快速加载的子应用闪烁骨架屏。
 */
function showSkeleton(): boolean {
  return showDelayedSkeleton.value && showSkeletonImmediate();
}

onMounted(() => {
  if (!microRuntime) {
    // 内核尚未初始化（理论上 bootstrap 已同步注册，防御性处理）
    logger.warn("microRuntime not ready");
    return;
  }

  // beforeLoad: 子应用开始加载 ESM 模块（10%）
  unsubscribers.push(
    microRuntime.addLifecycleHook("beforeLoad", (app: MicroAppConfig) => {
      setPhase("loading", app.name);
      // 启动 800ms 延迟骨架屏定时器，mounted 后清除
      showDelayedSkeleton.value = false;
      clearTimeout(skeletonDelayTimer);
      skeletonDelayTimer = window.setTimeout(() => {
        if (
          ["loading", "loaded", "mounting"].includes(state.phase.value)
        ) {
          showDelayedSkeleton.value = true;
        }
      }, 800);
    }),
  );

  // afterLoad: ESM 模块加载完成、LifecycleExports 就绪（60%）
  unsubscribers.push(
    microRuntime.addLifecycleHook("afterLoad", (app: MicroAppConfig) => {
      if (state.activeAppName.value === app.name) {
        setPhase("loaded", app.name);
      }
    }),
  );

  // beforeMount: mount() 即将调用（75%）
  unsubscribers.push(
    microRuntime.addLifecycleHook("beforeMount", (app: MicroAppConfig) => {
      if (state.activeAppName.value === app.name) {
        setPhase("mounting", app.name);
      }
    }),
  );

  // afterMount: 子应用 mount() 完成，DOM 已挂载（100%）
  unsubscribers.push(
    microRuntime.addLifecycleHook("afterMount", (app: MicroAppConfig) => {
      setPhase("mounted", app.name);
      mountKey.value = app.name;
      // 清除延迟骨架屏定时器
      clearTimeout(skeletonDelayTimer);
      showDelayedSkeleton.value = false;
      // 触发淡入动画
      isFadingIn.value = true;
      window.setTimeout(() => {
        isFadingIn.value = false;
      }, 300);
      // 100% 后短暂保持，再切回 idle 以便复用
      clearTimeout(mountedResetTimer);
      mountedResetTimer = window.setTimeout(() => {
        if (state.phase.value === "mounted") setPhase("idle");
      }, 300);
    }),
  );

  // afterUnmount: 子应用卸载完成（切换中的过渡态）
  unsubscribers.push(
    microRuntime.addLifecycleHook("afterUnmount", (app: MicroAppConfig) => {
      // 离开前的 snapshot 由 page-cache 内部 flush 自动捕获（无需手动）
      // 若当前激活应用仍是被卸载的应用，进入 unmounting 过渡
      if (state.activeAppName.value === app.name) {
        setPhase("unmounting", null);
        mountKey.value = "empty";
      }
    }),
  );

  // error: 加载或挂载失败
  unsubscribers.push(
    microRuntime.addLifecycleHook(
      "error",
      (app: MicroAppConfig, err: unknown) => {
        clearTimeout(skeletonDelayTimer);
        showDelayedSkeleton.value = false;
        setError(err, app.name);
      },
    ),
  );

  // 兜底：若初始路由已命中子应用但 beforeLoad 触发晚于组件挂载，
  // 通过当前激活应用名回填一次状态
  const active = microRuntime.getActiveAppName();
  if (active && state.phase.value === "idle") {
    setPhase("mounted", active);
    mountKey.value = active;
  }
});

onUnmounted(() => {
  clearTimeout(mountedResetTimer);
  clearTimeout(skeletonDelayTimer);
  for (const off of unsubscribers.splice(0)) {
    try {
      off();
    } catch {
      /* 静默 */
    }
  }
});
</script>

<template>
  <div class="subapp-wrapper">
    <!-- 屏幕阅读器公告区域：子应用加载状态变化时自动播报 -->
    <div class="sr-only" aria-live="polite" aria-atomic="true" role="status">
      {{ screenReaderAnnouncement }}
    </div>

    <!-- 子应用挂载容器 — Transition 包裹实现切换淡入 -->
    <Transition name="subapp-fade" mode="out-in">
      <div
        :key="mountKey"
        id="subapp-container"
        ref="subappContainerRef"
        class="subapp-container"
        role="region"
        :aria-label="$t('page.microKernel.containerLabel')"
        :aria-busy="showSkeleton()"
        :class="{
          'is-loading': showSkeleton(),
          'has-error': showErrorMask(),
          'is-fading-in': isFadingIn,
        }"
      >
        <!-- 页面级骨架屏（延迟 800ms 展示，避免闪烁） -->
        <div v-if="showSkeleton()" class="subapp-skeleton-wrapper">
          <component :is="pageSkeletonComponent" />
          <div
            class="skeleton-progress"
            role="progressbar"
            :aria-valuenow="state.progress.value"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              class="progress-bar"
              :style="{ width: `${state.progress.value}%` }"
            ></div>
          </div>
          <p class="loading-text">
            {{ phaseText
            }}<span v-if="state.activeAppName.value">
              · {{ state.activeAppName.value }}</span
            >
          </p>
        </div>

        <!-- 错误态遮罩（实际错误 UI 由内核 error-boundary 渲染） -->
        <div
          v-else-if="showErrorMask()"
          class="subapp-error-mask"
          aria-live="polite"
        >
          <p class="error-app">{{ state.activeAppName.value }}</p>
          <p class="error-title">{{ errorMaskTitle }}</p>
          <p class="error-msg">{{ state.lastError.value || phaseText }}</p>
          <p class="error-hint">{{ errorMaskHint }}</p>
          <!-- P2-2: 重新加载按钮 — 点击后卸载当前子应用并重新导航触发重新加载 -->
          <button
            type="button"
            class="retry-button"
            @click="handleRetry"
          >
            重新加载
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.subapp-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.subapp-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

/* ==================== 子应用切换淡入/淡出过渡（300ms） ==================== */

.subapp-fade-enter-active,
.subapp-fade-leave-active {
  transition: opacity 300ms ease;
}

.subapp-fade-enter-from {
  opacity: 0;
}

.subapp-fade-leave-to {
  opacity: 0;
}

/* mounted 后首帧淡入动画 — 与 Transition 叠加使用 */
.subapp-container.is-fading-in {
  animation: subapp-fade-in 300ms ease-out;
}

@keyframes subapp-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ==================== 加载态 / 错误态 ==================== */

.subapp-container.is-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.subapp-container.has-error {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 屏幕阅读器专用不可见内容 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 骨架屏包装器样式 */
.subapp-skeleton-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 40px;
  gap: 24px;
}

.skeleton-progress {
  width: 100%;
  max-width: 600px;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(
    90deg,
    hsl(var(--brand-200)) 0%,
    hsl(var(--brand-500)) 100%
  );
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-text {
  color: hsl(var(--txt-tertiary));
  font-size: 14px;
  margin: 0;
  text-align: center;
}

/* 错误态遮罩样式 */
.subapp-error-mask {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: hsl(var(--txt-tertiary));
  text-align: center;
}

.error-app {
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--txt-primary));
  margin: 0;
}

.error-title {
  font-size: 15px;
  font-weight: 500;
  color: hsl(var(--txt-secondary));
  margin: 0;
}

.error-msg {
  font-size: 14px;
  margin: 0;
  word-break: break-all;
}

.error-hint {
  font-size: 12px;
  color: hsl(var(--txt-disabled));
  margin: 0;
}

.retry-button {
  margin-top: 12px;
  padding: 6px 20px;
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--txt-primary));
  background: hsl(var(--surface-1));
  border: 1px solid hsl(var(--border));
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.retry-button:hover {
  background: hsl(var(--surface-2));
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
