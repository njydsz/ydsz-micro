/**
 * 命令面板搜索逻辑 —— 封装搜索过滤、键盘导航与命令分组的响应式计算
 *
 * @path main\src\components\command-palette\composables\use-command-search.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { computed, type ComputedRef, type Ref, watch } from "vue";

import type { SearchItem } from "#/hooks/use-global-search";

// ==================== 类型定义 ====================

/** 面板模式：搜索 / 命令 */
export type PaletteMode = "command" | "search";

/**
 * 命令项定义
 *
 * 描述命令面板中单个命令的数据结构。
 *
 * @since 4.0.0
 */
export interface CommandItem {
  /** 命令执行函数 */
  action: () => Promise<void> | void;
  /** 所属子应用名 */
  appName?: string;
  /** 命令分类（用于分组展示） */
  category?: string;
  /** 图标（emoji 或类名） */
  icon?: string;
  /** 唯一标识 */
  id: string;
  /** 快捷键提示 */
  shortcut?: string;
  /** 命令标题 */
  title: string;
}

/**
 * 最近访问项定义
 *
 * 描述命令面板中单个最近访问记录的数据结构。
 *
 * @since 4.0.0
 */
export interface RecentItem {
  /** 所属子应用名 */
  appName: string;
  /** 唯一标识 */
  id: string;
  /** 路由路径 */
  path: string;
  /** 访问时间戳 */
  timestamp: number;
  /** 页面标题 */
  title: string;
}

// ==================== Composable 选项 ====================

/**
 * use-command-search 选项
 *
 * @since 4.0.0
 */
export interface UseCommandSearchOptions {
  /** 搜索查询词 */
  query: Ref<string>;
  /** 面板模式 */
  mode: Ref<PaletteMode>;
  /** 搜索项列表（来自 props） */
  items: () => SearchItem[];
  /** 已注册的命令表 */
  commands: Ref<Map<string, CommandItem[]>>;
  /** 最近访问列表 */
  recentItems: Ref<RecentItem[]>;
  /** 当前活跃项索引 */
  activeIndex: Ref<number>;
  /** 子应用名到显示名的映射（来自 props） */
  appNameLabels?: () => Record<string, string> | undefined;
  /** 搜索提供者数量 */
  searchProviderCount: Ref<number>;
  /** 搜索提供者应用名列表 */
  searchProviderNames: Ref<string[]>;
  /** 关闭面板回调 */
  close: () => void;
  /** 记录最近访问回调 */
  recordRecentAccess: (item: SearchItem) => void;
}

// ==================== Composable 返回值 ====================

/**
 * use-command-search 返回值
 *
 * @since 4.0.0
 */
export interface UseCommandSearchReturn {
  /** 搜索结果 */
  searchResults: ComputedRef<Array<SearchItem & { _kind: "search"; highlightedTitle: string }>>;
  /** 命令结果 */
  commandResults: ComputedRef<Array<CommandItem & { _kind: "command" }>>;
  /** 最近访问结果 */
  recentResults: ComputedRef<Array<RecentItem & { _kind: "recent" }>>;
  /** 综合结果（命令模式仅命令，搜索模式为最近+搜索） */
  results: ComputedRef<Array<
    (SearchItem & { _kind: "search"; highlightedTitle: string })
    | (CommandItem & { _kind: "command" })
    | (RecentItem & { _kind: "recent" })
  >>;
  /** 输入框占位符文本 */
  placeholder: ComputedRef<string>;
  /** 搜索提供者状态栏文案 */
  searchProviderStatus: ComputedRef<string>;
  /** 键盘导航（上下移动选中项） */
  navigate: (dir: number) => void;
  /** 确认执行当前选中项 */
  handleEnter: () => void;
}

// ==================== 高亮工具函数 ====================

/**
 * 高亮搜索关键词（包裹 <mark> 标签）。
 *
 * @param text - 原始文本
 * @param query - 搜索词（已 toLowerCase）
 * @returns 高亮后的 HTML 字符串
 */
function highlightMatch(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return `${text.slice(0, idx)}<mark>${text.slice(idx, idx + query.length)}</mark>${text.slice(idx + query.length)}`;
}

// ==================== Composable ====================

/**
 * 命令面板搜索逻辑 composable
 *
 * 封装搜索过滤、键盘导航、命令分组等核心交互逻辑。
 *
 * @param options - 搜索逻辑所需的状态与回调
 * @returns 计算属性与操作方法
 *
 * @example
 * ```ts
 * const {
 *   results, placeholder, searchProviderStatus,
 *   navigate, handleEnter,
 * } = useCommandSearch({
 *   query, mode, items: () => props.items,
 *   commands, recentItems, activeIndex,
 *   searchProviderCount, searchProviderNames,
 *   close, recordRecentAccess,
 * });
 * ```
 *
 * @since 4.0.0
 */
