/**
 * YdButtonBase 组件测试 — 验证变体渲染、as 属性与可访问性基础
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\button\button.test.ts
 * @author ydsz-team
 * @since 26.09.17
 */

import { describe, it, expect } from 'vitest';

import { mount } from '@vue/test-utils';

import YdButtonBase from './YdButtonBase.vue';
import { buttonVariants } from './button';

describe('YdButtonBase', () => {
  it('默认渲染为 button 标签', () => {
    const wrapper = mount(YdButtonBase);
    const el = wrapper.element as HTMLElement;
    expect(el.tagName).toBe('BUTTON');
  });

  it('应包含默认变体基础类名', () => {
    const wrapper = mount(YdButtonBase);
    const classList = wrapper.classes();
    // 基础类：inline-flex items-center justify-center
    expect(classList).toContain('inline-flex');
    expect(classList).toContain('items-center');
  });

  it('variant="destructive" 应包含对应 bg 类名', () => {
    const wrapper = mount(YdButtonBase, { props: { variant: 'destructive' } });
    const classList = wrapper.classes();
    // destructive variant 含 bg-destructive
    const hasDestructiveBg = classList.some((cls) =>
      cls.startsWith('bg-destructive'),
    );
    expect(hasDestructiveBg).toBe(true);
  });

  it('variant="outline" 应包含 border 类名', () => {
    const wrapper = mount(YdButtonBase, { props: { variant: 'outline' } });
    const classList = wrapper.classes();
    expect(classList).toContain('border');
  });

  it('size="sm" 应包含对应尺寸类名', () => {
    const wrapper = mount(YdButtonBase, { props: { size: 'sm' } });
    const classList = wrapper.classes();
    // sm 对应 h-8
    expect(classList).toContain('h-8');
  });

  it('size="lg" 应包含对应大尺寸类名', () => {
    const wrapper = mount(YdButtonBase, { props: { size: 'lg' } });
    const classList = wrapper.classes();
    // lg 对应 h-10
    expect(classList).toContain('h-10');
  });

  it('as="a" 时渲染为锚点元素', () => {
    const wrapper = mount(YdButtonBase, {
      props: { as: 'a' },
      attrs: { href: 'https://example.com' },
    });
    const el = wrapper.element as HTMLElement;
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('https://example.com');
  });

  it('slot 内容应正确渲染', () => {
    const wrapper = mount(YdButtonBase, {
      slots: { default: 'Click Me' },
    });
    expect(wrapper.text()).toContain('Click Me');
  });

  it('自定义 class 应与变体类名合并', () => {
    const wrapper = mount(YdButtonBase, {
      props: { class: 'my-custom-class' },
    });
    expect(wrapper.classes()).toContain('my-custom-class');
  });
});

describe('buttonVariants', () => {
  it('默认调用应返回完整类名字符串', () => {
    const classes = buttonVariants();
    expect(typeof classes).toBe('string');
    expect(classes.length).toBeGreaterThan(0);
  });

  it('指定 variant 与默认 variant 类名应不同', () => {
    const defaultClasses = buttonVariants();
    const destructiveClasses = buttonVariants({ variant: 'destructive' });
    expect(defaultClasses).not.toBe(destructiveClasses);
  });

  it('指定 size 与默认 size 类名应不同', () => {
    const defaultClasses = buttonVariants();
    const largeClasses = buttonVariants({ size: 'lg' });
    expect(defaultClasses).not.toBe(largeClasses);
  });

  it('默认 size 应返回 h-9（default size）', () => {
    const classes = buttonVariants();
    expect(classes).toContain('h-9');
  });
});
