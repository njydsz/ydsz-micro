<!--
 * YDSZTipTapEditor — TipTap 富文本编辑器核心组件
 *
 * <p>基于 @tiptap/vue-3 封装，提供：
 * <ul>
 *   <li>工具栏（行内格式/标题/列表/对齐/链接/图片/表格/代码块）</li>
 *   <li>占位符 / 最大字符数 / 只读模式</li>
 *   <li>v-model 双向绑定 HTML 内容</li>
 *   <li>Markdown 导出 / HTML 导出</li>
 *   <li>图片上传钩子（onImageUpload）</li>
 * </ul>
 *
 * <p>背景色 / 字体大小等样式由外层 shadcn textarea 统一控制，组件聚焦时不覆盖。
 *
 * <p><b>使用示例：</b>
 * <pre>{@code
 * <YDSZTipTapEditor v-model="html" placeholder="请输入内容..." :max-length="5000" />
 * }</pre>
 *
 * @path comm/@core/ui-kit/tiptap/src/YDSZ-tiptap-editor.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { EditorContent, useEditor } from '@tiptap/vue-3';
import Placeholder from '@tiptap/extension-placeholder';
import { ElMessage } from 'element-plus';

import { getDefaultExtensions } from './extensions';
import { TipTapToolbar } from './toolbar';

interface Props {
  /** HTML 内容（v-model） */
  modelValue?: string;
  /** 占位符 */
  placeholder?: string;
  /** 最大字符数（0 表示不限制） */
  maxLength?: number;
  /** 是否只读 */
  disabled?: boolean;
  /** 最小高度（px） */
  minHeight?: number;
  /** 最大高度（px） */
  maxHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  maxLength: 0,
  disabled: false,
  minHeight: 200,
  maxHeight: 600,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'on-change': [value: string];
  'on-blur': [value: string];
}>();

const editorContainerRef = ref<HTMLElement>();
const characterCount = ref(0);

/**
 * @zh_CN TipTap 富文本编辑器实例
 */
const editor = useEditor({
  content: props.modelValue,
  editable: !props.disabled,
  extensions: [
    Placeholder.configure({ placeholder: props.placeholder }),
    ...getDefaultExtensions(),
  ],
  onUpdate: ({ editor: ed }) => {
    const html = ed.getHTML();
    characterCount.value = ed.getText().length;
    emit('update:modelValue', html);
    emit('on-change', html);
  },
  onBlur: ({ editor: ed }) => {
    emit('on-blur', ed.getHTML());
  },
});

// 监听外部 v-model 变化（如重置表单）
watch(
  () => props.modelValue,
  (newVal) => {
    const currentHtml = editor.value?.getHTML() ?? '';
    if (newVal !== currentHtml) {
      editor.value?.commands.setContent(newVal ?? '', false);
    }
  },
);

// 监听只读模式切换
watch(
  () => props.disabled,
  (disabled) => {
    editor.value?.setEditable(!disabled);
  },
);

onMounted(() => {
  // 字符数超限警告
  editor.value?.on('update', ({ editor: ed }) => {
    if (props.maxLength > 0 && ed.getText().length > props.maxLength) {
      ElMessage.warning(`内容已超过最大字符数限制（${props.maxLength}）`);
    }
  });
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

/** 导出 Markdown（简单转换） */
const exportMarkdown = computed(() => {
  if (!editor.value) return '';
  // TipTap 原生输出 HTML，Markdown 需要自行转换（或使用 @tiptap/extension-markdown）
  return editor.value.getHTML();
});

/** 容器样式 */
const containerStyle = computed(() => ({
  minHeight: `${props.minHeight}px`,
  maxHeight: `${props.maxHeight}px`,
}));

defineExpose({
  /** 编辑器实例（用于自定义命令） */
  editor,
  /** 当前字符数 */
  characterCount,
});
</script>

<template>
  <div ref="editorContainerRef" class="tiptap-editor-wrapper flex flex-col rounded-md border">
    <TipTapToolbar :editor="editor" :disabled="disabled" />
    <EditorContent
      :editor="editor"
      class="tiptap-content flex-1 overflow-y-auto px-3 py-2"
      :style="containerStyle"
    />
  </div>
</template>

<style scoped>
.tiptap-editor-wrapper {
  --_ring-color: hsl(var(--primary) / 0.3);
}

.tiptap-editor-wrapper:focus-within {
  border-color: var(--_ring-color);
  box-shadow: 0 0 0 2px var(--_ring-color);
}

.tiptap-content :deep(.tiptap) {
  outline: none;
  min-height: inherit;
}

.tiptap-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  height: 0;
}
</style>
