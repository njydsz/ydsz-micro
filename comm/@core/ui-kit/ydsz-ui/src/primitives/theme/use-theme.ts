/**
 * useTheme composable —— 运行时主题 API，支持单/批量修改 CSS 变量 + loose 密度档。
 *
 * 设计目标：
 *  - 提供类型安全的 token 读写接口；
 *  - 封装 CSSStyleDeclaration.setProperty 细节，统一到 set() / get() / bulk()；
 *  - 内置 light / dark / compact / loose 四种 preset；
 *  - 暴露元信息（isDark、当前 preset、已覆盖 token 数量）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\use-theme.ts
 * @author ydsz-team
 * @since 5.6.0
 */

import { ref } from 'vue';

import { themeTokens } from './theme-schema';

import type { TokenName } from './theme-schema';

/** 主题 preset 定义：一组 token 覆盖值的映射 */
export type ThemePreset = Partial<Record<TokenName, string>>;

/** 主题配置输入 */
export type ThemeConfig = Partial<Record<TokenName, string>>;

/** useTheme 返回的句柄接口 */
export interface ThemeHandle {
  set: (name: TokenName, value: string) => void;
  get: (name: TokenName) => string | null;
  bulk: (config: ThemeConfig) => void;
  applyPreset: (name: string, preset?: ThemePreset) => void;
  reset: () => void;
  toggleDark: (force?: boolean) => void;
  target: (element: HTMLElement) => ThemeHandle;
  isDark: () => boolean;
  overrideCount: () => number;
  /** 当前激活的 preset 名称 */
  currentPreset: () => string | null;
}

/** preset 注册表类型 */
export type PresetRegistry = Record<string, ThemePreset>;

/** 内置 preset 注册表 */
function createPresetRegistry(): PresetRegistry {
  return {
    light: Object.fromEntries(
      Object.entries(themeTokens)
        .filter(([, def]) => !def.darkValue)
        .map(([name, def]) => [name, def.defaultValue]),
    ),
    dark: Object.fromEntries(
      Object.entries(themeTokens)
        .filter(([, def]) => !!def.darkValue)
        .map(([name, def]) => [name, def.darkValue!]),
    ),
    compact: {
      'text-10': '0.6rem',
      'text-12': '0.7rem',
      'text-14': '0.8rem',
      'text-16': '0.9rem',
      radius: 'calc(0.5rem - 2px)',
      'radius-sm': 'calc(0.5rem - 6px)',
    },
    loose: {
      'text-10': '0.65rem',
      'text-12': '0.78rem',
      'text-14': '0.9rem',
      'text-16': '1.05rem',
      radius: 'calc(0.5rem + 2px)',
      'radius-lg': 'calc(0.5rem + 6px)',
      'radius-xl': 'calc(0.5rem + 8px)',
    },
  };
}

/* eslint-disable @typescript-eslint/typedef */
/**
 * useTheme —— 创建运行时主题句柄。
 *
 * @param options - 配置项
 * @returns 主题句柄
 */
export function useTheme(options: {
  rootElement?: HTMLElement;
  initialPreset?: string;
  /** 默认密度：default | compact | loose */
  density?: 'default' | 'compact' | 'loose';
} = {}): ThemeHandle {
  const { rootElement, initialPreset, density = 'default' } = options;

  /** 当前作用域根元素 */
  const currentRoot = ref<HTMLElement>(
    rootElement ?? (globalThis.document?.documentElement as HTMLElement),
  );

  /** 内部状态：已覆盖的 token 集合 */
  const overrides = ref<Map<TokenName, string>>(new Map());

  /** preset 注册表 */
  const presets = ref<PresetRegistry>(createPresetRegistry());

  /** 当前激活的 preset 名 */
  const activePreset = ref<string | null>(null);

  function getStyle(): CSSStyleDeclaration | Record<string, string> {
    const el = currentRoot.value;
    if (!el || !el.style) {
      return {};
    }
    return el.style as CSSStyleDeclaration;
  }

  function set(name: TokenName, value: string): void {
    if (!themeTokens[name]) {
      console.warn(`[theme] Unknown token: "${name}", skipping.`);
      return;
    }
    const style = getStyle();
    if (style.setProperty) {
      style.setProperty(`--${themeTokens[name].cssVar}`, value);
    }
    overrides.value.set(name, value);
  }

  function get(name: TokenName): string | null {
    return overrides.value.get(name) ?? null;
  }

  function bulk(config: ThemeConfig): void {
    const style = getStyle();
    if (!style.setProperty) return;
    for (const [name, value] of Object.entries(config)) {
      const tokenName = name as TokenName;
      if (!themeTokens[tokenName]) continue;
      style.setProperty(`--${themeTokens[tokenName].cssVar}`, value);
      overrides.value.set(tokenName, value);
    }
  }

  function applyPreset(name: string, preset?: ThemePreset): void {
    const targetPreset = preset ?? presets.value[name];
    if (!targetPreset) {
      console.warn(`[theme] Preset "${name}" not found.`);
      return;
    }
    bulk(targetPreset);
    activePreset.value = name;
    if (name === 'dark') {
      toggleDark(true);
    } else if (name === 'light') {
      toggleDark(false);
    }
  }

  function reset(): void {
    const style = getStyle();
    if (!style.removeProperty) return;
    for (const name of overrides.value.keys()) {
      style.removeProperty(`--${themeTokens[name].cssVar}`);
    }
    overrides.value.clear();
    activePreset.value = null;
    currentRoot.value?.classList.remove('dark');
  }

  function toggleDark(force?: boolean): void {
    const el = currentRoot.value;
    if (!el) return;
    const next = typeof force === 'boolean'
      ? force
      : !el.classList.contains('dark');
    el.classList.toggle('dark', next);
  }

  function target(element: HTMLElement): ThemeHandle {
    const newHandle = useTheme({ density, rootElement: element });
    newHandle.bulk(Object.fromEntries(overrides.value));
    return newHandle;
  }

  /** 初始化：应用密度档 + 预设主题 */
  const initialDensity = density !== 'default' ? density : undefined;
  if (initialDensity && presets.value[initialDensity]) {
    applyPreset(initialDensity);
  }
  if (initialPreset && presets.value[initialPreset]) {
    applyPreset(initialPreset);
  }

  return {
    applyPreset,
    bulk,
    currentPreset: () => activePreset.value,
    get,
    isDark: () => currentRoot.value?.classList.contains('dark') ?? false,
    overrideCount: () => overrides.value.size,
    reset,
    set,
    target,
    toggleDark,
  };
}

/** 全局默认主题句柄（懒初始化） */
let defaultHandle: ThemeHandle | null = null;

export function getTheme(): ThemeHandle {
  if (!defaultHandle) {
    defaultHandle = useTheme();
  }
  return defaultHandle;
}

/**
 * 注册自定义 preset。
 *
 * @param name - preset 名（如 'brand-ocean'）
 * @param preset - token 覆盖映射
 */
export function registerPreset(name: string, preset: ThemePreset): void {
  const handle = getTheme();
  handle.applyPreset(name, preset);
}

/** 重新导出类型 */
export type { TokenName } from './theme-schema';
export type { ThemePreset, ThemeConfig, ThemeHandle };
/* eslint-enable @typescript-eslint/typedef */
