/**
 * Audit Store 单元测试
 *
 * 覆盖：fetchLogs / resetFilters / fetchDetail
 *
 * @path main\src\store\__tests__\audit.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import type { AuditLog, AuditLogDetail } from '../../api/audit';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPinia, setActivePinia } from 'pinia';

import { getAuditLogDetail, listAuditLogs } from '../../api/audit';
import { useAuditStore } from '../audit';

// Mock API 模块
vi.mock('../../api/audit', () => ({
  getAuditLogDetail: vi.fn(),
  listAuditLogs: vi.fn(),
}));

const mockListAuditLogs = vi.mocked(listAuditLogs);
const mockGetAuditLogDetail = vi.mocked(getAuditLogDetail);

// 测试数据工厂
function createMockLog(overrides?: Partial<AuditLog>): AuditLog {
  return {
    id: 'log-001',
    actionTime: '2024-01-15T10:30:00Z',
    operatorName: 'admin',
    operatorId: 'user-001',
    module: 'user',
    actionType: 'CREATE',
    description: '新增用户张三',
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0 Chrome/120.0',
    result: 'SUCCESS',
    ...overrides,
  };
}

function createMockDetail(overrides?: Partial<AuditLogDetail>): AuditLogDetail {
  return {
    ...createMockLog(),
    diffs: [
      { field: 'username', oldValue: null, newValue: 'zhangsan' },
      { field: 'role', oldValue: null, newValue: 'editor' },
    ],
    sessionId: 'session-abc123',
    requestParams: '{"username":"zhangsan"}',
    responseData: '{"id":"user-002","username":"zhangsan"}',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 测试用例
// ---------------------------------------------------------------------------

describe('useAuditStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  // =========================================================================
  // fetchLogs —— 正确更新 list 与 total
  // =========================================================================

  describe('fetchLogs', () => {
    it('应正确更新 list 与 total', async () => {
      const mockLogs = [
        createMockLog({ id: 'log-001' }),
        createMockLog({ id: 'log-002', actionType: 'UPDATE' }),
      ];
      mockListAuditLogs.mockResolvedValue({
        total: 42,
        pageNum: 1,
        pageSize: 20,
        data: mockLogs,
      });

      const store = useAuditStore();
      await store.fetchLogs();

      // 验证 API 被调用
      expect(mockListAuditLogs).toHaveBeenCalledTimes(1);

      // 验证 list 和 total 正确更新
      expect(store.list).toHaveLength(2);
      expect(store.list[0].id).toBe('log-001');
      expect(store.list[1].id).toBe('log-002');
      expect(store.total).toBe(42);

      // 验证 loading 状态已重置
      expect(store.loading).toBe(false);
    });

    it('翻页时应传入正确的 pageNum', async () => {
      mockListAuditLogs.mockResolvedValue({
        total: 100,
        pageNum: 3,
        pageSize: 20,
        data: [],
      });

      const store = useAuditStore();
      await store.fetchLogs({ pageNum: 3 });

      expect(mockListAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ pageNum: 3 }),
      );
      expect(store.filters.pageNum).toBe(3);
    });

    it('API 失败时应清空列表并设置 total 为 0', async () => {
      mockListAuditLogs.mockRejectedValue(new Error('Network error'));

      const store = useAuditStore();
      await store.fetchLogs();

      expect(store.list).toEqual([]);
      expect(store.total).toBe(0);
      expect(store.loading).toBe(false);
    });
  });

  // =========================================================================
  // resetFilters —— 重置状态
  // =========================================================================

  describe('resetFilters', () => {
    it('应重置所有筛选条件并重新拉取第一页', async () => {
      mockListAuditLogs.mockResolvedValue({
        total: 0,
        pageNum: 1,
        pageSize: 20,
        data: [],
      });

      const store = useAuditStore();

      // 先修改筛选条件
      store.filters.operatorName = 'testuser';
      store.filters.module = 'system';
      store.filters.actionType = 'DELETE';
      store.filters.pageNum = 5;

      // 执行重置
      store.resetFilters();

      // 验证筛选条件已还原默认值
      expect(store.filters.operatorName).toBe('');
      expect(store.filters.module).toBe('');
      expect(store.filters.actionType).toBe('');
      expect(store.filters.pageNum).toBe(1);
      expect(store.filters.pageSize).toBe(20);

      // 验证 fetchLogs 被调用
      expect(mockListAuditLogs).toHaveBeenCalledTimes(1);
      expect(mockListAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ pageNum: 1 }),
      );
    });
  });

  // =========================================================================
  // fetchDetail —— 正确设置当前 detail
  // =========================================================================

  describe('fetchDetail', () => {
    it('应正确设置当前 detail', async () => {
      const mockDetail = createMockDetail({ id: 'log-detail-001' });
      mockGetAuditLogDetail.mockResolvedValue(mockDetail);

      const store = useAuditStore();
      await store.fetchDetail('log-detail-001');

      // 验证 API 被正确调用
      expect(mockGetAuditLogDetail).toHaveBeenCalledWith('log-detail-001');

      // 验证 currentDetail 正确设置
      expect(store.currentDetail).not.toBeNull();
      expect(store.currentDetail?.id).toBe('log-detail-001');
      expect(store.currentDetail?.operatorName).toBe('admin');
      expect(store.currentDetail?.diffs).toHaveLength(2);
      expect(store.currentDetail?.diffs[0].field).toBe('username');
      expect(store.currentDetail?.sessionId).toBe('session-abc123');

      // 验证 loading 状态已重置
      expect(store.detailLoading).toBe(false);
    });

    it('API 失败时应将 currentDetail 设为 null', async () => {
      mockGetAuditLogDetail.mockRejectedValue(new Error('Not found'));

      const store = useAuditStore();
      await store.fetchDetail('nonexistent-id');

      expect(store.currentDetail).toBeNull();
      expect(store.detailLoading).toBe(false);
    });

    it('clearDetail 应清除当前 detail', async () => {
      const mockDetail = createMockDetail();
      mockGetAuditLogDetail.mockResolvedValue(mockDetail);

      const store = useAuditStore();
      await store.fetchDetail('log-001');
      expect(store.currentDetail).not.toBeNull();

      store.clearDetail();
      expect(store.currentDetail).toBeNull();
    });
  });
});
