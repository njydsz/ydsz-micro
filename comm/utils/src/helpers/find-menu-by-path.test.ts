/**
 * findMenuByPath 单元测试 — 验证菜单树路径查找逻辑
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\utils\src\helpers\find-menu-by-path.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { findMenuByPath, findRootMenuByPath } from './find-menu-by-path';
import type { MenuRecordRaw } from '@ydsz-core/typings';

describe('findMenuByPath', () => {
  const menus: MenuRecordRaw[] = [
    { path: '/system', name: 'System', title: '系统管理' },
    {
      path: '/business',
      name: 'Business',
      title: '业务管理',
      children: [
        { path: '/business/order', name: 'Order', title: '订单管理' },
        {
          path: '/business/report',
          name: 'Report',
          title: '报表',
          children: [
            { path: '/business/report/sales', name: 'SalesReport', title: '销售报表' },
          ],
        },
      ],
    },
  ];

  it('应在一级菜单中查找成功', () => {
    const result = findMenuByPath(menus, '/system');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('System');
  });

  it('应在二级菜单中查找成功', () => {
    const result = findMenuByPath(menus, '/business/order');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Order');
  });

  it('应在三级嵌套菜单中查找成功', () => {
    const result = findMenuByPath(menus, '/business/report/sales');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('SalesReport');
  });

  it('路径不存在时应返回 null', () => {
    const result = findMenuByPath(menus, '/not-found');
    expect(result).toBeNull();
  });

  it('path 为空时应返回 null', () => {
    const result = findMenuByPath(menus, undefined);
    expect(result).toBeNull();
  });
});

describe('findRootMenuByPath', () => {
  const menus: MenuRecordRaw[] = [
    {
      path: '/business',
      name: 'Business',
      parents: ['/business'],
      title: '业务管理',
    },
    {
      path: '/system',
      name: 'System',
      parents: ['/system'],
      title: '系统管理',
    },
  ];

  it('应返回匹配路径的根菜单和 findMenu', () => {
    const result = findRootMenuByPath(menus, '/business', 0);
    expect(result.findMenu?.name).toBe('Business');
    expect(result.rootMenu?.name).toBe('Business');
    expect(result.rootMenuPath).toBe('/business');
  });

  it('不同 level 应对应 parents 数组不同索引', () => {
    const result = findRootMenuByPath(menus, '/system', 0);
    expect(result.rootMenu?.name).toBe('System');
  });

  it('找不到匹配路径时 rootMenu 应为 undefined', () => {
    const result = findRootMenuByPath(menus, '/not-found', 0);
    expect(result.findMenu).toBeNull();
    expect(result.rootMenu).toBeUndefined();
  });
});
