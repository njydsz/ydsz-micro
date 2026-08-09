/**
 * useDashboardData composable 单元测试
 *
 * 覆盖：API 成功时替换数据、API 失败时保留 fallback、
 * 空数组/空对象时保留 fallback、字段粒度合并。
 *
 * @path main/src/hooks/__tests__/use-dashboard-data.test.ts
 * @author ydsz-team
 * @since 4.1.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// mock API 层：默认 reject（后端未就绪），测试用例内按需覆盖
const mocks = vi.hoisted(() => ({
  getOverviewStatsApi: vi.fn(),
  getWorkspaceDataApi: vi.fn(),
}));

vi.mock('#/api/core/dashboard', () => ({
  getOverviewStatsApi: mocks.getOverviewStatsApi,
  getWorkspaceDataApi: mocks.getWorkspaceDataApi,
}));

import { useOverviewStats, useWorkspaceData } from '../use-dashboard-data';

describe('useOverviewStats', () => {
  const fallback = [
    { title: '用户量', totalTitle: '总用户量', totalValue: 100, value: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初始使用 fallback 数据', () => {
    const { items, fromServer, loading } = useOverviewStats(fallback);
    expect(items.value[0]).toMatchObject(fallback[0]);
    expect(fromServer.value).toBe(false);
    expect(loading.value).toBe(true);
  });

  it('API 成功且非空时替换为真实数据', async () => {
    mocks.getOverviewStatsApi.mockResolvedValue([
      { title: '真实用户量', totalTitle: '总用户量', totalValue: 999, value: 9 },
    ]);

    const { items, fromServer, load } = useOverviewStats(fallback);
    await load();

    expect(fromServer.value).toBe(true);
    expect(items.value[0]).toMatchObject({ totalValue: 999 });
    expect(items.value[0].title).toBe('真实用户量');
  });

  it('API 失败时静默保留 fallback', async () => {
    mocks.getOverviewStatsApi.mockRejectedValue(new Error('network down'));

    const { items, fromServer, load, loading } = useOverviewStats(fallback);
    await load();

    expect(fromServer.value).toBe(false);
    expect(items.value[0]).toMatchObject(fallback[0]);
    expect(loading.value).toBe(false);
  });

  it('API 返回空数组时保留 fallback', async () => {
    mocks.getOverviewStatsApi.mockResolvedValue([]);

    const { items, fromServer, load } = useOverviewStats(fallback);
    await load();

    expect(fromServer.value).toBe(false);
    expect(items.value[0]).toMatchObject(fallback[0]);
  });
});

describe('useWorkspaceData', () => {
  const fallback = {
    projects: [{ title: 'fallback-proj', content: '', date: '', group: '', icon: '', url: '' }],
    quickNavs: [{ title: 'fallback-nav', color: '', icon: '', url: '' }],
    todos: [{ title: 'fallback-todo', completed: false, content: '', date: '' }],
    trends: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('API 成功时字段粒度合并（部分字段缺失沿用 fallback）', async () => {
    mocks.getWorkspaceDataApi.mockResolvedValue({
      projects: [{ title: 'server-proj', content: '', date: '', group: '', icon: '', url: '' }],
      quickNavs: [],
      todos: [],
      trends: [],
    });

    const { data, fromServer, load } = useWorkspaceData(fallback);
    await load();

    expect(fromServer.value).toBe(true);
    // 后端提供的字段 → 使用后端值
    expect(data.value.projects[0].title).toBe('server-proj');
    // 后端缺失字段 → 沿用 fallback
    expect(data.value.quickNavs[0].title).toBe('fallback-nav');
    expect(data.value.todos[0].title).toBe('fallback-todo');
  });

  it('API 失败时保留 fallback', async () => {
    mocks.getWorkspaceDataApi.mockRejectedValue(new Error('boom'));

    const { data, fromServer, load } = useWorkspaceData(fallback);
    await load();

    expect(fromServer.value).toBe(false);
    expect(data.value.projects[0]).toMatchObject(fallback.projects[0]);
  });

  it('API 返回空对象时保留 fallback', async () => {
    mocks.getWorkspaceDataApi.mockResolvedValue({});

    const { data, fromServer, load } = useWorkspaceData(fallback);
    await load();

    expect(fromServer.value).toBe(false);
    expect(data.value.projects[0]).toMatchObject(fallback.projects[0]);
  });
});
