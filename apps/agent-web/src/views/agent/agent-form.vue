<!--
 * Agent 定义（表单组件）
 *
 * @path apps/agent-web/src/views/agent/agent-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * Agent 定义（表单组件）
 * <p>新增/编辑 Agent 定义弹窗，字段对齐后端 AgentDefinitionDTO。
 * <p>编辑时 agentCode 不可修改；提交时按 isEdit 调用 update / create。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYdModal } from '@ydsz/common-ui';
import { showToast } from '@ydsz/notification';
import { YdForm, YdFormItem, YdInput, YdNumberFieldInput, YdSelect, YdSelectItem } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { create, update } from '#/api/agentDefinition';
import { tools } from '#/api/agentMetadata';
import type { AgentDefinitionDTO, AgentDefinitionVO } from '#/api/models';
/** 表单提交成功后触发，通知父级列表页刷新数据 */
const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);
const formData = reactive<AgentDefinitionDTO>({ id: '',
  agentCode: '',
  agentName: '',
  agentType: '',
  description: '',
  systemPrompt: '',
  modelConfig: '',
  toolNames: '',
  temperature: 0,
  maxTokens: 0,
});
/** 工具下拉选项（label-value 对），API 不可用时为空 */
const toolOptions = ref<Array<{ label: string; value: string }>>([]);
/** 多选当前选中值（与 formData.toolNames 逗号串双向同步） */
const selectedTools = ref<string[]>([]);
/** API 调用失败时降级为文本输入 */
const useTextFallback = ref(false);
/** 防止重复拉取 */
let toolsLoaded = false;
const rules = {
  agentCode: [{ required: true, message: '请输入Agent编码', trigger: 'blur' }],
  agentName: [{ required: true, message: '请输入Agent名称', trigger: 'blur' }],
};
/** 加载工具列表，失败时降级文本输入 */
async function loadToolOptions(): Promise<void> {
  if (toolsLoaded) return;
  toolsLoaded = true;
  try {
    const list = await tools();
    toolOptions.value = (list ?? []).map((t) => {
      const name = String(t.toolName ?? t.name ?? '');
      const code = String(t.toolCode ?? t.code ?? t.id ?? name);
      return { label: name || code, value: code };
    }).filter((opt) => opt.value);
  } catch {
    useTextFallback.value = true;
    showToast.error('工具列表加载失败，已切换为文本输入');
  }
}

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: AgentDefinitionVO }>();
    if (data?.record) {
      isEdit.value = true;
      const record = data.record;
      Object.assign(formData, { id: record.id ?? '',
        agentCode: record.agentCode ?? '',
        agentName: record.agentName ?? '',
        agentType: record.agentType ?? '',
        description: record.description ?? '',
        systemPrompt: record.systemPrompt ?? '',
        modelConfig: record.modelConfig ?? '',
        toolNames: record.toolNames ?? '',
        temperature: record.temperature ?? 0,
        maxTokens: record.maxTokens ?? 0,
      });
      selectedTools.value = (formData.toolNames ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      isEdit.value = false;
      Object.assign(formData, { id: '',
        agentCode: '',
        agentName: '',
        agentType: '',
        description: '',
        systemPrompt: '',
        modelConfig: '',
        toolNames: '',
        temperature: 0,
        maxTokens: 0,
      });
      selectedTools.value = [];
    }
    // 每次打开都尝试加载工具列表
    void loadToolOptions();
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      // 将多选数组拼回逗号分隔字符串
      formData.toolNames = selectedTools.value.join(',');
      if (isEdit.value) { await update({ ...formData }); showToast.success('更新成功'); }
      else { await create({ ...formData }); showToast.success('创建成功'); }
      emit('success'); modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
const title = computed(() => (isEdit.value ? '编辑Agent定义' : '新增Agent定义'));

/** 判断给定字段名在 rules 中是否包含 required 校验 */
function isRequired(field: string): boolean {
  const fieldRules = rules[field];
  if (!fieldRules) return false;
  if (Array.isArray(fieldRules)) return fieldRules.some((r) => r.required);
  return false;
}
</script>
<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem prop="agentCode">
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">
          <span v-if="isRequired('agentCode')" class="mr-0.5 text-red-500">*</span>
          Agent编码
        </label>
        <YdInput v-model="formData.agentCode" placeholder="请输入Agent编码" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem prop="agentName">
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">
          <span v-if="isRequired('agentName')" class="mr-0.5 text-red-500">*</span>
          Agent名称
        </label>
        <YdInput v-model="formData.agentName" placeholder="请输入Agent名称" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">Agent类型</label>
        <YdInput v-model="formData.agentType" placeholder="请输入Agent类型" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">描述</label>
        <YdInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">系统提示词</label>
        <YdInput v-model="formData.systemPrompt" type="textarea" :rows="2" placeholder="请输入系统提示词" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">模型配置</label>
        <YdInput v-model="formData.modelConfig" placeholder="请输入模型配置（JSON）" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">工具列表</label>
        <YdSelect
          v-if="!useTextFallback"
          v-model="selectedTools"
          multiple
          clearable
          filterable
          placeholder="请选择工具（可多选）"
          class="w-full"
        >
          <YdSelectItem
            v-for="opt in toolOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </YdSelect>
        <YdInput v-else v-model="formData.toolNames" placeholder="请输入工具列表（逗号分隔）" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">温度</label>
        <YdNumberFieldInput v-model="formData.temperature" :min="0" :max="2" :step="0.1" />
      </YdFormItem>
      <YdFormItem>
        <label class="mb-1 flex items-center text-sm font-medium text-text-primary">MaxTokens</label>
        <YdNumberFieldInput v-model="formData.maxTokens" :min="0" :max="100000" :step="100" />
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
