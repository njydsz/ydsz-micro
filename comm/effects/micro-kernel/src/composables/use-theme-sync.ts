/**
 * 主子应用主题运行时同步 composable
 *
 * 微前端场景下主应用切换主题后，子应用自动跟随。
 * 与 useLocaleSync 结构类似，但仅涉及 'light' | 'dark' | 'auto' 三种模式。
 *
 * 使用方式：
 * - 主应用（provider）：
 *   ```ts
 *   import { useThemeSync } from '@ydsz/micro-kernel/composables';
 *   const { theme, setTheme } = useThemeSync();
 *   setTheme('dark');  // 所有子应用自动同步
 *   ```
 *
 * - 子应用（consumer）：
 *   ```ts
 *   import { useThemeSync } from '@ydsz/micro-kernel/composables';
 *   const { theme } = useThemeSync({
 *     initialTheme: props.context?.theme,
 *   });
 *   // theme 自动跟随主应用变化，document.documentElement 类名同步更新
 *   ```
 *
 * @path comm/effects/micro-kernel/src/composables/use-theme-sync.ts
 * @author ydsz-team
 * @since 4.2.0
 */

import { onUnmounted, ref } from 'vue';

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto';

// ==================== 模块级共享状态 ====================

/**
 * 跨应用共享主题状态单例。
 *
 * @remarks
 * 与 useLocaleSync 共享同一模块总线的变体，独立状态避免相互干扰。
 */
const shared = {
  /** 已注册的 theme provider (主应用) */
  provider: null as { getTheme: () => ThemeMode } | null,

  /** 等待 provider 就绪的回调队列 */
  waitingResolvers: [] as Array<(theme: ThemeMode) => void>,

  /** 已注册的 theme consumers */
  consumers: new Set<(theme: ThemeMode) => void>(),
};

// ==================== 主应用 Provider ===========================

/**
 * 注册主题 provider（主应用调用一次）。
 * 此后主应用主题变更会广播到所有子应用。
 *
 * @param getCurrentTheme - 获取当前主题模式的函数
 * @returns 取消注册函数
 */
export function registerThemeProvider(getCurrentTheme: () => ThemeMode): () => void {
  shared.provider = { getTheme: getCurrentTheme };

  const current = getCurrentTheme();
  flushWaitingResolvers(current);

  return () => {
    shared.provider = null;
  };
}

// ==================== Consumer 注册 =============================

/**
 * 订阅主题变更（子应用消费端）。
 *
 * @param callback - 主题变更回调
 * @returns 取消订阅函数
 */
export function onThemeChange(callback: (theme: ThemeMode) => void): () => void {
  // provider 已存在：立即同步
  const current = shared.provider?.getTheme();
  if (current) {
    callback(current);
  }

  shared.consumers.add(callback);
  return () => {
    shared.consumers.delete(callback);
  };
}

// ==================== 内部工具 ===================================

/**
 * 刷新等待队列：派发主题到所有等待中的 resolver。
 */
function flushWaitingResolvers(theme: ThemeMode): void {
  const resolvers = shared.waitingResolvers.splice(0);
  for (const resolve of resolvers) {
    resolve(theme);
  }
}

/**
 * 根据主题模式计算实际生效的 'light' | 'dark'。
 * 'auto' 模式会检测系统 prefers-color-scheme。
 */
function resolveEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode !== 'auto') return mode;
  // 检测系统主题偏好
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return 'light';
}

/**
 * 在根元素上应用主题类名。
 */
function applyThemeClass(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const effective = resolveEffectiveTheme(mode);
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  // 存储模式到 dataset，便于 CSS 选择器 `[data-theme="auto"]` 使用
  root.dataset.theme = mode;
  // 触发自定义事件，便于非响应式场景监听
  window.dispatchEvent(new CustomEvent('theme-change', { detail: { mode } }));
}

// ==================== 主 Composable ==============================

/**
 * useThemeSync 配置选项。
 */
export interface UseThemeSyncOptions {
  /** 子应用初始主题（来自 mountProps.context.theme） */
  initialTheme?: ThemeMode;

  /** 是否在 provider 未就绪时回退到本地 initialTheme（默认 true） */
  fallbackToLocal?: boolean;

  /**
   * 等待 provider 就绪超时（毫秒）。超时后回退到初始值或 auto。
   * 设 0 则禁用超时。
   */
  providerReadyTimeout?: number;
}

/**
 * useThemeSync 返回类型。
 */
export interface UseThemeSyncReturn {
  /** 当前主题模式（响应式） */
  theme: ReturnType<typeof ref<ThemeMode>>;

