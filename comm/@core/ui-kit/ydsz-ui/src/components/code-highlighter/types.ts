/**
 * CodeHighlighter 组件的 props 与内部类型。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\code-highlighter\types.ts
 * @author ydsz-team
 * @since 1.0.0
 */

/** 支持的语法高亮语言 */
export type CodeLanguage =
  | 'bash'
  | 'css'
  | 'html'
  | 'js'
  | 'json'
  | 'md'
  | 'text'
  | 'ts'
  | 'vue';

/** 主题模式 */
export type CodeTheme = 'dark' | 'light';

/** 单行高亮片段（文本 + 语义类别） */
export interface HighlightToken {
  /** CSS 类名后缀，对应 .code-hl__token--{type} */
  type: 'comment' | 'keyword' | 'number' | 'plain' | 'string';
  /** 片段文本 */
  value: string;
}

/** 一行代码的高亮结果 */
export interface HighlightLine {
  /** 行号（从 1 开始） */
  lineNumber: number;
  /** 该行的高亮片段 */
  tokens: HighlightToken[];
}

/**
 * CodeHighlighter 组件属性。
 */
export interface CodeHighlighterProps {
  /** 自定义 CSS class */
  class?: string;
  /** 代码内容 */
  code: string;
  /** 语言，默认 'text' */
  language?: CodeLanguage;
  /** 最大高度（px），超出滚动；0 表示不限 */
  maxHeight?: number;
  /** 是否显示行号，默认 false */
  showLineNumbers?: boolean;
  /** 主题，默认跟随系统 */
  theme?: CodeTheme;
}
