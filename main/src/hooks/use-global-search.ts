/**
 * 全局搜索数据源管理 —— 提供搜索提供者注册、就绪事件广播与状态追踪（v4.0）
 *
 * 子应用通过 registerSearchProvider 注册搜索项；搜索面板监听就绪事件更新状态栏。
 *
 * @path main\src\hooks\use-global-search.ts
 * @author ydsz-team
 * @since 4.0.0
 */

import { ref, computed, readonly, onUnmounted } from 'vue';

import { createLogger } from '@YDSZ-core/shared/utils';

/** 模块级日志器 */
const logger = createLogger('GlobalSearch');

/**
 * 搜索项定义
 *
 * 描述全局搜索面板中单个搜索结果的数据结构。
 *
 * @since 4.0.0
 */
export interface SearchItem {
  /** 唯一标识 */
  id: string;
  /** 搜索项标题 */
  title: string;
  /** 搜索项描述（可选） */
  description?: string;
  /** 图标类名或 URL（可选） */
  icon?: string;
  /** 点击后跳转的路由路径（可选） */
  path?: string;
  /** 所属子应用名 */
  appName: string;
  /** 子应用显示名（可选，用于分组展示） */
  appLabel?: string;
  /** 自定义点击回调（优先级高于 path 跳转） */
  onClick?: () => void;
  /** 内部字段：高亮后的标题（由搜索面板填充） */
  highlightedTitle?: string;
}

type SearchProvider = () => SearchItem[];

/** 已注册的搜索提供者 */
const providers = new Map<string, SearchProvider>();

/** 搜索项缓存（定期收集） */
const cachedItems = ref<SearchItem[]>([]);

/** 收集间隔（子应用注册/菜单变化时刷新） */
let collectTimer: ReturnType<typeof setTimeout> | null = null;

// ==================== P2-2: 提供者就绪事件广播 ====================

/** 提供者就绪事件名 */
export const SEARCH_PROVIDER_READY_EVENT = 'YDSZ:search-provider-ready';
/** 提供者移除事件名 */
export const SEARCH_PROVIDER_REMOVED_EVENT = 'YDSZ:search-provider-removed';
/** 提供者计数变更事件名 */
export const SEARCH_PROVIDER_COUNT_EVENT = 'YDSZ:search-provider-count';

/**
 * 搜索提供者就绪事件详情
 *
 * 当新的搜索提供者注册成功后广播的事件载荷。
 *
 * @since 4.0.0
 */
export interface SearchProviderReadyDetail {
  /** 子应用名 */
  appName: string;
  /** 子应用显示名（可选） */
  appLabel?: string;
  /** 该提供者贡献的搜索项数量 */
  itemCount: number;
  /** 当前总提供者数量 */
  totalProviders: number;
}

/**
 * 搜索提供者计数事件详情
 *
 * 当提供者数量变更时广播的事件载荷。
 *
 * @since 4.0.0
 */
export interface SearchProviderCountDetail {
  /** 当前总提供者数量 */
  totalProviders: number;
  /** 所有已注册的子应用名列表 */
  appNames: string[];
}

/**
 * 广播搜索提供者计数变更。
 *
 * 在提供者注册/移除后调用，通过 window.dispatchEvent 广播，
 * 使搜索面板、监控等外部消费者能感知数据源数量变化。
 */
function broadcastProviderCount(): void {
  if (typeof window === 'undefined') return;
  const detail: SearchProviderCountDetail = {
    totalProviders: providers.size,
    appNames: [...providers.keys()],
  };
  window.dispatchEvent(new CustomEvent(SEARCH_PROVIDER_COUNT_EVENT, { detail }));
}

/**
 * 注册搜索数据提供者。
 *
 * 子应用应在 mount 时调用，传入返回搜索项数组的函数。
 *
 * v4.0 P2-2: 注册成功后广播 `YDSZ:search-provider-ready` 事件，
 * 搜索面板可监听此事件更新"已加载数据源"状态指示。
 *
 * @param appName   子应用名
 * @param provider  搜索项生产函数
 * @param appLabel  应用显示名（可选，用于事件广播）
 * @returns 取消注册函数
 *
 * @example
 * onMounted(() => {
 *   registerSearchProvider('workflow-web', () => [
 *     { id: 'proj-list', title: '项目列表', appName: 'workflow-web', path: '/YDSZ-proj/opportunities' },
 *   ], '项目管理系统');
 * });
 */
export function registerSearchProvider(
  appName: string,
  provider: SearchProvider,
  appLabel?: string,
): () => void {
  providers.set(appName, provider);
  scheduleCollect();

  // P2-2: 广播提供者就绪事件（采集完成后再发，确保 itemCount 准确）
  if (typeof window !== 'undefined') {
    // 使用 queueMicrotask 等当前 collect 调度完成后广播
    queueMicrotask(() => {
      const itemCount = (providers.get(appName)?.() ?? []).length;
      const detail: SearchProviderReadyDetail = {
        appName,
        appLabel,
        itemCount,
        totalProviders: providers.size,
      };
      window.dispatchEvent(new CustomEvent(SEARCH_PROVIDER_READY_EVENT, { detail }));
      broadcastProviderCount();
    });
  }

  return () => {
    providers.delete(appName);
    scheduleCollect();
    // P2-2: 广播提供者移除事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SEARCH_PROVIDER_REMOVED_EVENT, {
          detail: { appName, totalProviders: providers.size },
        }),
      );
      broadcastProviderCount();
    }
  };
}

