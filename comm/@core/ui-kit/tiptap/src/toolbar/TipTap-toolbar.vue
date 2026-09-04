<script lang="ts" setup>
/**
 * TipTapToolbar 工具栏组件
 */
import { computed, ref } from 'vue';

import { Editor } from '@tiptap/vue-3';
import { ElInput, ElPopover, ElTooltip, ElMessage } from 'element-plus';

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
    <ElTooltip content="撤销" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        ↶
      </button>
    </ElTooltip>

    <!-- 重做 -->
    <ElTooltip content="重做" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        ↷
      </button>
    </ElTooltip>

    <div class="toolbar-divider" />

    <!-- 标题 -->
    <ElTooltip content="正文" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('paragraph') }"
        :disabled="!canEdit"
        @click="setHeading(0)"
      >
        正文
      </button>
    </ElTooltip>
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
    <ElTooltip content="加粗 (Ctrl+B)" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('bold') }"
        :disabled="!canEdit"
        @click="toggleFormat(() => editor!.chain().focus().toggleBold().run())"
      >
        <strong>B</strong>
      </button>
    </ElTooltip>

    <!-- 斜体 -->
    <ElTooltip content="斜体 (Ctrl+I)" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('italic') }"
        :disabled="!canEdit"
        @click="toggleFormat(() => editor!.chain().focus().toggleItalic().run())"
      >
        <em>I</em>
      </button>
    </ElTooltip>

    <!-- 下划线 -->
    <ElTooltip content="下划线 (Ctrl+U)" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('underline') }"
        :disabled="!canEdit"
        @click="toggleFormat(() => editor!.chain().focus().toggleUnderline().run())"
      >
        U
      </button>
    </ElTooltip>

    <!-- 删除行 -->
    <ElTooltip content="删除线" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('strike') }"
        :disabled="!canEdit"
        @click="toggleFormat(() => editor!.chain().focus().toggleStrike().run())"
      >
        S
      </button>
    </ElTooltip>

    <div class="toolbar-divider" />

    <!-- 无序列表 -->
    <ElTooltip content="无序列表" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('bulletList') }"
        :disabled="!canEdit"
        @click="toggleFormat(() => editor!.chain().focus().toggleBulletList().run())"
      >
        • 列表
      </button>
    </ElTooltip>

    <!-- 有序列表 -->
    <ElTooltip content="有序列表" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('orderedList') }"
        :disabled="!canEdit"
        @click="toggleFormat(() => editor!.chain().focus().toggleOrderedList().run())"
      >
        1. 列表
      </button>
    </ElTooltip>

    <!-- 代码块 -->
    <ElTooltip content="代码块" placement="top" :enterable="false">
      <button
        class="toolbar-btn"
        :class="{ active: isActive('codeBlock') }"
        :disabled="!canEdit"
        @click="toggleFormat(() => editor!.chain().focus().toggleCodeBlock().run())"
      >
        &lt;/&gt;
      </button>
    </ElTooltip>

    <div class="toolbar-divider" />

    <!-- 链接 -->
    <ElPopover :visible="linkDialogVisible" placement="bottom" :width="300">
      <template #reference>
        <button
          class="toolbar-btn"
          :class="{ active: isActive('link') }"
          :disabled="!canEdit"
          @click="openLinkDialog"
        >
          🔗
        </button>
      </template>
      <div class="flex flex-col gap-2 p-2">
        <ElInput v-model="linkUrl" placeholder="输入 URL..." size="small" />
        <button class="toolbar_confirm-btn" @click="setLink">
          确认
        </button>
      </div>
    </ElPopover>

    <!-- 表格 -->
    <ElTooltip content="插入 3x3 表格" placement="top" :enterable="false">
      <button class="toolbar-btn" :disabled="!canEdit" @click="insertTable">
        ⊞
      </button>
    </ElTooltip>

    <!-- 水平线 -->
    <ElTooltip content="水平线" placement="top" :enterable="false">
      <button class="toolbar-btn" :disabled="!canEdit" @click="insertHorizontalRule">
        ―
      </button>
    </ElTooltip>
  </div>
</template>

<style scoped>
.tiptap-toolbar {
  background-color: hsl(var(--muted) / 0.3);
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

.toolbar-btn:hover:not(:disabled) {
  background-color: hsl(var(--accent));
}

.toolbar-btn.active {
  background-color: hsl(var(--primary) / 0.15);
  color: hsl(var(--primary));
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  margin: 0 2px;
  background-color: hsl(var(--border));
}

.toolbar_confirm-btn {
  width: 100%;
  padding: 4px 0;
  border: none;
  border-radius: 4px;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  cursor: pointer;
}
</style>
