<script lang="ts" setup>
/**
 * 轻量级代码高亮组件。
 *
 * 不依赖 highlight.js / prismjs，通过正则分词对关键字、字符串、注释、数字着色，
 * 覆盖 ts/js/json/html/css/vue/md/bash 八种语言。超出 maxHeight 时滚动查看。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\code-highlighter\YdCodeHighlighter.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import type { CodeHighlighterProps, HighlightLine } from './types';

import { computed, onMounted, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

defineOptions({ name: 'YdCodeHighlighter' });

const props = withDefaults(defineProps<CodeHighlighterProps>(), {
  language: 'text',
  maxHeight: 0,
  showLineNumbers: false,
  theme: undefined,
});

/** 语言别名归一化：js→ts（共用 TS 词表）、html→html、vue→ts */
function normalizeLanguage(lang: string): string {
  if (lang === 'js') return 'ts';
  if (lang === 'vue') return 'ts';
  return lang;
}

interface TokenRule {
  className: 'comment' | 'keyword' | 'number' | 'string';
  pattern: RegExp;
}

const JS_KEYWORDS = [
  'abstract', 'any', 'as', 'async', 'await', 'boolean', 'break', 'case',
  'catch', 'class', 'const', 'continue', 'debugger', 'declare', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally',
  'for', 'from', 'function', 'get', 'if', 'implements', 'import', 'in',
  'infer', 'instanceof', 'interface', 'is', 'keyof', 'let', 'namespace',
  'never', 'new', 'null', 'number', 'object', 'of', 'package', 'private',
  'protected', 'public', 'readonly', 'return', 'satisfies', 'set', 'static',
  'string', 'super', 'switch', 'symbol', 'this', 'throw', 'true', 'try',
  'type', 'typeof', 'undefined', 'unique', 'unknown', 'var', 'void',
  'while', 'with', 'yield',
];

const BASH_KEYWORDS = [
  'cd', 'echo', 'export', 'if', 'then', 'fi', 'else', 'elif', 'for',
  'while', 'do', 'done', 'function', 'return', 'local', 'source', 'exit',
];

const CSS_KEYWORDS = [
  '@media', '@import', '@keyframes', '@font-face', '!important',
];

