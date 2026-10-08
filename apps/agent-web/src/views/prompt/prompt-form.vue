<!--
 * Prompt 模板表单组件
 *
 * <p>用于新增和编辑 Prompt 模板，支持变量提取、内容编辑。
 *
 * @path apps/agent-web/src/views/prompt/prompt-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Prompt 模板表单
 * <p>支持 {{variable}} 语法的变量定义与自动提取。
 * <p>提交时将表单数据通过 emit('success') 通知父级写入本地列表
 *    （后端 CRUD 端点就绪后可在父级 handleFormSuccess 中替换为真实 API 调用）。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem, YdInput, YdSelectItem, YdSelect, YdSwitch, YdBadge, YdButton } from '@ydsz-core/ydsz-ui';
import { createLogger } from '@ydsz/utils';
import { computed, reactive, ref, watch } from 'vue';

const logger = createLogger('agent-prompt');

defineOptions({ name: 'PromptForm' });

/** 提示词模板表单数据形状 */
interface PromptFormData {
  id?: string;
  templateCode?: string;
  templateName?: string;
  category?: string;
  content?: string;
  variables?: string[];
  enabled?: boolean;
  description?: string;
}

interface Props {
  record?: PromptFormData | null;
}

const props = withDefaults(defineProps<Props>(), {
  record: null,
});

const emit = defineEmits<{
  success: [data: PromptFormData];
}>();

/** 提交中状态 */
const submitting = ref(false);

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    // 尝试从 modalApi 获取父级传入的记录数据
    const data = modalApi.getData<{ record?: PromptFormData }>();
    const record = data?.record;
    if (record) {
      Object.assign(formData, record);
    } else {
      resetForm();
    }
  },
});

/** 是否为编辑模式 */
const isEditMode = computed(() => !!formData.id);

/** 表单数据 */
const formData = reactive<PromptFormData>({
  id: undefined,
  templateCode: '',
  templateName: '',
  category: '',
  content: '',
  variables: [],
  enabled: true,
  description: '',
});

/** 分类选项 */
const categoryOptions = [
  { label: '客服', value: '客服' },
  { label: '销售', value: '销售' },
  { label: '开发', value: '开发' },
  { label: '运营', value: '运营' },
  { label: '通用', value: '通用' },
];

/** 从内容中提取的变量列表 */
const extractedVariables = computed<string[]>(() => {
  if (!formData.content) return [];
  const matches = formData.content.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
});

watch(extractedVariables, (val) => {
  formData.variables = val;
});

/** 重置表单至初始状态 */
function resetForm(): void {
  formData.id = undefined;
  formData.templateCode = '';
  formData.templateName = '';
  formData.category = '';
  formData.content = '';
  formData.variables = [];
  formData.enabled = true;
  formData.description = '';
}

/** 提交表单 */
async function handleSubmit(): Promise<void> {
  if (!formData.templateCode?.trim()) {
    showToast.warning('请输入模板编码');
    return;
  }
  if (!formData.templateName?.trim()) {
    showToast.warning('请输入模板名称');
    return;
  }
  if (!formData.content?.trim()) {
    showToast.warning('请输入模板内容');
    return;
  }
  submitting.value = true;
  try {
    // 将表单数据提交给父级，由父级统一管理列表状态
    // 后端 CRUD 端点就绪后，可在此处调用 create / update API 后再 emit
    emit('success', { ...formData });
    modalApi.close();
  } catch (error) {
    logger.warn('保存 Prompt 模板失败: {}', error);
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.record,
  (val) => {
    if (val) {
      Object.assign(formData, val);
    } else {
      resetForm();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Modal :title="isEditMode ? '编辑 Prompt 模板' : '新增 Prompt 模板'" width="700px">
    <YdForm label-width="100px" class="mt-3">
      <div class="grid grid-cols-2 gap-x-4">
        <YdFormItem label="模板编码" required>
          <YdInput v-model="formData.templateCode" placeholder="唯一标识" :disabled="isEditMode" />
        </YdFormItem>
        <YdFormItem label="模板名称" required>
          <YdInput v-model="formData.templateName" placeholder="请输入名称" />
        </YdFormItem>
        <YdFormItem label="分类">
          <YdSelect v-model="formData.category" placeholder="请选择分类" class="w-full">
            <YdSelectItem
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </YdSelect>
        </YdFormItem>
        <YdFormItem label="启用">
          <YdSwitch v-model="formData.enabled" />
        </YdFormItem>
      </div>

      <YdFormItem label="模板描述">
        <YdInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入模板描述" />
      </YdFormItem>

      <YdFormItem label="模板内容" required>
        <div class="w-full">
          <YdInput
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder='使用 {{variable}} 语法声明变量，例如：你是一个客服人员。用户问题：{{question}}'
          />
          <p class="mt-1 text-xs text-gray-400">支持 {'{{'}variable{'}}'} 变量语法</p>
        </div>
      </YdFormItem>

      <YdFormItem label="识别变量">
        <div class="flex flex-wrap gap-2">
          <YdBadge v-for="v in extractedVariables" :key="v" type="info">{{ v }}</YdBadge>
          <span v-if="extractedVariables.length === 0" class="text-xs text-gray-400">暂未识别到变量</span>
        </div>
      </YdFormItem>
    </YdForm>

    <template #footer>
      <YdButton variant="outline" @click="modalApi.close()">取消</YdButton>
      <YdButton :disabled="submitting" @click="handleSubmit">保存</YdButton>
    </template>
  </Modal>
</template>
