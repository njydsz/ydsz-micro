<!--
 * YdInputMask Vue 组件 —— 格式化输入框，对标 PrimeVue InputMask。
 *
 * <p>通过 mask 模板约束输入格式：
 * <ul>
 *   <li>9 = 数字（0-9）</li>
 *   <li>a = 字母（A-Z / a-z）</li>
 *   <li>* = 字母数字（A-Z / a-z / 0-9）</li>
 * </ul>
 *
 * 其余字符视为字面量，自动跳过并插入；Backspace / Delete 正确回退到上一个掩码位；
 * 粘贴时过滤非法字符；modelValue 传出 unmasked 纯值当 unmask=true 时。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\input-mask\YdInputMask.vue
 * @author ydsz-team
 * @since 5.6.0
-->
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

import type { MaskToken, YdInputMaskProps } from './input-mask-types';

// ---------------------------------------------------------------------------
// Props / Emits
// ---------------------------------------------------------------------------

const props = withDefaults(defineProps<YdInputMaskProps>(), {
  unmask: false,
  placeholderChar: '_',
  autoClear: true,
  required: false,
  disabled: false,
  size: 'md',
  variant: 'default',
  type: 'text',
  readonly: false,
  autofocus: false,
  placeholder: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', payload: string): void;
  (e: 'complete', payload: string): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'blur', event: FocusEvent): void;
}>();

// ---------------------------------------------------------------------------
// Mask parsing
// ---------------------------------------------------------------------------

/** 解析掩码模板为 token 数组 */
const tokens = computed<MaskToken[]>(() =>
  props.mask.split('').map((ch): MaskToken => {
    if (ch === '9') return { char: ch, isEditable: true, pattern: /[0-9]/ };
    if (ch === 'a') return { char: ch, isEditable: true, pattern: /[A-Za-z]/ };
    if (ch === '*') return { char: ch, isEditable: true, pattern: /[A-Za-z0-9]/ };
    return { char: ch, isEditable: false };
  }),
);

/** 可编辑位总数 */
const editableCount = computed(() => tokens.value.filter((t) => t.isEditable).length);

/** 下一个可编辑位的掩码索引（从 start 开始查找） */
function nextEditablePos(pos: number): number {
  const len = tokens.value.length;
  for (let i = pos; i < len; i++) {
    if (tokens.value[i]!.isEditable) return i;
  }
  return len;
}

/** 上一个可编辑位的掩码索引（从 start 往回查找） */
function prevEditablePos(pos: number): number {
  for (let i = pos; i >= 0; i--) {
    if (tokens.value[i]!.isEditable) return i;
  }
  return -1;
}

