/**
 * YdBreadcrumb 组件测试 —— 验证导出。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\breadcrumb\breadcrumb.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { describe, it, expect } from 'vitest';

import YdBreadcrumb from './YdBreadcrumb.vue';
import YdBreadcrumbEllipsis from './YdBreadcrumbEllipsis.vue';
import YdBreadcrumbItem from './YdBreadcrumbItem.vue';
import YdBreadcrumbLink from './YdBreadcrumbLink.vue';
import YdBreadcrumbList from './YdBreadcrumbList.vue';
import YdBreadcrumbPage from './YdBreadcrumbPage.vue';
import YdBreadcrumbSeparator from './YdBreadcrumbSeparator.vue';

describe('YdBreadcrumb compound components', () => {
  it('YdBreadcrumb 应被定义', () => {
    expect(YdBreadcrumb).toBeDefined();
  });

  it('YdBreadcrumbList 应被定义', () => {
    expect(YdBreadcrumbList).toBeDefined();
  });

  it('YdBreadcrumbItem 应被定义', () => {
    expect(YdBreadcrumbItem).toBeDefined();
  });

  it('YdBreadcrumbLink 应被定义', () => {
    expect(YdBreadcrumbLink).toBeDefined();
  });

  it('YdBreadcrumbPage 应被定义', () => {
    expect(YdBreadcrumbPage).toBeDefined();
  });

  it('YdBreadcrumbSeparator 应被定义', () => {
    expect(YdBreadcrumbSeparator).toBeDefined();
  });

  it('YdBreadcrumbEllipsis 应被定义', () => {
    expect(YdBreadcrumbEllipsis).toBeDefined();
  });
});

describe('YdBreadcrumbLink props', () => {
  it('应包含 class prop', () => {
    expect(YdBreadcrumbLink.props).toHaveProperty('class');
  });

  it('应包含 as prop', () => {
    expect(YdBreadcrumbLink.props).toHaveProperty('as');
  });

  it('as 默认值应为 a', () => {
    const asProp = YdBreadcrumbLink.props.as;
    expect(asProp).toHaveProperty('default', 'a');
  });
});
