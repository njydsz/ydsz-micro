/**
 * YdMentionExtension —— @提及 扩展。
 *
 * <p>通过组合 @tiptap/suggestion 插件实现 @mention 功能：
 * <ul>
 *   <li>输入 @ 字符唤起候选列表</li>
 *   <li>上下箭头选择 / Tab 或 Enter 确认</li>
 *   <li>输入字符过滤候选</li>
 * </ul>
 *
 * <p>候选数据源由外部通过 items 查询函数提供，支持异步加载（后端搜索）。
 *
 * @path comm\@core\ui-kit/editor-ui\src\extensions\mention.ts
 * @author ydsz-team
 * @since 5.6.0
 */
import { mergeAttributes, Node } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { Suggestion } from '@tiptap/suggestion';

/** 提及节点属性 */
export interface MentionOptions {
  /** HTML 属性 */
  HTMLAttributes: Record<string, string>;
  /** 候选查询函数（query 为用户输入的搜索词） */
  items: (query: string) => Array<MentionItem> | Promise<Array<MentionItem>>;
  /** 渲染下拉菜单 */
  suggestion: Record<string, unknown>;
}

/** 候选项 */
export interface MentionItem {
  id: string;
  label: string;
  /** 可选：头像/附加信息 */
  avatar?: string;
  description?: string;
}

/** 插件 key */
export const mentionPluginKey = new PluginKey('ydMention');

/**
 * Mention 节点 + 建议插件配置。
 */
export function createMentionExtension(
  items: (query: string) => Array<MentionItem> | Promise<Array<MentionItem>>,
): ReturnType<typeof Node.create> {
  return Node.create({
    name: 'mention',

    addOptions() {
      return {
        HTMLAttributes: {},
        items,
        suggestion: {
          char: '@',
          allowedPrefixes: [' '],
          pluginKey: mentionPluginKey,
          command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: this.name,
                  attrs: props,
                },
                {
                  type: 'text',
                  text: ' ',
                },
              ])
              .run();
          },
          items: ({ query }: { query: string }) => {
            return items(query);
          },
          render: () => {
            // 返回一个对象，实际渲染由 YdMentionMenu 组件负责
            return {
              onStart: () => {},
              onUpdate: () => {},
              onExit: () => {},
              onKeyDown: () => false,
            };
          },
        },
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

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
        }),
      ];
    },
  });
}

/** 导出 suggestion 配置（供独立使用） */
export function createMentionSuggestion(
  items: (query: string) => Array<MentionItem> | Promise<Array<MentionItem>>,
): Record<string, unknown> {
  return {
    char: '@',
    pluginKey: mentionPluginKey,
    command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          { type: 'mention', attrs: props },
          { type: 'text', text: ' ' },
        ])
        .run();
    },
    items: ({ query }: { query: string }) => items(query),
  };
}

export type { MentionItem as YdMentionItem };