export function useCommandSearch(options: UseCommandSearchOptions): UseCommandSearchReturn {
  const {
    query,
    mode,
    items,
    commands,
    recentItems,
    activeIndex,
    searchProviderCount,
    searchProviderNames,
    close,
    recordRecentAccess,
  } = options;

  // ==================== Computed ====================

  /** 搜索结果 */
  const searchResults = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return [] as Array<SearchItem & { _kind: "search"; highlightedTitle: string }>;
    return items()
      .map((item) => {
        const titleIdx = item.title.toLowerCase().indexOf(q);
        const descIdx = item.description?.toLowerCase().indexOf(q) ?? -1;
        if (titleIdx === -1 && descIdx < 0) return null;
        const highlightedTitle = highlightMatch(item.title, q);
        return { ...item, highlightedTitle, _kind: "search" as const };
      })
      .filter(
        (x): x is SearchItem & { _kind: "search"; highlightedTitle: string } =>
          x !== null,
      )
      .slice(0, 20);
  });

  /** 命令结果 */
  const commandResults = computed(() => {
    const q = query.value.trim().toLowerCase();
    const allCommands: Array<CommandItem & { _kind: "command" }> = [];

    for (const [, cmds] of commands.value) {
      for (const cmd of cmds) {
        if (
          !q ||
          cmd.title.toLowerCase().includes(q) ||
          cmd.category?.toLowerCase().includes(q)
        ) {
          allCommands.push({ ...cmd, _kind: "command" });
        }
      }
    }

    return allCommands.slice(0, 20);
  });

  /** 最近访问 */
  const recentResults = computed((): Array<RecentItem & { _kind: "recent" }> => {
    if (query.value.trim()) return [];
    return recentItems.value
      .slice(0, 5)
      .map((r) => ({ ...r, _kind: "recent" as const }));
  });

  /** 综合结果 */
  const results = computed(() => {
    if (mode.value === "command") return commandResults.value;
    return [...recentResults.value, ...searchResults.value];
  });

  /** 占位符文本 */
  const placeholder = computed(() => {
    if (mode.value === "command") return "输入命令... (⌘⇧P)";
    return "搜索菜单、功能、操作... (⌘K)";
  });

  /** P2-2: 搜索提供者状态栏文案 */
  const searchProviderStatus = computed(() => {
    const count = searchProviderCount.value;
    if (count === 0) return "暂无搜索数据源";
    return `已加载 ${count} 个数据源${searchProviderNames.value.length > 0 ? ` · ${searchProviderNames.value.slice(0, 3).join(", ")}${count > 3 ? "…" : ""}` : ""}`;
  });

  // ==================== Methods ====================

  /**
   * 键盘导航 — 上下移动选中项
   *
   * @param dir - 移动方向（-1 上 / +1 下）
   */
  function navigate(dir: number) {
    const len = results.value.length;
    if (!len) return;
    activeIndex.value = (activeIndex.value + dir + len) % len;
  }

  /**
   * 确认执行当前选中项
   *
   * 根据选中项类型执行对应操作：
   * - command：调用 action()
   * - recent：跳转到 path
   * - search：调用 onClick() 或跳转到 path
   */
  function handleEnter() {
    const item = results.value[activeIndex.value];
    if (!item) return;

    if (item._kind === "command") {
      close();
      item.action();
    } else if (item._kind === "recent") {
      close();
      window.dispatchEvent(
        new CustomEvent("micro-kernel:navigate", { detail: { path: item.path } }),
      );
    } else {
      // search
      close();
      if (item.onClick) {
        item.onClick();
      } else if (item.path) {
        recordRecentAccess(item);
        window.dispatchEvent(
          new CustomEvent("micro-kernel:navigate", {
            detail: { path: item.path },
          }),
        );
      }
    }
  }

  // ==================== Watchers ====================

  /** 搜索词变化时重置活跃索引 */
  watch(query, () => {
    activeIndex.value = 0;
  });

  /** 模式切换时重置活跃索引 */
  watch(mode, () => {
    activeIndex.value = 0;
  });

  // ==================== Return ====================

  return {
    searchResults,
    commandResults,
    recentResults,
    results,
    placeholder,
    searchProviderStatus,
    navigate,
    handleEnter,
  };
}
