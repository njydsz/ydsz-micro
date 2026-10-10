/**
 * 主题切换 composable：管理 light / dark / auto 三类主题偏好。
 *
 * 默认行为：先读 localStorage('ydsz-theme')，未命中时回退 prefers-color-scheme。
 * setTheme 会将选择写入 html[data-theme] 与 localStorage，
 * 'auto' 模式不写 data-theme，改为监听系统变化动态切换。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-theme.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import type { ComputedRef, Ref } from 'vue';

import { computed, ref, watch } from 'vue';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/** localStorage 键名 */
const THEME_STORAGE_KEY = 'ydsz-theme';

/** 宽作用域单例，避免多次调用产生重复监听 */
let sharedState: {
  theme: Ref<ThemeMode>;
  systemDark: MediaQueryList | null;
  listener: ((e: MediaQueryListEvent) => void) | null;
} | null = null;

/**
 * 获取系统是否为暗色模式。
 *
 * @returns 系统是否为暗色
 */
function getSystemDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * 从 localStorage 解析主题值，超限回退 'auto'。
 *
 * @returns 已持久化的主题偏好；无效或非 'light' | 'dark' | 'auto' 时返回 null
 */
function parseStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
  } catch {
    // localStorage 不可用时静默降级
  }
  return null;
}

/**
 * 根据当前主题模式计算实际渲染的明暗状态。
 *
 * @param mode - 主题模式
 * @returns 暗色模式时为 true
 */
function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'auto') {
    return getSystemDark();
  }
  return mode === 'dark';
}

/**
 * 将主题应用到 document 与 localStorage。
 *
 * @param mode - 主题模式
 */
function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const isDark = resolveDark(mode);

  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.dataset.theme = mode;
  }

  // 同步 data-theme-dark 布尔标记，便于 CSS 选择器精准命中
  root.dataset.themeDark = String(isDark);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // 隐私模式下可能抛错，静默忽略
  }
}

/**
 * 初始化并获取主题单例状态，供 ConfigProvider 在应用启动时调用一次。
 *
 * 内部采用惰性单例：首次调用时读取持久化偏好并建立系统主题监听，
 * 后续调用返回同一组 ref，避免重复注册事件。
 *
 * @returns 含 theme / setTheme / toggleTheme / isDark 的组合句柄
 *
 * @example
 * ```ts
 * const { theme, setTheme, toggleTheme } = initTheme();
 * setTheme('dark');
 * ```
 */
export function initTheme(): {
  theme: Ref<ThemeMode>;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: ComputedRef<boolean>;
} {
  if (sharedState) {
    return {
      theme: sharedState.theme,
      setTheme: setThemeFn,
      toggleTheme: toggleThemeFn,
      isDark: computed(() => resolveDark(sharedState!.theme.value)),
    };
  }

  const stored = parseStoredTheme();
  const theme = ref<ThemeMode>(stored ?? 'auto');

  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = (e: MediaQueryListEvent): void => {
    if (theme.value === 'auto') {
      document.documentElement.dataset.themeDark = String(e.matches);
    }
  };
  mql.addEventListener('change', onSystemChange);

  sharedState = {
    listener: onSystemChange,
    systemDark: mql,
    theme,
  };

  // 数据就绪后立即同步一次 DOM，避免首帧闪烁
  applyTheme(theme.value);

  // 持久化变化时重新应用
  watch(theme, (mode) => {
    applyTheme(mode);
  });

  return {
    theme,
    setTheme: setThemeFn,
    toggleTheme: toggleThemeFn,
    isDark: computed(() => resolveDark(theme.value)),
  };
}

/**
 * 设置主题模式（响应式 + 持久化 + DOM 同步）。
 *
 * @param mode - 目标主题模式
 */
function setThemeFn(mode: ThemeMode): void {
  if (!sharedState) {
    // 未调用 initTheme 时兜底初始化
    initTheme();
  }
  sharedState!.theme.value = mode;
}

/**
 * 在 light / dark 之间切换（不影响 auto 模式的语义）。
 *
 * 当前已是 'dark' 则切到 'light'，其余一律切到 'dark'。
 */
function toggleThemeFn(): void {
  if (!sharedState) {
    initTheme();
  }
  const current = sharedState!.theme.value;
  sharedState!.theme.value = current === 'dark' ? 'light' : 'dark';
}

/**
 * 面向组件实例的 composable，内部复用 initTheme 单例。
 *
 * 在组件 setup 阶段调用，即可获得响应式的主题状态与控制方法；
 * 多次调用不会重复注册监听。
 *
 * @returns 含 theme / setTheme / toggleTheme / isDark 的主题句柄
 *
 * @example
 * ```vue
 * <script setup>
 * const { isDark, toggleTheme } = useTheme();
 * </script>
 * <template>
 *   <button @click="toggleTheme">{{ isDark ? '亮色' : '暗色' }}</button>
 * </template>
 * ```
 */
export function useTheme(): {
  theme: Ref<ThemeMode>;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: ComputedRef<boolean>;
} {
  return initTheme();
}

export { applyTheme as applyThemeToDocument };
