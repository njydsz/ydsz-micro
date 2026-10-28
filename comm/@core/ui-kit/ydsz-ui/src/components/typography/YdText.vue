<script lang="ts" setup>
/**
* Typography.Text：文本 / 代码 / 标记 / 复制 / 可编辑等原子组件。
* 
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\typography\YdText.vue
 * @author ydsz-team
 * @since 1.0.0
 */
// @ts-nocheck
import { getCurrentInstance, nextTick, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

interface EditableConfig {
  /** 失焦/回车后是否自动保存（触发 change 事件） */
  autoSave?: boolean;
  /** 最大可输入字符数 */
  maxLength?: number;
}

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 是否加粗 */
  bold?: boolean;
  /** 代码高亮 */
  code?: boolean;
  /** 文本可复制 */
  copyable?: boolean;
  /** 删除线 */
  delete?: boolean;
  /** 文字省略 */
  ellipsis?: boolean;
  /** 是否可编辑（boolean 或详细配置对象） */
  editable?: boolean | EditableConfig;
  /** 斜体 */
  italic?: boolean;
  /** 标记高亮 */
  mark?: boolean;
  /** 下划线 */
  underline?: boolean;
  /** 语义类型 */
  type?: 'danger' | 'secondary' | 'success' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  bold: false,
  code: false,
  copyable: false,
  delete: false,
  ellipsis: false,
  editable: false,
  italic: false,
  mark: false,
  underline: false,
  type: undefined,
});

const emit = defineEmits<{
  copy: [text: string];
  change: [value: string];
}>();

const typeClass: Record<string, string> = {
  danger: 'text-red-600 dark:text-red-400',
  secondary: 'text-muted-foreground',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
};

function handleCopy(): void {
  const el = getCurrentInstance()?.proxy?.$el as HTMLElement | undefined;
  const text = el?.textContent ?? '';
  if (text) {
    navigator.clipboard.writeText(text).then(() => emit('copy', text));
  }
}

// ── Editable 模式 ──────────────────────────────────────────
const isEditing = ref(false);
const editValue = ref('');
const contentRef = ref<HTMLElement | null>(null);

const editableConfig = (): EditableConfig => {
  if (typeof props.editable === 'object') return props.editable;
  return {};
};

function startEditing(): void {
  if (!props.editable) return;
  const el = contentRef.value;
  if (!el) return;
  editValue.value = el.textContent ?? '';
  isEditing.value = true;
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.focus();
      // 移动光标至末尾
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(contentRef.value);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  });
}

function finishEditing(): void {
  if (!isEditing.value) return;
  isEditing.value = false;
  const el = contentRef.value;
  if (!el) return;
  const newValue = (el.textContent ?? '').trim();
  const cfg = editableConfig();
  if (cfg.maxLength && newValue.length > cfg.maxLength) {
    el.textContent = newValue.slice(0, cfg.maxLength);
  }
  if (cfg.autoSave !== false) {
    emit('change', el.textContent ?? '');
  }
}

function cancelEditing(): void {
  isEditing.value = false;
  const el = contentRef.value;
  if (el) {
    el.textContent = editValue.value;
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    e.preventDefault();
    finishEditing();
  } else if (e.key === 'Escape') {
    cancelEditing();
  }
}
</script>

<template>
  <span
    :class="
      cn(
        'inline',
        props.type ? typeClass[props.type] : 'text-foreground',
        props.bold && 'font-semibold',
        props.code && 'rounded bg-muted px-1 py-0.5 font-mono text-sm',
        props.delete && 'line-through',
        props.ellipsis && 'block max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
        props.italic && 'italic',
        props.mark && 'rounded bg-yellow-100 px-0.5 dark:bg-yellow-900/40',
        props.underline && 'underline',
        props.editable && 'group relative inline-flex items-center gap-1',
        props.class,
      )
    "
    @dblclick="startEditing"
  >
    <!-- 编辑中：contenteditable div -->
    <div
      v-if="isEditing"
      ref="contentRef"
      contenteditable="true"
      class="min-w-[2em] rounded border border-primary bg-transparent px-1 outline-none focus:ring-1 focus:ring-primary"
      @blur="finishEditing"
      @keydown="handleKeydown"
    />

    <!-- 非编辑态：正常文本 + 编辑图标 -->
    <template v-else>
      <span
        ref="contentRef"
        :class="cn(props.editable && 'cursor-text', props.ellipsis && 'overflow-hidden text-ellipsis whitespace-nowrap')"
      >
        <slot></slot>
      </span>

      <!-- 编辑 hint 图标 -->
      <span
        v-if="props.editable"
        class="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        :aria-label="t('common.edit')"
      >
        <svg aria-hidden="true" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
      </span>

      <!-- 复制按钮 -->
      <button
        v-if="props.copyable"
        :aria-label="t('common.copy')"
        class="text-muted-foreground hover:text-foreground ml-1 inline align-baseline text-xs"
        type="button"
        @click="handleCopy"
      >
        <svg aria-hidden="true" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
    </template>
  </span>
</template>
