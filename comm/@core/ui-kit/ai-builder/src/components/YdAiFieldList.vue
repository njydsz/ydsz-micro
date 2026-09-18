<!--
 * YdAiFieldList — AI 生成结果字段列表编辑器。
 *
 * <p>展示 AI 推断的字段清单，支持行内编辑（类型/标签/必填/选项）、拖拽排序和删除。
 *
 * @path comm\@core\ui-kit\ai-builder\src\components\YdAiFieldList.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { FieldSuggestion } from '../types';

const props = withDefaults(defineProps<{
  /** 字段列表 */
  fields: FieldSuggestion[];
  /** 是否可编辑 */
  isEditable?: boolean;
  /** 生成置信度 */
  confidence?: number;
  /** 字段总数 */
  fieldCount?: number;
}>(), {
  isEditable: true,
  confidence: 0,
  fieldCount: 0,
});

const emit = defineEmits<{
  'add-field': [field: FieldSuggestion];
  'remove-field': [fieldName: string];
  'update-field': [fieldName: string, updates: Partial<FieldSuggestion>];
  'move-up': [fieldName: string];
  'move-down': [fieldName: string];
  submit: [];
}>();

const sortedFields = (): FieldSuggestion[] => {
  return [...props.fields].sort((a, b) => a.sort - b.sort);
};

/**
 * 推断字段类型的中文标签。
 */
function fieldTypeLabel(type: string): string {
  const map: Record<string, string> = {
    string: '文本',
    number: '数字',
    boolean: '布尔',
    date: '日期',
    datetime: '时间',
    enum: '枚举',
    text: '长文本',
    email: '邮箱',
    phone: '电话',
    url: '链接',
    money: '金额',
    percent: '百分比',
  };
  return map[type] ?? type;
}

/**
 * 置信度转颜色。
 */
function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) {
    return 'text-green-500';
  }
  if (confidence >= 0.5) {
    return 'text-yellow-500';
  }
  return 'text-muted-foreground';
}

const typeOptions: FieldSuggestion['fieldType'][] = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'enum',
  'text',
  'email',
  'phone',
  'url',
  'money',
  'percent',
];
</script>

<template>
  <div class="yai-fields flex flex-col gap-3">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">
        生成字段
        <span class="text-muted-foreground">({{ fieldCount }})</span>
      </h3>
      <span :class="['text-xs', confidenceColor(confidence)]">
        置信度: {{ (confidence * 100).toFixed(0) }}%
      </span>
    </div>

    <!-- 字段列表 -->
    <div class="flex flex-col gap-1">
      <div
        v-for="field in sortedFields()"
        :key="field.name"
        class="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
      >
        <!-- 排序按钮 -->
        <div class="flex flex-col" aria-label="排序控制">
          <button
            type="button"
            :disabled="!isEditable"
            class="text-muted-foreground disabled:opacity-50"
            aria-label="上移"
            @click="emit('move-up', field.name)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            :disabled="!isEditable"
            class="text-muted-foreground disabled:opacity-50"
            aria-label="下移"
            @click="emit('move-down', field.name)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- 字段名（只读） -->
        <span class="w-28 truncate text-xs font-mono text-muted-foreground">
          {{ field.name }}
        </span>

        <!-- 中文标签 -->
        <input
          v-if="isEditable"
          :value="field.label"
          class="w-24 rounded border border-input bg-background px-2 py-1 text-sm"
          @input="emit('update-field', field.name, { label: ($event.target as HTMLInputElement).value })"
        />
        <span v-else class="w-24 text-sm">{{ field.label }}</span>

        <!-- 类型 -->
        <select
          v-if="isEditable"
          :value="field.fieldType"
          class="w-20 rounded border border-input bg-background px-2 py-1 text-xs"
          @change="emit('update-field', field.name, { fieldType: ($event.target as HTMLSelectElement).value as FieldSuggestion['fieldType'] })"
        >
          <option v-for="opt in typeOptions" :key="opt" :value="opt">
            {{ fieldTypeLabel(opt) }}
          </option>
        </select>
        <span v-else class="w-20 text-xs text-muted-foreground">
          {{ fieldTypeLabel(field.fieldType) }}
        </span>

        <!-- 必填 -->
        <label class="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            :checked="field.isRequired"
            :disabled="!isEditable"
            class="rounded border-input"
            @change="emit('update-field', field.name, { isRequired: ($event.target as HTMLInputElement).checked })"
          />
          必填
        </label>

        <!-- 校验提示 -->
        <input
          v-if="isEditable"
          :value="field.tooltip ?? field.validationHint ?? ''"
          placeholder="校验提示（可选）"
          class="flex-1 rounded border border-input bg-background px-2 py-1 text-xs"
          @input="emit('update-field', field.name, { tooltip: ($event.target as HTMLInputElement).value })"
        />
        <span v-else class="flex-1 truncate text-xs text-muted-foreground">
          {{ field.validationHint ?? '' }}
        </span>

        <!-- 删除 -->
        <button
          v-if="isEditable"
          type="button"
          class="text-destructive hover:text-destructive/80"
          aria-label="删除字段"
          @click="emit('remove-field', field.name)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="flex items-center justify-between border-t pt-3">
      <button
        v-if="isEditable"
        type="button"
        class="text-xs text-primary hover:text-primary/80"
        @click="emit('add-field', {
          name: `field_${Date.now()}`,
          label: '新字段',
          fieldType: 'string',
          isRequired: false,
          sort: 999,
        })"
      >
        + 添加字段
      </button>
      <button
        type="button"
        :disabled="fieldCount === 0"
        class="ml-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        @click="emit('submit')"
      >
        确认生成表单
      </button>
    </div>
  </div>
</template>