/** 各语言的词法规则（顺序即优先级） */
function getRules(lang: string): TokenRule[] {
  const stringPattern = /(["'`])(?:\\.|(?!\1)[^\\])*\1/g;
  const numberPattern = /\b\d+(?:\.\d+)?\b/g;

  switch (lang) {
    case 'bash':
      return [
        { className: 'comment', pattern: /#.*$/gm },
        { className: 'string', pattern: /(["'])(?:\\.|(?!\1)[^\\])*\1/g },
        { className: 'keyword', pattern: new RegExp(`\\b(?:${BASH_KEYWORDS.join('|')})\\b`, 'g') },
        { className: 'number', pattern: numberPattern },
      ];
    case 'css':
      return [
        { className: 'comment', pattern: /\/\*[\s\S]*?\*\//g },
        { className: 'string', pattern: /(["'])(?:\\.|(?!\1)[^\\])*\1/g },
        { className: 'keyword', pattern: new RegExp(`\\b(?:${CSS_KEYWORDS.join('|')})\\b`, 'g') },
        { className: 'number', pattern: /\b\d+(?:\.\d+)?(?:px|em|rem|%|s|ms|vh|vw|deg|fr)?\b/g },
      ];
    case 'html':
      return [
        { className: 'comment', pattern: /<!--[\s\S]*?-->/g },
        { className: 'keyword', pattern: /<\/?[a-zA-Z][\w-]*/g },
        { className: 'string', pattern: /(["'])(?:\\.|(?!\1)[^\\])*\1/g },
      ];
    case 'json':
      return [
        { className: 'keyword', pattern: /"(?:[^"\\]|\\.)*"(?=\s*:)/g },
        { className: 'string', pattern: /"(?:[^"\\]|\\.)*"/g },
        { className: 'number', pattern: numberPattern },
      ];
    case 'md':
      return [
        { className: 'keyword', pattern: /^#{1,6}\s.*$/gm },
        { className: 'string', pattern: /`[^`]+`/g },
        { className: 'comment', pattern: /\[.*?\]\(.*?\)/g },
      ];
    case 'text':
      return [];
    case 'ts':
    default:
      return [
        { className: 'comment', pattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm },
        { className: 'string', pattern: stringPattern },
        {
          className: 'keyword',
          pattern: new RegExp(`\\b(?:${JS_KEYWORDS.join('|')})\\b`, 'g'),
        },
        { className: 'number', pattern: numberPattern },
      ];
  }
}

/**
 * 将单行文本按词法规则切分为高亮片段。
 *
 * 实现要点：先扫描所有规则的匹配位置，按起始偏移排序后合并区间，
 * 未被任何规则覆盖的区间标记为 plain。同一位置优先取更长匹配。
 */
function tokenizeLine(line: string, rules: TokenRule[]): HighlightLine['tokens'] {
  if (!line) return [{ type: 'plain', value: '' }];
  if (rules.length === 0) return [{ type: 'plain', value: line }];

  interface Match {
    end: number;
    start: number;
    type: TokenRule['className'];
    value: string;
  }

  const matches: Match[] = [];

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      // 零宽匹配保护，避免死循环
      if (match.index === regex.lastIndex) regex.lastIndex++;
      matches.push({
        end: match.index + match[0].length,
        start: match.index,
        type: rule.className,
        value: match[0],
      });
    }
  }

  // 按起始位置升序；同起始取更长匹配
  matches.sort((a, b) => a.start - b.start || b.end - a.end);

  // 合并重叠区间：保留先出现的（已按长度排序）
  const merged: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start >= cursor) {
      merged.push(m);
      cursor = m.end;
    }
  }

  // 填充未覆盖区间
  const tokens: HighlightLine['tokens'] = [];
  let pos = 0;
  for (const m of merged) {
    if (m.start > pos) {
      tokens.push({ type: 'plain', value: line.slice(pos, m.start) });
    }
    tokens.push({ type: m.type, value: m.value });
    pos = m.end;
  }
  if (pos < line.length) {
    tokens.push({ type: 'plain', value: line.slice(pos) });
  }

  return tokens;
}

const highlightedLines = computed<HighlightLine[]>(() => {
  const normalizedLang = normalizeLanguage(props.language ?? 'text');
  const rules = getRules(normalizedLang);
  const lines = props.code.split('\n');
  return lines.map((line, index) => ({
    lineNumber: index + 1,
    tokens: tokenizeLine(line, rules),
  }));
});

/** 是否显式指定主题（否则跟随系统 prefers-color-scheme） */
const systemDark = ref(false);

onMounted(() => {
  if (props.theme) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  systemDark.value = mq.matches;
  const handler = (e: MediaQueryListEvent): void => {
    systemDark.value = e.matches;
  };
  mq.addEventListener('change', handler);
});

const isDark = computed(() => props.theme === 'dark' || (!props.theme && systemDark.value));

const containerStyle = computed(() => ({
  ...(props.maxHeight && props.maxHeight > 0
    ? { maxHeight: `${props.maxHeight}px` }
    : {}),
}));
</script>

<template>
  <div
    :class="
      cn(
        'code-hl overflow-auto rounded-lg border font-mono text-sm leading-6',
        isDark
          ? 'border-neutral-700 bg-neutral-900 text-neutral-200'
          : 'border-border bg-muted/30 text-foreground',
        props.class,
      )
    "
    :style="containerStyle"
    role="region"
    :aria-label="t('codeHighlighter.ariaLabel')"
  >
    <pre class="min-w-max p-3">
      <div
        v-for="line in highlightedLines"
        :key="line.lineNumber"
        class="code-hl__line flex"
      >
        <span
          v-if="props.showLineNumbers"
          class="code-hl__line-number text-muted-foreground mr-3 inline-block w-8 select-none text-right text-xs"
          aria-hidden="true"
        >
          {{ line.lineNumber }}
        </span>
        <code class="code-hl__code">
          <span
            v-for="(token, idx) in line.tokens"
            :key="idx"
            :class="cn('code-hl__token--' + token.type)"
          >
            {{ token.value }}
          </span>
        </code>
      </div>
    </pre>
  </div>
</template>

<style scoped>
.code-hl__token--comment {
  color: #6a9955;
  font-style: italic;
}

.code-hl__token--keyword {
  color: #569cd6;
  font-weight: 500;
}

.code-hl__token--number {
  color: #b5cea8;
}

.code-hl__token--string {
  color: #ce9178;
}

.code-hl__token--plain {
  color: inherit;
}
</style>
