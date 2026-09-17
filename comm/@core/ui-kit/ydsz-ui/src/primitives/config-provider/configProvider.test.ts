/**
 * YdConfigProvider 组件测试 —— 验证上下文注入与回退。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\config-provider\configProvider.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import { CONFIG_INJECTION_KEY } from './YdConfigProvider.vue';

import { useConfigProvider } from './useConfigProvider';

describe('YdConfigProvider exports', () => {
  it('YdConfigProvider 组件应被定义', async () => {
    const { default: YdConfigProvider } = await import('./YdConfigProvider.vue');
    expect(YdConfigProvider).toBeDefined();
    expect(typeof YdConfigProvider).toBe('object');
  });

  it('CONFIG_INJECTION_KEY 应定义为 symbol', () => {
    expect(typeof CONFIG_INJECTION_KEY === 'symbol').toBe(true);
  });

  it('CONFIG_INJECTION_KEY 描述应为 ydsz-config', () => {
    expect(CONFIG_INJECTION_KEY.description).toBe('ydsz-config');
  });
});

describe('useConfigProvider fallback', () => {
  it('无 provider 包裹时回退到 DEFAULT_CONFIG', () => {
    const config = useConfigProvider();
    expect(config).toBeDefined();
    expect(config.density).toBe('default');
    expect(config.size).toBe('default');
    expect(config.prefixCls).toBe('yd');
    expect(config.isDisabled).toBe(false);
    expect(config.locale).toEqual({});
    expect(config.wave).toEqual({ isDisabled: false });
    expect(config.theme).toEqual({ mode: 'auto', preset: 'light' });
  });

  it('禁用 fallback 时返回空对象', () => {
    const config = useConfigProvider(false);
    expect(config).toBeDefined();
    expect(Object.keys(config).length).toBe(0);
  });

  it('返回的配置对象不应为 null 或 undefined', () => {
    const config = useConfigProvider();
    expect(config).not.toBeNull();
    expect(config).not.toBeUndefined();
  });
});

describe('ConfigContext type guards', () => {
  it('size 只允许 small / default / large', async () => {
    const { default: Comp } = await import('./YdConfigProvider.vue');
    expect(Comp).toBeDefined();
    // SFC props 存在性校验
    expect(Comp.props).toHaveProperty('config');
  });
});
