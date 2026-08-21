/**
 * use-command-recent.ts — 最近访问记录管理
 *
 * 提供最近访问项的加载、保存、记录功能。
 *
 * @path main/src/components/command-palette/composables/use-command-recent.ts
 * @author ydsz-team
 * @since 4.1.0
 */

import { ref } from "vue";

import type { RecentItem } from "./use-command-search";

/** 最近访问 localStorage key */
const RECENT_STORAGE_KEY = "ydsz_command_palette_recent";
/** 最大最近访问记录数 */
const MAX_RECENT = 20;

/**
 * 最近访问记录管理
 */
export function useCommandRecent() {
  /** 最近访问（最多20条） */
  const recentItems = ref<RecentItem[]>([]);

  /** 加载最近访问 */
  function loadRecentItems() {
    try {
      const data = localStorage.getItem(RECENT_STORAGE_KEY);
      if (data) recentItems.value = JSON.parse(data);
    } catch {
      // 静默
    }
  }

  /** 保存最近访问 */
  function saveRecentItems() {
    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recentItems.value));
    } catch {
      // 静默
    }
  }

  /**
   * 记录最近访问
   *
   * @param item - 搜索项
   */
  function recordRecentAccess(item: {
    id: string;
    title: string;
    path?: string;
    appName?: string;
  }) {
    if (!item.path) return;
    const existing = recentItems.value.findIndex((r) => r.path === item.path);
    if (existing !== -1) recentItems.value.splice(existing, 1);

    recentItems.value.unshift({
      id: item.id,
      title: item.title,
      path: item.path,
      appName: item.appName || "",
      timestamp: Date.now(),
    });

    recentItems.value = recentItems.value.slice(0, MAX_RECENT);
    saveRecentItems();
  }

  return {
    recentItems,
    loadRecentItems,
    saveRecentItems,
    recordRecentAccess,
  };
}
