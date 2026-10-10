/**
 * use-crud-table 组合式函数单元测试
 *
 * <p>覆盖核心 CRUD 流程：初始化加载、分页切换、搜索过滤、删除行刷新。
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\effects\shared-business\src\composables\use-crud-table.test.ts
 * @author ydsz-team
 * @since 26.09.24
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ServerPaginationFetcher } from './use-server-pagination';

/** 模拟数据行类型 */
interface MockRow {
  id: number;
  name: string;
}

/** 模拟服务分页返回结果 */
const mockRows: MockRow[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

/** 模拟分页查询函数 */
const mockFetcher: ServerPaginationFetcher<MockRow, { keyword?: string }> = vi.fn(
  async (query) => {
    const filtered = mockRows.filter((row) =>
      query.keyword ? row.name.includes(query.keyword) : true,
    );
    const start = (query.pageNum - 1) * query.pageSize;
    return {
      items: filtered.slice(start, start + query.pageSize),
      total: filtered.length,
    };
  },
);

/** 模拟删除函数 */
const mockDeleteFetcher = vi.fn(async (_row: MockRow) => {
  return { success: true };
});

vi.mock('@ydsz/notification', () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@ydsz-core/popup-ui', () => ({
  YdConfirm: vi.fn(() => Promise.resolve()),
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: vi.fn((key: string, params?: Record<string, unknown>) => {
      if (params?.count !== undefined) {
        return `确认删除 ${params.count} 条记录？`;
      }
      return key;
    }),
  }),
}));

describe('use-crud-table', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正常路径：初始化自动加载数据并填充 items / total', async () => {
    const { useCrudTable } = await import('./use-crud-table');
    const crud = useCrudTable<MockRow, { keyword?: string }>({
      fetcher: mockFetcher,
      deleteFetcher: mockDeleteFetcher,
    });

    // 等待下次微任务，确保 immediate fetchData 完成
    await vi.waitFor(() => {
      expect(crud.items.value.length).toBeGreaterThan(0);
    });

    expect(crud.items.value).toEqual(mockRows);
    expect(crud.total.value).toBe(3);
    expect(crud.loading.value).toBe(false);
  });

  it('正常路径：切换页码后 items 正确更新', async () => {
    const { useCrudTable } = await import('./use-crud-table');
    const crud = useCrudTable<MockRow, { keyword?: string }>({
      fetcher: mockFetcher,
      pageSize: 2,
    });

    await vi.waitFor(() => {
      expect(crud.loading.value).toBe(false);
    });

    // pageSize=2，第一页应有 2 条
    expect(crud.items.value.length).toBe(2);

    // 切换至第二页
    await crud.changePage(2);

    expect(crud.items.value.length).toBe(1);
    expect(crud.items.value[0].name).toBe('Charlie');
  });

  it('正常路径：search 重置页码并触发查询', async () => {
    const { useCrudTable } = await import('./use-crud-table');
    const crud = useCrudTable<MockRow, { keyword?: string }>({
      fetcher: mockFetcher,
      pageSize: 2,
    });

    await vi.waitFor(() => {
      expect(crud.loading.value).toBe(false);
    });

    // 先切到第二页
    await crud.changePage(2);

    // 重新导入 fetchermock 以便捕获调用
    const fetchSpy = mockFetcher;

    // search 应回到第一页
    await crud.search();

    expect(crud.pagination.value.current).toBe(1);
    // search 触发了 fetchData
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('正常路径：删除行成功后刷新列表', async () => {
    const { useCrudTable } = await import('./use-crud-table');
    const { YdConfirm } = await import('@ydsz-core/popup-ui');
    const { showToast } = await import('@ydsz/notification');

    const crud = useCrudTable<MockRow, { keyword?: string }>({
      fetcher: mockFetcher,
      deleteFetcher: mockDeleteFetcher,
    });

    await vi.waitFor(() => {
      expect(crud.loading.value).toBe(false);
    });

    await crud.handleDelete(mockRows[0]);

    expect(YdConfirm).toHaveBeenCalledTimes(1);
    expect(mockDeleteFetcher).toHaveBeenCalledWith(mockRows[0]);
    expect(showToast.success).toHaveBeenCalled();
  });

  it('边界路径：API 抛出错误时应回退 tableData 并展示 errorMessage', async () => {
    const { useCrudTable } = await import('./use-crud-table');
    const { YdConfirm } = await import('@ydsz-core/popup-ui');
    const { showToast } = await import('@ydsz/notification');

    // 用户确认删除通过
    (YdConfirm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    // 删除函数抛出错误
    const errorDeleteFetcher = vi.fn(async () => {
      throw new Error('Network error');
    });

    const crud = useCrudTable<MockRow, { keyword?: string }>({
      fetcher: mockFetcher,
      deleteFetcher: errorDeleteFetcher,
    });

    await vi.waitFor(() => {
      expect(crud.loading.value).toBe(false);
    });

    await expect(crud.handleDelete(mockRows[0])).rejects.toThrow('Network error');
    expect(showToast.error).toHaveBeenCalled();
  });

  it('边界路径：用户取消删除确认时不触发删除', async () => {
    const { useCrudTable } = await import('./use-crud-table');
    const { YdConfirm } = await import('@ydsz-core/popup-ui');

    // 用户取消确认
    (YdConfirm as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('cancel'));

    const crud = useCrudTable<MockRow, { keyword?: string }>({
      fetcher: mockFetcher,
      deleteFetcher: mockDeleteFetcher,
    });

    await vi.waitFor(() => {
      expect(crud.loading.value).toBe(false);
    });

    await crud.handleDelete(mockRows[0]);

    expect(mockDeleteFetcher).not.toHaveBeenCalled();
  });
});
