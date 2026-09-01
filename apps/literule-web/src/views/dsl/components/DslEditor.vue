<!--
 * DSL 编辑器组件（语法高亮/自动补全）
 *
 * <p>提供 DSL 代码编辑能力，支持语法高亮、自动补全、行号显示、错误提示。
 *
 * @path apps\literule-web\src\views\dsl\components\DslEditor.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * DSL 编辑器
 * <p>基于文本编辑器的 DSL 语法高亮与自动补全实现。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, nextTick, ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

interface Props {
  modelValue?: string;
  placeholder?: string;
  errorLines?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入 DSL 内容...',
  errorLines: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/** 编辑器引用 */
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const highlightRef = ref<HTMLDivElement | null>(null);

/** 是否显示补全弹窗 */
const showCompletion = ref(false);
const completionItems = ref<string[]>([]);
const completionIndex = ref(0);
const completionPosition = ref({ x: 0, y: 0 });

/** DSL 关键字 */
const DSL_KEYWORDS = [
  'rule',
  'chain',
  'when',
  'then',
  'else',
  'end',
  'if',
  'else',
  'elseif',
  'switch',
  'case',
  'default',
  'for',
  'while',
  'do',
  'break',
  'continue',
  'return',
  'function',
  'var',
  'let',
  'const',
  'true',
  'false',
  'null',
  'and',
  'or',
  'not',
  'in',
  'contains',
  'matches',
  'startsWith',
  'endsWith',
];

/** DSL 内置函数 */
const DSL_FUNCTIONS = [
  'len',
  'abs',
  'ceil',
  'floor',
  'round',
  'max',
  'min',
  'sqrt',
  'pow',
  'log',
  'substring',
  'indexOf',
  'replace',
  'trim',
  'upper',
  'lower',
  'split',
  'join',
  'list',
  'map',
  'filter',
  'reduce',
  'sort',
  'reverse',
  'date',
  'now',
  'formatDate',
  'parseDate',
];

/** DSL 补全建议 */
const COMPLETION_SUGGESTIONS: {
  label: string;
  insert: string;
  type: 'keyword' | 'function' | 'snippet';
}[] = [
  // 关键字
  ...DSL_KEYWORDS.map((kw) => ({ label: kw, insert: kw, type: 'keyword' as const })),
  // 函数
  ...DSL_FUNCTIONS.map((fn) => ({ label: fn, insert: `${fn}()`, type: 'function' as const })),
  // 代码片段
  {
    label: 'rule',
    insert: 'rule "${name}"\n  when\n    ${condition}\n  then\n    ${action}\nend',
    type: 'snippet',
  },
  { label: 'chain', insert: 'chain "${name}"\n  ${nodes}\nend', type: 'snippet' },
  {
    label: 'if-else',
    insert: 'if ${condition} then\n  ${action}\nelse\n  ${alternative}\nend',
    type: 'snippet',
  },
  { label: 'function', insert: 'function ${name}(${params})\n  ${body}\nend', type: 'snippet' },
  { label: 'for-loop', insert: 'for ${item} in ${list}\n  ${body}\nend', type: 'snippet' },
];

/** 当前编辑内容 */
const content = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
});

/** 行号列表 */
const lineNumbers = computed(() => {
  const lines = (props.modelValue || '').split('\n');
  return Array.from({ length: Math.max(lines.length, 10) }, (_, i) => i + 1);
});

/** 高亮后的 HTML */
const highlightedHtml = computed(() => {
  let text = props.modelValue || '';
  // 转义 HTML
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 高亮关键字
  DSL_KEYWORDS.forEach((kw) => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    text = text.replace(regex, `<span class="dsl-keyword">$1</span>`);
  });

  // 高亮函数
  DSL_FUNCTIONS.forEach((fn) => {
    const regex = new RegExp(`\\b(${fn})(?=\\()`, 'g');
    text = text.replace(regex, `<span class="dsl-function">$1</span>`);
  });

  // 高亮字符串
  text = text.replace(/"([^"\\]|\\.)*"/g, '<span class="dsl-string">$&</span>');
  text = text.replace(/'([^'\\]|\\.)*'/g, '<span class="dsl-string">$&</span>');

  // 高亮数字
  text = text.replace(/\b(\d+\.?\d*)\b/g, '<span class="dsl-number">$1</span>');

  // 高亮注释
  text = text.replace(/(#.*$)/gm, '<span class="dsl-comment">$1</span>');
  text = text.replace(/(\/\/.*$)/gm, '<span class="dsl-comment">$1</span>');

  // 高亮错误行
  const lines = text.split('\n');
  props.errorLines.forEach((lineNum) => {
    if (lineNum > 0 && lineNum <= lines.length) {
      lines[lineNum - 1] = `<div class="dsl-error-line">${lines[lineNum - 1]}</div>`;
    }
  });

  return lines.join('\n');
});

/** 滚动同步 */
function handleScroll(): void {
  if (textareaRef.value && highlightRef.value) {
    highlightRef.value.scrollTop = textareaRef.value.scrollTop;
    highlightRef.value.scrollLeft = textareaRef.value.scrollLeft;
  }
}

/** 输入处理（v-model 立即同步，补全计算防抖 150ms） */
function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  debouncedUpdateCompletion(target);
}

/** 防抖更新补全建议（规范 5.4：高频输入事件防抖） */
const debouncedUpdateCompletion = useDebounceFn((textarea: HTMLTextAreaElement) => {
  updateCompletion(textarea);
}, 150);

