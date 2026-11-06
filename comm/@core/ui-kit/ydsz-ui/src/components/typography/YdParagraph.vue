<script lang="ts" setup>
/**
 * Typography.Paragraph：段落，多行文本容器，支持多行省略、展开/收起与可编辑。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\typography\YdParagraph.vue
 * @author ydsz-team
 * @since 1.0.0
 */
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { cn } from '@ydsz-core/shared/utils';
import { useLocale } from '../../locale/useLocale';

const { t } = useLocale();

interface EditableConfig {
  /** 失焦/回车后是否自动保存（触发 change 事件） */
  autoSave?: boolean;
  /** 最大可输入字符数 */
  maxLength?: number;
}

interface EllipsisConfig {
  /** 最大行数，1 = 单行省略 */
  rows?: number;
  /** 是否显示「展开/收起」按钮 */
  expandable?: boolean;
  /** 溢出时是否用 Tooltip 展示全文 */
  tooltip?: boolean;
}

interface Props {
  /** 自定义类名 */
  class?: string;
  /** 文字省略（多行）配置 */
  ellipsis?: boolean | EllipsisConfig;
  /** 是否可编辑 */
  editable?: boolean | EditableConfig;
}

const props = withDefaults(defineProps<Props>(), {
  ellipsis: false,
  editable: false,
});

const emit = defineEmits<{
  change: [value: string];
  expandChange: [expanded: boolean];
}>();

/** 归一化省略配置 */
function resolveEllipsis(): EllipsisConfig | null {
  if (!props.ellipsis) return null;
  if (typeof props.ellipsis === 'boolean') return { rows: 1, expandable: false, tooltip: false };
  return { rows: 1, expandable: false, tooltip: false, ...props.ellipsis };
}

// ── 省略 / 展开 ──────────────────────────────────────────
const textRef = ref<HTMLElement | null>(null);
const isOverflowing = ref(false);
const expanded = ref(false);
const isClient = ref(false);
let resizeObserver: ResizeObserver | null = null;

function checkOverflow(): void {
  const el = textRef.value;
  const cfg = resolveEllipsis();
  if (!el || !cfg) return;
  const rows = cfg.rows ?? 1;
  if (rows <= 1) {
    isOverflowing.value = el.scrollWidth > el.clientWidth + 1;
  } else {
    isOverflowing.value = el.scrollHeight > el.clientHeight + 1;
  }
}

function toggleExpand(): void {
  expanded.value = !expanded.value;
  emit('expandChange', expanded.value);
}

onMounted(() => {
  isClient.value = true;
  nextTick(() => {
    checkOverflow();
    const el = textRef.value;
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => checkOverflow());
      resizeObserver.observe(el);
    }
  });
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  () => props.ellipsis,
  () => nextTick(checkOverflow),
);

/** 省略态样式 */
function ellipsisStyle(rows: number): Record<string, string> | undefined {
  if (rows <= 1) {
    return { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  }
  return {
    display: '-webkit-box',
    '-webkit-line-clamp': String(rows),
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
  };
}

// ── Editable 模式 ──────────────────────────────────────────
const isEditing = ref(false);
const editValue = ref('');
const contentRef = ref<HTMLElement | null>(null);

function editableConfig(): EditableConfig {
  return typeof props.editable === 'object' ? props.editable : {};
}

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
  const cfg = editableConfig();
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
  if (el) el.textContent = editValue.value;
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
    class="border-primary text-muted-foreground focus:ring-primary min-w-[2em] rounded border bg-transparent px-2 py-1 text-sm leading-relaxed outline-none focus:ring-1"
    @blur="finishEditing"
    @keydown="handleKeydown"
  />

  <!-- 正常模式 -->
  <p
    v-else
    :class="
      cn(
        'text-muted-foreground group relative text-sm leading-relaxed',
        props.editable && 'inline-flex items-center gap-1',
        props.class,
      )
    "
    @dblclick="startEditing"
  >
    <span
      ref="textRef"
      :class="
        cn(
          resolveEllipsis() && !expanded && 'block',
          resolveEllipsis() &&
            !expanded &&
            (resolveEllipsis()?.rows ?? 1) <= 1 &&
            'overflow-hidden text-ellipsis whitespace-nowrap',
        )
      "
      :style="
        resolveEllipsis() && !expanded ? ellipsisStyle(resolveEllipsis()?.rows ?? 1) : undefined
      "
    >
      <span ref="contentRef"><slot></slot></span>
    </span>

    <!-- 展开/收起按钮 -->
    <button
      v-if="resolveEllipsis()?.expandable && isOverflowing && isClient"
      class="text-primary ml-1 inline-block text-xs hover:underline"
      type="button"
      @click="toggleExpand"
    >
      {{ expanded ? t('common.collapse') : t('common.expand') }}
    </button>

    <!-- 编辑 hint 图标 -->
    <span
      v-if="props.editable"
      class="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      :aria-label="t('common.edit')"
    >
      <svg
        aria-hidden="true"
        class="size-3.5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </span>
  </p>
</template>
