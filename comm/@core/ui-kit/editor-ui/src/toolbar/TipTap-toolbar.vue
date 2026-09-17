<!--
 * TipTap 富文本编辑器工具栏组件。
 *
 * <p>基于 TipTap 实例提供常用排版操作：标题、加粗、斜体、对齐、链接、撤销等；
 * <p>支持只读模式（disabled 时全部按钮置灰）。
 *
 * @path comm/@core/ui-kit/tiptap/src/toolbar/TipTap-toolbar.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed, ref } from 'vue';

import { type Editor } from '@tiptap/vue-3';

import { YdInput, YdPopoverBase, YdPopoverContentBase, YdPopoverTriggerBase, YdTooltip } from '@ydsz-core/ydsz-ui';

interface Props {
  /** TipTap 编辑器实例 */
  editor: Editor | undefined;
  /** 是否禁用（只读模式） */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const linkDialogVisible = ref(false);
const linkUrl = ref('');

/** 是否可操作（编辑器存在且非只读） */
const canEdit = computed(() => !!props.editor && !props.disabled);

/**
 * @zh_CN 切换行内格式（toggleable 为 true 时表示有 active 状态）
 */
const toggleFormat = (command: () => void) => {
  if (!canEdit.value) return;
  command();
};

/**
 * @zh_CN 设置标题级别（0 表示段落）
 */
const setHeading = (level: number) => {
  if (!canEdit.value) return;
  if (level === 0) {
    props.editor?.chain().focus().setParagraph().run();
  } else {
    props.editor?.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run();
  }
};

const openLinkDialog = () => {
  const previousUrl = props.editor?.getAttributes('link').href ?? '';
  linkUrl.value = previousUrl;
  linkDialogVisible.value = true;
};

const setLink = () => {
  if (!canEdit.value) return;
  if (linkUrl.value === '') {
    props.editor?.chain().focus().extendMarkRange('link').unsetLink().run();
  } else {
    props.editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run();
  }
  linkDialogVisible.value = false;
};

const insertTable = () => {
  props.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
};

const insertHorizontalRule = () => {
  props.editor?.chain().focus().setHorizontalRule().run();
};

/** 获取当前格式是否激活 */
const isActive = (name: string, attrs?: Record<string, unknown>): boolean => {
  return props.editor?.isActive(name, attrs) ?? false;
};
</script>

<template>
  <div
    v-if="editor"
    class="tiptap-toolbar flex flex-wrap items-center gap-1 border-b px-2 py-1"
  >
    <!-- 撤销 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :disabled="!editor.can().undo()"
          @click="editor.chain().focus().undo().run()"
        >
          ↶
        </button>
      </template>
      撤销
    </YdTooltip>

    <!-- 重做 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :disabled="!editor.can().redo()"
          @click="editor.chain().focus().redo().run()"
        >
          ↷
        </button>
      </template>
      重做
    </YdTooltip>

    <div class="toolbar-divider" />

    <!-- 标题 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('paragraph') }"
          :disabled="!canEdit"
          @click="setHeading(0)"
        >
          正文
        </button>
      </template>
      正文
    </YdTooltip>
    <button
      v-for="level in [1, 2, 3, 4]"
      :key="level"
      class="toolbar-btn"
      :class="{ active: isActive('heading', { level }) }"
      :disabled="!canEdit"
      @click="setHeading(level)"
    >
      H{{ level }}
    </button>

    <div class="toolbar-divider" />

    <!-- 加粗 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('bold') }"
          :disabled="!canEdit"
          @click="toggleFormat(() => editor!.chain().focus().toggleBold().run())"
        >
          <strong>B</strong>
        </button>
      </template>
      加粗 (Ctrl+B)
    </YdTooltip>

    <!-- 斜体 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('italic') }"
          :disabled="!canEdit"
          @click="toggleFormat(() => editor!.chain().focus().toggleItalic().run())"
        >
          <em>I</em>
        </button>
      </template>
      斜体 (Ctrl+I)
    </YdTooltip>

    <!-- 下划线 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('underline') }"
          :disabled="!canEdit"
          @click="toggleFormat(() => editor!.chain().focus().toggleUnderline().run())"
        >
          U
        </button>
      </template>
      下划线 (Ctrl+U)
    </YdTooltip>

    <!-- 删除行 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('strike') }"
          :disabled="!canEdit"
          @click="toggleFormat(() => editor!.chain().focus().toggleStrike().run())"
        >
          S
        </button>
      </template>
      删除线
    </YdTooltip>

    <div class="toolbar-divider" />

    <!-- 无序列表 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('bulletList') }"
          :disabled="!canEdit"
          @click="toggleFormat(() => editor!.chain().focus().toggleBulletList().run())"
        >
          • 列表
        </button>
      </template>
      无序列表
    </YdTooltip>

    <!-- 有序列表 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('orderedList') }"
          :disabled="!canEdit"
          @click="toggleFormat(() => editor!.chain().focus().toggleOrderedList().run())"
        >
          1. 列表
        </button>
      </template>
      有序列表
    </YdTooltip>

    <!-- 代码块 -->
    <YdTooltip side="top">
      <template #trigger>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('codeBlock') }"
          :disabled="!canEdit"
          @click="toggleFormat(() => editor!.chain().focus().toggleCodeBlock().run())"
        >
          &lt;/&gt;
        </button>
      </template>
      代码块
    </YdTooltip>

    <div class="toolbar-divider" />

    <!-- 链接 -->
    <YdPopoverBase v-model:open="linkDialogVisible">
      <YdPopoverTriggerBase as-child>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('link') }"
          :disabled="!canEdit"
          @click="openLinkDialog"
        >
          🔗
        </button>
      </YdPopoverTriggerBase>
      <YdPopoverContentBase class="w-[300px]" side="bottom">
        <div class="flex flex-col gap-2 p-2">
          <YdInput v-model="linkUrl" placeholder="输入 URL..." class="h-8 text-xs" />
          <button class="toolbar-confirm-btn" @click="setLink">
            确认
          </button>
        </div>
      </YdPopoverContentBase>
    </YdPopoverBase>

    <!-- 表格 -->
    <YdTooltip side="top">
      <template #trigger>
        <button class="toolbar-btn" :disabled="!canEdit" @click="insertTable">
          ⊞
        </button>
      </template>
      插入 3x3 表格
    </YdTooltip>

    <!-- 水平线 -->
    <YdTooltip side="top">
      <template #trigger>
        <button class="toolbar-btn" :disabled="!canEdit" @click="insertHorizontalRule">
          ―
        </button>
      </template>
      水平线
    </YdTooltip>
  </div>
</template>

<style scoped>
.tiptap-toolbar {
  background-color: hsl(var(--muted) / 30%);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: hsl(var(--foreground));
  transition: background-color 0.15s;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn:hover:not(:disabled) {
  background-color: hsl(var(--accent));
}

.toolbar-btn.active {
  background-color: hsl(var(--primary) / 15%);
  color: hsl(var(--primary));
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  margin: 0 2px;
  background-color: hsl(var(--border));
}

.toolbar-confirm-btn {
  width: 100%;
  padding: 4px 0;
  border: none;
  border-radius: 4px;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  cursor: pointer;
}
</style>
