// @vitest-environment jsdom
/**
 * v-safe-html 消毒器伴生测试。
 *
 * <p>覆盖白名单放行、越权标签降级、危险协议属性剔除、SVG 驼峰标签保留，
 * 以及指令钩子把消毒结果写回元素的契约。环境选 jsdom：SVG 大小写还原（clipPath 等）
 * 依赖 HTML 解析器的 SVG element adjustment，happy-dom 未实现该规则。
 *
 * @path comm/effects/common-ui/src/components/safe-html/yd-safe-html.test.ts
 * @author ydsz-team
 * @since 5.7.0
 */
import type { DirectiveBinding } from 'vue';

import { describe, expect, it } from 'vitest';

import { sanitize, vSafeHtml } from './yd-safe-html';

/** 构造指令钩子所需的最小绑定对象 */
function bind(value: string): DirectiveBinding<string> {
  return { value } as unknown as DirectiveBinding<string>;
}

describe('sanitize', () => {
  it('保留白名单标签与安全属性', () => {
    const html = '<mark>关键词</mark><a href="https://ydsz.dev/x?i=1#frag" target="_blank">链接</a>';
    const result = sanitize(html);
    expect(result).toContain('<mark>关键词</mark>');
    expect(result).toContain('href="https://ydsz.dev/x?i=1#frag"');
    expect(result).toContain('target="_blank"');
  });

  it('保留站内相对路径与锚点 href', () => {
    expect(sanitize('<a href="/system/config">内部</a>')).toContain('href="/system/config"');
    expect(sanitize('<a href="#section">锚点</a>')).toContain('href="#section"');
  });

  it('非白名单标签整段降级为文本，且不残留可执行属性', () => {
    const result = sanitize('<img src="x" onerror="window.__pwn = 1"><script>alert(1)</script>');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<script');
    expect(result).not.toContain('onerror');
    expect((window as unknown as { __pwn?: number }).__pwn).toBeUndefined();
  });

  it('剔除 javascript: 协议与事件处理器属性', () => {
    const result = sanitize('<a href="javascript:alert(1)" onclick="alert(2)">点我</a>');
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('onclick');
    expect(result).toContain('点我');
  });

  it('剔除白名单外的属性但保留标签本身', () => {
    const result = sanitize('<span data-secret="s3cr3t" class="hl">文本</span>');
    expect(result).not.toContain('data-secret');
    expect(result).toContain('class="hl"');
  });

  it('保留 HTML 解析器还原成驼峰的 SVG 标签', () => {
    const result = sanitize(
      '<svg viewBox="0 0 10 10"><clipPath id="c"><rect width="10" height="10"/></clipPath><foreignObject x="0"><div>说明</div></foreignObject></svg>',
    );
    expect(result).toContain('<clipPath');
    expect(result).toContain('<foreignObject');
    expect(result).toContain('说明');
  });

  it('空串返回空串', () => {
    expect(sanitize('')).toBe('');
  });
});

describe('vSafeHtml 指令', () => {
  it('mounted 写入消毒后的 HTML', () => {
    const el = document.createElement('div');
    vSafeHtml.mounted?.(el, bind('<b>粗体</b><img src="x" onerror="window.__pwn = 1">'));
    expect(el.innerHTML).toContain('<b>粗体</b>');
    expect(el.innerHTML).not.toContain('<img');
  });

  it('updated 仅在绑定值变化时重新消毒', () => {
    const el = document.createElement('div');
    vSafeHtml.mounted?.(el, bind('<em>旧</em>'));
    const htmlAfterMount = el.innerHTML;

    // 同值更新不应改写 DOM（避免打断子树内的选区与动画）
    vSafeHtml.updated?.(el, { value: '<em>旧</em>', oldValue: '<em>旧</em>' } as unknown as DirectiveBinding<string>);
    expect(el.innerHTML).toBe(htmlAfterMount);

    vSafeHtml.updated?.(el, { value: '<em>新</em>', oldValue: '<em>旧</em>' } as unknown as DirectiveBinding<string>);
    expect(el.innerHTML).toBe('<em>新</em>');
  });
});
