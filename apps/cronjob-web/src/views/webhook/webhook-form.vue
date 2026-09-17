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
import { useYdModal } from '@ydsz/common-ui';
import { Input, RadioGroup, RadioGroupItem, Select, SelectContent, SelectItem, SelectTrigger, Textarea } from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElForm/ElFormItem 表单组件保留 element-plus（有专门迁移批次）
import { ElForm, ElFormItem } from 'element-plus';
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

const [Modal, modalApi] = useYdModal({
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
        showToast.success('修改成功');
      } else {
        await create(payload);
        showToast.success('新增成功');
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
        <Input v-model="formData.name" :placeholder="t('business.webhookNamePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookEventType')" prop="eventType">
        <Select v-model="formData.eventType">
          <SelectTrigger :placeholder="t('business.webhookEventTypePlaceholder')" />
          <SelectContent>
            <SelectItem v-for="item in eventTypeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </ElFormItem>
      <ElFormItem :label="t('business.webhookJobKey')" prop="jobKey">
        <Input v-model="formData.jobKey" :placeholder="t('business.webhookJobKeyPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookJobGroup')" prop="jobGroup">
        <Input v-model="formData.jobGroup" :placeholder="t('business.webhookJobGroupPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookCallbackUrl')" prop="callbackUrl">
        <Input v-model="formData.callbackUrl" :placeholder="t('business.webhookCallbackUrlPlaceholder')" />
      </ElFormItem>
      <ElFormItem label="HTTP Method" prop="httpMethod">
        <RadioGroup v-model="formData.httpMethod">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <RadioGroupItem id="method-post" value="POST" />
              <label for="method-post" class="cursor-pointer text-sm">POST</label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="method-put" value="PUT" />
              <label for="method-put" class="cursor-pointer text-sm">PUT</label>
            </div>
          </div>
        </RadioGroup>
      </ElFormItem>
      <ElFormItem :label="t('business.webhookHeaders')" prop="headers">
        <Textarea v-model="formData.headers" :rows="3" :placeholder="t('business.webhookHeadersPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('business.webhookSecret')" prop="secret">
        <Input v-model="formData.secret" :placeholder="t('business.webhookSecretPlaceholder')" type="password" />
      </ElFormItem>
      <ElFormItem :label="t('common.status')">
        <RadioGroup v-model="formData.webhookStatus">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <RadioGroupItem id="status-active" value="ACTIVE" />
              <label for="status-active" class="cursor-pointer text-sm">{{ t('common.enabled') }}</label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="status-inactive" value="INACTIVE" />
              <label for="status-inactive" class="cursor-pointer text-sm">{{ t('common.disabled') }}</label>
            </div>
          </div>
        </RadioGroup>
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
