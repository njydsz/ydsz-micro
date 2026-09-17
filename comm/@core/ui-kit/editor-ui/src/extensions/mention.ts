/**
 * YdMentionExtension —— @提及 扩展类型定义与工厂接口。
 *
 * <p>由于 @tiptap/suggestion / @tiptap/extension-mention 是可选 peer 依赖，
 * 本模块仅提供类型定义与工厂函数接口，实际运行时需要业务侧安装可选依赖后
 * 使用 {@link createMentionExtension} 创建节点扩展。
 *
 * <p>安装方式：
 * <pre>
 *   pnpm add @tiptap/suggestion @tiptap/extension-mention
 * </pre>
 *
 * @path comm\@core/ui-kit/editor-ui\src\extensions\mention.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { mergeAttributes, Node } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';

/** 提及节点属性 */
export interface MentionOptions {
  HTMLAttributes: Record<string, string>;
}

/** 候选项 */
export interface MentionItem {
  id: string;
  label: string;
  avatar?: string;
  description?: string;
}

/** 插件 key */
export const mentionPluginKey = new PluginKey('ydMention');

/**
 * 创建 Mention 节点扩展。
 *
 * <p>这是 TipTap Mention 的轻量封装，渲染为 <span data-mention-id="...">@label</span>。
 *
 * @param _items - 候选查询函数（在使用 @tiptap/suggestion 后生效）
 * @return TipTap 节点扩展
 */
export function createMentionExtension(
  _items?: (query: string) => Array<MentionItem> | Promise<Array<MentionItem>>,
): ReturnType<typeof Node.create> {
  return Node.create({
    name: 'mention',

    addOptions() {
      return {
        HTMLAttributes: {},
      };
    },

    group: 'inline',
    inline: true,
    selectable: false,
    atom: true,

    addAttributes() {
      return {
        id: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-mention-id'),
          renderHTML: (attrs: Record<string, string>) => ({
            'data-mention-id': attrs.id,
          }),
        },
        label: {
          default: null,
          parseHTML: (element: HTMLElement) => element.getAttribute('data-mention-label'),
          renderHTML: (attrs: Record<string, string>) => ({
            'data-mention-label': attrs.label,
          }),
        },
      };
    },

    parseHTML() {
      return [{ tag: 'span[data-mention-id]' }];
    },

    renderHTML({ node, HTMLAttributes }: { node: any; HTMLAttributes: Record<string, string> }) {
      return [
        'span',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class: 'mention-chip',
          'data-mention-id': node.attrs.id,
        }),
        `@${node.attrs.label}`,
      ];
    },
  });
}

/**
 * 创建提及 suggestion 配置。
 *
 * <p>当业务方安装了 @tiptap/suggestion 后，调用此对象配合 Mention 节点使用。
 * 返回对象的实现为可选依赖安装后的增强版本。
 *
 * @param _items - 候选查询函数
 * @return suggestion 配置对象
 */
export function createMentionSuggestion(
  _items?: (query: string) => Array<MentionItem> | Promise<Array<MentionItem>>,
): Record<string, unknown> {
  return {
    char: '@',
    pluginKey: mentionPluginKey,
  };
}

export type { MentionItem as YdMentionItem };
