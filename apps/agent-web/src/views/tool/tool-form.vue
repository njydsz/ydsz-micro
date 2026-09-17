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
import { YdForm, YdFormItem, YdInput, YdNumberFieldInput, YdSelectItem, YdSelect, YdSwitch, YdButtonBase, YdTabs, YdTabsContent, YdTabsList, YdTabsTrigger } from '@ydsz-core/ydsz-ui';
import { createLogger } from '@ydsz/utils';
import { computed, reactive, ref, watch } from 'vue';

const logger = createLogger('agent-tool');

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
  { label: 'HTTP 接口', value: 'HTTP' },
  { label: '函数', value: 'FUNCTION' },
  { label: '数据库', value: 'DATABASE' },
  { label: '代码执行', value: 'CODE' },
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
    showToast.warning('请输入工具编码');
    return;
  }
  if (!formData.toolName.trim()) {
    showToast.warning('请输入工具名称');
    return;
  }
  if (!formData.endpoint.trim()) {
    showToast.warning('请输入端点地址');
    return;
  }

  try {
    // TODO: 调用后端 API 保存
    showToast.success(isEditMode.value ? '更新成功' : '创建成功');
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
  <Modal :title="isEditMode ? '编辑工具' : '新增工具'" width="700px">
    <YdTabs v-model="activeTab">
      <YdTabsList>
        <YdTabsTrigger value="basic">基本信息</YdTabsTrigger>
        <YdTabsTrigger value="params">参数配置</YdTabsTrigger>
      </YdTabsList>
      <!-- 基本信息 -->
      <YdTabsContent value="basic">
        <YdForm ref="formRef" label-width="100px" class="mt-3">
          <YdFormItem label="工具编码" required>
            <YdInput
              v-model="formData.toolCode"
              placeholder="请输入工具编码（唯一标识）"
              :disabled="isEditMode"
            />
          </YdFormItem>
          <YdFormItem label="工具名称" required>
            <YdInput v-model="formData.toolName" placeholder="请输入工具名称" />
          </YdFormItem>
          <YdFormItem label="工具类型" required>
            <YdSelect v-model="formData.toolType" placeholder="请选择工具类型" class="w-full">
              <YdSelectItem
                v-for="opt in toolTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </YdSelect>
          </YdFormItem>
          <YdFormItem label="描述">
            <YdInput v-model="formData.description" type="textarea" :rows="3" placeholder="请输入工具描述" />
          </YdFormItem>
          <YdFormItem label="端点地址" required>
            <YdInput v-model="formData.endpoint" placeholder="请输入端点地址（URL 或连接字符串）" />
          </YdFormItem>
          <YdFormItem v-if="formData.toolType === 'HTTP'" label="请求方法">
            <YdSelect v-model="formData.method" placeholder="请选择" class="w-full">
              <YdSelectItem
                v-for="opt in httpMethodOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </YdSelect>
          </YdFormItem>
          <YdFormItem label="超时时间">
            <YdNumberFieldInput v-model="formData.timeout" :min="1000" :max="120000" :step="1000" class="w-full" />
            <span class="ml-2 text-xs text-gray-500">毫秒</span>
          </YdFormItem>
          <YdFormItem label="重试次数">
            <YdNumberFieldInput v-model="formData.retryCount" :min="0" :max="5" class="w-full" />
          </YdFormItem>
          <YdFormItem label="启用">
            <YdSwitch v-model="formData.enabled" />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>

      <!-- 参数配置 -->
      <YdTabsContent value="params">
        <YdForm label-width="100px" class="mt-3">
          <YdFormItem label="输入 Schema">
            <YdInput
              v-model="formData.inputSchema"
              type="textarea"
              :rows="10"
              placeholder="请输入 JSON Schema 定义输入参数"
            />
          </YdFormItem>
          <YdFormItem label="输出 Schema">
            <YdInput
              v-model="formData.outputSchema"
              type="textarea"
              :rows="10"
              placeholder="请输入 JSON Schema 定义输出参数"
            />
          </YdFormItem>
          <YdFormItem v-if="formData.toolType === 'HTTP'" label="请求头">
            <YdInput
              v-model="formData.headers"
              type="textarea"
              :rows="5"
              placeholder="请输入请求头（JSON 格式）"
            />
          </YdFormItem>
        </YdForm>
      </YdTabsContent>
    </YdTabs>

    <template #footer>
      <YdButtonBase variant="outline" @click="modalApi.close()">取消</YdButtonBase>
      <YdButtonBase @click="handleSubmit">保存</YdButtonBase>
    </template>
  </Modal>
</template>
