/**
 * lifecycle-scheduler.spec.ts — 调度器核心路径单元测试
 *
 * v4.3.0 新增：补齐调度器核心路径覆盖（deactivateApp 完整卸载 / keep-alive 停靠 / LRU 淘汰）。
 * 覆盖场景：
 * 1. 完整卸载：调用 exports.unmount、清理样式、状态回退 NOT_LOADED
 * 2. 未挂载实例幂等返回 success
 * 3. unmount 抛错 → KernelError UNMOUNT_ERROR
 * 4. keep-alive 停靠：缓存 DOM、状态 UNMOUNTED、调用 deactivate/serialize 钩子
 * 5. LRU 淘汰：超过 maxKeepAliveApps 时淘汰最久未访问实例
 * 6. pin 保护：pinned 实例跳过 LRU 淘汰
 *
 * @path comm/effects/micro-kernel/src/__tests__/unit/lifecycle-scheduler.spec.ts
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

import type { MicroAppConfig } from '@ydsz/micro-runtime';

import { KernelError, KernelErrorCode } from '../../error-boundary';
import { createAppInstance, getAllInstances } from '../../app-state';
import { deactivateApp } from '../../lifecycle';
import { configureKeepAlive, resetScheduler } from '../../scheduler';

const CONTAINER_ID = 'subapp-container';

/** 构造最小子应用配置 */
function makeConfig(name: string): MicroAppConfig {
  return {
    name,
    entry: 'https://cdn.example.com/apps/' + name,
    container: '#' + CONTAINER_ID,
    activeRule: '/YDSZ-' + name,
  };
}

/** 挂载测试容器到 DOM */
function mountContainer(): HTMLElement {
  const container = document.createElement('div');
  container.id = CONTAINER_ID;
  document.body.appendChild(container);
  return container;
}

describe('lifecycle — deactivateApp 完整卸载', () => {
  let container: HTMLElement;

  beforeEach(() => {
    resetScheduler();
    container = mountContainer();
  });

  afterEach(() => {
    resetScheduler();
    document.body.innerHTML = '';
  });

  it('完整卸载：调用 unmount、清理样式、状态回退 NOT_LOADED', async () => {
    const instance = createAppInstance(makeConfig('userinfo'));
    const unmount = vi.fn().mockResolvedValue(undefined);
    instance.status = 'MOUNTED';
    instance.exports = { mount: vi.fn(), unmount };

    // 模拟子应用注入的样式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-micro-kernel-app', 'userinfo');
    document.head.appendChild(link);

    const result = await deactivateApp(instance);

    expect(unmount).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(instance.status).toBe('NOT_LOADED');
    expect(instance.exports).toBeNull();
    expect(
      document.querySelectorAll('link[data-micro-kernel-app="userinfo"]'),
    ).toHaveLength(0);
    // 容器上的子应用标记被清除
    expect(container.dataset.microApp).toBeUndefined();
  });

  it('未挂载实例幂等返回 success', async () => {
    const instance = createAppInstance(makeConfig('system'));
    instance.status = 'NOT_LOADED';

    const result = await deactivateApp(instance);

    expect(result.success).toBe(true);
    expect(instance.status).toBe('NOT_LOADED');
  });

  it('unmount 抛错时抛出 UNMOUNT_ERROR', async () => {
    const instance = createAppInstance(makeConfig('message'));
    instance.status = 'MOUNTED';
    instance.exports = {
      mount: vi.fn(),
      unmount: vi.fn().mockRejectedValue(new Error('unmount crashed')),
    };

    await expect(deactivateApp(instance)).rejects.toMatchObject({
      code: KernelErrorCode.UNMOUNT_ERROR,
    });
    expect(instance.error).toBe('Error: unmount crashed');
  });
});

