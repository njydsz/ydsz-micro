<!--
 * YdAiBuilder — AI 页面骨架生成器组件。
 *
 * <p>从自然语言描述自动生成页面骨架（字段列表），支持增量编辑。
 * 整合意图解析、关键词匹配、表单 Schema 输出三大能力。
 *
 * <p>典型使用场景：
 * <ol>
 *   <li>用户在输入框描述业务需求</li>
 *   <li>点击"生成"自动推断字段列表</li>
 *   <li>用户微调字段属性后确认，输出 YdFormSchema</li>
 *   <li>将 Schema 传给 YdForm 渲染完整表单</li>
 * </ol>
 *
 * @usage
 * ```vue
 * <YdAiBuilder
 *   :initial-description="defaultText"
 *   @generated="handleGenerated"
 *   @submit="handleFormSchema"
 * />
 * ```
 *
 * @path comm\@core\ui-kit\ai-builder\src\components\YdAiBuilder.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts">
/**
 * 事件：生成完成。
 *
 * @property page — 生成的页面骨架
 */
export interface YdAiGeneratedEvent {
  page: import('../types').GeneratedPage;
}

/**
 * 事件：提交表单 Schema。
 *
 * @property schema — 可调入 YdForm 的完整 Schema
 * @property page — 原始页面骨架
 */
export interface YdAiSubmitEvent {
  schema: import('../types').FieldSuggestion[];
  page: import('../types').GeneratedPage;
}

/**
 * Props 定义。
 */
export interface YdAiBuilderProps {
  /** 初始描述文字 */
  initialDescription?: string;
  /** 页面类型预设 */
  pageType?: import('../types').PageIntent['pageType'];
  /** 生成按钮文字 */
  generateButtonText?: string;
  /** 是否显示字段编辑区 */
  isFieldEditable?: boolean;
  /** 最大允许字段数 */
  maxFields?: number;
}
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import type { FieldSuggestion } from '../types';

import { useAiBuilder } from '../composables/use-ai-builder';
import { generateFormSchema } from '../form-schema-adapter';
import { YdAiBuilderToolbar } from './YdAiBuilderToolbar.vue';
import { YdAiFieldList } from './YdAiFieldList.vue';

const props = withDefaults(defineProps<YdAiBuilderProps>(), {
  initialDescription: '',
  generateButtonText: '生成页面',
  isFieldEditable: true,
  maxFields: 32,
});

const emit = defineEmits<{
  generated: [event: YdAiGeneratedEvent];
  submit: [event: YdAiSubmitEvent];
  error: [message: string];
}>();

const {
  description,
  isGenerating,
  fields,
  confidence,
  hasGenerated,
  generate,
  addField,
  removeField,
  updateField,
  moveFieldUp,
  moveFieldDown,
  reset,
} = useAiBuilder({
  initialDescription: props.initialDescription,
  generationOptions: {
    enableDictMatch: true,
    enableValidation: true,
    enableSchemaAlignment: false,
    maxFields: props.maxFields,
    locale: 'zh-CN',
  },
  onGenerated(page) {
    emit('generated', { page });
  },
});

/** 描述是否为空 */
const isDescriptionEmpty = computed<boolean>(() => !description.value.trim());

/** 字段数量 */
const fieldCount = computed<number>(() => fields.value.length);

/**
 * 执行生成。
 */
async function handleGenerate(): Promise<void> {
  const page = await generate();
  if (!page && description.value.trim()) {
    emit('error', '生成失败，请检查描述内容');
  }
}

/**
 * 处理提交。
 */
function handleSubmit(): void {
  if (!hasGenerated.value) {
    return;
  }
  const activeFields = [...fields.value].sort((a, b) => a.sort - b.sort);
  emit('submit', {
    schema: activeFields,
    page: {
      title: '',
      description: description.value,
      apiPath: '',
      fields: activeFields,
      pageType: props.pageType ?? 'form',
      confidence: confidence.value,
      suggestions: [],
      rawInput: description.value,
    },
  });
}

/**
 * 处理重置。
 */
function handleReset(): void {
  reset();
}
</script>

<template>
  <div class="yai-builder flex flex-col gap-4 rounded-lg border bg-card p-4">
    <!-- 输入区 -->
    <YdAiBuilderToolbar
      v-model:description="description"
      :is-generating="isGenerating"
      :is-description-empty="isDescriptionEmpty"
      :generate-button-text="generateButtonText"
      :page-type="pageType"
      @generate="handleGenerate"
      @reset="handleReset"
    />

    <!-- 结果区 -->
    <YdAiFieldList
      v-if="hasGenerated"
      :fields="fields"
      :is-editable="isFieldEditable"
      :confidence="confidence"
      :field-count="fieldCount"
      @add-field="addField"
      @remove-field="removeField"
      @update-field="updateField"
      @move-up="moveFieldUp"
      @move-down="moveFieldDown"
      @submit="handleSubmit"
    />
  </div>
</template>
