<!--
 * 流程表单设计器
 *
 * <p>提供流程节点的表单可视化设计能力，支持字段拖拽、属性配置、JSON Schema 预览与保存。
 *
 * @path apps/workflow-web/src/views/form-designer/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 流程表单设计器
 * <p>消费后端契约 FlowDesignerController（apps/workflow-web/src/api/flowDesigner.ts）：
 * getFormConfig() 读取节点表单配置（JSON Schema 字符串），saveFormConfig() 保存。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { Page } from '@ydsz/common-ui';
import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSwitch,
  ElTag,
} from 'element-plus';
import { computed, ref } from 'vue';
import { getFormConfig, saveFormConfig } from '#/api/flowDesigner';

defineOptions({ name: 'WorkflowFormDesigner' });

/** 表单字段定义 */
interface FormField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  defaultValue: string;
  options: string[];
}

/** 字段类型定义 */
const FIELD_TYPES = [
  { type: 'input', label: '单行文本', icon: '✏️' },
  { type: 'textarea', label: '多行文本', icon: '📝' },
  { type: 'number', label: '数字', icon: '#' },
  { type: 'select', label: '下拉选择', icon: '▼' },
  { type: 'date', label: '日期', icon: '📅' },
  { type: 'switch', label: '开关', icon: '⭕' },
];

/** 目标流程定义 ID */
const definitionId = ref('');

/** 目标节点编码 */
const nodeCode = ref('');

/** 加载状态 */
const loading = ref(false);

/** 保存状态 */
const saving = ref(false);

/** 已添加的字段列表 */
const fields = ref<FormField[]>([]);

/** 选中的字段 */
const selectedField = ref<FormField | null>(null);

/** Schema 预览 */
const schemaVisible = ref(false);

/** 生成唯一字段键 */
function generateKey(type: string): string {
  return `field_${type}_${Date.now().toString(36)}`;
}

/** 添加字段 */
function addField(type: string): void {
  const meta = FIELD_TYPES.find((t) => t.type === type);
  const field: FormField = {
    key: generateKey(type),
    label: meta?.label ?? type,
    type,
    required: false,
    placeholder: `请输入${meta?.label ?? ''}`,
    defaultValue: '',
    options: type === 'select' ? ['选项一', '选项二'] : [],
  };
  fields.value.push(field);
  selectedField.value = field;
}

/** 删除字段 */
function removeField(field: FormField): void {
  fields.value = fields.value.filter((f) => f !== field);
  if (selectedField.value === field) selectedField.value = null;
}

/** 上移字段 */
function moveUp(index: number): void {
  if (index <= 0) return;
  [fields.value[index - 1], fields.value[index]] = [fields.value[index], fields.value[index - 1]];
}

/** 下移字段 */
function moveDown(index: number): void {
  if (index >= fields.value.length - 1) return;
  [fields.value[index], fields.value[index + 1]] = [fields.value[index + 1], fields.value[index]];
}

/** 校验字段选项字符串 */
const optionsText = computed({
  get: () => (selectedField.value?.options ?? []).join('\n'),
  set: (val: string) => {
    if (selectedField.value) {
      selectedField.value.options = val.split('\n').filter((s) => s.trim() !== '');
    }
  },
});

/** 构建 JSON Schema */
function buildSchema(): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const requiredList: string[] = [];
  fields.value.forEach((field) => {
    properties[field.key] = {
      type: field.type === 'number' ? 'number' : field.type === 'switch' ? 'boolean' : 'string',
      title: field.label,
      ...(field.placeholder ? { description: field.placeholder } : {}),
      ...(field.options.length > 0 ? { enum: field.options } : {}),
    };
    if (field.required) requiredList.push(field.key);
  });
  return {
    type: 'object',
    properties,
    required: requiredList,
    ui: { title: `节点表单：${nodeCode.value}` },
  };
}

/** Schema 文本预览 */
const schemaText = computed(() => JSON.stringify(buildSchema(), null, 2));

/** 加载已有表单配置 */
async function loadFormConfig(): Promise<void> {
  if (!definitionId.value.trim() || !nodeCode.value.trim()) {
    ElMessage.warning('请输入流程定义 ID 与节点编码');
    return;
  }
  loading.value = true;
  try {
    const raw = await getFormConfig({ id: definitionId.value, nodeCode: nodeCode.value });
    if (!raw) {
      fields.value = [];
      ElMessage.info('该节点暂无表单配置，可从左侧开始设计');
      return;
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as unknown);
    const props = ((parsed as Record<string, unknown>)?.properties ?? {}) as Record<string, Record<string, unknown>>;
    const requiredList = ((parsed as Record<string, unknown>)?.required ?? []) as string[];
    fields.value = Object.entries(props).map(([key, prop]) => ({
      key,
      label: String(prop.title ?? key),
      type: prop.enum ? 'select' : String(prop.type ?? 'input') === 'number' ? 'number' : String(prop.type ?? 'input'),
      required: requiredList.includes(key),
      placeholder: String(prop.description ?? ''),
      defaultValue: '',
      options: prop.enum ? (prop.enum as unknown[]).map(String) : [],
    }));
    ElMessage.success('已加载节点表单配置');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    loading.value = false;
  }
}

