/**
 * 子应用加载阶段管理 composable
 *
 * 从 SubAppContainer 拆出：阶段状态机 + 阶段映射 + 无障碍公告 + 焦点管理。
 * 由 micro-kernel 细化生命周期钩子驱动。
 *
 * @path main/src/views/_core/subapp/composables/use-subapp-phase.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import type { Ref } from "vue";

import { computed, ref } from "vue";

import { $t } from "#/locales";

/**
 * 子应用加载阶段 — 由内核细化生命周期钩子驱动（v3.3）。
 *
 *   idle         → 初始/无活跃应用
 *   loading      → beforeLoad 触发后，ESM 模块加载中（10%）
 *   loaded       → afterLoad 触发后，模块就绪等待挂载（60%，短暂过渡）
 *   mounting     → beforeMount 触发后，mount() 调用中（75%）
 *   mounted      → afterMount 触发后，DOM 已挂载（100%）
 *   unmounting   → afterUnmount 触发后，切换中的过渡态（50%）
 *   error        → 加载或挂载失败（0%）
 */
export type LoadingPhase =
  | "error"
  | "idle"
  | "loaded"
  | "loading"
  | "mounted"
  | "mounting"
  | "unmounting";

/** 阶段 → (百分比, i18n key) 映射表，保证进度反映真实生命周期而非随机数。 */
const PHASE_META: Record<LoadingPhase, readonly [number, string]> = {
  idle: [0, ""],
  loading: [10, "page.microKernel.phase.loading"],
  loaded: [60, "page.microKernel.phase.loaded"],
  mounting: [75, "page.microKernel.phase.mounting"],
  mounted: [100, "page.microKernel.phase.mounted"],
  unmounting: [50, "page.microKernel.phase.unmounting"],
  error: [0, "page.microKernel.phase.error"],
};

/** 无障碍公告文案模板（i18n） */
const ANNOUNCEMENT_KEYS: Record<LoadingPhase, string> = {
  idle: "",
  loading: "page.microKernel.announcements.loading",
  loaded: "page.microKernel.announcements.loaded",
  mounting: "page.microKernel.announcements.mounting",
  mounted: "page.microKernel.announcements.mounted",
  unmounting: "page.microKernel.announcements.unmounting",
  error: "page.microKernel.announcements.error",
};

/**
 * 子应用加载阶段状态集合
 *
 * 持有所有响应式状态引用，供组件模板直接访问。
 * 注意：不使用 reactive() 包装 ref，避免自动解包导致响应式丢失。
 *
 * @since 4.1.0
 */
export interface SubAppPhaseState {
  /** 当前阶段 */
  phase: Ref<LoadingPhase>;
  /** 正在加载/激活的子应用名 */
  activeAppName: Ref<null | string>;
  /** 进度百分比（按阶段映射，非随机模拟） */
  progress: Ref<number>;
  /** 阶段对应的提示文案 key */
  phaseTextKey: Ref<string>;
  /** 最近一次错误信息（用于错误态展示） */
  lastError: Ref<null | string>;
}

/**
 * 子应用加载阶段管理 composable
 *
 * 从 SubAppContainer 拆出：阶段状态机 + 阶段映射 + 无障碍公告 + 焦点管理。
 * 由 micro-kernel 细化生命周期钩子驱动（v3.3）。
 *
 * 阶段流转：
 * - idle -> loading -> loaded -> mounting -> mounted
 * - 切换中：mounted -> unmounting -> loading -> ...
 * - 失败：任意阶段 -> error
 *
 * @param containerRef - 子应用容器 DOM 引用（mounted 后焦点管理用）
 * @returns 阶段状态与控制方法
 * @returns state - 阶段状态集合（SubAppPhaseState）
 * @returns phaseText - 当前阶段的展示文案（Computed，i18n）
 * @returns screenReaderAnnouncement - 屏幕阅读器公告文案（Ref）
 * @returns showSkeleton - 是否展示骨架屏的判断函数
 * @returns showErrorMask - 是否展示错误遮罩的判断函数
 * @returns errorMaskTitle - 错误遮罩标题（Computed，i18n）
 * @returns errorMaskHint - 错误遮罩提示（Computed，i18n）
 * @returns setPhase - 切换到指定阶段（更新进度/文案/公告/焦点）
 * @returns setError - 设置错误信息并切换到 error 阶段
 *
 * @example
 * ```ts
 * const containerRef = ref<HTMLElement | null>(null);
 * const { state, setPhase, setError, showSkeleton } = useSubAppPhase(containerRef);
 *
 * // 内核钩子中调用
 * onBeforeLoad(() => setPhase('loading', appName));
 * onAfterMount(() => setPhase('mounted', appName));
 * ```
 *
 * @since 4.1.0
 */
