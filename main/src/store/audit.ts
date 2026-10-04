/**
 * 操作审计 Pinia Store —— 维护分页列表、筛选条件与详情状态
 *
 * <p>列表页共享状态（筛选/分页/数据）与详情状态（当前查看的日志 + 变更 diff），
 * actions 提供 fetchLogs / fetchDetail / resetFilters 等操作。
 *
 * @path main\src\store\audit.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type {
  AuditActionType,
  AuditLog,
  AuditLogDetail,
  AuditLogQueryParams,
} from '#/api/audit';

import { ref } from 'vue';

import { defineStore } from 'pinia';
import { createLogger } from '@ydsz-core/shared/utils';

import { getAuditLogDetail, listAuditLogs } from '#/api/audit';

/** 模块级日志器 */
const logger = createLogger('AuditStore');

/** 默认每页条数 */
const DEFAULT_PAGE_SIZE = 20;

/** 默认筛选条件工厂 */
function createDefaultFilters(): Required<
  Pick<AuditLogQueryParams, 'pageNum' | 'pageSize'>
> & Omit<AuditLogQueryParams, 'pageNum' | 'pageSize'> {
  return {
    pageNum: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    operatorName: '',
    module: '',
    actionType: '' as AuditActionType | '',
    startTime: '',
    endTime: '',
    keyword: '',
    result: '',
  };
}

/**
 * 操作审计状态管理 Store（Pinia setup store）。
 *
 * <p>列表页筛选/分页状态由本 store 统一管理；详情状态在打开抽屉时写入。
 */
export const useAuditStore = defineStore('audit', () => {
  // ---- State ----
  /** 审计日志列表 */
  const list = ref<AuditLog[]>([]);
  /** 总记录数 */
  const total = ref(0);
  /** 数据加载中 */
  const loading = ref(false);

  /** 当前筛选条件 */
  const filters = ref(createDefaultFilters());

  /** 当前查看的日志详情 */
  const currentDetail = ref<AuditLogDetail | null>(null);
  /** 详情加载中 */
  const detailLoading = ref(false);

  // ---- Actions ----

  /**
   * 分页查询审计日志并更新列表/总数。
   *
   * @param overrides - 覆盖筛选条件（如翻页时传入 { pageNum: 2 }）
   */
  async function fetchLogs(
    overrides?: Partial<AuditLogQueryParams>,
  ): Promise<void> {
    if (overrides) {
      filters.value = { ...filters.value, ...overrides };
    }
    loading.value = true;
    try {
      const { pageNum, pageSize, ...rest } = filters.value;
      const res = await listAuditLogs({
        pageNum,
        pageSize,
        ...rest,
      });
      list.value = res.data;
      total.value = res.total;
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error);
      list.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取单条审计日志详情并写入 currentDetail。
   *
   * @param id - 日志 ID
   */
  async function fetchDetail(id: string): Promise<void> {
    detailLoading.value = true;
    try {
      currentDetail.value = await getAuditLogDetail(id);
    } catch (error) {
      logger.error(`Failed to fetch audit detail for id=${id}:`, error);
      currentDetail.value = null;
    } finally {
      detailLoading.value = false;
    }
  }

  /**
   * 重置所有筛选条件并重新拉取第一页。
   */
  function resetFilters(): void {
    filters.value = createDefaultFilters();
    void fetchLogs();
  }

  /**
   * 关闭详情，清除当前 detail。
   */
  function clearDetail(): void {
    currentDetail.value = null;
  }

  return {
    // state
    currentDetail,
    detailLoading,
    filters,
    list,
    loading,
    total,
    // actions
    clearDetail,
    fetchDetail,
    fetchLogs,
    resetFilters,
  };
});
