/**
 * YdszUiResolver 自动导入解析测试。
 *
 * <p>resolver 的职责边界很窄：名册内的名字放行、名册外的名字必须返回 undefined。
 * 过去名册里存在 60+ 个包根并未导出的组件名，构建期会生成指向不存在导出的 import，
 * 因此这里把「幽灵名一律不解析」钉成用例。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/resolver.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import type { ComponentResolverObject } from 'unplugin-vue-components/types';

import { describe, expect, it } from 'vitest';

import { YDSZ_UI_COMPONENT_NAMES } from './component-names';
import { YdszUiResolver } from './resolver';

/**
 * 取出组件解析器（resolvers 数组中 type 为 component 的那一个）。
 *
 * @return 组件解析器对象
 */
function componentResolver(): ComponentResolverObject {
  const resolver = YdszUiResolver().find(item => item.type === 'component');
  if (!resolver || resolver.type !== 'component') {
    throw new Error('YdszUiResolver 未返回 component 解析器');
  }
  return resolver;
}

describe('YdszUiResolver 组件解析', () => {
  const resolver = componentResolver();

  it('名册内的组件应解析到包根', () => {
    expect(resolver.resolve('YdSelectSmart', '')).toEqual({
      from: '@ydsz-core/ydsz-ui',
      name: 'YdSelectSmart',
    });
    expect(resolver.resolve('YdTreeSelect', '')).toEqual({
      from: '@ydsz-core/ydsz-ui',
      name: 'YdTreeSelect',
    });
  });

  it('名册内的每一个名字都应命中', () => {
    const unresolved = YDSZ_UI_COMPONENT_NAMES.filter(name => !resolver.resolve(name, ''));
    expect(unresolved).toEqual([]);
  });

  it('名册外的 Yd 前缀名字不应解析', () => {
    // 这些名字曾存在于旧名册中，但包根从未导出它们
    for (const ghost of ['YdCommand', 'YdCombobox', 'YdTreeItem', 'YdSliderThumb']) {
      expect(resolver.resolve(ghost, '')).toBeUndefined();
    }
    expect(resolver.resolve('YdNotExists', '')).toBeUndefined();
  });

  it('非 Yd 前缀的名字不应解析', () => {
    expect(resolver.resolve('ElButton', '')).toBeUndefined();
    expect(resolver.resolve('Button', '')).toBeUndefined();
  });
});

describe('YdszUiResolver 指令解析', () => {
  /**
   * 取出指令解析器。
   *
   * @param options - 传给 YdszUiResolver 的配置
   * @returns 指令解析器的 resolve 函数
   */
  function resolveDirective(options: Parameters<typeof YdszUiResolver>[0] = {}): (name: string) => unknown {
    const directive = YdszUiResolver(options).find(item => item.type === 'directive');
    if (!directive || directive.type !== 'directive') {
      throw new Error('YdszUiResolver 未返回 directive 解析器');
    }
    return (name: string) => directive.resolve(name, '');
  }

  it('默认开启时应解析 v-ripple 与 v-click-outside', () => {
    const resolve = resolveDirective();
    expect(resolve('v-ripple')).toBeTruthy();
    expect(resolve('v-click-outside')).toBeTruthy();
    expect(resolve('v-nope')).toBeUndefined();
  });

  it('驼峰与裸名写法应归一化到同一个指令', () => {
    const resolve = resolveDirective();
    expect(resolve('VRipple')).toBeTruthy();
    expect(resolve('ripple')).toBeTruthy();
    expect(resolve('ClickOutside')).toBeTruthy();
  });

  it('自定义前缀应替换默认 v 而不是叠加残留分隔符', () => {
    const resolve = resolveDirective({ prefix: 'yd' });
    expect(resolve('yd-ripple')).toBeTruthy();
    expect(resolve('YdClickOutside')).toBeTruthy();
  });

  it('directives=false 时不应注册指令解析器', () => {
    expect(YdszUiResolver({ directives: false }).some(item => item.type === 'directive')).toBe(false);
  });
});