describe('lifecycle — keep-alive 停靠与 LRU 淘汰', () => {
  let container: HTMLElement;

  beforeEach(() => {
    resetScheduler();
    container = mountContainer();
    configureKeepAlive({ enabled: true, maxKeepAliveApps: 2, keepAliveTTL: 0 });
  });

  afterEach(() => {
    resetScheduler();
    document.body.innerHTML = '';
  });

  it('keep-alive 停靠：缓存 DOM、状态 UNMOUNTED、调用 deactivate/serialize 钩子', async () => {
    const instance = createAppInstance(makeConfig('cron'));
    instance.status = 'MOUNTED';
    instance.keepAlive = true;
    const deactivate = vi.fn().mockResolvedValue(undefined);
    const serialize = vi.fn().mockResolvedValue({ page: 1 });
    instance.exports = {
      mount: vi.fn(),
      unmount: vi.fn(),
      deactivate,
      serialize,
    };

    // 模拟子应用渲染出的 DOM 节点
    const child = document.createElement('div');
    child.dataset.appRoot = 'cron';
    container.appendChild(child);

    const result = await deactivateApp(instance);

    expect(result.success).toBe(true);
    expect(instance.status).toBe('UNMOUNTED');
    expect(instance.cachedRoot).toBe(child);
    expect(instance.cachedParent).toBe(container);
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(serialize).toHaveBeenCalledTimes(1);
    expect(instance.cachedState).toEqual({ page: 1 });
    // DOM 从容器中移除
    expect(container.firstElementChild).toBeNull();
  });

  it('LRU 淘汰：超过 maxKeepAliveApps 时淘汰最久未访问实例', async () => {
    configureKeepAlive({ enabled: true, maxKeepAliveApps: 1, keepAliveTTL: 0 });

    const appA = createAppInstance(makeConfig('a'));
    appA.status = 'MOUNTED';
    appA.keepAlive = true;
    appA.lastActivatedAt = 100;
    appA.exports = { mount: vi.fn(), unmount: vi.fn() };

    const appB = createAppInstance(makeConfig('b'));
    appB.status = 'MOUNTED';
    appB.keepAlive = true;
    appB.lastActivatedAt = 200;
    appB.exports = { mount: vi.fn(), unmount: vi.fn() };

    // 先停靠 app-a（成为缓存态，占用唯一名额）
    container.appendChild(document.createElement('div'));
    const resultA = await deactivateApp(appA);
    expect(resultA.success).toBe(true);
    expect(appA.status).toBe('UNMOUNTED');

    // 再停靠 app-b → 超过 maxKeepAliveApps=1，应 LRU 淘汰最久未访问的 app-a
    container.appendChild(document.createElement('div'));
    const resultB = await deactivateApp(appB);

    expect(resultB.evicted).toContain('a');
    const evicted = getAllInstances().find((i) => i.config.name === 'a');
    expect(evicted?.status).toBe('NOT_LOADED');
    expect(appB.status).toBe('UNMOUNTED');
  });

  it('pin 保护：pinned 实例跳过 LRU 淘汰', async () => {
    configureKeepAlive({ enabled: true, maxKeepAliveApps: 1, keepAliveTTL: 0 });

    const appA = createAppInstance(makeConfig('a'));
    appA.status = 'MOUNTED';
    appA.keepAlive = true;
    appA.pinned = true; // pin 保护
    appA.exports = { mount: vi.fn(), unmount: vi.fn() };

    const appB = createAppInstance(makeConfig('b'));
    appB.status = 'MOUNTED';
    appB.keepAlive = true;
    appB.exports = { mount: vi.fn(), unmount: vi.fn() };

    container.appendChild(document.createElement('div'));
    const resultB = await deactivateApp(appB);

    // app-a 被 pin 保护，不应被淘汰；app-b 自身停靠成功
    expect(resultB.evicted).toBeUndefined();
    expect(getAllInstances().find((i) => i.config.name === 'a')?.status).toBe('MOUNTED');
    expect(getAllInstances().find((i) => i.config.name === 'b')?.status).toBe('UNMOUNTED');
  });
});
