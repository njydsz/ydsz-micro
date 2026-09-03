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
import { useYDSZModal } from '@ydsz/common-ui';
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTabPane,
  ElTabs,
} from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';

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

const [Modal, modalApi] = useYDSZModal({
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
    ElMessage.warning('请输入工具编码');
    return;
  }
  if (!formData.toolName.trim()) {
    ElMessage.warning('请输入工具名称');
    return;
  }
  if (!formData.endpoint.trim()) {
    ElMessage.warning('请输入端点地址');
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
    }
  },
  { immediate: true },
);
</script>

<template>
  <Modal :title="isEditMode ? '编辑工具' : '新增工具'" width="700px">
    <ElTabs v-model="activeTab">
      <!-- 基本信息 -->
      <ElTabPane label="基本信息" name="basic">
        <ElForm ref="formRef" label-width="100px" class="mt-3">
          <ElFormItem label="工具编码" required>
            <ElInput
              v-model="formData.toolCode"
              placeholder="请输入工具编码（唯一标识）"
              :disabled="isEditMode"
            />
          </ElFormItem>
          <ElFormItem label="工具名称" required>
            <ElInput v-model="formData.toolName" placeholder="请输入工具名称" />
          </ElFormItem>
          <ElFormItem label="工具类型" required>
            <ElSelect v-model="formData.toolType" placeholder="请选择工具类型" class="w-full">
              <ElOption
                v-for="opt in toolTypeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="描述">
            <ElInput v-model="formData.description" type="textarea" :rows="3" placeholder="请输入工具描述" />
          </ElFormItem>
          <ElFormItem label="端点地址" required>
            <ElInput v-model="formData.endpoint" placeholder="请输入端点地址（URL 或连接字符串）" />
          </ElFormItem>
          <ElFormItem v-if="formData.toolType === 'HTTP'" label="请求方法">
            <ElSelect v-model="formData.method" placeholder="请选择" class="w-full">
              <ElOption
                v-for="opt in httpMethodOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="超时时间">
            <ElInputNumber v-model="formData.timeout" :min="1000" :max="120000" :step="1000" class="w-full" />
            <span class="ml-2 text-xs text-gray-500">毫秒</span>
          </ElFormItem>
          <ElFormItem label="重试次数">
            <ElInputNumber v-model="formData.retryCount" :min="0" :max="5" class="w-full" />
          </ElFormItem>
          <ElFormItem label="启用">
            <ElSwitch v-model="formData.enabled" />
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <!-- 参数配置 -->
      <ElTabPane label="参数配置" name="params">
        <ElForm label-width="100px" class="mt-3">
          <ElFormItem label="输入 Schema">
            <ElInput
              v-model="formData.inputSchema"
              type="textarea"
              :rows="10"
              placeholder="请输入 JSON Schema 定义输入参数"
            />
          </ElFormItem>
          <ElFormItem label="输出 Schema">
            <ElInput
              v-model="formData.outputSchema"
              type="textarea"
              :rows="10"
              placeholder="请输入 JSON Schema 定义输出参数"
            />
          </ElFormItem>
          <ElFormItem v-if="formData.toolType === 'HTTP'" label="请求头">
            <ElInput
              v-model="formData.headers"
              type="textarea"
              :rows="5"
              placeholder="请输入请求头（JSON 格式）"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <ElButton @click="modalApi.close()">取消</ElButton>
      <ElButton type="primary" @click="handleSubmit">保存</ElButton>
    </template>
  </Modal>
</template>
