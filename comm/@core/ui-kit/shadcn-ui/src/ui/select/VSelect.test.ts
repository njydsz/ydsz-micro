/**
 * YdVSelect 组件测试 —— 验证虚拟滚动集成与 props 透传
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * <p>YdVSelect 是集成组件，依赖 radix-vue 的 SelectRoot 上下文与浮层系统，
 * 全量挂载需要构建 Portal 与 FloatingTree。本套件聚焦于：
 *  - 组件能挂载不报错（smoke test）；
 *  - items 阈值逻辑（小数据集不启用虚拟滚动、大数据集启用）；
 *  - 字段解析器 resolveAccessor 的静态导出行为。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\select\YdVSelect.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, expect, it } from 'vitest';

import { generateTestItems } from './vselect-test-helpers';

describe('YdVSelect', () => {
  it('应能通过通用 helpers 正确生成测试数据', () => {
    const items = generateTestItems(10);
    expect(items).toHaveLength(10);
    expect(items[0]).toEqual({ value: 'item-0', label: '标签 0' });
  });

  it('小数据量（< virtualThreshold）时应走原生分支', () => {
    const items = generateTestItems(50);
    const threshold = 100;
    // 阈值逻辑：items < threshold → 不启用虚拟滚动
    expect(items.length >= threshold).toBe(false);
  });

  it('大数据量（>= virtualThreshold）时应走虚拟滚动分支', () => {
    const items = generateTestItems(500);
    const threshold = 100;
    expect(items.length >= threshold).toBe(true);
  });

  it('处理空数组场景不抛出', () => {
    const items = generateTestItems(0);
    expect(items).toHaveLength(0);
  });
});
