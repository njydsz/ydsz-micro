/**
 * 灰度接线测试 — 验证 loader 加载前会查询 canary 决策
 *
 * 背景（v4.3.2）：此前 canary-manager 的 resolveVersion 未接入加载链路，
 * 灰度决策结果无处可用。现 loadApp 在加载前调用 resolveEffectiveEntry，
 * 用灰度版本的 entry 替代注册入口。
 *
 * 测试策略：
 * 单测环境 `import.meta.env.DEV === true`，loader 走 dev 分支
 * （`${entry}/src/main.ts`），不会调用 fetchManifest。因此通过 mock
 * link-hints 的 injectModulePreload 捕获实际使用的入口 URL，
 * 该函数在 dev 分支中于 dynamic import 之前被调用。
 *
 * @path comm\effects\micro-kernel\src\loader.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** 灰度决策结果构造器 */
function resolution(overrides: Record<string, unknown> = {}) {
  return {
    appName: 'sub-a',
    resolved: {
      version: '1.0.0',
      tag: 'stable',
      entry: 'https://stable.example.com',
      percentage: 100,
    },
    tag: 'stable',
    whitelisted: false,
    ...overrides,
  };
}

const resolveVersion = vi.fn();
const injectModulePreload = vi.fn();

vi.mock('./canary-manager', () => ({
  getCanaryManager: () => ({ resolveVersion }),
}));

vi.mock('./link-hints', () => ({
  injectModulePreload,
  preloadAppAssets: vi.fn(),
}));

describe('loader 灰度接线', () => {
  beforeEach(() => {
    resolveVersion.mockReset();
    injectModulePreload.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /** 触发一次加载并返回捕获到的入口 URL（加载本身会失败，忽略） */
  async function loadAndCaptureEntry(registeredEntry: string): Promise<string> {
    const { loadApp } = await import('./loader');
    await loadApp({
      name: 'sub-a',
      entry: registeredEntry,
      container: '#app',
      activeRule: '/sub-a',
    } as never).catch(() => undefined);

    expect(injectModulePreload).toHaveBeenCalled();
    return String(injectModulePreload.mock.calls[0]![0]);
  }

  it('未命中灰度（tag=stable）时使用注册入口', async () => {
    resolveVersion.mockReturnValue(resolution());

    const url = await loadAndCaptureEntry('https://stable.example.com');

    expect(url).toBe('https://stable.example.com/src/main.ts');
  });

  it('命中灰度时使用灰度版本 entry', async () => {
    resolveVersion.mockReturnValue(
      resolution({
        tag: 'canary',
        whitelisted: true,
        resolved: {
          version: '1.1.0-canary.1',
          tag: 'canary',
          entry: 'https://canary.example.com',
          percentage: 10,
        },
      }),
    );

    const url = await loadAndCaptureEntry('https://stable.example.com');

    expect(url).toBe('https://canary.example.com/src/main.ts');
  });

  it('灰度版本 entry 为空时降级为注册入口', async () => {
    resolveVersion.mockReturnValue(
      resolution({
        tag: 'canary',
        resolved: {
          version: '1.1.0-canary.1',
          tag: 'canary',
          entry: '',
          percentage: 10,
        },
      }),
    );

    const url = await loadAndCaptureEntry('https://stable.example.com');

    expect(url).toBe('https://stable.example.com/src/main.ts');
  });

  it('灰度查询抛错时降级为注册入口，加载不中断', async () => {
    resolveVersion.mockImplementation(() => {
      throw new Error('canary service down');
    });

    // 不应抛出，且仍使用注册入口
    const url = await loadAndCaptureEntry('https://stable.example.com');

    expect(url).toBe('https://stable.example.com/src/main.ts');
  });

  it('resolveVersion 以子应用名调用', async () => {
    resolveVersion.mockReturnValue(resolution());

    const { loadApp } = await import('./loader');
    await loadApp({
      name: 'sub-a',
      entry: 'https://stable.example.com',
      container: '#app',
      activeRule: '/sub-a',
    } as never).catch(() => undefined);

    expect(resolveVersion).toHaveBeenCalledWith('sub-a');
  });

  it('同一应用两次加载各自独立解析（灰度可变化）', async () => {
    resolveVersion
      .mockReturnValueOnce(resolution())
      .mockReturnValueOnce(
        resolution({
          tag: 'canary',
          resolved: { version: '1.1.0', tag: 'canary', entry: 'https://canary.example.com' },
        }),
      );

    const { loadApp } = await import('./loader');
    const config = {
      name: 'sub-a',
      entry: 'https://stable.example.com',
      container: '#app',
      activeRule: '/sub-a',
    } as never;

    await loadApp(config).catch(() => undefined);
    await loadApp(config).catch(() => undefined);

    expect(injectModulePreload).toHaveBeenNthCalledWith(
      1,
      'https://stable.example.com/src/main.ts',
    );
    expect(injectModulePreload).toHaveBeenNthCalledWith(
      2,
      'https://canary.example.com/src/main.ts',
    );
  });
});
