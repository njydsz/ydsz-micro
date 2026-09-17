/**
 * useTheme composable —— 运行时主题 API，支持单个 / 批量修改 CSS 变量。
 *
 * 设计目标：
 *  - 提供类型安全的 token 读写接口（基于 @see TokenName 联合类型）；
 *  - 封装 CSSStyleDeclaration.setProperty 细节，统一到 set() / get() / bulk()；
 *  - 内置常见 preset（light / dark / compact），开箱即用；
 *  - 暴露当前主题元信息（是否为 dark、当前 preset 名、已覆盖 token 数量）。
 *
 * 与 Tailwind 配置的分工：
 *  - Tailwind config 只定义「静态类名 → CSS 变量引用」；
 *  - useTheme 运行时直接修改 CSS 变量的值（影响所有已渲染的组件）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\theme\use-theme.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { ref } from 'vue';

import { themeTokens } from './theme-schema';

import type { TokenName } from './theme-schema';

/** 主题 preset 定义：一组 token 覆盖值的映射 */
export type ThemePreset = Partial<Record<TokenName, string>>;

/**
 * 主题配置输入：可由调用方一次性覆盖多个 token。
 *
 * 值遵循 CSS 变量赋值语法（不含 -- 前缀），颜色类 token 建议传 HSL 如 '210 40% 96%'。
 */
export type ThemeConfig = Partial<Record<TokenName, string>>;

/**
 * useTheme 返回的句柄接口。
 */
export interface ThemeHandle {
  /** 设置单个 token 的值（立即生效） */
  set: (name: TokenName, value: string) => void;
  /** 获取 token 的当前值（运行时解析，非预设默认值） */
  get: (name: TokenName) => string | null;
  /** 批量设置 token（仅一次 DOM 写入，性能优于多次 set） */
  bulk: (config: ThemeConfig) => void;
  /** 应用预设主题 */
  applyPreset: (name: string, preset: ThemePreset) => void;
  /** 重置所有已覆盖的 token，回退到 CSS 中声明的默认值 */
  reset: () => void;
  /** 切换暗黑模式 */
  toggleDark: (force?: boolean) => void;
  /** 目标元素（默认 document.documentElement），用于限定作用域 */
  target: (element: HTMLElement) => ThemeHandle;
  /** 是否为暗黑模式 */
  isDark: (() => boolean) | undefined;
  /** 当前已覆盖的 token 数量，用于调试面板 */
  overrideCount: () => number;
}

/**
 * 内置 preset 注册表：可被 applyPreset 一键切换。
 *
 * 业务方可通过 registerPreset 注入自定义 preset（如品牌色变体）。
 */
export type PresetRegistry = Record<string, ThemePreset>;

function createPresetRegistry(): PresetRegistry {
  return {
    // Light 预设：恢复框架默认值
    light: Object.fromEntries(
      Object.entries(themeTokens)
        .filter(([, def]) => !def.darkValue)
        .map(([name, def]) => [name, def.defaultValue]),
    ),
    // Dark 预设：把有 darkValue 的 token 切换到黑暗值
    dark: Object.fromEntries(
      Object.entries(themeTokens)
        .filter(([, def]) => !!def.darkValue)
        .map(([name, def]) => [name, def.darkValue!]),
    ),
    // 紧凑模式：缩小字号与间距
    compact: {
      'text-10': '0.6rem',
      'text-12': '0.7rem',
      'text-14': '0.8rem',
      'text-16': '0.9rem',
    },
  };
}

/**
 * useTheme —— 创建一个运行时主题的句柄。
 *
 * @param options - 配置项
 * @returns 主题句柄
 *
 * @example
 * ```ts
 * const theme = useTheme();
 * theme.set('primary', '210 40% 40%');        // 单个覆盖
 *
 * theme.bulk({                               // 批量覆盖
 *   'radius': '0.75rem',
 *   'shadow-raised-100': 'none',
 * });
 *
 * theme.applyPreset('dark');                  // 切换暗黑
 * theme.toggleDark();                          // 切换
 * theme.reset();                               // 全部恢复
 * ```
 *
 * @since 1.0.0
 */