/** 更新补全建议 */
function updateCompletion(textarea: HTMLTextAreaElement): void {
  const cursorPos = textarea.selectionStart;
  const text = textarea.value.substring(0, cursorPos);
  const currentLine = text.split('\n').pop() || '';
  const lastWord = currentLine.split(/[\s,()[\]{}]+/).pop() || '';

  if (lastWord.length >= 1) {
    const matches = COMPLETION_SUGGESTIONS.filter((item) =>
      item.label.toLowerCase().startsWith(lastWord.toLowerCase()),
    );
    if (matches.length > 0) {
      completionItems.value = matches.map((m) => m.label);
      showCompletion.value = true;
      completionIndex.value = 0;
      updateCompletionPosition(textarea, currentLine);
      return;
    }
  }
  showCompletion.value = false;
}

/** 更新补全弹窗位置 */
function updateCompletionPosition(textarea: HTMLTextAreaElement, currentLine: string): void {
  const lineHeight = 20;
  const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
  const currentLineIndex = lines.length - 1;
  const currentCharIndex = (lines[lines.length - 1] || '').length;

  completionPosition.value = {
    x: 60 + currentCharWidth(currentLine.substring(0, currentCharIndex)),
    y: 10 + (currentLineIndex + 1) * lineHeight,
  };
}

/** 计算字符宽度（近似） */
function currentCharWidth(text: string): number {
  return text.length * 8;
}

/** 选择补全项 */
function selectCompletion(item: string): void {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const completionItem = COMPLETION_SUGGESTIONS.find((s) => s.label === item);
  if (!completionItem) return;

  const cursorPos = textarea.selectionStart;
  const text = textarea.value;
  const beforeCursor = text.substring(0, cursorPos);
  const afterCursor = text.substring(cursorPos);

  // 找到当前单词的起始位置
  const currentLine = beforeCursor.split('\n').pop() || '';
  const lastWord = currentLine.split(/[\s,()[\]{}]+/).pop() || '';
  const wordStart = beforeCursor.length - lastWord.length;

  const newText = text.substring(0, wordStart) + completionItem.insert + afterCursor;
  emit('update:modelValue', newText);

  showCompletion.value = false;

  // 设置光标位置
  nextTick(() => {
    const newCursorPos = wordStart + completionItem.insert.length;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;
    textarea.focus();
  });
}

/** 键盘事件 */
function handleKeydown(event: KeyboardEvent): void {
  if (showCompletion.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      completionIndex.value = (completionIndex.value + 1) % completionItems.value.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      completionIndex.value =
        (completionIndex.value - 1 + completionItems.value.length) % completionItems.value.length;
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      if (completionItems.value.length > 0) {
        selectCompletion(completionItems.value[completionIndex.value]);
      }
    } else if (event.key === 'Escape') {
      showCompletion.value = false;
    }
  } else if (event.key === 'Tab') {
    event.preventDefault();
    // 插入缩进
    const textarea = textareaRef.value;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + '  ' + text.substring(end);
      emit('update:modelValue', newText);
      nextTick(() => {
        textarea.selectionStart = start + 2;
        textarea.selectionEnd = start + 2;
      });
    }
  }
}

/** 处理失去焦点 */
function handleBlur(): void {
  setTimeout(() => {
    showCompletion.value = false;
  }, 200);
}

watch(
  () => props.modelValue,
  () => {
    nextTick(handleScroll);
  },
);
</script>

<template>
  <div class="dsl-editor">
    <!-- 行号 -->
    <div class="line-numbers">
      <div
        v-for="num in lineNumbers"
        :key="num"
        class="line-number"
        :class="{ error: errorLines.includes(num) }"
      >
        {{ num }}
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-wrapper">
      <!-- 高亮层 -->
      <div ref="highlightRef" class="highlight-layer" v-safe-html="highlightedHtml" />

      <!-- 输入层 -->
      <textarea
        ref="textareaRef"
        v-model="content"
        class="input-layer"
        :placeholder="placeholder"
        spellcheck="false"
        @input="handleInput"
        @scroll="handleScroll"
        @keydown="handleKeydown"
        @blur="handleBlur"
      />

      <!-- 自动补全弹窗 -->
      <div
        v-if="showCompletion"
        class="completion-popup"
        :style="{ left: `${completionPosition.x}px`, top: `${completionPosition.y}px` }"
      >
        <div
          v-for="(item, index) in completionItems"
          :key="item"
          class="completion-item"
          :class="{ active: index === completionIndex }"
          @mousedown.prevent="selectCompletion(item)"
        >
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dsl-editor {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 300px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
  font-family: Monaco, Menlo, 'Ubuntu Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 20px;
}

.line-numbers {
  flex-shrink: 0;
  width: 50px;
  padding: 10px 0;
  background: #f5f7fa;
  border-right: 1px solid var(--el-border-color);
  text-align: right;
  user-select: none;
}

.line-number {
  padding: 0 8px;
  color: #909399;
  font-size: 12px;
}

.line-number.error {
  color: #f56c6c;
  background: #fef0f0;
}

.editor-wrapper {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 10px;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: transparent;
  pointer-events: none;
  background: #fafafa;
}

.input-layer {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 10px;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: #303133;
  caret-color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.input-layer::placeholder {
  color: #c0c4cc;
}

.completion-popup {
  position: absolute;
  z-index: 10;
  min-width: 150px;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.completion-item {
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
}

.completion-item:hover,
.completion-item.active {
  background: #ecf5ff;
  color: #409eff;
}

/* 语法高亮样式 */
:deep(.dsl-keyword) {
  color: #c678dd;
  font-weight: 500;
}

:deep(.dsl-function) {
  color: #61afef;
}

:deep(.dsl-string) {
  color: #98c379;
}

:deep(.dsl-number) {
  color: #d19a66;
}

:deep(.dsl-comment) {
  color: #5c6370;
  font-style: italic;
}

:deep(.dsl-error-line) {
  background: #fef0f0;
  display: block;
  width: 100%;
}
</style>
