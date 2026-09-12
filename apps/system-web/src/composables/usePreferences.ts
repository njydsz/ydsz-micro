/**
 * 偏好设置 Composable —— 统一管理用户偏好（localStorage 即时生效 + 后端异步持久化）
 *
 * <p>设计：
 * <ul>
 *   <li>轻量偏好（主题色/布局/字体）使用 localStorage，即时生效</li>
 *   <li>用户级偏好（默认首页/语言）通过 HTTP API + localStorage 缓存</li>
 * </ul>
 *
 * @path apps\system-web\src\composables\usePreferences.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, ref } from 'vue';

import { createLogger } from '@ydsz-core/shared/utils';

/** 模块日志器 */
const logger = createLogger('usePreferences');

/** localStorage key 前缀 */
const LS_PREFIX = 'ydsz_pref_';

/** 表格密度 → VxeTable size 映射 */
const TABLE_SIZE_MAP: Record<string, string> = {
  compact: 'mini',
  default: 'small',
  loose: 'medium',
};

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/** 菜单布局 */
export type MenuLayout = 'side' | 'top' | 'mix';

/** 表格密度 */
export type TableSize = 'default' | 'compact' | 'loose';

/** 字体大小 */
export type FontSize = 'small' | 'medium' | 'large';

/** 用户偏好配置（持久化到后端的部分） */
export interface UserPrefConfig {
  defaultIndex: string;
  language: string;
  theme: ThemeMode;
  themeColor: string;
  menuLayout: MenuLayout;
  accordionMenu: boolean;
  tableSize: TableSize;
  fontSize: FontSize;
}

/** 默认配置 */
const DEFAULT_CONFIG: UserPrefConfig = {
  accordionMenu: true,
  defaultIndex: '/system/monitor/dashboard',
  fontSize: 'medium',
  language: 'zh-CN',
  menuLayout: 'side',
  tableSize: 'default',
  theme: 'auto',
  themeColor: '#3b82f6',
};

/**
 * 从 localStorage 加载偏好。
 */
function loadConfig(): UserPrefConfig {
  try {
    const stored = localStorage.getItem(`${LS_PREFIX}user_config`);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UserPrefConfig>;
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    logger.warn('从 localStorage 加载偏好失败', error);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * 持久化偏好到 localStorage 并同步样式到 DOM。
 */
function persistConfig(config: UserPrefConfig): void {
  try {
    localStorage.setItem(`${LS_PREFIX}user_config`, JSON.stringify(config));
  } catch (error) {
    logger.warn('持久化偏好到 localStorage 失败', error);
  }
}

/**
 * 将偏好应用到 DOM（CSS 变量 / class）。
 */
function applyConfigToDOM(config: UserPrefConfig): void {
  const root = document.documentElement;

  // 主题色
  root.style.setProperty('--el-color-primary', config.themeColor);

  // 主题模式
  root.classList.remove('dark', 'light');
  if (config.theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    root.classList.add(config.theme);
  }

  // 字体大小
  const fontSizeMap: Record<FontSize, string> = {
    large: '16px',
    medium: '14px',
    small: '13px',
  };
  root.style.setProperty('--el-font-size-base', fontSizeMap[config.fontSize]);

  // 表格密度（绑定 CSS 变量，VxeTable adapter 读取）
  root.style.setProperty('--ydsz-table-size', TABLE_SIZE_MAP[config.tableSize]);
}

// =====================================================================
// Composable 入口（单例 store）
// =====================================================================

/** 单例状态 */
const configRef = ref<UserPrefConfig>(loadConfig());
let backendSyncInit = false;

export function usePreferences() {
  /**
   * 更新偏好（局部更新，立即生效）。   *
   * @param patch - 需更新的字段
   */
  function update(patch: Partial<UserPrefConfig>): void {
    const next = { ...configRef.value, ...patch };
    configRef.value = next;
    applyConfigToDOM(next);
    persistConfig(next);
  }

  /**
   * 更新单个字段。   */
  function set<K extends keyof UserPrefConfig>(
    key: K,
    value: UserPrefConfig[K],
  ): void {
    update({ [key]: value } as Partial<UserPrefConfig>);
  }

  /**
   * 重置为默认值。   */
  function reset(): void {
    configRef.value = { ...DEFAULT_CONFIG };
    applyConfigToDOM(DEFAULT_CONFIG);
    persistConfig(DEFAULT_CONFIG);
  }

  /**
   * 从后端同步偏好（幂等，仅初始化时调用一次）。   */
  async function syncFromBackend(): Promise<void> {
    if (backendSyncInit) return;
    backendSyncInit = true;
    try {
      const { getUserPreferenceApi } = await import('#/api/core/preference');
      const remote = await getUserPreferenceApi();
      const merged = { ...configRef.value };
      if (remote.defaultIndex) merged.defaultIndex = remote.defaultIndex;
      if (remote.language) merged.language = remote.language;
      if (remote.theme) merged.theme = remote.theme as ThemeMode;
      if (remote.themeColor) merged.themeColor = remote.themeColor;
      if (remote.menuLayout)
        merged.menuLayout = remote.menuLayout as MenuLayout;
      if (remote.accordionMenu !== undefined)
        merged.accordionMenu = remote.accordionMenu;
      if (remote.tableSize)
        merged.tableSize = remote.tableSize as TableSize;
      if (remote.fontSize) merged.fontSize = remote.fontSize as FontSize;
      configRef.value = merged;
      applyConfigToDOM(merged);
      persistConfig(merged);
    } catch (error) {
      logger.warn('从后端同步偏好失败（使用本地缓存）', error);
    }
  }

  /**
   * 保存当前配置到后端。   */
  async function saveToBackend(): Promise<void> {
    try {
      const { saveUserPreferenceApi } = await import('#/api/core/preference');
      await saveUserPreferenceApi({ ...configRef.value });
    } catch (error) {
      logger.warn('保存偏好到后端失败', error);
      throw error;
    }
  }

  /** 获取当前表格密度对应的 VxeTable size */
  function getTableVxeSize(): string {
    return TABLE_SIZE_MAP[configRef.value.tableSize] || 'small';
  }

  return {
    // 状态（响应式）
    config: computed(() => configRef.value),

    // 方法
    getTableVxeSize,
    reset,
    saveToBackend,
    set,
    syncFromBackend,
    update,
  };
}
