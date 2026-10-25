/**
 * YdBreadcrumb 组件测试 —— 七件套原子组件导出 + YdBreadcrumbPro 配置式渲染。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\breadcrumb\breadcrumb.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdBreadcrumb from './YdBreadcrumb.vue';
import YdBreadcrumbEllipsis from './YdBreadcrumbEllipsis.vue';
import YdBreadcrumbItem from './YdBreadcrumbItem.vue';
import YdBreadcrumbLink from './YdBreadcrumbLink.vue';
import YdBreadcrumbList from './YdBreadcrumbList.vue';
import YdBreadcrumbPage from './YdBreadcrumbPage.vue';
import YdBreadcrumbPro from './YdBreadcrumbPro.vue';
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

describe('YdBreadcrumbPro 配置式面包屑', () => {
  const items = [
    { href: '/', title: '首页' },
    { href: '/kg', title: '知识图谱' },
    { title: '实体详情' },
  ];

  it('按 items 渲染全部层级文本', () => {
    const wrapper = mount(YdBreadcrumbPro, { props: { items } });
    const nav = wrapper.find('nav');
    expect(nav.exists()).toBe(true);
    expect(nav.text()).toContain('首页');
    expect(nav.text()).toContain('知识图谱');
    expect(nav.text()).toContain('实体详情');
  });

  it('带 href 的项渲染为链接，末级渲染为当前页', () => {
    const wrapper = mount(YdBreadcrumbPro, { props: { items } });
    const links = wrapper.findAll('a');
    expect(links).toHaveLength(2);
    expect(links[0]!.attributes('href')).toBe('/');
    expect(links[1]!.attributes('href')).toBe('/kg');
    expect(wrapper.text()).toContain('实体详情');
  });

  it('disabled 项不应生成可点击链接', () => {
    const wrapper = mount(YdBreadcrumbPro, {
      props: { items: [{ disabled: true, href: '/x', title: '禁用层' }, { title: '当前' }] },
    });
    expect(wrapper.findAll('a')).toHaveLength(0);
    expect(wrapper.text()).toContain('禁用层');
  });

  it('默认分隔符为斜杠，可通过 separator 覆盖', () => {
    const byDefault = mount(YdBreadcrumbPro, { props: { items } });
    expect(byDefault.text()).toContain('/');
    const customized = mount(YdBreadcrumbPro, { props: { items, separator: '>' } });
    expect(customized.text()).toContain('>');
    expect(customized.text()).not.toContain('/');
  });

  it('单项时不渲染分隔符', () => {
    const wrapper = mount(YdBreadcrumbPro, { props: { items: [{ title: '只有首页' }] } });
    expect(wrapper.text()).toBe('只有首页');
  });
});
