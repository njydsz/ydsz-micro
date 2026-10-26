/**
 * safeIconHtml 测试 —— YdOrgChart 图标注入白名单
 *
 * <p>覆盖 §7.1 XSS 防护：只放行单一根元素的图标标记，
 * 事件属性、危险协议、可执行标签与非图标标签一律降级为空字符串。
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 *
 * @path comm/@core/ui-kit/ydsz-ui/src/components/org-chart/org-chart-icon.test.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import { describe, expect, it } from 'vitest';

import { safeIconHtml } from './org-chart-icon';

const SAFE_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2 2 22h20z"/></svg>';

describe('safeIconHtml 白名单放行', () => {
  it('放行成对闭合的 svg 图标', () => {
    expect(safeIconHtml(SAFE_SVG)).toBe(SAFE_SVG);
  });

  it('放行自闭合的字体图标占位标签', () => {
    const icon = '<i class="i-lucide-user" />';
    expect(safeIconHtml(icon)).toBe(icon);
  });

  it('放行前后空白并返回 trim 后的标记', () => {
    expect(safeIconHtml(`  ${SAFE_SVG}  `)).toBe(SAFE_SVG);
  });

  it('放行 span / em 根元素', () => {
    expect(safeIconHtml('<span class="icon-dot"></span>')).toBe('<span class="icon-dot"></span>');
    expect(safeIconHtml('<em>★</em>')).toBe('<em>★</em>');
  });
});

describe('safeIconHtml 拒绝注入面', () => {
  it.each([
    ['缺省值', undefined],
    ['空字符串', ''],
    ['事件属性', '<i class="x" onclick="alert(1)"></i>'],
    ['javascript 协议', '<span><a href="javascript:alert(1)">go</a></span>'],
    ['script 标签', '<span></span><script>alert(1)</script>'],
    ['iframe 嵌入', '<iframe src="https://evil.test"></iframe>'],
    ['img 根元素', '<img src=x onerror=alert(1)>'],
    ['div 根元素', '<div>不是图标</div>'],
    ['多根片段', '<i></i><i></i>'],
    ['未闭合片段', '<i class="x">'],
    ['根内夹带第二个可渲染元素', '<svg></svg><a href="//evil.test">x</a></svg>'],
  ])('%s 应降级为空字符串', (_case, input) => {
    expect(safeIconHtml(input as string | undefined)).toBe('');
  });

  it('危险内容即便包在合法根元素内也被拒绝', () => {
    expect(safeIconHtml('<span><object data="evil.swf"></object></span>')).toBe('');
    expect(safeIconHtml('<svg onload="alert(1)"><circle/></svg>')).toBe('');
  });
});
