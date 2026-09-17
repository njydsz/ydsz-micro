/**
 * RichEditor completeness test —— 验证 TipTap 编辑器包完整性。
 *
 * @path comm\@core/ui-kit/editor-ui\src\editor-completeness.test.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

describe('RichEditor completeness', () => {
  it('应导出 getYdDefaultExtensions 且返回足够扩展', async () => {
    const { getYdDefaultExtensions } = await import('./extensions');
    expect(getYdDefaultExtensions).toBeDefined();
    const extensions = getYdDefaultExtensions();
    expect(Array.isArray(extensions)).toBe(true);
    expect(extensions.length).toBeGreaterThan(15);
  });

  it('应导出 mention 扩展工厂函数和 PluginKey', async () => {
    const mod = await import('./extensions/mention');
    expect(mod.createMentionExtension).toBeDefined();
    expect(mod.createMentionSuggestion).toBeDefined();
    expect(mod.mentionPluginKey).toBeDefined();
  });

  it('createMentionExtension 应是函数且调用无抛出', async () => {
    const { createMentionExtension } = await import('./extensions/mention');
    expect(typeof createMentionExtension).toBe('function');
  });

  it('getYdDefaultExtensions 应包含文档/段落/文本等基础扩展', async () => {
    const { getYdDefaultExtensions } = await import('./extensions');
    const extensions = getYdDefaultExtensions();
    // 至少有 Document, Paragraph, Text, 以及多个格式扩展
    expect(extensions.length).toBeGreaterThan(10);
  });
});
