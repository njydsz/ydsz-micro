/**
 * YdInputOtp —— OTP 验证码输入组件。
 *
 * N 位独立的单字符输入框，自动跳框、Backspace 跳回、粘贴分配、完成回调。
 *
 * 用法示例：
 * ```vue
 * <YdInputOtp v-model="otp" :length="6" @complete="onComplete" />
 * ```
 *
 * WAI-ARIA: role="group" + aria-label，每个 input 带 aria-label 标明第几位。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\input-otp\YdInputOtp.vue
 * @author ydsz-team
 * @since 1.0.0
 */
<script setup lang="ts">
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue';

import type { YdInputOtpEmits, YdInputOtpProps } from './types';

defineOptions({ name: 'YdInputOtp' });

const props = withDefaults(defineProps<YdInputOtpProps>(), {
  modelValue: '',
  length: 6,
  type: 'number',
  disabled: false,
  autoFocus: false,
  mask: false,
});

const emit = defineEmits<YdInputOtpEmits>();

// —— 内部状态 ——
/** 每个格子的值 */
const chars = ref<string[]>(Array.from({ length: props.length }, () => ''));

/** DOM refs: 手动维护的 refs 数组 */
const inputRefs = ref<(HTMLInputElement | null)[]>([]);

/**
 * 模板 ref 回调 —— 把 input 元素存入 inputRefs 数组。
 */
function setInputRef(el: unknown, index: number): void {
  if (el instanceof HTMLInputElement) {
    inputRefs.value[index] = el;
  }
}

watch(() => props.modelValue, (val) => {
  if (val === chars.value.join('')) return;
  const arr = val.split('').slice(0, props.length);
  while (arr.length < props.length) arr.push('');
  chars.value = arr;
}, { immediate: true });

watch(() => props.length, (len) => {
  const current = chars.value.slice(0, len);
  while (current.length < len) current.push('');
  chars.value = current;
  // 重置 refs 数组
  inputRefs.value = Array.from({ length: len }, () => null);
});

/** 是否以遮罩字符显示 */
const shouldMask = computed(() => props.mask || props.type === 'password');

/** 实际传递给 input 的 type */
const inputType = computed(() => {
  if (shouldMask.value) return 'password';
  return props.type === 'number' ? 'text' : props.type;
});

// —— 核心逻辑 ——
function updateModel(): void {
  const val = chars.value.join('');
  emit('update:modelValue', val);
  if (val.length === props.length && chars.value.every((c) => c !== '')) {
    emit('complete', val);
  }
}

/**
 * 输入事件 —— 限制单字符、自动跳下一格。
 */
function onInput(e: Event, index: number): void {
  const input = e.target as HTMLInputElement;
  let value = input.value;

  // 只取最后一个字符（粘贴时 paste 事件已单独处理，这里仍做兜底）
  if (value.length > 1) {
    value = value.slice(-1);
  }

  // number 类型限制数字
  if (props.type === 'number' && value && !/^\d$/.test(value)) {
    input.value = chars.value[index] ?? '';
    return;
  }

  chars.value[index] = value;
  input.value = value;
  updateModel();

  // 自动跳到下一格
  if (value && index < props.length - 1) {
    nextTick(() => {
      const next = inputRefs.value[index + 1];
      if (next) {
        next.focus();
        next.select();
      }
    });
  }
}

/**
 * 键盘事件 —— 方向键左右跳格、Backspace 跳回上一格。
 */
function onKeydown(e: KeyboardEvent, index: number): void {
  switch (e.key) {
    case 'Backspace':
      if (!chars.value[index] && index > 0) {
        e.preventDefault();
        chars.value[index - 1] = '';
        updateModel();
        nextTick(() => {
          const prev = inputRefs.value[index - 1];
          if (prev) {
            prev.focus();
            prev.select();
          }
        });
      }
      break;
    case 'ArrowLeft':
      if (index > 0) {
        e.preventDefault();
        inputRefs.value[index - 1]?.focus();
      }
      break;
    case 'ArrowRight':
      if (index < props.length - 1) {
        e.preventDefault();
        inputRefs.value[index + 1]?.focus();
      }
      break;
  }
}

