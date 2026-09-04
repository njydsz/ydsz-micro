/**
 * TipTap 扩展集 — 初始化编辑器所需的全部扩展
 *
 * <p>集中注册富文本编辑器支持的格式：
 * <ul>
 *   <li>基础：Document / Paragraph / Text / HardBreak / History</li>
 *   <li>行内格式：Bold / Italic / Strike / Underline / Code</li>
 *   <li>标题：H1-H6</li>
 *   <li>列表：BulletList / OrderedList</li>
 *   <li>块级：CodeBlock / Blockquote</li>
 *   <li>高级：Image / Link / Table / HorizontalRule / Placeholder</li>
 * </ul>
 *
 * @path comm/@core/ui-kit/tiptap/src/extensions/index.ts
 * @author ydsz-team
 * @since 1.0.0
 */
import Bold from '@tiptap/extension-bold';
import BulletList from '@tiptap/extension-bullet-list';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Gapcursor from '@tiptap/extension-gapcursor';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Image from '@tiptap/extension-image';
import Italic from '@tiptap/extension-italic';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Strike from '@tiptap/extension-strike';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';

/**
 * 获取默认编辑器扩展集。
 *
 * <p>{@link Placeholder} 使用方需在组件内自定义（依赖 placeholder prop），故不在此注册。
 *
 * @returns TipTap 扩展数组
 */
export function getDefaultExtensions(): Array<unknown> {
  return [
    Document,
    Text,
    Paragraph,
    HardBreak,
    History,
    Bold,
    Italic,
    Strike,
    Underline,
    Code,
    Heading.configure({ levels: [1, 2, 3, 4] }),
    BulletList,
    OrderedList,
    ListItem,
    CodeBlock.configure({ languageClassPrefix: 'language-' }),
    HorizontalRule,
    Image.configure({ inline: true, allowBase64: false }),
    Link.configure({ openOnClick: false, autolink: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Dropcursor,
    Gapcursor,
  ];
}