function scheduleCollect(): void {
  if (collectTimer) return;
  collectTimer = setTimeout(() => {
    collectTimer = null;
    collectItems();
  }, 50);
}

function collectItems(): void {
  const all: SearchItem[] = [];
  for (const [appName, provider] of providers) {
    try {
      const items = provider();
      all.push(...items.map((item) => ({ ...item, appName })));
    } catch (err) {
      logger.warn(`provider ${appName} failed:`, err);
    }
  }
  cachedItems.value = all;
}

/**
 * 全局搜索 composable — 面板组件内使用
 *
 * 提供搜索项数据源、应用名称标签映射和手动刷新能力。
 * 搜索面板组件使用此 composable 获取所有已注册的搜索项。
 *
 * @returns 搜索面板所需数据
 * @returns items - 所有已收集的搜索项（只读 Ref）
 * @returns appNameLabels - 子应用名到显示名的映射（Computed）
 * @returns refresh - 手动触发重新收集搜索项的函数
 *
 * @example
 * ```ts
 * // global-search.vue 内
 * const { items, appNameLabels, refresh } = useGlobalSearch();
 * ```
 *
 * @since 4.0.0
 */
export function useGlobalSearch() {
  const appNameLabels = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const item of cachedItems.value) {
      if (!map[item.appName]) map[item.appName] = item.appLabel || item.appName;
    }
    return map;
  });

  const refresh = () => collectItems();

  return { items: readonly(cachedItems), appNameLabels, refresh };
}

/**
 * 子应用快捷注册搜索项的工具函数
 *
 * 提供子应用快速注册搜索项的便捷接口，支持静态数组和动态函数两种方式。
 * 注册延迟 100ms 执行，确保挂载后完成。
 *
 * @param appName - 子应用名
 * @param items - 搜索项数组或返回搜索项数组的函数
 * @returns 取消注册函数，调用后移除该子应用的搜索项
 *
 * @example
 * ```ts
 * import { useSearchProvider } from '@ydsz/micro-runtime/search';
 * useSearchProvider('workflow-web', [
 *   { id: 'list', title: '项目列表', path: '/proj/list' },
 *   { id: 'new',  title: '新建项目', path: '/proj/new' },
 * ]);
 * ```
 *
 * @since 4.0.0
 */
export function useSearchProvider(appName: string, items: (() => SearchItem[]) | SearchItem[]): (() => void) {
  if (typeof window === 'undefined') return () => {};

  const provider: SearchProvider = typeof items === 'function' ? items : () => items;
  // 延迟注册 —— 确保挂载后执行
  const id = setTimeout(() => {
    registerSearchProvider(appName, provider);
  }, 100);
  return () => {
    clearTimeout(id);
    providers.delete(appName);
  };
}

/**
 * 跟踪搜索提供者就绪状态的 composable（P2-2）
 *
 * 返回已注册的提供者数量、应用名列表，以及最新就绪事件。
 * 搜索面板可使用此 composable 在底部状态栏显示 "已加载 N 个数据源"。
 *
 * @example
 * // search-panel.vue
 * const { providerCount, appNames, lastReadyEvent } = useSearchProviderStatus();
 */
export function useSearchProviderStatus() {
  const providerCount = ref(0);
  const appNames = ref<string[]>([]);
  const lastReadyEvent = ref<SearchProviderReadyDetail | null>(null);

  function onReady(e: Event) {
    const detail = (e as CustomEvent<SearchProviderReadyDetail>).detail;
    lastReadyEvent.value = detail;
  }
  function onCount(e: Event) {
    const detail = (e as CustomEvent<SearchProviderCountDetail>).detail;
    providerCount.value = detail.totalProviders;
    appNames.value = detail.appNames;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener(SEARCH_PROVIDER_READY_EVENT, onReady);
    window.addEventListener(SEARCH_PROVIDER_COUNT_EVENT, onCount);

    // 同步当前快照
    providerCount.value = providers.size;
    appNames.value = [...providers.keys()];

    onUnmounted(() => {
      window.removeEventListener(SEARCH_PROVIDER_READY_EVENT, onReady);
      window.removeEventListener(SEARCH_PROVIDER_COUNT_EVENT, onCount);
    });
  }

  return { providerCount: readonly(providerCount), appNames: readonly(appNames), lastReadyEvent: readonly(lastReadyEvent) };
}

/**
 * 动态追加搜索项
 *
 * 子应用运行时调用（例如菜单变化后更新搜索源），
 * 将新搜索项追加到指定子应用的搜索提供者中。
 *
 * @param appName - 子应用名
 * @param items - 要追加的搜索项数组
 *
 * @example
 * ```ts
 * // 菜单变化后更新搜索项
 * watch(menuItems, (items) => {
 *   addSearchItems('workflow-web', items.map(toSearchItem));
 * });
 * ```
 *
 * @since 4.0.0
 */
export function addSearchItems(appName: string, items: SearchItem[]): void {
  const existing = providers.get(appName);
  if (existing) {
    providers.set(appName, () => [...existing(), ...items]);
  } else {
    providers.set(appName, () => items);
  }
  scheduleCollect();

  // P2-2: 广播计数变更
  if (typeof window !== 'undefined') {
    queueMicrotask(() => broadcastProviderCount());
  }
}

export { cachedItems };
