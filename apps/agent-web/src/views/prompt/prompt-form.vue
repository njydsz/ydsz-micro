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
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYdModal } from '@ydsz/common-ui';
import { YdForm, YdFormItem, YdInput, YdSelectItem, YdSelect, YdSwitch, YdBadge } from '@ydsz-core/ydsz-ui';
import { YdButtonBase } from '@ydsz-core/ydsz-ui';
import { createLogger } from '@ydsz/utils';
import { computed, reactive, watch } from 'vue';

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
  success: [];
}>();

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (isOpen && props.record) {
      Object.assign(formData, props.record);
    }
  },
});

/** 是否为编辑模式 */
const isEditMode = computed(() => !!props.record?.id);

/** 表单数据 */
const formData = reactive({
  id: '',
  templateCode: '',
  templateName: '',
  category: '',
  content: '',
  variables: [] as string[],
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
  const matches = formData.content.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
});

watch(extractedVariables, (val) => {
  formData.variables = val;
});

/** 提交表单 */
async function handleSubmit(): Promise<void> {
  if (!formData.templateCode.trim()) {
    showToast.warning('请输入模板编码');
    return;
  }
  if (!formData.templateName.trim()) {
    showToast.warning('请输入模板名称');
    return;
  }
  if (!formData.content.trim()) {
    showToast.warning('请输入模板内容');
    return;
  }
  try {
    // TODO: 调用后端 API 保存
    showToast.success(isEditMode.value ? '更新成功' : '创建成功');
    emit('success');
    modalApi.close();
  } catch (error) {
    logger.warn('保存 Prompt 模板失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

watch(
  () => props.record,
  (val) => {
    if (val) {
      Object.assign(formData, val);
    } else {
      formData.id = '';
      formData.templateCode = '';
      formData.templateName = '';
      formData.category = '';
      formData.content = '';
      formData.variables = [];
      formData.enabled = true;
      formData.description = '';
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
      <YdButtonBase variant="outline" @click="modalApi.close()">取消</YdButtonBase>
      <YdButtonBase @click="handleSubmit">保存</YdButtonBase>
    </template>
  </Modal>
</template>
