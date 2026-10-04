/**
 * defineYdzSubApp 单元测试 — 验证核心装配逻辑与 hooks 时序
 *
 * <p>测试范围：
 * <ol>
 *   <li>返回值含 app / router / pinia</li>
 *   <li>自定义 createRouter 优先调用</li>
 *   <li>onBeforeMount / onMounted 在正确时机被调用</li>
 *   <li>appKey 为空串时抛出明确 Error</li>
 * </ol>
 *
 * <p>为避免微前端运行时与 feature-flags 冷启动开销，
 * 此处 mock 掉 @ydsz/micro-runtime 与 @ydsz-core/feature-flags，
 * 仅验证 defineYdzSubApp 自身的装配与时序保证。
 *
 * @path comm\effects\shared-business\src\composables\__tests__\use-bootstrap.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Component } from 'vue';
import type { Router } from 'vue-router';

// ---------- mocks ----------

/** mock micro-runtime: useMicroProps 返回不含 featureFlags 的默认 props */
vi.mock('@ydsz/micro-runtime/use-micro-props', () => ({
  useMicroProps: () => ({
    appName: 'test',
    basename: '/',
    container: document.createElement('div'),
    sandbox: 'snapshot' as const,
    globalState: {},
    messageBus: {},
    context: {},
  }),
  provideMicroProps: () => {},
  MICRO_PROPS_KEY: Symbol('__MICRO_PROPS__'),
}));

/** mock feature-flags: 空实现避免 init 阻塞 */
vi.mock('@ydsz-core/feature-flags', () => ({
  defineFeatureFlags: () => {},
  initFeatureFlags: async () => {},
  featureFlagsManager: { init: async () => {}, register: () => {} },
  FeatureFlagsManager: class { init = async () => {}; register = () => {}; },
}));

/** mock styles: 无实际 CSS */
vi.mock('@ydsz/styles', () => ({}));

// ---------- import after mocks ----------

import { defineYdzSubApp } from '../use-bootstrap';

// ---------- helpers ----------

/** 极简模拟根组件 */
const MockRoot = { template: '<div>test</div>' } as unknown as Component;

/** 同步创建最小可用 vue-router 实例的自定义工厂 */
function customRouterFactory(): Router {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vueRouter = require('vue-router');
  return vueRouter.createRouter({
    history: vueRouter.createWebHistory('/__test__'),
    routes: [],
  });
}

// ---------- setup / teardown ----------

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
});

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------- tests ----------

describe('defineYdzSubApp', () => {

  // ----- 1. 返回值含 app / router / pinia -----
  it('返回值应包含 app / router / pinia 三个实例', async () => {
    const result = await defineYdzSubApp({
      appKey: 'test-instance',
      createApp: async () => ({ default: MockRoot }),
      createRouter: () => customRouterFactory(),
    });

    expect(result).toHaveProperty('app');
    expect(result).toHaveProperty('router');
    expect(result).toHaveProperty('pinia');
    expect(result.app).toBeDefined();
    expect(result.router).toBeDefined();
    expect(result.pinia).toBeDefined();

    result.app.unmount();
  }, 30_000);

  // ----- 2. 自定义 createRouter 优先调用 -----
  it('自定义 createRouter 应被优先调用而非使用默认工厂', async () => {
    const customFactory = vi.fn((): Router => customRouterFactory());

    const result = await defineYdzSubApp({
      appKey: 'test-custom-router',
      createApp: async () => ({ default: MockRoot }),
      createRouter: customFactory,
    });

    expect(customFactory).toHaveBeenCalledTimes(1);
    expect(customFactory).toHaveBeenCalledWith(result.app);

    result.app.unmount();
  });

  // ----- 3. onBeforeMount / onMounted 时序 -----
  it('onBeforeMount 应先于挂载执行，onMounted 应晚于挂载执行', async () => {
    const callOrder: string[] = [];

    const onBeforeMount = vi.fn(async () => {
      callOrder.push('beforeMount');
    });

    const onMounted = vi.fn(async () => {
      callOrder.push('mounted');
    });

    const result = await defineYdzSubApp({
      appKey: 'test-hooks-order',
      createApp: async () => ({ default: MockRoot }),
      createRouter: () => customRouterFactory(),
      onBeforeMount,
      onMounted,
    });

    expect(onBeforeMount).toHaveBeenCalledTimes(1);
    expect(onMounted).toHaveBeenCalledTimes(1);
    // 时序：beforeMount 先于 mounted
    expect(callOrder.indexOf('beforeMount')).toBeLessThan(callOrder.indexOf('mounted'));

    result.app.unmount();
  });

  // ----- 4. appKey 为空串抛 Error -----
  it('appKey 为空串时应抛出明确 Error', async () => {
    await expect(
      defineYdzSubApp({
        appKey: '',
        createApp: async () => ({ default: MockRoot }),
        createRouter: () => customRouterFactory(),
      }),
    ).rejects.toThrow('[defineYdzSubApp] appKey is required');
  });

  it('appKey 为纯空格串时也应抛出 Error', async () => {
    await expect(
      defineYdzSubApp({
        appKey: '   ',
        createApp: async () => ({ default: MockRoot }),
        createRouter: () => customRouterFactory(),
      }),
    ).rejects.toThrow('[defineYdzSubApp] appKey is required');
  });
});
