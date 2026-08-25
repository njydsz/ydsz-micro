/**
 * loader.spec.ts — ESM Manifest 加载器核心路径单元测试
 *
 * v4.3.0 新增：此前 loader/沙箱/调度器核心三件套零直接覆盖。
 * 覆盖场景：
 * 1. fetchManifest 成功拉取 + manifestCache 缓存命中
 * 2. manifestCache LRU 淘汰（上限 MAX_MANIFEST_CACHE_SIZE = 50）
 * 3. 网络错误 → KernelError LOAD_MANIFEST_FETCH
 * 4. 非法 JSON → KernelError LOAD_MANIFEST_INVALID
 * 5. AbortSignal 取消传播
 * 6. removeStylesheets 按 data-micro-kernel-app 精确清理
 * 7. clearManifestCache 清空缓存
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/loader.spec.ts
 * @author ydsz-team
 * @since 4.3.0
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@YDSZ-core/shared/utils', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { KernelError, KernelErrorCode } from '../../error-boundary';
import {
  clearManifestCache,
  fetchManifest,
  removeStylesheets,
} from '../../loader';

/** 构造合法 manifest 响应 */
function okManifestResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      name: 'workflow-web',
      entry: '/workflow-web/index.js',
      css: ['/workflow-web/index.css'],
      version: '1.0.0',
      ...overrides,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('loader — fetchManifest', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clearManifestCache();
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    clearManifestCache();
    vi.restoreAllMocks();
  });

  it('成功拉取并解析 manifest', async () => {
    fetchSpy.mockResolvedValue(okManifestResponse());

    const manifest = await fetchManifest('https://cdn.example.com/apps/workflow');

    expect(manifest.name).toBe('workflow-web');
    expect(manifest.entry).toBe('/workflow-web/index.js');
    expect(manifest.css).toEqual(['/workflow-web/index.css']);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://cdn.example.com/apps/workflow/manifest.json',
    );
  });

  it('同一 URL 第二次拉取命中缓存（不再发请求）', async () => {
    fetchSpy.mockResolvedValue(okManifestResponse());

    await fetchManifest('https://cdn.example.com/apps/agent');
    const second = await fetchManifest('https://cdn.example.com/apps/agent');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(second.name).toBe('workflow-web');
  });

  it('manifestCache 超过上限时 LRU 淘汰最旧条目', async () => {
    // 每次调用返回全新 Response（Response.body 只能消费一次）
    fetchSpy.mockImplementation(() =>
      Promise.resolve(okManifestResponse()),
    );

    // 连续拉取 55 个不同 URL，超过上限 50
    for (let i = 0; i < 55; i++) {
      await fetchManifest(`https://cdn.example.com/apps/app-${i}`);
    }

    // 最旧的 5 个（app-0..app-4）应已被淘汰，重新拉取会再次发请求
    const before = fetchSpy.mock.calls.length;
    await fetchManifest('https://cdn.example.com/apps/app-0');
    expect(fetchSpy.mock.calls.length).toBe(before + 1);

    // 最新条目仍在缓存中
    const latest = fetchSpy.mock.calls.length;
    await fetchManifest('https://cdn.example.com/apps/app-54');
    expect(fetchSpy.mock.calls.length).toBe(latest);
  });

  it('网络错误时抛出 LOAD_MANIFEST_FETCH 错误', async () => {
    fetchSpy.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
      fetchManifest('https://cdn.example.com/apps/msg'),
    ).rejects.toMatchObject({ code: KernelErrorCode.LOAD_MANIFEST_FETCH });
  });

  it('HTTP 非 2xx 时抛出 LOAD_MANIFEST_FETCH 错误', async () => {
    fetchSpy.mockResolvedValue(new Response('Not Found', { status: 404 }));

    await expect(
      fetchManifest('https://cdn.example.com/apps/msg'),
    ).rejects.toMatchObject({ code: KernelErrorCode.LOAD_MANIFEST_FETCH });
  });

  it('非法 JSON 时抛出 LOAD_MANIFEST_INVALID 错误', async () => {
    fetchSpy.mockResolvedValue(
      new Response('<html>oops</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    await expect(
      fetchManifest('https://cdn.example.com/apps/msg'),
    ).rejects.toMatchObject({ code: KernelErrorCode.LOAD_MANIFEST_INVALID });
  });

  it('AbortSignal 取消时取消底层 fetch', async () => {
    const controller = new AbortController();
    const rejectOnAbort = new Promise<Response>((_, reject) => {
      controller.signal.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      );
    });
    fetchSpy.mockReturnValue(rejectOnAbort);

    const pending = fetchManifest(
      'https://cdn.example.com/apps/agent',
      controller.signal,
    );
    controller.abort();

    await expect(pending).rejects.toBeInstanceOf(KernelError);
  });
});

describe('loader — 样式清理', () => {
  it('removeStylesheets 精确移除指定应用的样式', () => {
    const linkA = document.createElement('link');
    linkA.rel = 'stylesheet';
    linkA.setAttribute('data-micro-kernel-app', 'app-a');
    document.head.appendChild(linkA);

    const linkB = document.createElement('link');
    linkB.rel = 'stylesheet';
    linkB.setAttribute('data-micro-kernel-app', 'app-b');
    document.head.appendChild(linkB);

    removeStylesheets('app-a');

    expect(document.querySelectorAll('link[data-micro-kernel-app="app-a"]')).toHaveLength(0);
    expect(document.querySelectorAll('link[data-micro-kernel-app="app-b"]')).toHaveLength(1);
  });

  it('移除不存在的应用不抛错', () => {
    expect(() => removeStylesheets('never-mounted')).not.toThrow();
  });
});
