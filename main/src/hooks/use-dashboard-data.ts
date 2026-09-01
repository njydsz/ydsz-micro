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

import type { OverviewItem, WorkspaceData } from '#/api/core/dashboard';
import {
  getOverviewStatsApi,
  getWorkspaceDataApi,
} from '#/api/core/dashboard';

/**
 * 加载概览统计项
 *
 * 优先从后端 API 获取真实数据，后端不可用或返回空时静默回退到 fallback 默认值，
 * 确保页面不白屏、不报错。后端就绪后自动切换到真实数据。
 *
 * @typeParam T - 统计项类型，需继承自 OverviewItem
 * @param fallback - 后端不可用/返回空时的默认数据（类型为 UI 组件类型）
 * @returns 概览统计数据与加载状态
 * @returns items - 统计项列表（Ref），初始值为 fallback
 * @returns loading - 加载中状态（Ref）
 * @returns fromServer - 数据是否来自后端（Ref）
 * @returns load - 触发加载的函数
 *
 * @example
 * ```ts
 * const { items, loading, fromServer, load } = useOverviewStats<OverviewItem>([
 *   { title: '项目总数', totalValue: 0, icon: 'project' },
 *   { title: '待办事项', totalValue: 0, icon: 'todo' },
 * ]);
 * onMounted(load);
 * ```
 *
 * @since 4.1.0
 */
export function useOverviewStats<T extends OverviewItem>(
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
 * 加载工作台聚合数据
 *
 * 加载项目列表、快捷导航、待办事项、动态等聚合数据。
 * 后端不可用或返回空时静默回退到 fallback 默认值，按字段粒度合并确保页面不白屏。
 *
 * @typeParam T - 工作台数据类型
 * @param fallback - 后端不可用/返回空时的默认数据（与 WorkspaceData 字段对齐）
 * @returns 工作台数据与加载状态
 * @returns data - 工作台数据（Ref），初始值为 fallback
 * @returns loading - 加载中状态（Ref）
 * @returns fromServer - 数据是否来自后端（Ref）
 * @returns load - 触发加载的函数
 *
 * @example
 * ```ts
 * const { data, loading, load } = useWorkspaceData<WorkspaceData>({
 *   projects: [], quickNavs: [], todos: [], trends: [], greeting: '欢迎回来',
 * });
 * onMounted(load);
 * ```
 *
 * @since 4.1.0
 */
export function useWorkspaceData<T extends object>(fallback: T) {
  const data = ref<T>(fallback);
  const loading = ref(true);
  const fromServer = ref(false);

  async function load() {
    loading.value = true;
    try {
      const res = await getWorkspaceDataApi();
      const fallbackData = fallback as WorkspaceData;
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
