/**
 * 内核路由匹配测试 — 覆盖 activeRule 前缀匹配与 search/hash 支持
 *
 * 重点验证（v4.3.2）：
 *   - hash 模式（createWebHashHistory）下子应用切换此前完全失效
 *     （只读 pathname，而 hash 模式的 pathname 恒为 `/`）
 *   - 带 query 的 URL 无法与 activeRule 匹配
 *   - 末尾斜杠导致 `/ydsz-ai/` 与 `/ydsz-ai` 匹配不一致
 *
 * 由于 `createStartRouterSync` 会注册 window 监听并调用 patchHistory，
 * 本文件以「驱动 handleRouteChange → 观测 switchToAppFn 调用」的方式测试。
 *
 * @path comm\effects\micro-kernel\src\kernel-router.test.ts
 * @author ydsz-team
 * @since 26.11.07
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createStartRouterSync } from './kernel-router';
import type { LifecycleStateAccessors } from './kernel-lifecycle';

/** 构造最小可用的 LifecycleStateAccessors 替身 */
function makeState(): LifecycleStateAccessors {
  let activeAppName: string | null = null;
  return {
    getActiveAppName: () => activeAppName,
    setActiveAppName: (name: string | null) => {
      activeAppName = name;
    },
  } as unknown as LifecycleStateAccessors;
}

/** 构造注册表配置 */
function makeApp(name: string, activeRule: string) {
  return {
    name,
    packageName: `@ydsz/${name}`,
    activeRule,
    entry: `http://localhost:5600/${name}/`,
    container: '#app',
  } as never;
}

describe('kernel-router', () => {
  const cleanups: Array<() => void> = [];
  let switchToAppFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    switchToAppFn = vi.fn().mockResolvedValue(undefined);
    // happy-dom 默认 pathname 为 /
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    while (cleanups.length > 0) cleanups.pop()!();
    window.location.hash = '';
    window.history.replaceState({}, '', '/');
    vi.restoreAllMocks();
  });

  /** 启动路由同步并返回其清理函数 */
  function start(apps: ReturnType<typeof makeApp>[], state = makeState()) {
    const stop = createStartRouterSync(state, switchToAppFn as never)(
      apps as never,
      undefined,
    );
    cleanups.push(stop);
    return state;
  }

  describe('基础前缀匹配', () => {
    it('pathname 命中 activeRule 时激活对应应用', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      window.history.replaceState({}, '', '/ydsz-a/list');

      // handleRouteChange 由首次匹配触发，这里手动触发一次路由变更
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn).toHaveBeenCalled();
      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-a');
    });

    it('未命中任何 activeRule 时不激活应用', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      window.history.replaceState({}, '', '/other');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn).not.toHaveBeenCalled();
    });

    it('更长（更具体）的 activeRule 优先匹配', () => {
      start([makeApp('sub-a', '/ydsz-a'), makeApp('sub-detail', '/ydsz-a/detail')]);
      window.history.replaceState({}, '', '/ydsz-a/detail/1');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-detail');
    });
  });

  describe('search 支持（v4.3.2）', () => {
    it('带 query 的 URL 仍能命中 activeRule', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      window.history.replaceState({}, '', '/ydsz-a/chat?agentId=1');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-a');
    });

    it('activeRule 含 query 时精确匹配', () => {
      start([makeApp('sub-a', '/ydsz-a/chat?agentId=1')]);
      window.history.replaceState({}, '', '/ydsz-a/chat?agentId=1');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-a');
    });

    it('activeRule 含 query 但 URL query 不同时不匹配', () => {
      start([makeApp('sub-a', '/ydsz-a/chat?agentId=1')]);
      window.history.replaceState({}, '', '/ydsz-a/chat?agentId=2');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn).not.toHaveBeenCalled();
    });
  });

  describe('hash 模式支持（v4.3.2）', () => {
    it('hash 路由命中 activeRule（此前 pathname 恒为 / 导致完全失效）', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      // 模拟 createWebHashHistory 的 URL 形态：/index.html#/ydsz-a/chat
      window.history.replaceState({}, '', '/index.html#/ydsz-a/chat');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-a');
    });

    it('hash 路由带 query 时命中', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      window.history.replaceState({}, '', '/index.html#/ydsz-a/chat?agentId=1');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-a');
    });

    it('hash 路由未命中时不激活', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      window.history.replaceState({}, '', '/index.html#/other');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn).not.toHaveBeenCalled();
    });

    it('hash 不含路径时回退到 pathname', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      window.history.replaceState({}, '', '/ydsz-a/list#section');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-a');
    });
  });

  describe('末尾斜杠归一化（v4.3.2）', () => {
    it('activeRule 无末尾斜杠，URL 有末尾斜杠时仍命中', () => {
      start([makeApp('sub-a', '/ydsz-a')]);
      window.history.replaceState({}, '', '/ydsz-a/');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('sub-a');
    });

    it('根路径不被归一化掉', () => {
      start([makeApp('root-app', '/')]);
      window.history.replaceState({}, '', '/anything');

      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn.mock.calls[0]![0].name).toBe('root-app');
    });
  });

  describe('清理', () => {
    it('stop 后不再响应路由变化', () => {
      const stop = createStartRouterSync(makeState(), switchToAppFn as never)(
        [makeApp('sub-a', '/ydsz-a')] as never,
        undefined,
      );
      window.history.replaceState({}, '', '/ydsz-a');
      expect(switchToAppFn).toHaveBeenCalledTimes(1);

      stop();
      switchToAppFn.mockClear();

      window.history.replaceState({}, '', '/ydsz-b');
      window.dispatchEvent(new PopStateEvent('popstate'));

      expect(switchToAppFn).not.toHaveBeenCalled();
    });
  });
});
