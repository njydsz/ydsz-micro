/**
 * YdCodeHighlighter 组件单元测试。
 *
 * 用例覆盖：
 * - 默认渲染与纯文本输出
 * - 关键字 / 字符串 / 注释 / 数字着色
 * - 行号显示开关
 * - maxHeight 滚动约束
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\code-highlighter\YdCodeHighlighter.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */

import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import YdCodeHighlighter from './YdCodeHighlighter.vue';

describe('YdCodeHighlighter', () => {
  it('渲染纯文本代码', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: 'hello world' },
    });
    expect(wrapper.text()).toContain('hello world');
  });

  it('多行代码按行渲染', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: 'line1\nline2\nline3' },
    });
    const lines = wrapper.findAll('.code-hl__line');
    expect(lines).toHaveLength(3);
  });

  it('showLineNumbers=true 时显示行号', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: 'const a = 1;\nconst b = 2;', language: 'ts', showLineNumbers: true },
    });
    const numbers = wrapper.findAll('.code-hl__line-number');
    expect(numbers).toHaveLength(2);
    expect(numbers[0]?.text()).toBe('1');
    expect(numbers[1]?.text()).toBe('2');
  });

  it('showLineNumbers=false 时不显示行号', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: 'const a = 1;', language: 'ts', showLineNumbers: false },
    });
    expect(wrapper.find('.code-hl__line-number').exists()).toBe(false);
  });

  it('对 TS 关键字着色', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: 'const x = 42;', language: 'ts' },
    });
    const keywords = wrapper.findAll('.code-hl__token--keyword');
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords.some((el) => el.text() === 'const')).toBe(true);
  });

  it('对字符串字面量着色', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: "const s = 'hello';", language: 'ts' },
    });
    const strings = wrapper.findAll('.code-hl__token--string');
    expect(strings.length).toBeGreaterThan(0);
    expect(strings.some((el) => el.text() === "'hello'")).toBe(true);
  });

  it('对注释着色', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: '// this is a comment', language: 'ts' },
    });
    const comments = wrapper.findAll('.code-hl__token--comment');
    expect(comments.length).toBeGreaterThan(0);
  });

  it('对 JSON key 着色', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: '{"name": "ydsz"}', language: 'json' },
    });
    const keywords = wrapper.findAll('.code-hl__token--keyword');
    expect(keywords.some((el) => el.text() === '"name"')).toBe(true);
  });

  it('maxHeight>0 时设置内联 maxHeight', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: 'x', maxHeight: 200 },
    });
    const root = wrapper.find('.code-hl');
    const el = root.element as HTMLElement;
    expect(el.style.maxHeight).toBe('200px');
  });

  it('language=text 时不产生高亮片段', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: 'const x = 1;', language: 'text' },
    });
    expect(wrapper.find('.code-hl__token--keyword').exists()).toBe(false);
  });

  it('空代码不报错', () => {
    const wrapper = mount(YdCodeHighlighter, {
      props: { code: '' },
    });
    expect(wrapper.exists()).toBe(true);
  });
});
