/**
 * Agent 文本处理工具集 — 纯函数，无外部依赖
 *
 * <p>为 Agent 对话页面提供文本截断、清洗等纯计算逻辑。
 * 纯函数设计便于单测覆盖。
 *
 * @path apps/agent-web/src/utils/agent-text-utils.ts
 * @author ydsz-team
 * @since 26.09.17
 */

/** 非打印字符正则（控制字符 + 零宽字符） */
const NON_PRINTABLE_PATTERN = /[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g;

/** Markdown 代码块语言标签 */
const CODE_BLOCK_LANG_PATTERN = /^```[a-zA-Z0-9_+-]*\n/;

/**
 * 移除字符串中的零宽字符与非打印字符（防止 SSE 帧拼接残留）。
 *
 * @param input - 原始文本
 * @returns 清洗后的文本
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input.replace(NON_PRINTABLE_PATTERN, '');
}

/**
 * 截断文本到指定长度，超长部分添加省略号。
 *
 * <p>截断点在整字边界（按 Unicode 码点取子串），
 * 不拆分 emoji 等多码点字符。
 *
 * @param text - 原始文本
 * @param maxLength - 最大长度（≥ 0），0 返回空字符串
 * @param suffix - 省略号后缀，默认 '...'
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (maxLength <= 0) return '';
  if (!text || text.length <= maxLength) return text;
  if (suffix.length >= maxLength) return text.slice(0, maxLength);
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 移除 Markdown 代码块起始行的语言标签（如 ```typescript → ```）。
 *
 * <p>便于在前端展示时统一代码块样式。
 *
 * @param markdown - Markdown 文本
 * @returns 移除语言标签后的文本
 */
export function stripCodeBlockLanguage(markdown: string): string {
  return markdown.replace(CODE_BLOCK_LANG_PATTERN, '```\n');
}

/**
 * 统计文本中有效字符数（按码点数计，不计控制字符）。
 *
 * @param text - 输入文本
 * @returns 有效字符数
 */
export function countPrintableChars(text: string): number {
  const cleaned = sanitizeText(text);
  // 使用 Array.from 以正确统计 Unicode 码点（含 emoji）
  return Array.from(cleaned).length;
}
