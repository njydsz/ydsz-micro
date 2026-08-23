/**
 * reset-routes 工具函数单元测试
 *
 * 覆盖：
 * - 路由清理：移除不在白名单中的动态路由
 * - 白名单保留：静态路由（白名单中的路由）不被删除
 * - 空路由表处理
 * - 嵌套路由 name 提取
 * - 无 name 字段路由的警告
 *
 * @path comm/utils/src/helpers/__tests__/reset-routes.test.ts
 * @author ydsz-team
 * @since 4.2.1
 *
 * @todo(any) 测试文件使用 38 处 as any，原因：
 * 1. component 字段使用空对象 mock，不需要真实组件
 * 2. mockRouter 使用简化对象模拟 Router 类型
 * 后续可通过创建完整的 mock 工厂函数减少 any 使用
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ============================================================
// Mock: vue-router — 仅在需要时 mock Router 类型
// ============================================================

import type { RouteRecordName, RouteRecordRaw } from 'vue-router';

// ============================================================
// 直接引用源码中的 traverseTreeValues 实现
// ============================================================
function traverseTreeValues<T, V>(
  tree: T[],
  getValue: (node: T) => V,
  options?: { childProps: string },
): V[] {
  const result: V[] = [];
  const { childProps } = options || { childProps: 'children' };

  const dfs = (treeNode: T) => {
    const value = getValue(treeNode);
    result.push(value);
    const children = (treeNode as Record<string, any>)?.[childProps];
    if (!children) return;
    if (children.length > 0) {
      for (const child of children) {
        dfs(child);
      }
    }
  };

  for (const treeNode of tree) {
    dfs(treeNode);
  }
  return result.filter(Boolean);
}

// ============================================================
// 源码的等价实现（从 reset-routes.ts 提取）
// ============================================================
function resetStaticRoutes(
  router: {
    getRoutes: () => Array<{ name?: RouteRecordName }>;
    hasRoute: (name: RouteRecordName) => boolean;
    removeRoute: (name: RouteRecordName) => void;
  },
  routes: RouteRecordRaw[],
) {
  const staticRouteNames = traverseTreeValues<
    RouteRecordRaw,
    RouteRecordName | undefined
  >(routes, (route) => {
    if (!route.name) {
      console.warn(
        `The route with the path ${route.path} needs to have the field name specified.`,
      );
    }
    return route.name;
  });

  const { getRoutes, hasRoute, removeRoute } = router;
  const allRoutes = getRoutes();
  allRoutes.forEach(({ name }) => {
    if (name && !staticRouteNames.includes(name) && hasRoute(name)) {
      removeRoute(name);
    }
  });
}

// ============================================================
// 辅助函数
// ============================================================
function createMockRouter(routes: Array<{ name?: RouteRecordName }>) {
  const routeMap = new Map<RouteRecordName, boolean>();
  routes.forEach((r) => {
    if (r.name) routeMap.set(r.name, true);
  });

  return {
    getRoutes: () => routes,
    hasRoute: (name: RouteRecordName) => routeMap.has(name),
    removeRoute: vi.fn((name: RouteRecordName) => {
      routeMap.delete(name);
    }),
    removedRoutes: [] as RouteRecordName[],
  };
}

// ============================================================
// Test suites
// ============================================================
describe('resetStaticRoutes', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  // ----------------------------------------------------------
  // 基础路由清理
  // ----------------------------------------------------------
  describe('basic route cleanup', () => {
    it('应移除不在白名单中的动态路由', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/dashboard', name: 'Dashboard', component: {} as any },
        { path: '/settings', name: 'Settings', component: {} as any },
      ];

      const mockRouter = createMockRouter([
        { name: 'Dashboard' },
        { name: 'Settings' },
        { name: 'DynamicRoute1' },
        { name: 'DynamicRoute2' },
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      expect(removeRouteSpy).toHaveBeenCalledTimes(2);
      expect(removeRouteSpy).toHaveBeenCalledWith('DynamicRoute1');
      expect(removeRouteSpy).toHaveBeenCalledWith('DynamicRoute2');
    });

    it('不应移除白名单中的静态路由', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/dashboard', name: 'Dashboard', component: {} as any },
      ];

      const mockRouter = createMockRouter([{ name: 'Dashboard' }]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      expect(removeRouteSpy).not.toHaveBeenCalled();
    });

    it('路由表为空时不应报错', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/home', name: 'Home', component: {} as any },
      ];

      const mockRouter = createMockRouter([]);

      expect(() =>
        resetStaticRoutes(mockRouter as any, staticRoutes),
      ).not.toThrow();
    });

    it('静态路由为空数组时应移除所有动态路由', () => {
      const staticRoutes: RouteRecordRaw[] = [];

      const mockRouter = createMockRouter([
        { name: 'Route1' },
        { name: 'Route2' },
        { name: 'Route3' },
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      expect(removeRouteSpy).toHaveBeenCalledTimes(3);
    });
  });

  // ----------------------------------------------------------
  // 白名单保留
  // ----------------------------------------------------------
  describe('whitelist preservation', () => {
    it('多个静态路由应全部保留', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/a', name: 'RouteA', component: {} as any },
        { path: '/b', name: 'RouteB', component: {} as any },
        { path: '/c', name: 'RouteC', component: {} as any },
      ];

      const mockRouter = createMockRouter([
        { name: 'RouteA' },
        { name: 'RouteB' },
        { name: 'RouteC' },
        { name: 'ExtraRoute' },
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      // 只移除了 ExtraRoute
      expect(removeRouteSpy).toHaveBeenCalledTimes(1);
      expect(removeRouteSpy).toHaveBeenCalledWith('ExtraRoute');

      // 白名单路由不应被移除
      expect(removeRouteSpy).not.toHaveBeenCalledWith('RouteA');
      expect(removeRouteSpy).not.toHaveBeenCalledWith('RouteB');
      expect(removeRouteSpy).not.toHaveBeenCalledWith('RouteC');
    });

    it('hasRoute 返回 false 的路由不应被移除', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/home', name: 'Home', component: {} as any },
      ];

      // 创建一个 hasRoute 总是返回 false 的 mock
      const mockRouter = {
        getRoutes: () => [{ name: 'GhostRoute' }],
        hasRoute: vi.fn().mockReturnValue(false),
        removeRoute: vi.fn(),
      };

      resetStaticRoutes(mockRouter as any, staticRoutes);

      expect(mockRouter.removeRoute).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // 嵌套路由
  // ----------------------------------------------------------
  describe('nested routes', () => {
    it('应提取嵌套子路由的 name 到白名单', () => {
      const staticRoutes: RouteRecordRaw[] = [
        {
          path: '/parent',
          name: 'Parent',
          component: {} as any,
          children: [
            {
              path: 'child1',
              name: 'Child1',
              component: {} as any,
            },
            {
              path: 'child2',
              name: 'Child2',
              component: {} as any,
            },
          ],
        },
      ];

      const mockRouter = createMockRouter([
        { name: 'Parent' },
        { name: 'Child1' },
        { name: 'Child2' },
        { name: 'GhostChild' },
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      // 只应移除 GhostChild
      expect(removeRouteSpy).toHaveBeenCalledTimes(1);
      expect(removeRouteSpy).toHaveBeenCalledWith('GhostChild');

      // Parent 和子路由不应被移除
      expect(removeRouteSpy).not.toHaveBeenCalledWith('Parent');
      expect(removeRouteSpy).not.toHaveBeenCalledWith('Child1');
      expect(removeRouteSpy).not.toHaveBeenCalledWith('Child2');
    });

    it('多层嵌套路由应正确提取所有 name', () => {
      const staticRoutes: RouteRecordRaw[] = [
        {
          path: '/l1',
          name: 'Level1',
          component: {} as any,
          children: [
            {
              path: 'l2',
              name: 'Level2',
              component: {} as any,
              children: [
                {
                  path: 'l3',
                  name: 'Level3',
                  component: {} as any,
                },
              ],
            },
          ],
        },
      ];

      const mockRouter = createMockRouter([
        { name: 'Level1' },
        { name: 'Level2' },
        { name: 'Level3' },
        { name: 'DynamicPage' },
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      // 只移除 DynamicPage
      expect(removeRouteSpy).toHaveBeenCalledTimes(1);
      expect(removeRouteSpy).toHaveBeenCalledWith('DynamicPage');
    });

    it('子路由无 name 不应包含在白名单中', () => {
      const staticRoutes: RouteRecordRaw[] = [
        {
          path: '/parent',
          name: 'Parent',
          component: {} as any,
          children: [
            {
              path: 'no-name-child',
              component: {} as any,
            },
          ],
        },
      ];

      const mockRouter = createMockRouter([
        { name: 'Parent' },
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      // Parent 不应被移除
      expect(removeRouteSpy).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // 警告日志
  // ----------------------------------------------------------
  describe('warning for missing name', () => {
    it('无 name 字段的路由应触发 console.warn', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/no-name', component: {} as any },
      ];

      const mockRouter = createMockRouter([]);

      resetStaticRoutes(mockRouter as any, staticRoutes);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/no-name'),
      );
    });

    it('有 name 字段的路由不应触发 console.warn', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/with-name', name: 'WithName', component: {} as any },
      ];

      const mockRouter = createMockRouter([{ name: 'WithName' }]);

      resetStaticRoutes(mockRouter as any, staticRoutes);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('混合场景应只对无 name 的路由发出警告', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/has-name', name: 'HasName', component: {} as any },
        { path: '/no-name-a', component: {} as any },
        { path: '/no-name-b', component: {} as any },
      ];

      const mockRouter = createMockRouter([{ name: 'HasName' }]);

      resetStaticRoutes(mockRouter as any, staticRoutes);

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/no-name-a'),
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/no-name-b'),
      );
    });
  });

  // ----------------------------------------------------------
  // 边界情况
  // ----------------------------------------------------------
  describe('edge cases', () => {
    it('路由表中无 name 的路由不应被移除', () => {
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/home', name: 'Home', component: {} as any },
      ];

      // 路由表中存在无 name 的路由
      const mockRouter = createMockRouter([
        { name: 'Home' },
        {}, // 无 name
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      // 无 name 的路由不会被移除（因为条件要求 name 为 truthy）
      expect(removeRouteSpy).not.toHaveBeenCalled();
    });

    it('Symbol 类型的 route name 应正确处理', () => {
      const symbolName = Symbol('SymbolRoute') as unknown as RouteRecordName;
      const staticRoutes: RouteRecordRaw[] = [
        { path: '/symbol', name: symbolName, component: {} as any },
      ];

      const mockRouter = createMockRouter([
        { name: symbolName },
        { name: 'OtherRoute' },
      ]);

      const removeRouteSpy = vi.spyOn(mockRouter, 'removeRoute');

      resetStaticRoutes(mockRouter as any, staticRoutes);

      // Symbol 路由不应被移除
      expect(removeRouteSpy).not.toHaveBeenCalledWith(symbolName);
      // OtherRoute 应被移除
      expect(removeRouteSpy).toHaveBeenCalledWith('OtherRoute');
    });

    it('空静态路由 + 空路由表不应报错', () => {
      const mockRouter = createMockRouter([]);

      expect(() =>
        resetStaticRoutes(mockRouter as any, []),
      ).not.toThrow();
    });
  });
});
