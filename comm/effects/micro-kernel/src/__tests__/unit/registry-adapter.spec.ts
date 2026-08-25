/**
 * 远程注册表适配器 — 失败回退行为单元测试
 *
 * 覆盖场景：
 * 1. 成功拉取并返回最新 registry
 * 2. 网络超时时应回退到缓存
 * 3. 网络返回 5xx 错误时应回退到缓存
 * 4. 缓存为空且网络失败时应回退到静态配置
 * 5. 拉取成功后应更新缓存
 * 6. 多次快速调用应共享同一个 inflight 请求（去重）
 * 7. clearCache 应清空缓存
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — 必须在 import 被测模块之前完成
// ---------------------------------------------------------------------------

vi.mock('@YDSZ-core/shared/utils', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// 被测模块
// ---------------------------------------------------------------------------

import {
  clearRegistryCache,
  refreshRegistry,
  resolveAppEntry,
  resolveRegistry,
  setStaticRegistry,
} from '../../registry-adapter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REGISTRY_CACHE_KEY = 'ydsz_micro_apps_registry';

/** 静态注册表（模拟宿主注入的 MICRO_APPS） */
const STATIC_APPS = [
  { name: 'static-a', activeRule: '/static-a', devPort: 5701 },
  { name: 'static-b', activeRule: '/static-b', devPort: 5702 },
];

/** 构造合法的远端 registry 响应 */
function mockRemoteApps() {
  return [
    { name: 'remote-a', activeRule: '/remote-a', devPort: 5801 },
    { name: 'remote-b', activeRule: '/remote-b', devPort: 5802 },
  ];
}

/** 将缓存写入 localStorage */
function setCache(apps: unknown[], version = 'test-v1'): void {
  const cache = { remoteVersion: version, cachedAt: Date.now(), apps };
  localStorage.setItem(REGISTRY_CACHE_KEY, JSON.stringify(cache));
}

