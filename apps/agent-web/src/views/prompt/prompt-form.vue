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
import { useYDSZModal } from '@ydsz/common-ui';
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTag,
} from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

defineOptions({ name: 'PromptForm' });

interface Props {
  record?: Record<string, unknown> | null;
}

const props = withDefaults(defineProps<Props>(), {
  record: null,
});

const emit = defineEmits<{
  success: [];
}>();

const [Modal, modalApi] = useYDSZModal({
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
    ElMessage.warning('请输入模板编码');
    return;
  }
  if (!formData.templateName.trim()) {
    ElMessage.warning('请输入模板名称');
    return;
  }
  if (!formData.content.trim()) {
    ElMessage.warning('请输入模板内容');
    return;
  }
  try {
    // TODO: 调用后端 API 保存
    ElMessage.success(isEditMode.value ? '更新成功' : '创建成功');
    emit('success');
    modalApi.close();
  } catch {
    // 错误提示由请求拦截器统一处理
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
    <ElForm label-width="100px" class="mt-3">
      <div class="grid grid-cols-2 gap-x-4">
        <ElFormItem label="模板编码" required>
          <ElInput v-model="formData.templateCode" placeholder="唯一标识" :disabled="isEditMode" />
        </ElFormItem>
        <ElFormItem label="模板名称" required>
          <ElInput v-model="formData.templateName" placeholder="请输入名称" />
        </ElFormItem>
        <ElFormItem label="分类">
          <ElSelect v-model="formData.category" placeholder="请选择分类" class="w-full">
            <ElOption
              v-for="opt in categoryOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="启用">
          <ElSwitch v-model="formData.enabled" />
        </ElFormItem>
      </div>

      <ElFormItem label="模板描述">
        <ElInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入模板描述" />
      </ElFormItem>

      <ElFormItem label="模板内容" required>
        <div class="w-full">
          <ElInput
            v-model="formData.content"
            type="textarea"
            :rows="10"
            placeholder='使用 {{variable}} 语法声明变量，例如：你是一个客服人员。用户问题：{{question}}'
          />
          <p class="mt-1 text-xs text-gray-400">支持 {'{{'}variable{'}}'} 变量语法</p>
        </div>
      </ElFormItem>

      <ElFormItem label="识别变量">
        <div class="flex flex-wrap gap-2">
          <ElTag v-for="v in extractedVariables" :key="v" type="info">{{ v }}</ElTag>
          <span v-if="extractedVariables.length === 0" class="text-xs text-gray-400">暂未识别到变量</span>
        </div>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="modalApi.close()">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit">保存</ElButton>
    </template>
  </Modal>
</template>
