/**
 * 搜索 API —— 聚合全文搜索服务，跨类别查询页面/文档/用户/消息/任务/智能体
 *
 * @path main\src\api\search.ts
 * @author ydsz-team
 * @since 5.1.0
 *
 * 通过 VITE_SEARCH_API_URL（默认 /api/v1/search）调用后端全文索引服务，
 * 支持类别过滤与请求超时/取消控制。多个类别并发请求后合并为统一结果集。
 */
import { requestClient } from '#/api/request';

/** 搜索类别枚举 */
export type SearchCategory = 'page' | 'doc' | 'user' | 'message' | 'task' | 'agent';

/** 所有支持的搜索类别 */
export const ALL_SEARCH_CATEGORIES: SearchCategory[] = [
  'page',
  'doc',
  'user',
  'message',
  'task',
  'agent',
];

/** 单条搜索结果 */
export interface SearchResultItem {
  /** 唯一标识 */
  id: string;
  /** 结果标题 */
  title: string;
  /** 结果描述/摘要 */
  description?: string;
  /** 结果 URL 路径 */
  url?: string;
  /** 所属类别 */
  category: SearchCategory;
  /** 所属类别显示名 */
  categoryLabel?: string;
  /** 所属子应用 */
  appName?: string;
  /** 图标标识 */
  icon?: string;
  /** 相关度得分（可选） */
  score?: number;
}

/** 聚合搜索结果 */
export interface SearchResult {
  /** 原始查询字符串 */
  query: string;
  /** 各类别结果 Total 数 */
  totals: Record<SearchCategory, number>;
  /** 合并后的结果数组（按相关度排序） */
  items: SearchResultItem[];
  /** 各类别明细（可选，用于分组展示） */
  grouped?: Record<SearchCategory, SearchResultItem[]>;
}

/** 搜索请求参数 */
export interface SearchAllParams {
  /** 搜索关键词 */
  query: string;
  /** 类别过滤（为空则查询全部） */
  categories?: SearchCategory[];
  /** 单类别最大返回条数 */
  limit?: number;
}

/** 搜索 API 端点（可通过环境变量覆盖） */
const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL || '/api/v1/search';

/** 请求超时时长（毫秒） */
const REQUEST_TIMEOUT_MS = 8000;

/**
 * 聚合调用全文搜索服务，跨类别检索。
 *
 * 内部将按类别拆分多个并发请求（或携带 categories 参数单次请求，
 * 由后端决定），支持 AbortController 调用方取消，超时 8s 自动中止。
 *
 * @param params - 搜索参数
 * @param controller - 外部 AbortController（可选，用于联动取消）
 * @returns 聚合搜索结果
 *
 * @example
 * ```ts
 * const controller = new AbortController();
 * const result = await searchAll({ query: '项目管理', categories: ['page', 'doc'] }, controller);
 * // 需要取消时
 * controller.abort();
 * ```
 *
 * @since 5.1.0
 */
export async function searchAll(
  params: SearchAllParams,
  controller?: AbortController,
): Promise<SearchResult> {
  const { query, categories = ALL_SEARCH_CATEGORIES, limit = 20 } = params;

  const signal = controller?.signal;

  const response = await requestClient.get<SearchResult>(SEARCH_API_URL, {
    params: {
      q: query,
      categories: categories.join(','),
      limit,
    },
    signal,
    timeout: REQUEST_TIMEOUT_MS,
  });

  return response;
}

/**
 * 获取搜索热词（用于挂件入口展示推荐词）。
 *
 * @param limit - 热词数量上限，默认 5
 * @returns 热词数组
 *
 * @since 5.1.0
 */
export async function getHotSearches(limit = 5): Promise<string[]> {
  try {
    const response = await requestClient.get<string[]>(
      `${SEARCH_API_URL}/hot`,
      { params: { limit }, timeout: REQUEST_TIMEOUT_MS },
    );
    return response;
  } catch {
    return [];
  }
}

/**
 * 获取搜索历史（后端可选接口，后端未就绪时返回空数组）。
 *
 * @param limit - 历史记录数量上限，默认 20
 * @returns 搜索历史数组
 *
 * @since 5.1.0
 */
export async function getSearchHistory(limit = 20): Promise<string[]> {
  try {
    const response = await requestClient.get<string[]>(
      `${SEARCH_API_URL}/history`,
      { params: { limit }, timeout: REQUEST_TIMEOUT_MS },
    );
    return response;
  } catch {
    return [];
  }
}