export function useSubAppPhase(containerRef: Ref<HTMLElement | null>) {
  /** 当前阶段 */
  const phase = ref<LoadingPhase>("idle");
  /** 正在加载/激活的子应用名 */
  const activeAppName = ref<null | string>(null);
  /** 进度百分比（按阶段映射，非随机模拟） */
  const progress = ref(0);
  /** 阶段对应的提示文案 key */
  const phaseTextKey = ref("");
  /** 最近一次错误信息（用于错误态展示） */
  const lastError = ref<null | string>(null);
  /** 屏幕阅读器公告文案（随阶段变化） */
  const screenReaderAnnouncement = ref("");

  // 注意：不使用 reactive() 包装 ref —— reactive 会自动解包 ref，
  // 导致 state.phase 退化为原始值而非 Ref。此处用普通对象持有 ref，
  // 组件模板通过 state.phase.value 访问（与响应式语义一致）。
  const state: SubAppPhaseState = {
    phase,
    activeAppName,
    progress,
    phaseTextKey,
    lastError,
  };

  /** 当前阶段的展示文案（i18n） */
  const phaseText = computed(() =>
    phaseTextKey.value ? $t(phaseTextKey.value) : "",
  );

  /** 是否展示骨架屏（loading/loaded/mounting/unmounting） */
  function showSkeleton(): boolean {
    return ["loaded", "loading", "mounting", "unmounting"].includes(
      state.phase.value,
    );
  }

  /** 是否展示错误态（错误由内核 error-boundary 渲染容器内 fallback，此处仅作背景遮罩） */
  function showErrorMask(): boolean {
    return state.phase.value === "error";
  }

  /** 错误遮罩标题文案（i18n） */
  const errorMaskTitle = computed(() =>
    $t("page.microKernel.errorMask.title"),
  );
  /** 错误遮罩提示文案（i18n） */
  const errorMaskHint = computed(() => $t("page.microKernel.errorMask.hint"));

  /**
   * 更新屏幕阅读器公告（无障碍）。
   *
   * 在阶段变化时同步更新 aria-live 区域文案，
   * 屏幕阅读器会自动播报子应用加载进度。
   */
  function updateScreenReaderAnnouncement(
    next: LoadingPhase,
    appName: null | string,
  ): void {
    const appNameText = appName ? ` (${appName})` : "";
    const key = ANNOUNCEMENT_KEYS[next];
    screenReaderAnnouncement.value = key
      ? $t(key, { appName: appNameText })
      : "";
  }

  /**
   * 切换到指定阶段：更新进度/文案/公告，必要时移动焦点。
   */
  function setPhase(
    next: LoadingPhase,
    appName: null | string = state.activeAppName.value,
  ): void {
    const [pct, key] = PHASE_META[next];
    state.phase.value = next;
    state.progress.value = pct;
    state.phaseTextKey.value = key;
    if (appName !== undefined) state.activeAppName.value = appName;
    if (next !== "error") state.lastError.value = null;

    // 无障碍：更新屏幕阅读器公告
    updateScreenReaderAnnouncement(next, state.activeAppName.value);

    // 无障碍：子应用加载完成后移动焦点到容器
    if (next === "mounted" && containerRef.value) {
      const focusable = containerRef.value.querySelector<HTMLElement>(
        'h1, h2, [tabindex="0"], main',
      );
      focusable?.focus();
    }
  }

  /** 设置错误信息（由 error 钩子调用） */
  function setError(err: unknown, appName: null | string): void {
    state.lastError.value = err instanceof Error ? err.message : String(err);
    setPhase("error", appName);
  }

  return {
    // state（组件模板访问）
    state,
    phaseText,
    screenReaderAnnouncement,
    // 展示判断
    showSkeleton,
    showErrorMask,
    errorMaskTitle,
    errorMaskHint,
    // actions
    setPhase,
    setError,
  };
}
