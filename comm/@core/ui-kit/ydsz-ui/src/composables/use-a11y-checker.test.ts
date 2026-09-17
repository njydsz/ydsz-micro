/**
 * useA11yChecker composable 测试 —— axe-core 自动化 a11y 检查。
 *
 * <p>使用真实 DOM（jsdom/happy-dom）运行 axe-core，验证组件无 WCAG AA 违反。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\composables\use-a11y-checker.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

import { useA11yChecker } from './use-a11y-checker';

describe('useA11yChecker', () => {
  it('应在空容器上返回 isClean=true', async () => {
    const { check } = useA11yChecker({ value: undefined });
    const result = await check();
    expect(result.isClean).toBe(true);
    expect(result.violationCount).toBe(0);
  });

  it('应在简单合规 DOM 上通过检查', async () => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h1>测试页面</h1>
      <button aria-label="操作按钮">点击</button>
      <a href="https://example.com" aria-label="示例链接">链接</a>
      <main><p>主内容区</p></main>
    `;
    document.body.appendChild(div);

    const { check } = useA11yChecker({ value: div });
    const result = await check();

    expect(result.isClean).toBe(true);
    expect(result.violationCount).toBe(0);

    document.body.removeChild(div);
  });

  it('应检测到缺少 alt 的图片违规', async () => {
    const div = document.createElement('div');
    div.innerHTML = `<img src="test.png">`;
    document.body.appendChild(div);

    const { check } = useA11yChecker({ value: div });
    const result = await check();

    // 图片无 alt 文本应触发 image-alt 违规
    expect(result.violationCount).toBeGreaterThan(0);

    document.body.removeChild(div);
  });

  it('isComplete 应在检查后变为 true', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<p>简单内容</p>';
    document.body.appendChild(div);

    const checker = useA11yChecker({ value: div });
    expect(checker.isComplete.value).toBe(false);

    await checker.check();
    expect(checker.isComplete.value).toBe(true);
    expect(checker.lastResult.value).not.toBeNull();

    document.body.removeChild(div);
  });
});