/** 从 localStorage 读取缓存 */
function getCache(): unknown {
  const raw = localStorage.getItem(REGISTRY_CACHE_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('registry-adapter', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 在每个测试前重置 localStorage / env / fetch / 静态注册表
    localStorage.clear();
    vi.restoreAllMocks();
    delete import.meta.env.VITE_MICRO_APPS_REGISTRY;
    setStaticRegistry(STATIC_APPS);

    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // 1. 成功拉取并返回最新 registry
  // -----------------------------------------------------------------------
  it('应从远端拉取并返回最新 registry', async () => {
    const remoteApps = mockRemoteApps();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ version: 'v2026-08-04', apps: remoteApps }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await resolveRegistry();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('remote-a');
    expect(result[1].name).toBe('remote-b');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // 2. 网络超时时应回退到缓存
  // -----------------------------------------------------------------------
  it('网络超时时应回退到缓存', async () => {
    // 预置缓存
    const cachedApps = [{ name: 'cached-x', activeRule: '/cached', devPort: 5901 }];
    setCache(cachedApps, 'cached-v1');

    // fetch 抛出 abort 错误模拟超时
    fetchSpy.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

    const result = await resolveRegistry();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('cached-x');
    expect(result[0].activeRule).toBe('/cached');
  });

  // -----------------------------------------------------------------------
  // 3. 网络返回 5xx 错误时应回退到缓存
  // -----------------------------------------------------------------------
  it('网络返回 5xx 错误时应回退到缓存', async () => {
    const cachedApps = [
      { name: 'cached-y', activeRule: '/cached-y', devPort: 5902 },
      { name: 'cached-z', activeRule: '/cached-z', devPort: 5903 },
    ];
    setCache(cachedApps, 'cached-v2');

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 503,
        statusText: 'Service Unavailable',
      }),
    );

    const result = await resolveRegistry();

    expect(result).toHaveLength(2);
    expect(result.map((a) => a.name)).toEqual(['cached-y', 'cached-z']);
  });

  // -----------------------------------------------------------------------
  // 4. 缓存为空且网络失败时应回退到静态配置
  // -----------------------------------------------------------------------
  it('缓存为空且网络失败时应回退到静态配置', async () => {
    // 确保无缓存
    expect(getCache()).toBeNull();

    // fetch 网络错误
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await resolveRegistry();

    // 回退到宿主注入的静态注册表
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('static-a');
    expect(result[1].name).toBe('static-b');
  });

  // -----------------------------------------------------------------------
  // 4.1 未注入静态注册表且网络失败时应返回空数组（并告警）
  // -----------------------------------------------------------------------
  it('静态注册表为空且网络失败时应返回空数组', async () => {
    setStaticRegistry([]);
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await resolveRegistry();

    expect(result).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 5. 拉取成功后应更新缓存
  // -----------------------------------------------------------------------
  it('拉取成功后应更新缓存', async () => {
    const remoteApps = mockRemoteApps();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ version: 'v2026-08-05', apps: remoteApps }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await resolveRegistry();

    const cache = getCache();
    expect(cache).not.toBeNull();
    expect(cache.remoteVersion).toBe('v2026-08-05');
    expect(cache.apps).toHaveLength(2);
    expect(cache.apps[0].name).toBe('remote-a');
  });

  // -----------------------------------------------------------------------
  // 6. 多次快速调用应共享同一个 inflight 请求（去重）
  // -----------------------------------------------------------------------
  it('多次快速并发调用应共享同一个 inflight 请求', async () => {
    const remoteApps = mockRemoteApps();
    let resolveFetch: (val: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    fetchSpy.mockReturnValue(fetchPromise);

    // 同时发起两次调用（不 await）
    const p1 = resolveRegistry();
    const p2 = resolveRegistry();

    // 两个调用应该只触发一次 fetch
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // 手动 resolve fetch
    resolveFetch!(
      new Response(JSON.stringify({ version: 'v-dedup', apps: remoteApps }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toHaveLength(2);
    expect(r2).toHaveLength(2);
    // 确认只调用一次 fetch
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // 7. clearCache 应清空缓存
  // -----------------------------------------------------------------------
  it('clearCache 应清空缓存', async () => {
    const cachedApps = [{ name: 'will-be-deleted', activeRule: '/del', devPort: 5905 }];
    setCache(cachedApps);
    expect(getCache()).not.toBeNull();

    clearRegistryCache();

    expect(getCache()).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 补充场景：useCache=false 时跳过缓存直接回退静态配置
  // -----------------------------------------------------------------------
  it('useCache=false 且网络失败时应直接回退静态配置（不读缓存）', async () => {
    setCache([{ name: 'should-not-read', activeRule: '/skip', devPort: 5906 }]);
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await resolveRegistry(false);

    expect(result[0].name).toBe('static-a'); // 来自注入的静态注册表而非缓存
  });

  // -----------------------------------------------------------------------
  // 补充场景：refreshRegistry 先清缓存再拉取
  // -----------------------------------------------------------------------
  it('refreshRegistry 应先清缓存再拉取远端', async () => {
    // 预置缓存
    setCache([{ name: 'old-cached', activeRule: '/old', devPort: 5907 }], 'old-version');

    const remoteApps = mockRemoteApps();
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ version: 'v-fresh', apps: remoteApps }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await refreshRegistry();

    // 应返回远程数据（因为 refreshRegistry 会在拉取前 clearCache，然后 resolveRegistry(false) 跳过缓存）
    expect(result.map((a) => a.name)).toEqual(['remote-a', 'remote-b']);
    // 缓存应已更新为新远端版本
    const cache = getCache() as { remoteVersion: string } | null;
    expect(cache?.remoteVersion).toBe('v-fresh');
  });

  // -----------------------------------------------------------------------
  // 补充场景：resolveAppEntry 生产环境推导 entry
  // -----------------------------------------------------------------------
  it('resolveAppEntry 生产环境应根据 prodPath / name 推导 entry', () => {
    // mock DEV = false
    import.meta.env.DEV = false;

    // 显式 entry 优先
    expect(
      resolveAppEntry({ name: 'a', activeRule: '/a', devPort: 1, entry: 'https://cdn.example.com/a/' } as any),
    ).toBe('https://cdn.example.com/a/');

    // prodPath 自定义
    expect(
      resolveAppEntry({ name: 'b', activeRule: '/b', devPort: 2, prodPath: '/custom-b/' } as any),
    ).toBe('/custom-b/');

    // 默认 /YDSZ-{name}/
    expect(
      resolveAppEntry({ name: 'agent-web', activeRule: '/ai', devPort: 3 } as any),
    ).toBe('/YDSZ-agent-web/');
  });

  it('resolveAppEntry 开发环境应返回 localhost:devPort', () => {
    import.meta.env.DEV = true;

    const entry = resolveAppEntry({ name: 'dev-app', activeRule: '/dev', devPort: 9999 } as any);
    expect(entry).toBe('//localhost:9999');
  });
});
