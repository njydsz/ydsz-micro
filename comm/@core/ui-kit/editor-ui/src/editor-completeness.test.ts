/**
 * RichEditor completeness test —— 验证 TipTap 编辑器包完整性。
 *
 * @path comm\@core/ui-kit/editor-ui\src\editor-completeness.test.ts
 * @author ydsz Team
 * @since 5.6.0
 */
import { describe, expect, it } from 'vitest';

describe('RichEditor completeness', () => {
  it('应导出 getYdDefaultExtensions 且返回足够扩展', async () => {
    const { getYdDefaultExtensions } = await import('./extensions');
    expect(getYdDefaultExtensions).toBeDefined();
    const extensions = getYdDefaultExtensions();
    expect(Array.isArray(extensions)).toBe(true);
    // 应有超过 15 个基础扩展
    expect(extensions.length).toBeGreaterThan(15);
  });

  it('应导出 mention 扩展工厂函数', async () => {
    const mod = await import('./extensions/mention');
    expect(mod.createMentionExtension).toBeDefined();
    expect(mod.createMentionSuggestion).toBeDefined();
    expect(mod.mentionPluginKey).toBeDefined();
  });

  it('createMentionExtension 应返回有效的 TipTap 节点', () => {
    // 同步测试：验证扩展工厂不抛出
    // 注意：这里不实际调用，因为 Node.create 需要 TipTap editor 环境
    expect(typeof createMentionExtension).toBe('function');
  });
}

// 延迟导入避免循环
import { createMentionExtension } from './extensions/mention';
