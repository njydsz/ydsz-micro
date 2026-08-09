<!--
 * Agent 管理（表单组件）
 *
 * @path apps/agent-web/src/views/agent/agent-form.vue
 * @author ydsz-team
 * @since 1.0.0
 * @modified 4.0.1 消除 as any + i18n 接入。
-->
<script lang="ts" setup>
/**
 * Agent 管理（表单组件）
 */
import type { AgentApi } from '#/api/agent';
import { useVbenModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
import { computed, reactive, ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { createAgentApi, updateAgentApi } from '#/api/agent';

const { t } = useI18n();

/** 表单提交成功后触发，通知父级列表页刷新数据 */
const emit = defineEmits<{ success: [] }>();
const formRef = ref();
const isEdit = ref(false);
const formData = reactive<Omit<AgentApi.AgentDTO, 'id'> & { id?: string }>({
  agentName: '',
  agentType: '',
  modelProvider: '',
  modelName: '',
  systemPrompt: '',
  temperature: 0,
  status: 0,
});

const rules = {
  agentName: [{ required: true, message: () => t('validation.required', { field: t('agent.columns.name') }), trigger: 'blur' }],
};

const [Modal, modalApi] = useVbenModal({
  onOpenChange: (isOpen) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: AgentApi.AgentVO }>();
    if (data?.record) {
      isEdit.value = true;
      const { id, ...rest } = data.record;
      Object.assign(formData, { id, ...rest });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        agentName: '',
        agentType: '',
        modelProvider: '',
        modelName: '',
        systemPrompt: '',
        temperature: 0,
        status: 0,
      });
    }
  },
  onConfirm: async () => {
    try { await formRef.value?.validate(); } catch { return; }
    modalApi.lock();
    try {
      const { id, ...payload } = toRaw(formData);
      if (isEdit.value) {
        await updateAgentApi(payload);
        ElMessage.success(t('agent.updateSuccess'));
      } else {
        await createAgentApi(payload);
        ElMessage.success(t('agent.createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});
const title = computed(() => (isEdit.value ? t('agent.editTitle') : t('agent.createTitle')));
</script>
<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem :label="t('agent.columns.name')" prop="agentName">
        <ElInput v-model="formData.agentName" :placeholder="t('agent.placeholder.name')" />
      </ElFormItem>
      <ElFormItem :label="t('agent.columns.type')" prop="agentType">
        <ElInput v-model="formData.agentType" :placeholder="t('agent.placeholder.type')" />
      </ElFormItem>
      <ElFormItem :label="t('agent.columns.provider')" prop="modelProvider">
        <ElInput v-model="formData.modelProvider" :placeholder="t('agent.placeholder.provider')" />
      </ElFormItem>
      <ElFormItem :label="t('agent.columns.model')" prop="modelName">
        <ElInput v-model="formData.modelName" :placeholder="t('agent.placeholder.model')" />
      </ElFormItem>
      <ElFormItem :label="t('agent.columns.systemPrompt')" prop="systemPrompt">
        <ElInput v-model="formData.systemPrompt" type="textarea" :rows="2" :placeholder="t('agent.placeholder.systemPrompt')" />
      </ElFormItem>
      <ElFormItem :label="t('agent.columns.temperature')" prop="temperature">
        <ElInputNumber v-model="formData.temperature" :min="0" :max="2" :step="0.1" />
      </ElFormItem>
      <ElFormItem :label="t('agent.columns.status')" prop="status">
        <ElRadioGroup v-model="formData.status">
          <ElRadio :value="1">{{ t('common.enabled') }}</ElRadio>
          <ElRadio :value="0">{{ t('common.disabled') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