export function useTheme(options: {
  /** 作用域根元素，默认 document.documentElement */
  rootElement?: HTMLElement;
  /** 初始 preset 名 */
  initialPreset?: string;
} = {}): ThemeHandle {
  const { rootElement, initialPreset } = options;

  /** 当前作用域根元素 */
  const currentRoot = ref<HTMLElement>(
    rootElement ?? (globalThis.document?.documentElement as HTMLElement),
  );

  /** 内部状态：已覆盖的 token 集合 */
  const overrides = ref<Map<TokenName, string>>(new Map());

  /** preset 注册表（支持运行时扩展） */
  const presets = ref<PresetRegistry>(createPresetRegistry());

  /**
   * 获取根元素的 style 声明；SSR 下返回空对象避免报错。
   *
   * @return CSSStyleDeclaration 或空对象
   */
  function getStyle(): CSSStyleDeclaration | Record<string, string> {
    const el = currentRoot.value;
    if (!el || !el.style) {
      return {};
    }
    return el.style as CSSStyleDeclaration;
  }

  /**
   * 设置单个 CSS 变量的值（立即写入内联样式）。
   *
   * @param name - token 名称
   * @param value - CSS 值
   */
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

  /**
   * 读取某个 token 的运行时计算值。
   *
   * @param name - token 名称
   * @return 值字符串，未覆盖时返回 null
   */
  function get(name: TokenName): string | null {
    return overrides.value.get(name) ?? null;
  }

  /**
   * 批量写入 token（减少 DOM 操作次数）。
   *
   * @param config - token → value 映射
   */
  function bulk(config: ThemeConfig): void {
    const style = getStyle();
    if (!style.setProperty) return;

    for (const [name, value] of Object.entries(config)) {
      const tokenName = name as TokenName;
      if (!themeTokens[tokenName]) continue;
      style.setProperty(
        `--${themeTokens[tokenName].cssVar}`,
        value,
      );
      overrides.value.set(tokenName, value);
    }
  }

  /**
   * 应用命名 preset，合并覆盖当前状态。
   *
   * @param name - preset 名
   * @param preset - 可选：临时 preset（若不在注册表中）
   */
  function applyPreset(name: string, preset?: ThemePreset): void {
    const targetPreset = preset ?? presets.value[name];
    if (!targetPreset) {
      console.warn(`[theme] Preset "${name}" not found.`);
      return;
    }
    bulk(targetPreset);
    if (name === 'dark') {
      toggleDark(true);
    } else if (name === 'light') {
      toggleDark(false);
    }
  }

  /**
   * 重置所有已覆盖 token：移除内联样式中对应的 CSS 变量。
   */
  function reset(): void {
    const style = getStyle();
    if (!style.removeProperty) return;

    for (const name of overrides.value.keys()) {
      style.removeProperty(`--${themeTokens[name].cssVar}`);
    }
    overrides.value.clear();
    // 移除 dark 类
    currentRoot.value?.classList.remove('dark');
  }

  /**
   * 切换暗黑模式：在根元素上添加/移除 dark 类。
   *
   * @param force - 强制指定状态（true=开, false=关）
   */
  function toggleDark(force?: boolean): void {
    const el = currentRoot.value;
    if (!el) return;
    const next =
      typeof force === 'boolean'
        ? force
        : !el.classList.contains('dark');
    el.classList.toggle('dark', next);
  }

  /**
   * 限定主题的 CSS 变量作用域到某个元素（如只改侧边栏）。
   * 返回新的句柄实例，不会改变原句柄。
   *
   * @param element - 目标根元素
   * @return 新的主题句柄
   */
  function target(element: HTMLElement): ThemeHandle {
    const newHandle = useTheme({ rootElement: element });
    // 同步当前 overrides 到新句柄
    newHandle.bulk(Object.fromEntries(overrides.value));
    return newHandle;
  }

  /** 初始化：若指定 initialPreset 则立即应用 */
  if (initialPreset && presets.value[initialPreset]) {
    applyPreset(initialPreset);
  }

  return {
    applyPreset,
    bulk,
    get,
    isDark: () => currentRoot.value?.classList.contains('dark') ?? false,
    overrideCount: () => overrides.value.size,
    reset,
    set,
    target,
    toggleDark,
  };
}

/**
 * 全局默认主题句柄，便于在不方便 provide/inject 的场景下直接 import 使用。
 *
 * 推荐通过 `useTheme()` 局部调用，获得作用域隔离；全局单例仅作 fallback。
 */
let defaultHandle: ThemeHandle | null = null;

/**
 * 获取全局默认主题句柄（懒初始化）。
 *
 * @return 主题句柄
 */
export function getTheme(): ThemeHandle {
  if (!defaultHandle) {
    defaultHandle = useTheme();
  }
  return defaultHandle;
}

/**
 * 注册自定义 preset：业务品牌色、客户定制主题等。
 *
 * @param name - preset 名（如 'brand-ocean'）
 * @param preset - token 覆盖映射
 */
export function registerPreset(name: string, preset: ThemePreset): void {
  const handle = getTheme();
  handle.applyPreset(name, preset);
}

/** 重新导出类型供外部直接使用 */
export { TokenCategory };
export type { TokenDefinition, TokenName } from './theme-schema';
export type { ThemePreset, ThemeConfig, ThemeHandle };
