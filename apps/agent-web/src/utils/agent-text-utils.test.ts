/**
 * Agent 文本处理工具集单元测试 — 验证纯函数行为
 *
 * <p>云顶编码规范 §16.10 YDIZ-TEST-FE-001：测试用例必须有明确断言。
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  truncateText,
  stripCodeBlockLanguage,
  countPrintableChars,
} from './agent-text-utils';

describe('sanitizeText', () => {
  it('应移除零宽空格（U+200B）', () => {
    expect(sanitizeText('hello​world')).toBe('helloworld');
  });

  it('应移除 U+FEFF BOM 字符', () => {
    expect(sanitizeText('﻿内容')).toBe('内容');
  });

  it('空字符串应返回空字符串', () => {
    expect(sanitizeText('')).toBe('');
  });

  it('常规文本应原样保留', () => {
    expect(sanitizeText('plain text 中文 123')).toBe('plain text 中文 123');
  });
});

describe('truncateText', () => {
  it('文本未超长时应原样返回', () => {
    expect(truncateText('short', 100)).toBe('short');
  });

  it('超长文本应截断并追加省略号', () => {
    const result = truncateText('这是一段很长很长的文本内容', 10);
    expect(result).toBe('这是一段很...');
    expect(result.length).toBe(10);
  });

  it('maxLength=0 返回空字符串', () => {
    expect(truncateText('not empty', 0)).toBe('');
  });

  it('应支持自定义后缀', () => {
    expect(truncateText('hello world', 8, '→')).toBe('hello w→');
  });
});

describe('stripCodeBlockLanguage', () => {
  it('应移除 ```typescript 语言标签', () => {
    const md = '```typescript\nconst x = 1;\n```';
    const result = stripCodeBlockLanguage(md);
    expect(result).toBe('```\nconst x = 1;\n```');
  });

  it('不带语言标签的代码块不应改变', () => {
    const md = '```\nplain code\n```';
    expect(stripCodeBlockLanguage(md)).toBe(md);
  });
});

describe('countPrintableChars', () => {
  it('应正确统计中文字符数', () => {
    expect(countPrintableChars('中文测试')).toBe(4);
  });

  it('应排除控制字符', () => {
    expect(countPrintableChars('a​b﻿c')).toBe(3);
  });

  it('emoji 按单个码点计数', () => {
    // 🎉 长度为 1 个码点（2 个 UTF-16 代码单元，但 Array.from 拆为 1 个元素）
    expect(countPrintableChars('🎉🎊')).toBe(2);
  });
});
