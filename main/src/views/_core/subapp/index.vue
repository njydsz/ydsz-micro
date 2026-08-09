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
 *
 * @path main\src\views\_core\subapp\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";

import type { MicroAppConfig } from "@ydsz/micro-runtime";

import { microRuntime } from "#/bootstrap";
import { $t } from "#/locales";

import { useSubAppPhase } from "./composables/use-subapp-phase";
import { useSkeletonResolver } from "./composables/use-skeleton-resolver";

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
  showSkeleton,
  showErrorMask,
  errorMaskTitle,
  errorMaskHint,
  setPhase,
  setError,
} = useSubAppPhase(subappContainerRef);

/** 骨架屏组件解析（computed 自动追踪 route.path，无需手动 watch） */
const pageSkeletonComponent = useSkeletonResolver(state.activeAppName, route);

/** 取消订阅函数集合，组件卸载时统一调用 */
const unsubscribers: Array<() => void> = [];

onMounted(() => {
  if (!microRuntime) {
    // 内核尚未初始化（理论上 bootstrap 已同步注册，防御性处理）
    console.warn("[SubAppContainer] microRuntime not ready");
    return;
  }

  // beforeLoad: 子应用开始加载 ESM 模块（10%）
  unsubscribers.push(
    microRuntime.addLifecycleHook("beforeLoad", (app: MicroAppConfig) => {
      setPhase("loading", app.name);
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
      // 100% 后短暂保持，再切回 idle 以便复用
      window.setTimeout(() => {
        if (state.phase.value === "mounted") setPhase("idle");
      }, 300);
    }),
  );

  // afterUnmount: 子应用卸载完成（切换中的过渡态）
  unsubscribers.push(
    microRuntime.addLifecycleHook("afterUnmount", (app: MicroAppConfig) => {
      // 若当前激活应用仍是被卸载的应用，进入 unmounting 过渡
      if (state.activeAppName.value === app.name) {
        setPhase("unmounting", null);
      }
    }),
  );

  // error: 加载或挂载失败
  unsubscribers.push(
    microRuntime.addLifecycleHook(
      "error",
      (app: MicroAppConfig, err: unknown) => {
        setError(err, app.name);
      },
    ),
  );

  // 兜底：若初始路由已命中子应用但 beforeLoad 触发晚于组件挂载，
  // 通过当前激活应用名回填一次状态
  const active = microRuntime.getActiveAppName();
  if (active && state.phase.value === "idle") {
    setPhase("mounted", active);
  }
});

onUnmounted(() => {
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

    <!-- 子应用挂载容器 -->
    <div
      id="subapp-container"
      ref="subappContainerRef"
      class="subapp-container"
      role="region"
      :aria-label="$t('page.microKernel.containerLabel')"
      :aria-busy="showSkeleton()"
      :class="{ 'is-loading': showSkeleton(), 'has-error': showErrorMask() }"
    >
      <!-- 页面级骨架屏（优先取自 manifest.routes，回退到路由 meta.skeletonType） -->
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
      </div>
    </div>
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

/* 骨骼屏包装器样式 */
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
    var(--el-color-primary-light-5, #409eff) 0%,
    var(--el-color-primary, #409eff) 100%
  );
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loading-text {
  color: var(--el-text-color-secondary, #909399);
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
  color: var(--el-text-color-secondary, #909399);
  text-align: center;
}

.error-app {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  margin: 0;
}

.error-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-regular, #606266);
  margin: 0;
}

.error-msg {
  font-size: 14px;
  margin: 0;
  word-break: break-all;
}

.error-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
  margin: 0;
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