  /** 实际生效的 'light' | 'dark'（计算属性式 ref） */
  effectiveTheme: ReturnType<typeof ref<'light' | 'dark'>>;

  /** 设置主题模式（仅主应用调用）。子应用修改也会广播但设计上不推荐 */
  setTheme: (mode: ThemeMode) => void;

  /** 当 provider 未注册时，等待 provider 就绪或超时 */
  whenReady: () => Promise<ThemeMode>;
}

/**
 * 主子应用主题运行时同步 composable。
 *
 * 主应用（provider）：调用 setTheme 时广播到所有子应用。
 * 子应用（consumer）：自动跟随主应用主题变化。
 *
 * @example
 * ```ts
 * // 主应用 main.ts
 * const { theme, setTheme } = useThemeSync();
 * setTheme('dark');
 * ```
 *
 * @example
 * ```ts
 * // 子应用 main.ts
 * export async function mount(props) {
 *   const { theme } = useThemeSync({ initialTheme: props.context?.theme });
 *   // theme 跟随主应用变化，document.documentElement.dark 类名同步更新
 * }
 * ```
 */
export function useThemeSync(options: UseThemeSyncOptions = {}): UseThemeSyncReturn {
  const { initialTheme = 'auto', fallbackToLocal = true, providerReadyTimeout = 2000 } = options;

  const theme = ref<ThemeMode>(initialTheme);
  const effectiveTheme = ref<'light' | 'dark'>(resolveEffectiveTheme(initialTheme));

  // 内部辅助：应用主题并广播
  const applyAndBroadcast = (mode: ThemeMode): void => {
    if (mode === theme.value) return;
    theme.value = mode;
    effectiveTheme.value = resolveEffectiveTheme(mode);
    applyThemeClass(mode);
    // 仅 provider 端广播
    if (isProvider && shared.provider) {
      for (const consumer of shared.consumers) {
        consumer(mode);
      }
    }
  };

  // 判断是否应该作为 provider（无已注册 provider 时自动成为 provider）
  let isProvider = !shared.provider;

  let unregisterProvider: (() => void) | null = null;

  if (isProvider) {
    // 注册为 provider
    unregisterProvider = registerThemeProvider(() => theme.value);
    // 立即应用初始主题
    applyThemeClass(initialTheme);
  } else {
    // consumer：立即同步 provider 的当前主题
    const providerTheme = shared.provider!.getTheme();
    if (providerTheme) {
      theme.value = providerTheme;
      effectiveTheme.value = resolveEffectiveTheme(providerTheme);
      applyThemeClass(providerTheme);
    }
    // 订阅后续变化
    const unsubscribe = onThemeChange((mode) => {
      theme.value = mode;
      effectiveTheme.value = resolveEffectiveTheme(mode);
      applyThemeClass(mode);
    });
    onUnmounted(unsubscribe);
  }

  const whenReady = (): Promise<ThemeMode> => {
    if (shared.provider) {
      return Promise.resolve(shared.provider.getTheme());
    }

    if (providerReadyTimeout === 0) {
      return new Promise<ThemeMode>((resolve) => {
        shared.waitingResolvers.push((mode) => resolve(mode));
      });
    }

    return new Promise<ThemeMode>((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const idx = shared.waitingResolvers.indexOf(resolveWaiting);
        if (idx !== -1) shared.waitingResolvers.splice(idx, 1);
        if (fallbackToLocal) {
          theme.value = initialTheme;
          effectiveTheme.value = resolveEffectiveTheme(initialTheme);
          applyThemeClass(initialTheme);
        }
        resolve(initialTheme);
      }, providerReadyTimeout);

      const resolveWaiting = (mode: ThemeMode) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(mode);
      };

      shared.waitingResolvers.push(resolveWaiting);
    });
  };

  // 卸载时清理 provider 注册
  onUnmounted(() => {
    unregisterProvider?.();
  });

  return {
    theme,
    effectiveTheme,
    setTheme: applyAndBroadcast,
    whenReady,
  };
}

// ==================== 便捷函数 ===================================

/**
 * 为子应用 mount 阶段提供的快捷主题同步调用。
 *
 * 在子应用 mount() 中使用，自动根据 props.context?.theme 初始化。
 *
 * @param initialTheme - mountProps.context?.theme
 * @returns 主题同步返回
 */
export function initThemeForSubApp(initialTheme?: ThemeMode): UseThemeSyncReturn {
  return useThemeSync({
    initialTheme,
    providerReadyTimeout: 3000,
  });
}
