<script setup lang="ts">
/**
 * YdInputTags —— 标签输入组件。
 *
 * <p>交互型标签输入：在输入框内输入内容后按分隔符 / Enter / Blur 转为 tag。
 * tag 内嵌删除按钮；超出 maxTags 时输入框禁用；Backspace 删除最后一个 tag。
 *
 * WAI-ARIA: role="list"（容器） + role="listitem"（每个 tag） + aria-label（删除按钮）。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\input-tags\YdInputTags.vue
 * @author ydsz-team
 * @since 1.0.0
 */

import { computed, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { X } from 'lucide-vue-next';

import type { YdInputTagsEmits, YdInputTagsProps } from './types';

defineOptions({ name: 'YdInputTags' });

const props = withDefaults(defineProps<YdInputTagsProps>(), {
  allowDuplicates: false,
  disabled: false,
  maxTags: undefined,
  modelValue: () => [],
  pattern: undefined,
  placeholder: '',
  readonly: false,
  separator: ',',
  size: 'md',
});

const emit = defineEmits<YdInputTagsEmits>();

/** 内部标签列表（与 props.modelValue 双向同步） */
const tags = ref<string[]>([...props.modelValue]);

/** 当前输入值 */
const inputValue = ref('');

/** 输入框模板 ref */
const inputRef = ref<HTMLInputElement | null>(null);

/** 校验失败提示是否可见 */
const isInvalidVisible = ref(false);

/* ============================================================ */
/* 计算                                                           */
/* ============================================================ */

/** 是否已达上限 */
const isMaxReached = computed(() =>
  props.maxTags !== undefined && tags.value.length >= props.maxTags,
);

/** 输入框是否禁用 */
const isInputDisabled = computed(() =>
  props.disabled || props.readonly || isMaxReached.value,
);

/** 尺寸样式映射 */
const sizeClasses = computed(() => {
  const map: Record<string, { container: string; input: string; tag: string }> = {
    sm: {
      container: 'min-h-7 gap-1 px-2 py-0.5',
      input: 'h-5 text-xs',
      tag: 'h-5 gap-0.5 px-1.5 text-xs',
    },
    md: {
      container: 'min-h-9 gap-1.5 px-2.5 py-1',
      input: 'h-6 text-sm',
      tag: 'h-6 gap-1 px-2 text-sm',
    },
    lg: {
      container: 'min-h-11 gap-2 px-3 py-1.5',
      input: 'h-7 text-base',
      tag: 'h-7 gap-1 px-2.5 text-sm',
    },
  };
  return map[props.size] ?? map.md!;
});

/* ============================================================ */
/* 方法                                                           */
/* ============================================================ */

/**
 * 尝试将输入值转为 tag。
 */
function commitInput(): void {
  const raw = inputValue.value.trim();
  if (!raw) return;

  // 处理可能包含分隔符的粘贴场景
  const parts = raw.split(props.separator).map(s => s.trim()).filter(Boolean);

  let added = false;
  for (const part of parts) {
    if (!isValidTag(part)) {
      isInvalidVisible.value = true;
      return;
    }
    if (!props.allowDuplicates && tags.value.includes(part)) {
      continue;
    }
    if (props.maxTags !== undefined && tags.value.length >= props.maxTags) {
      break;
    }
    tags.value.push(part);
    emit('tag-add', part, [...tags.value]);
    added = true;
  }

  if (added) {
    emit('update:modelValue', [...tags.value]);
    isInvalidVisible.value = false;
  }
  inputValue.value = '';
}

/**
 * 校验单个 tag 是否符合要求。
 */
function isValidTag(tag: string): boolean {
  if (!tag) return false;
  if (props.pattern && !props.pattern.test(tag)) return false;
  return true;
}

/**
 * 移除指定索引的 tag。
 */
function removeTag(index: number): void {
  if (props.disabled || props.readonly) return;
  const removed = tags.value[index];
  if (removed === undefined) return;
  tags.value.splice(index, 1);
  emit('tag-remove', removed, [...tags.value]);
  emit('update:modelValue', [...tags.value]);
}

/**
 * 按下删除键且输入为空时，删除最后一个 tag。
 */
function handleBackspace(): void {
  if (inputValue.value !== '' || tags.value.length === 0) return;
  if (props.disabled || props.readonly) return;
  const index = tags.value.length - 1;
  removeTag(index);
}

/**
 * 聚焦输入框。
 */
function focusInput(): void {
  inputRef.value?.focus();
}

/* ============================================================ */
/* 事件                                                           */
/* ============================================================ */

function handleInputKeydown(event: KeyboardEvent): void {
  emit('keydown', event);

  if (event.key === 'Enter') {
    event.preventDefault();
    commitInput();
  } else if (event.key === 'Backspace') {
    handleBackspace();
  } else if (event.key === props.separator) {
    event.preventDefault();
    commitInput();
  }
}

function handleInputBlur(): void {
  commitInput();
}

function handleBeforePaste(event: ClipboardEvent): void {
  // 粘贴含分隔符的内容时，阻止默认并走 commitInput
  const text = event.clipboardData?.getData('text');
  if (text && text.includes(props.separator)) {
    event.preventDefault();
    inputValue.value += text;
    commitInput();
  }
}

/** 暴露给父组件的方法 */
defineExpose({
  addTag: (tag: string) => {
    if (isValidTag(tag)) {
      tags.value.push(tag);
      emit('update:modelValue', [...tags.value]);
    }
  },
  clear: () => {
    tags.value = [];
    emit('update:modelValue', []);
  },
  focus: focusInput,
});
</script>

<template>
  <div
    :class="
      cn(
        'yd-input-tags flex w-full flex-wrap items-center rounded-md border border-[hsl(var(--ydsz-border-default))] bg-[hsl(var(--ydsz-surface-1))] transition-colors',
        'focus-within:border-[hsl(var(--ydsz-comp-border-focus))] focus-within:ring-2 focus-within:ring-[hsl(var(--ydsz-comp-focus-ring-color))/0.2]',
        isInputDisabled && 'cursor-not-allowed opacity-60',
        sizeClasses.container,
      )
    "
    role="list"
    :aria-label="`标签输入（${tags.length} 个标签）`"
    @click="focusInput"
  >
    <!-- Tag 列表 -->
    <span
      v-for="(tag, index) in tags"
      :key="`${tag}-${index}`"
      :class="
        cn(
          'inline-flex items-center rounded-sm bg-[hsl(var(--ydsz-comp-surface-selected))] text-[hsl(var(--ydsz-text-primary))]',
          sizeClasses.tag,
        )
      "
      role="listitem"
      :aria-label="`标签：${tag}`"
    >
      <span class="truncate max-w-[160px]">{{ tag }}</span>
      <button
        v-if="!props.readonly && !props.disabled"
        type="button"
        :aria-label="`删除标签 ${tag}`"
        :class="
          cn(
            'inline-flex shrink-0 items-center justify-center rounded-full',
            'hover:bg-[hsl(var(--ydsz-text-primary))/0.15] focus:outline-none',
            'focus-visible:ring-2 focus-visible:ring-[hsl(var(--ydsz-comp-focus-ring-color))]',
          )
        "
        @click.stop="removeTag(index)"
      >
        <X class="size-3" aria-hidden="true" />
      </button>
    </span>

    <!-- 输入框 -->
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      :disabled="isInputDisabled"
      :placeholder="tags.length === 0 ? props.placeholder : ''"
      :aria-invalid="isInvalidVisible"
      :aria-label="props.placeholder ?? '输入标签'"
      :class="
        cn(
          'flex-1 min-w-[80px] border-none bg-transparent outline-none',
          'text-[hsl(var(--ydsz-text-primary))] placeholder:text-[hsl(var(--ydsz-text-tertiary))]',
          sizeClasses.input,
        )
      "
      @keydown="handleInputKeydown"
      @blur="handleInputBlur"
      @beforepaste="handleBeforePaste"
    />
  </div>

  <!-- 校验失败提示 -->
  <p
    v-if="isInvalidVisible && props.invalidMessage"
    role="alert"
    class="mt-1 text-xs text-[hsl(var(--ydsz-color-destructive-500))]"
  >
    {{ props.invalidMessage }}
  </p>
</template>

<style scoped>
.yd-input-tags:focus-within {
  box-shadow: var(--ydsz-comp-focus-ring);
}
</style>
