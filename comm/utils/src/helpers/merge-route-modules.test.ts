/**
 * mergeRouteModules 单元测试 — 验证路由合并逻辑
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 */

import { describe, it, expect } from 'vitest';
import { mergeRouteModules } from './merge-route-modules';
import type { RouteRecordRaw } from 'vue-router';

describe('mergeRouteModules', () => {
  function makeModule(routes: RouteRecordRaw[]): { default: RouteRecordRaw[] } {
    return { default: routes };
  }

  it('应合并多个模块的路由为一个扁平数组', () => {
    const modules = {
      agent: makeModule([{ path: '/agent', name: 'Agent' }]),
      chat: makeModule([{ path: '/chat', name: 'Chat' }]),
    };
    const result = mergeRouteModules(modules);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.path)).toEqual(['/agent', '/chat']);
  });

  it('遇到模块 default 为空数组时应跳过（不添加元素）', () => {
    const modules = {
      a: makeModule([{ path: '/a', name: 'A' }]),
      b: makeModule([]),
      c: makeModule([{ path: '/c', name: 'C' }]),
    };
    const result = mergeRouteModules(modules);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.path)).toEqual(['/a', '/c']);
  });

  it('传入空对象应返回空数组', () => {
    const result = mergeRouteModules({});
    expect(result).toEqual([]);
  });

  it('一个模块包含多条路由时应全部合并', () => {
    const routes: RouteRecordRaw[] = [
      { path: '/dag', name: 'DAG' },
      { path: '/debug', name: 'Debug' },
    ];
    const result = mergeRouteModules({ flow: makeModule(routes) });
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('DAG');
    expect(result[1].name).toBe('Debug');
  });
});
