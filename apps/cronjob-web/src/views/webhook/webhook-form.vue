<!--
 * 任务 Webhook（表单组件）
 *
 * @path apps\cronjob-web\src\views\webhook\webhook-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 任务 Webhook（表单组件）
 * <p>Webhook 订阅的创建/编辑弹窗，字段对应契约 JobWebhookPostDTO/JobWebhookPutDTO（src/api/jobWebhook.ts，auto-generated）：
 * 名称、事件类型、关联任务、回调 URL、HTTP 方法、请求头、密钥、启停状态。
 * 提交走 create/update，成功后 emit('success') 并关闭弹窗。
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
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { create, update } from '#/api/jobWebhook';
import type { JobWebhookVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();
const { t } = useI18n();

const formRef = ref();
const isEdit = ref(false);

/** 表单状态（字段对应 JobWebhookPostDTO / JobWebhookPutDTO） */
interface WebhookFormState {
  id: string;
  name: string;
  eventType: string;
  jobKey: string;
  jobGroup: string;
  callbackUrl: string;
  httpMethod: string;
  headers: string;
  secret: string;
  webhookStatus: string;
}

const formData = reactive<WebhookFormState>({
  id: '',
  name: '',
  eventType: 'TASK_FAILED',
  jobKey: '',
  jobGroup: '',
  callbackUrl: '',
  httpMethod: 'POST',
  headers: '',
  secret: '',
  webhookStatus: 'ACTIVE',
});

const rules = {
  name: [{ required: true, message: t('business.webhookNameRequired'), trigger: 'blur' }],
  eventType: [{ required: true, message: t('business.webhookEventTypeRequired'), trigger: 'blur' }],
  callbackUrl: [{ required: true, message: t('business.webhookCallbackUrlRequired'), trigger: 'blur' }],
};

/** Webhook 事件类型选项 */
const eventTypeOptions = [
  { label: 'TASK_STARTED', value: 'TASK_STARTED' },
  { label: 'TASK_SUCCESS', value: 'TASK_SUCCESS' },
  { label: 'TASK_FAILED', value: 'TASK_FAILED' },
  { label: 'TASK_TIMEOUT', value: 'TASK_TIMEOUT' },
  { label: 'DAG_COMPLETED', value: 'DAG_COMPLETED' },
];

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: JobWebhookVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        name: data.record.name ?? '',
        eventType: data.record.eventType ?? 'TASK_FAILED',
        jobKey: data.record.jobKey ?? '',
        jobGroup: data.record.jobGroup ?? '',
        callbackUrl: data.record.callbackUrl ?? '',
        httpMethod: data.record.httpMethod ?? 'POST',
        headers: data.record.headers ?? '',
        secret: data.record.secret ?? '',
        webhookStatus: data.record.webhookStatus ?? 'ACTIVE',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        name: '',
        eventType: 'TASK_FAILED',
        jobKey: '',
        jobGroup: '',
        callbackUrl: '',
        httpMethod: 'POST',
        headers: '',
        secret: '',
        webhookStatus: 'ACTIVE',
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
        name: formData.name,
        eventType: formData.eventType,
        jobKey: formData.jobKey || undefined,
        jobGroup: formData.jobGroup || undefined,
        callbackUrl: formData.callbackUrl,
        httpMethod: formData.httpMethod,
        headers: formData.headers || undefined,
        secret: formData.secret || undefined,
        webhookStatus: formData.webhookStatus,
      };
      if (isEdit.value) {
        await update({ ...payload, id: formData.id || undefined });
        ElMessage.success('修改成功');
      } else {
        await create(payload);
        ElMessage.success('新增成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? t('business.webhookEdit') : t('business.webhookCreate')));
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="110px" label-position="right">
      <ElFormItem :label="t('business.webhookName')" prop="name">
        <ElInput v-model="formData.name" :placeholder="t('business.webhookNamePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookEventType')" prop="eventType">
        <ElSelect v-model="formData.eventType" :placeholder="t('business.webhookEventTypePlaceholder')">
          <ElOption v-for="item in eventTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem :label="t('business.webhookJobKey')" prop="jobKey">
        <ElInput v-model="formData.jobKey" :placeholder="t('business.webhookJobKeyPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookJobGroup')" prop="jobGroup">
        <ElInput v-model="formData.jobGroup" :placeholder="t('business.webhookJobGroupPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookCallbackUrl')" prop="callbackUrl">
        <ElInput v-model="formData.callbackUrl" :placeholder="t('business.webhookCallbackUrlPlaceholder')" />
      </ElFormItem>
      <ElFormItem label="HTTP Method" prop="httpMethod">
        <ElRadioGroup v-model="formData.httpMethod">
          <ElRadio value="POST">POST</ElRadio>
          <ElRadio value="PUT">PUT</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="t('business.webhookHeaders')" prop="headers">
        <ElInput v-model="formData.headers" type="textarea" :rows="3" :placeholder="t('business.webhookHeadersPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookSecret')" prop="secret">
        <ElInput v-model="formData.secret" :placeholder="t('business.webhookSecretPlaceholder')" show-password />
      </ElFormItem>
      <ElFormItem :label="t('common.status')">
        <ElRadioGroup v-model="formData.webhookStatus">
          <ElRadio value="ACTIVE">{{ t('common.enabled') }}</ElRadio>
          <ElRadio value="INACTIVE">{{ t('common.disabled') }}</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
