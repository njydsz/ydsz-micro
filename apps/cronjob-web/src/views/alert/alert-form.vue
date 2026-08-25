<!--
 * 任务告警（表单组件）
 *
 * @path apps\cronjob-web\src\views\alert\alert-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 任务告警（表单组件）
 * <p>告警规则的创建/编辑弹窗，字段对应契约 AlertRulePostDTO/AlertRulePutDTO（src/api/alert.ts，auto-generated）：
 * 规则名称、关联任务、告警类型/级别、阈值、时间窗口、通知通道、接收人、冷却时长、启停状态。
 * 提交走 createRule/updateRule，成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useVbenModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage, ElRadio, ElRadioGroup } from 'element-plus';
import { computed, reactive, ref } from 'vue';

import { createRule, updateRule } from '#/api/alert';
import type { JobAlertRuleVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 AlertRulePostDTO / AlertRulePutDTO） */
interface AlertFormState {
  id: string;
  ruleName: string;
  jobKey: string;
  jobId: string;
  alertType: string;
  alertLevel: string;
  threshold: number;
  timeWindowMinutes: number;
  channels: string;
  receivers: string;
  cooldownMinutes: number;
  enabled: number;
}

const formData = reactive<AlertFormState>({
  id: '',
  ruleName: '',
  jobKey: '',
  jobId: '',
  alertType: 'FAILURE',
  alertLevel: 'WARN',
  threshold: 1,
  timeWindowMinutes: 10,
  channels: '',
  receivers: '',
  cooldownMinutes: 5,
  enabled: 1,
});

const rules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
};

const [Modal, modalApi] = useVbenModal({
  onOpenChange: (isOpen) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: JobAlertRuleVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        ruleName: data.record.ruleName ?? '',
        jobKey: data.record.jobKey ?? '',
        jobId: data.record.jobId ?? '',
        alertType: data.record.alertType ?? 'FAILURE',
        alertLevel: data.record.alertLevel ?? 'WARN',
        threshold: data.record.threshold ?? 1,
        timeWindowMinutes: data.record.timeWindowMinutes ?? 10,
        channels: data.record.channels ?? '',
        receivers: data.record.receivers ?? '',
        cooldownMinutes: data.record.cooldownMinutes ?? 5,
        enabled: data.record.enabled ?? 1,
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        ruleName: '',
        jobKey: '',
        jobId: '',
        alertType: 'FAILURE',
        alertLevel: 'WARN',
        threshold: 1,
        timeWindowMinutes: 10,
        channels: '',
        receivers: '',
        cooldownMinutes: 5,
        enabled: 1,
      });
    }
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      const payload = {
        ruleName: formData.ruleName,
        jobKey: formData.jobKey,
        jobId: formData.jobId,
        alertType: formData.alertType,
        alertLevel: formData.alertLevel,
        threshold: formData.threshold,
        timeWindowMinutes: formData.timeWindowMinutes,
        channels: formData.channels,
        receivers: formData.receivers,
        cooldownMinutes: formData.cooldownMinutes,
        enabled: formData.enabled,
      };
      if (isEdit.value) {
        await updateRule({ id: formData.id }, { ...payload, id: formData.id || undefined });
        ElMessage.success('更新成功');
      } else {
        await createRule(payload);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑告警规则' : '新增告警规则'));
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="110px" label-position="right">
      <ElFormItem label="规则名称" prop="ruleName">
        <ElInput v-model="formData.ruleName" placeholder="请输入规则名称" />
      </ElFormItem>
      <ElFormItem label="任务标识" prop="jobKey">
        <ElInput v-model="formData.jobKey" placeholder="请输入关联任务标识（jobKey）" />
      </ElFormItem>
      <ElFormItem label="任务ID" prop="jobId">
        <ElInput v-model="formData.jobId" placeholder="请输入关联任务ID（jobId）" />
      </ElFormItem>
      <ElFormItem label="告警类型" prop="alertType">
        <ElInput v-model="formData.alertType" placeholder="请输入告警类型" />
      </ElFormItem>
      <ElFormItem label="告警级别" prop="alertLevel">
        <ElInput v-model="formData.alertLevel" placeholder="请输入告警级别" />
      </ElFormItem>
      <ElFormItem label="阈值" prop="threshold">
        <ElInputNumber v-model="formData.threshold" :min="0" :precision="2" />
      </ElFormItem>
      <ElFormItem label="时间窗口(分)" prop="timeWindowMinutes">
        <ElInputNumber v-model="formData.timeWindowMinutes" :min="1" />
      </ElFormItem>
      <ElFormItem label="通知通道" prop="channels">
        <ElInput v-model="formData.channels" placeholder="多个通道用逗号分隔，如 email,wecom,dingtalk" />
      </ElFormItem>
      <ElFormItem label="接收人" prop="receivers">
        <ElInput v-model="formData.receivers" placeholder="请输入接收人，多个用逗号分隔" />
      </ElFormItem>
      <ElFormItem label="冷却时长(分)" prop="cooldownMinutes">
        <ElInputNumber v-model="formData.cooldownMinutes" :min="0" />
      </ElFormItem>
      <ElFormItem label="状态">
        <ElRadioGroup v-model="formData.enabled">
          <ElRadio :value="1">启用</ElRadio>
          <ElRadio :value="0">停用</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>