/**
 * 粘贴事件 —— 按字符分配到各个格子。
 */
function onPaste(e: ClipboardEvent, startIndex: number): void {
  e.preventDefault();
  const text = e.clipboardData?.getData('text') ?? '';
  if (!text) return;

  // 清理非法字符（number 模式只取数字）
  let clean = text.replace(/\s/g, '');
  if (props.type === 'number') {
    clean = clean.replace(/\D/g, '');
  }

  // 分配到 chars（从 startIndex 开始）
  for (let i = 0; i < clean.length && (startIndex + i) < props.length; i++) {
    chars.value[startIndex + i] = clean[i] ?? '';
  }

  // 聚焦到最后一个已填的下一格或末格
  const nextEmpty = chars.value.findIndex((c) => c === '');
  const focusIdx = nextEmpty === -1 ? props.length - 1 : nextEmpty;
  nextTick(() => {
    const el = inputRefs.value[focusIdx];
    if (el) {
      el.focus();
      el.select();
    }
  });

  updateModel();
}

/**
 * focus 时自动选中当前格内容。
 */
function onFocus(e: FocusEvent): void {
  const input = e.target as HTMLInputElement;
  input.select();
}

/**
 * 暴露 reset 方法 —— 清空全部并聚焦首格。
 */
function reset(): void {
  chars.value = Array.from({ length: props.length }, () => '');
  emit('update:modelValue', '');
  nextTick(() => {
    inputRefs.value[0]?.focus();
  });
}

defineExpose({ reset });
</script>

<template>
  <div
    class="yd-input-otp"
    :class="{ 'yd-input-otp--disabled': disabled }"
    role="group"
    aria-label="One-time password input"
    :aria-disabled="disabled || undefined"
  >
    <template
      v-for="(_, index) in chars"
      :key="index"
    >
      <!-- 分隔符 slot -->
      <div
        v-if="index > 0 && $slots.separator"
        class="yd-input-otp__separator"
        aria-hidden="true"
      >
        <slot name="separator" />
      </div>

      <!-- 输入格 -->
      <input
        :ref="(el) => setInputRef(el, index)"
        :type="inputType"
        :inputmode="type === 'number' ? 'numeric' : 'text'"
        :autocomplete="index === 0 ? 'one-time-code' : 'off'"
        :disabled="disabled"
        :aria-label="`Character ${index + 1} of ${length}`"
        class="yd-input-otp__cell"
        maxlength="1"
        @input="onInput($event, index)"
        @keydown="onKeydown($event, index)"
        @paste="onPaste($event, index)"
        @focus="onFocus"
      >
    </template>
  </div>
</template>

<style scoped>
.yd-input-otp {
  display: inline-flex;
  align-items: center;
  gap: var(--ydsz-spacing-xs);
}

.yd-input-otp--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.yd-input-otp__cell {
  width: 2.75rem;
  height: 3rem;
  text-align: center;
  font-size: var(--ydsz-font-size-lg);
  font-weight: 600;
  color: hsl(var(--ydsz-text-primary));
  background: hsl(var(--ydsz-surface-1));
  border: 1px solid hsl(var(--ydsz-border-default));
  border-radius: var(--ydsz-radius-md);
  outline: none;
  caret-color: hsl(var(--ydsz-comp-bg));
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

.yd-input-otp__cell:focus {
  border-color: hsl(var(--ydsz-comp-bg));
  box-shadow: 0 0 0 3px hsl(var(--ydsz-comp-bg) / 0.15);
}

.yd-input-otp__separator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--ydsz-text-tertiary));
  font-size: var(--ydsz-font-size-base);
  user-select: none;
}
</style>