/** 掩码位索引 → chars 数组索引 */
function maskPosToCharIndex(maskPos: number): number {
  let ci = 0;
  const len = tokens.value.length;
  for (let i = 0; i < len; i++) {
    if (tokens.value[i]!.isEditable) {
      if (i === maskPos) return ci;
      ci++;
    }
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Internal value state
// ---------------------------------------------------------------------------

/** 每个可编辑位上的字符值 */
const chars = ref<string[]>(new Array(editableCount.value).fill(''));

/** 是否已完成（所有可编辑位都已填入） */
const isComplete = computed(() => chars.value.every((c) => c !== ''));

/** 同步 chars → displayValue + emit modelValue */
function syncValue(display: string): void {
  displayValue.value = display;
  const payload = props.unmask ? chars.value.filter((c) => c !== '').join('') : display;
  emit('update:modelValue', payload);

  if (isComplete.value) {
    emit('complete', payload);
  }
}

/** 根据当前 chars 构建完整的掩码显示字符串 */
function buildDisplay(): string {
  let result = '';
  let ci = 0;
  for (const token of tokens.value) {
    if (token.isEditable) {
      const v = chars.value[ci++];
      result += v || props.placeholderChar;
    } else {
      result += token.char;
    }
  }
  return result;
}

/** 当前的显示字符串 */
const displayValue = ref(buildDisplay());

// ---------------------------------------------------------------------------
// Selection management
// ---------------------------------------------------------------------------

const inputRef = ref<HTMLInputElement | null>(null);

/** 在下一个 tick 设置光标到指定掩码位 */
function setCursorTo(maskPos: number): void {
  nextTick(() => {
    inputRef.value?.setSelectionRange(maskPos, maskPos);
  });
}

// ---------------------------------------------------------------------------
// Core: apply character at a mask position
// ---------------------------------------------------------------------------

/** 在指定掩码位填入字符（自动跳过非可编辑位） */
function applyCharAt(pos: number, char: string): void {
  const len = tokens.value.length;
  let cur = pos;
  while (cur < len) {
    const token = tokens.value[cur];
    if (token && token.isEditable) {
      if (token.pattern && !token.pattern.test(char)) {
        return;
      }
      const ci = maskPosToCharIndex(cur);
      if (ci >= 0) {
        chars.value[ci] = char;
        syncValue(buildDisplay());
        setCursorToNextEditable(cur + 1);
      }
      return;
    }
    // 字面量位：直接跳过
    cur++;
  }
}

/** 填字符后光标移至下一个可编辑位 */
function setCursorToNextEditable(fromPos: number): void {
  const next = nextEditablePos(fromPos);
  setCursorTo(next < tokens.value.length ? next : tokens.value.length);
}

/** 清除 [startPos, endPos) 掩码范围内的可编辑字符 */
function clearRange(startPos: number, endPos: number): void {
  const len = tokens.value.length;
  for (let i = startPos; i < endPos && i < len; i++) {
    if (tokens.value[i]!.isEditable) {
      const ci = maskPosToCharIndex(i);
      if (ci >= 0) chars.value[ci] = '';
    }
  }
}

// ---------------------------------------------------------------------------
// Paste handling
// ---------------------------------------------------------------------------

/** 将粘贴的文本按掩码规则逐位填入 */
function applyPastedChars(startPos: number, input: string): void {
  const validChars = input
    .split('')
    .filter((c) => /[A-Za-z0-9]/.test(c));

  const len = tokens.value.length;
  let pos = nextEditablePos(startPos);

  for (const ch of validChars) {
    if (pos >= len) break;

    const token = tokens.value[pos];
    // 跳过不符合当前位模式的字符
    if (token && token.pattern && !token.pattern.test(ch)) {
      // 尝试下一位
      const next = nextEditablePos(pos + 1);
      if (next >= len) break;
      // 如果下一位也不匹配则丢弃该字符
      const nextToken = tokens.value[next];
      if (nextToken && nextToken.pattern && !nextToken.pattern.test(ch)) {
        continue;
      }
      pos = next;
    }

    const curToken = tokens.value[pos];
    if (curToken && curToken.isEditable) {
      const ci = maskPosToCharIndex(pos);
      if (ci >= 0) {
        chars.value[ci] = ch;
      }
      pos = nextEditablePos(pos + 1);
    } else {
      pos = nextEditablePos(pos + 1);
    }
  }

  syncValue(buildDisplay());
  setCursorTo(pos);
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function handleBeforeInput(e: InputEvent): void {
  if (props.disabled || props.readonly) {
    e.preventDefault();
    return;
  }

  const inputEl = inputRef.value;
  const selStart = inputEl?.selectionStart ?? 0;
  const selEnd = inputEl?.selectionEnd ?? 0;

  // 有选区时先清除
  if (selStart !== selEnd) {
    clearRange(selStart, selEnd);
  }

  const pos = nextEditablePos(selStart);
  if (pos >= tokens.value.length) {
    e.preventDefault();
    return;
  }

  const data = e.data;
  if (!data) return;

  e.preventDefault();

  if (data.length === 1) {
    applyCharAt(pos, data);
  } else {
    applyPastedChars(pos, data);
  }
}

function handleKeydown(e: KeyboardEvent): void {
  const inputEl = inputRef.value;
  const selStart = inputEl?.selectionStart ?? 0;
  const selEnd = inputEl?.selectionEnd ?? 0;
  const len = tokens.value.length;

  if (e.key === 'Backspace') {
    e.preventDefault();
    if (selStart !== selEnd) {
      clearRange(selStart, selEnd);
      syncValue(buildDisplay());
      setCursorTo(nextEditablePos(selStart));
    } else if (selStart > 0) {
      const targetPos = prevEditablePos(selStart - 1);
      if (targetPos >= 0) {
        const ci = maskPosToCharIndex(targetPos);
        if (ci >= 0) chars.value[ci] = '';
        syncValue(buildDisplay());
        setCursorTo(targetPos);
      }
    }
    return;
  }

  if (e.key === 'Delete') {
    e.preventDefault();
    if (selStart !== selEnd) {
      clearRange(selStart, selEnd);
      syncValue(buildDisplay());
      setCursorTo(nextEditablePos(selStart));
    } else if (selStart < len) {
      const targetPos = nextEditablePos(selStart);
      if (targetPos < len) {
        const ci = maskPosToCharIndex(targetPos);
        if (ci >= 0) chars.value[ci] = '';
        syncValue(buildDisplay());
        setCursorTo(targetPos);
      }
    }
  }
}

function handlePaste(e: ClipboardEvent): void {
  const text = e.clipboardData?.getData('text') ?? '';
  if (!text) return;
  e.preventDefault();

  const selStart = inputRef.value?.selectionStart ?? 0;
  clearRange(selStart, inputRef.value?.selectionEnd ?? selStart);
  applyPastedChars(selStart, text);
}

function handleFocus(e: FocusEvent): void {
  if (chars.value.every((c) => !c)) {
    nextTick(() => {
      const pos = nextEditablePos(0);
      inputRef.value?.setSelectionRange(pos, pos);
    });
  }
  emit('focus', e);
}

function handleBlur(e: FocusEvent): void {
  emit('blur', e);

  if (props.autoClear && !isComplete.value) {
    emit('update:modelValue', '');
  }
}

// ---------------------------------------------------------------------------
// Watch mask change
// ---------------------------------------------------------------------------

watch(
  () => props.mask,
  () => {
    chars.value = new Array(editableCount.value).fill('');
    syncValue(buildDisplay());
  },
);

// ---------------------------------------------------------------------------
// Style classes
// ---------------------------------------------------------------------------

/** 尺寸类名映射 */
const sizeClasses: Record<string, string> = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 py-1 text-sm',
  lg: 'h-11 px-4 text-base',
};

/** 变体类名映射 */
const variantClasses: Record<string, string> = {
  default: 'border border-input bg-background shadow-sm',
  filled: 'border-transparent bg-neutral-100',
  underlined: 'rounded-none border-x-0 border-t-0 border-b border-input shadow-none',
};

const inputClasses = computed(() =>
  cn(
    'flex w-full rounded-md text-sm transition-all',
    'placeholder:text-muted-foreground',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'readonly:cursor-default readonly:bg-muted/30',
    sizeClasses[props.size] ?? sizeClasses.md,
    variantClasses[props.variant] ?? variantClasses.default,
    props.class,
  ),
);
</script>

<template>
  <input
    ref="inputRef"
    :value="displayValue"
    :type="props.type"
    :placeholder="props.placeholder || props.placeholderChar!.repeat(editableCount)"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :required="props.required"
    :autofocus="props.autofocus"
    :class="inputClasses"
    :aria-disabled="props.disabled"
    :aria-readonly="props.readonly"
    :aria-required="props.required"
    @beforeinput="handleBeforeInput"
    @keydown="handleKeydown"
    @paste="handlePaste"
    @focus="handleFocus"
    @blur="handleBlur"
  />
</template>
