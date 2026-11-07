<!--
 * 工具表单组件
 *
 * <p>用于新增和编辑 Agent 工具，支持配置工具类型、端点、参数等。
 *
 * @path apps/agent-web/src/views/tool/tool-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 工具表单
 * <p>支持 HTTP、函数、数据库、代码等类型的工具配置。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import {
  YdForm,
  YdFormItem,
  YdInput,
  YdNumberFieldInput,
  YdSelectItem,
  YdSelect,
  YdSwitch,
  YdButton,
  YdTabs,
  YdTabsContent,
  YdTabsList,
  YdTabsTrigger,
} from '@ydsz-core/ydsz-ui';
import { createLogger } from '@ydsz/utils';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { showToast } from '@ydsz/notification';

const logger = createLogger('agent-tool');

const { t } = useI18n();

defineOptions({ name: 'ToolForm' });

/** 工具表单数据形状 */
interface ToolFormData {
  id?: string;
  toolCode?: string;
  toolName?: string;
  toolType?: string;
  description?: string;
  endpoint?: string;
  method?: string;
  headers?: string;
  timeout?: number;
  retryCount?: number;
  enabled?: boolean;
  inputSchema?: string;
  outputSchema?: string;
}

interface Props {
  record?: ToolFormData | null;
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

/** 表单引用 */
const formRef = ref();

/** 是否为编辑模式 */
const isEditMode = computed(() => !!props.record?.id);

/** 当前激活的标签页 */
const activeTab = ref('basic');

/** 表单数据 */
const formData = reactive({
  id: '',
  toolCode: '',
  toolName: '',
  toolType: 'HTTP',
  description: '',
  endpoint: '',
  method: 'GET',
  headers: '',
  timeout: 5000,
  retryCount: 0,
  enabled: true,
  inputSchema: '',
  outputSchema: '',
});

/** 工具类型选项 */
const toolTypeOptions = [
  { label: t('toolForm.typeHttp'), value: 'HTTP' },
  { label: t('toolForm.typeFunction'), value: 'FUNCTION' },
  { label: t('toolForm.typeDatabase'), value: 'DATABASE' },
  { label: t('toolForm.typeCode'), value: 'CODE' },
];

/** HTTP 方法选项 */
const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
];

/** 提交表单 */
async function handleSubmit(): Promise<void> {
  if (!formData.toolCode.trim()) {
    showToast.warning(t('toolForm.toolCodeRequired'));
    return;
  }
  if (!formData.toolName.trim()) {
    showToast.warning(t('toolForm.toolNameRequired'));
    return;
  }
  if (!formData.endpoint.trim()) {
    showToast.warning(t('toolForm.endpointRequired'));
    return;
  }

  try {
    // TODO: 调用后端 API 保存
    showToast.success(isEditMode.value ? t('toolForm.updateSuccess') : t('toolForm.createSuccess'));
    emit('success');
    modalApi.close();
  } catch (error) {
    logger.warn('保存工具失败: {}', error);
    // 用户提示由 errorMessageResponseInterceptor 统一处理
  }
}

watch(
  () => props.record,
  (val) => {
    if (val) {
      Object.assign(formData, val);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Modal
    :title="isEditMode ? t('toolForm.editTitle') : t('toolForm.createTitle')"
    width="700px"
  >
    <YdTabs v-model="activeTab">
      <YdTabsList>
        <YdTabsTrigger value="basic">{{ t('toolForm.tabBasic') }}</YdTabsTrigger>
        <YdTabsTrigger value="params">{{ t('toolForm.tabParams') }}</YdTabsTrigger>
      </YdTabsList>
      <!-- 基本信息 -->
      <YdTabsContent value="basic">
        <YdForm ref="formRef" label-width="100px" class="mt-3">
          <YdFormItem :label="t('toolForm.toolCode')" required>
            <YdInput
              v-model="formData.toolCode"
              :placeholder="t('toolForm.toolCodePlaceholder')"
              :disabled="isEditMode"
            />
          </YdFormItem>
          <YdFormItem :label="t('toolForm.toolName')" required>
            <YdInput v-model="formData.toolName" :placeholder="t('toolForm.toolNamePlaceholder')" />
          </YdFormItem>
          <YdFormItem :label="t('toolForm.toolType')" required>
            <YdSelect
              v-model="formData.toolType"
              :placeholder="t('toolForm.toolTypePlaceholder')"
              class="w-full"
            >
              <YdSelectItem
                v-for="opt in toolTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </YdSelect>
          </YdFormItem>
          <YdFormItem :label="t('toolForm.description')">
            <YdInput
              v-model="formData.description"
              type="textarea"
              :rows="3"
              :placeholder="t('toolForm.descriptionPlaceholder')"
            />
          </YdFormItem>
          <YdFormItem :label="t('toolForm.endpoint')" required>
            <YdInput
              v-model="formData.endpoint"
              :placeholder="t('toolForm.endpointPlaceholder')"
            />
          </YdFormItem>
          <YdFormItem v-if="formData.toolType === 'HTTP'" :label="t('toolForm.method')">
            <YdSelect
              v-model="formData.method"
              :placeholder="t('toolForm.methodPlaceholder')"
              class="w-full"
            >
              <YdSelectItem
                v-for="opt in httpMethodOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </YdSelect>
          </YdFormItem>
          <YdFormItem :label="t('toolForm.timeout')">
            <YdNumberFieldInput
              v-model="formData.timeout"
              :min="1000"
              :max="120000"
              :step="1000"
              class="w-full"
            />
            <span class="ml-2 text-xs text-gray-500">{{ t('toolForm.timeoutUnit') }}</span>
          </YdFormItem>
          <YdFormItem :label="t('toolForm.retryCount')">
            <YdNumberFieldInput v-model="formData.retryCount" :min="0" :max="5" class="w-full" />
          </YdFormItem>
          <YdFormItem :label="t('toolForm.enabled')">
            <YdSwitch v-model="formData.enabled" />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>

      <!-- 参数配置 -->
      <YdTabsContent value="params">
        <YdForm label-width="100px" class="mt-3">
          <YdFormItem :label="t('toolForm.inputSchema')">
            <YdInput
              v-model="formData.inputSchema"
              type="textarea"
              :rows="10"
              :placeholder="t('toolForm.inputSchemaPlaceholder')"
            />
          </YdFormItem>
          <YdFormItem :label="t('toolForm.outputSchema')">
            <YdInput
              v-model="formData.outputSchema"
              type="textarea"
              :rows="10"
              :placeholder="t('toolForm.outputSchemaPlaceholder')"
            />
          </YdFormItem>
          <YdFormItem v-if="formData.toolType === 'HTTP'" :label="t('toolForm.headers')">
            <YdInput
              v-model="formData.headers"
              type="textarea"
              :rows="5"
              :placeholder="t('toolForm.headersPlaceholder')"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
    </YdTabs>

    <template #footer>
      <YdButton variant="outline" @click="modalApi.close()">
        {{ t('toolForm.cancel') }}
      </YdButton>
      <YdButton @click="handleSubmit">{{ t('toolForm.save') }}</YdButton>
    </template>
  </Modal>
</template>