/** 保存表单配置 */
async function handleSave(): Promise<void> {
  if (!definitionId.value.trim() || !nodeCode.value.trim()) {
    ElMessage.warning('请先填写流程定义 ID 与节点编码');
    return;
  }
  saving.value = true;
  try {
    await saveFormConfig(
      { id: definitionId.value, nodeCode: nodeCode.value },
      schemaText.value,
    );
    ElMessage.success('表单配置保存成功');
  } catch {
    // 错误提示由请求拦截器统一处理
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="flex h-full flex-col gap-3 p-4">
      <!-- 顶部工具栏 -->
      <ElCard shadow="never" class="shrink-0">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm text-gray-500">流程定义 ID：</span>
          <ElInput v-model="definitionId" placeholder="如 def_10001" class="w-52" />
          <span class="text-sm text-gray-500">节点编码：</span>
          <ElInput v-model="nodeCode" placeholder="如 node_approve" class="w-40" />
          <ElButton @click="loadFormConfig">加载配置</ElButton>
          <div class="flex-1" />
          <ElButton @click="schemaVisible = true">Schema 预览</ElButton>
          <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
        </div>
      </ElCard>

      <!-- 设计器主体 -->
      <div class="grid min-h-0 flex-1 grid-cols-12 gap-3">
        <!-- 组件面板 -->
        <ElCard shadow="never" class="col-span-2 overflow-auto">
          <p class="mb-2 text-sm font-medium">字段组件</p>
          <div
            v-for="item in FIELD_TYPES"
            :key="item.type"
            class="mb-2 cursor-pointer rounded border p-2 text-center text-xs hover:border-blue-400 hover:bg-blue-50"
            draggable="false"
            @click="addField(item.type)"
          >
            {{ item.icon }} {{ item.label }}
          </div>
        </ElCard>

        <!-- 画布区 -->
        <ElCard shadow="never" class="col-span-6 overflow-auto">
          <p class="mb-2 text-sm font-medium">表单画布（点击添加）</p>
          <div v-if="fields.length === 0" class="pt-16 text-center text-sm text-gray-300">
            从左侧点击或拖拽组件到此区域
          </div>
          <div
            v-for="(field, index) in fields"
            :key="field.key"
            class="mb-2 flex items-center gap-2 rounded border p-2 hover:border-blue-400"
            :class="{ 'border-blue-500 bg-blue-50': selectedField === field }"
            @click="selectedField = field"
          >
            <span class="w-20 shrink-0 text-xs text-gray-400">{{ index + 1 }}.</span>
            <span class="flex-1 truncate text-sm">{{ field.label }}</span>
            <ElTag size="small" type="info">{{ field.type }}</ElTag>
            <ElTag v-if="field.required" size="small" type="danger">必填</ElTag>
            <ElButton size="small" link @click.stop="moveUp(index)">↑</ElButton>
            <ElButton size="small" link @click.stop="moveDown(index)">↓</ElButton>
            <ElButton size="small" link type="danger" @click.stop="removeField(field)">删除</ElButton>
          </div>
        </ElCard>

        <!-- 属性面板 -->
        <ElCard shadow="never" class="col-span-4 overflow-auto">
          <p class="mb-2 text-sm font-medium">字段属性</p>
          <template v-if="selectedField">
            <ElForm label-width="80px" size="small">
              <ElFormItem label="字段标签">
                <ElInput v-model="selectedField.label" />
              </ElFormItem>
              <ElFormItem label="字段Key">
                <ElInput v-model="selectedField.key" disabled />
              </ElFormItem>
              <ElFormItem label="是否必填">
                <ElSwitch v-model="selectedField.required" />
              </ElFormItem>
              <ElFormItem label="占位提示">
                <ElInput v-model="selectedField.placeholder" />
              </ElFormItem>
              <ElFormItem v-if="['input', 'textarea'].includes(selectedField.type)" label="默认值">
                <ElInput v-model="selectedField.defaultValue" />
              </ElFormItem>
              <ElFormItem v-if="selectedField.type === 'select'" label="选项">
                <div class="w-full">
                  <ElInput v-model="optionsText" type="textarea" :rows="4" placeholder="每行一个选项" />
                </div>
              </ElFormItem>
            </ElForm>
          </template>
          <div v-else class="pt-10 text-center text-xs text-gray-400">请选择画布中的字段</div>
        </ElCard>
      </div>
    </div>

    <!-- Schema 预览弹窗 -->
    <ElDialog v-model="schemaVisible" title="JSON Schema 预览" width="600px">
      <pre class="max-h-96 overflow-auto rounded border bg-gray-50 p-3 text-xs">{{ schemaText }}</pre>
      <template #footer>
        <ElButton type="primary" @click="schemaVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
