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
import { YdForm, YdFormItem, YdInput, YdNumberFieldInput } from '@ydsz-core/ydsz-ui';
import { computed, reactive, ref } from 'vue';
import { create, update } from '#/api/agentDefinition';
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
const rules = {
  agentCode: [{ required: true, message: '请输入Agent编码', trigger: 'blur' }],
  agentName: [{ required: true, message: '请输入Agent名称', trigger: 'blur' }],
};
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
    }
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      if (isEdit.value) { await update({ ...formData }); showToast.success('更新成功'); }
      else { await create({ ...formData }); showToast.success('创建成功'); }
      emit('success'); modalApi.close();
    } finally { modalApi.unlock(); }
  },
});
const title = computed(() => (isEdit.value ? '编辑Agent定义' : '新增Agent定义'));
</script>
<template>
  <Modal :title="title">
    <YdForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <YdFormItem label="Agent编码" prop="agentCode">
        <YdInput v-model="formData.agentCode" placeholder="请输入Agent编码" :disabled="isEdit" />
      </YdFormItem>
      <YdFormItem label="Agent名称" prop="agentName">
        <YdInput v-model="formData.agentName" placeholder="请输入Agent名称" />
      </YdFormItem>
      <YdFormItem label="Agent类型">
        <YdInput v-model="formData.agentType" placeholder="请输入Agent类型" />
      </YdFormItem>
      <YdFormItem label="描述">
        <YdInput v-model="formData.description" type="textarea" :rows="2" placeholder="请输入描述" />
      </YdFormItem>
      <YdFormItem label="系统提示词">
        <YdInput v-model="formData.systemPrompt" type="textarea" :rows="2" placeholder="请输入系统提示词" />
      </YdFormItem>
      <YdFormItem label="模型配置">
        <YdInput v-model="formData.modelConfig" placeholder="请输入模型配置（JSON）" />
      </YdFormItem>
      <YdFormItem label="工具列表">
        <YdInput v-model="formData.toolNames" placeholder="请输入工具列表（逗号分隔）" />
      </YdFormItem>
      <YdFormItem label="温度">
        <YdNumberFieldInput v-model="formData.temperature" :min="0" :max="2" :step="0.1" />
      </YdFormItem>
      <YdFormItem label="MaxTokens">
        <YdNumberFieldInput v-model="formData.maxTokens" :min="0" :max="100000" :step="100" />
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
