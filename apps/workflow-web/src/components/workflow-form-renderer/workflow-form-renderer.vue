<!--
 * 工作流表单渲染器
 *
 * <p>将表单设计器生成的 JSON Schema 转为 YDSZForm Schema 并动态渲染。
 * 整合链路：form-designer 保存 schema → 节点绑定 schema → 任务运行时本组件渲染表单 → 提交时输出 form data。
 *
 * <p>符合云顶编码规范 §8、§14。
 *
 * @path apps/workflow-web/src/components/workflow-form-renderer/workflow-form-renderer.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 工作流动态表单渲染器
 * <p>将后端 FlowDesignerController 返回的 formConfig（JSON Schema 格式）转换为 YDSZForm Schema 渲染。
 * 支持的字段类型映射：
 * <ul>
 *   <li>string → Input / Textarea（根据 format 或 maxLength 判断）</li>
 *   <li>number / integer → InputNumber</li>
 *   <li>boolean → Switch</li>
 *   <li>enum → Select</li>
 *   <li>date / datetime → DatePicker</li>
 * </ul>
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { computed, ref, watch } from 'vue';

import { ElEmpty, ElInput, ElInputNumber, ElOption, ElSelect, ElSwitch } from 'element-plus';

import type { YDSZFormSchema } from '@ydsz/common-ui';

import type { JsonSchema, JsonSchemaProperty } from './types';

interface Props {
  /** 表单设计器输出的 JSON Schema 对象 */
  schema?: JsonSchema;
  /** 表单初始值（编辑时回填） */
  formData?: Record<string, unknown>;
  /** 是否只读 */
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  schema: undefined,
  formData: () => ({}),
  disabled: false,
});

const emit = defineEmits<{
  'update:formData': [value: Record<string, unknown>];
}>();

/** 表单数据 */
const formModel = ref<Record<string, unknown>>({ ...props.formData });

// 外部 formData 变化时同步
watch(
  () => props.formData,
  (val) => {
    formModel.value = { ...val };
  },
  { deep: true },
);

/**
 * 将 JSON Schema 属性映射为 YDSZForm Schema 字段
 *
 * <p>根据属性的 type / format / enum 自动选择组件类型。
 */
const formSchema = computed<YDSZFormSchema | undefined>(() => {
  if (!props.schema?.properties) return undefined;

  const fields: YDSZFormSchema = [];
  for (const [fieldName, prop] of Object.entries(props.schema.properties)) {
    const isRequired = props.schema.required?.includes(fieldName) ?? false;
    const componentType = mapToComponentType(prop);

    fields.push({
      component: componentType,
      fieldName,
      label: prop.title || prop.description || fieldName,
      required: isRequired,
      ...(componentType === 'Select' && prop.enum
        ? {
            componentProps: {
              options: prop.enum.map((v: string) => ({ label: v, value: v })),
            },
          }
        : {}),
      ...(componentType === 'Input' && prop.maxLength
        ? { componentProps: { showWordLimit: true, maxlength: prop.maxLength } }
        : {}),
      ...(componentType === 'InputNumber' && prop.minimum !== undefined
        ? { componentProps: { min: prop.minimum } }
        : {}),
      ...(componentType === 'InputNumber' && prop.maximum !== undefined
        ? { componentProps: { max: prop.maximum } }
        : {}),
    });
  }
  return fields;
});

/**
 * JSON Schema 属性 → YDSZForm 组件类型映射
 */
function mapToComponentType(prop: JsonSchemaProperty): string {
  if (prop.enum && prop.enum.length > 0) return 'Select';
  switch (prop.type) {
    case 'number':
    case 'integer':
      return 'InputNumber';
    case 'boolean':
      return 'Switch';
    case 'string':
      if (prop.format === 'date' || prop.format === 'date-time') return 'DatePicker';
      if (prop.format === 'textarea' || (prop.maxLength && prop.maxLength > 256)) {
        return 'Input'; // renderProps.type = 'textarea' 由调用方配置
      }
      return 'Input';
    default:
      return 'Input';
  }
}
</script>

<template>
  <div v-if="formSchema" class="workflow-form-renderer space-y-4">
    <div
      v-if="schema?.ui?.title"
      class="form-title text-foreground mb-2 text-base font-medium"
    >
      {{ schema.ui.title }}
    </div>
    <div
      v-for="field in formSchema"
      :key="field.fieldName"
      class="form-field"
    >
      <label class="text-foreground mb-1 block text-sm font-medium">
        <span v-if="field.required" class="text-destructive mr-1">*</span>
        {{ field.label }}
      </label>

      <!-- 根据组件类型动态渲染 -->
      <div class="field-content">
        <!-- Select -->
        <el-select
          v-if="field.component === 'Select'"
          v-model="formModel[field.fieldName]"
          :placeholder="`请选择${field.label}`"
          :disabled="disabled"
          class="w-full"
          @change="emit('update:formData', formModel)"
        >
          <el-option
            v-for="opt in (field.componentProps?.options as any[])"
            :key="(opt as any).value"
            :label="(opt as any).label as string"
            :value="(opt as any).value as string"
          />
        </el-select>

        <!-- Number -->
        <el-input-number
          v-else-if="field.component === 'InputNumber'"
          v-model="formModel[field.fieldName] as any"
          :disabled="disabled"
          class="w-full"
          @change="emit('update:formData', formModel)"
        />

        <!-- Boolean / Switch -->
        <el-switch
          v-else-if="field.component === 'Switch'"
          v-model="formModel[field.fieldName] as boolean"
          :disabled="disabled"
          @change="emit('update:formData', formModel)"
        />

        <!-- Textarea (长文本) -->
        <el-input
          v-else-if="field.component === 'Input' && schema?.properties[field.fieldName]?.maxLength && (schema.properties[field.fieldName].maxLength ?? 0) > 256"
          v-model="formModel[field.fieldName] as string"
          type="textarea"
          :rows="3"
          :maxlength="schema.properties[field.fieldName].maxLength"
          show-word-limit
          :disabled="disabled"
          :placeholder="`请输入${field.label}`"
          @blur="emit('update:formData', formModel)"
        />

        <!-- Input (默认) -->
        <el-input
          v-else
          v-model="formModel[field.fieldName] as string"
          :maxlength="schema?.properties[field.fieldName]?.maxLength"
          :show-word-limit="!!schema?.properties[field.fieldName]?.maxLength"
          :disabled="disabled"
          :placeholder="`请输入${field.label}`"
          @blur="emit('update:formData', formModel)"
        />
      </div>
    </div>
  </div>

  <!-- 空态 -->
  <el-empty
    v-else
    description="当前节点未配置表单"
    :image-size="80"
  />
</template>

<style scoped>
.workflow-form-renderer {
  padding: 0;
}

.form-title {
  border-bottom: 1px solid hsl(var(--border));
  padding-bottom: 8px;
}

.form-field {
  margin-bottom: 16px;
}

.field-content {
  margin-top: 4px;
}
</style>
