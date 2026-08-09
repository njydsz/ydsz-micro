/**
 * Dashboard 数据加载 composable — API 优先，失败/空数据回退到本地默认值
 *
 * 设计目标：后端统计接口就绪前页面不白屏、不报错；
 * 后端就绪后自动切换到真实数据（无需改页面代码）。
 * 类型上接受 UI 组件类型（如 AnalysisOverviewItem / WorkbenchProjectItem），
 * 后端字段与 UI 字段通过字段名对齐（title/totalValue/value 等）。
 *
 * @path main/src/hooks/use-dashboard-data.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { ref } from 'vue';

import type { DashboardApi } from '#/api/core/dashboard';
import {
  getOverviewStatsApi,
  getWorkspaceDataApi,
} from '#/api/core/dashboard';

/**
 * 加载概览统计项。
 *
 * @param fallback - 后端不可用/返回空时的默认数据（类型为 UI 组件类型）
 * @returns [数据, 是否来自后端]
 */
export function useOverviewStats<T extends DashboardApi.OverviewItem>(
  fallback: T[],
) {
  const items = ref<T[]>(fallback);
  const loading = ref(true);
  const fromServer = ref(false);

  async function load() {
    loading.value = true;
    try {
      const data = await getOverviewStatsApi();
      if (data && data.length > 0) {
        // 后端字段对齐：以 fallback 的 icon 等 UI 字段为基底，覆盖数值字段
        items.value = data.map((item, index) => ({
          ...fallback[index % fallback.length],
          ...item,
        })) as T[];
        fromServer.value = true;
      }
      // 后端返回空数组时保留 fallback，避免页面空白
    } catch {
      // 后端未就绪：静默回退到默认展示
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, fromServer, load };
}

/**
 * 加载工作台聚合数据（项目/快捷导航/待办/动态）。
 *
 * @param fallback - 后端不可用/返回空时的默认数据（类型为 UI 组件类型，
 *                   与 DashboardApi.WorkspaceData 字段对齐即可）
 */
export function useWorkspaceData<T extends object>(fallback: T) {
  const data = ref<T>(fallback);
  const loading = ref(true);
  const fromServer = ref(false);

  async function load() {
    loading.value = true;
    try {
      const res = await getWorkspaceDataApi();
      const fallbackData = fallback as DashboardApi.WorkspaceData;
      if (
        res &&
        (res.projects?.length || res.todos?.length || res.quickNavs?.length)
      ) {
        // 按字段粒度合并：后端只返回部分字段时，缺失字段沿用 fallback
        data.value = {
          ...fallbackData,
          ...res,
          projects: res.projects?.length ? res.projects : fallbackData.projects,
          quickNavs: res.quickNavs?.length
            ? res.quickNavs
            : fallbackData.quickNavs,
          todos: res.todos?.length ? res.todos : fallbackData.todos,
          trends: res.trends?.length ? res.trends : fallbackData.trends,
          greeting: res.greeting || fallbackData.greeting,
        } as T;
        fromServer.value = true;
      }
    } catch {
      // 后端未就绪：静默回退到默认展示
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, fromServer, load };
}
