<!--
 * Typography.Paragraph：段落，多行文本容器，支持省略与可编辑。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\primitives\typography\YdParagraph.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { nextTick, ref } from 'vue';

import { cn } from '@ydsz-core/shared/utils';

interface EditableConfig {
  /** 失焦/回车后是否自动保存（触发 change 事件） */
  autoSave?: boolean;
  /** 最大可输入字符数 */
  maxLength?: number;
}

interface Props {
  /** 自定义类名 */
  class?: any;
  /** 文字省略（多行） */
  ellipsis?: { rows?: number; expandable?: boolean };
  /** 是否可编辑 */
  editable?: boolean | EditableConfig;
}

const props = withDefaults(defineProps<Props>(), {
  ellipsis: undefined,
  editable: false,
});

const emit = defineEmits<{
  change: [value: string];
}>();

// ── Editable 模式 ──────────────────────────────────────────
const isEditing = ref(false);
const editValue = ref('');
const contentRef = ref<HTMLElement | null>(null);

function startEditing(): void {
  if (!props.editable) return;
  const el = contentRef.value;
  if (!el) return;
  editValue.value = el.textContent ?? '';
  isEditing.value = true;
  nextTick(() => {
    if (contentRef.value) {
      contentRef.value.focus();
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
  const editableObj = typeof props.editable === 'object' ? props.editable : {};
  const cfg: EditableConfig = editableObj;
  if (cfg.maxLength && (el.textContent ?? '').length > cfg.maxLength) {
    el.textContent = (el.textContent ?? '').slice(0, cfg.maxLength);
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
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    finishEditing();
  } else if (e.key === 'Escape') {
    cancelEditing();
  }
}
</script>

<template>
  <!-- 编辑模式 -->
  <div
    v-if="isEditing"
    ref="contentRef"
    contenteditable="true"
    class="min-w-[2em] rounded border border-primary bg-transparent px-2 py-1 text-sm leading-relaxed text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
    @blur="finishEditing"
    @keydown="handleKeydown"
  />

  <!-- 正常模式 -->
  <p
    v-else
    :class="cn(
      'text-sm leading-relaxed text-muted-foreground group relative cursor-text',
      props.editable && 'inline-flex items-center gap-1',
      props.class,
    )"
    @dblclick="startEditing"
  >
    <span ref="contentRef">
      <slot></slot>
    </span>

    <!-- 编辑 hint 图标 -->
    <span
      v-if="props.editable"
      class="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      :aria-label="'编辑段落'"
    >
      <svg aria-hidden="true" class="size-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </span>
  </p>
</template>
