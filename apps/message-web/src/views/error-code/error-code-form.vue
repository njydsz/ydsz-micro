<!--
 * 错误码配置表单组件
 *
 * @path apps/message-web/src/views/error-code/error-code-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 错误码配置（表单组件）
 * <p>消费 MessageErrorCodesController#create/update（src/api/messageErrorCodes.ts）：
 * 按 ErrorCodeUpsertDTO 字段（errorCode/errorMessage/channelType/retryPolicy/notifyPolicy/
 * maxRetryCount/retryIntervalBase/status/description）填写，新增调 create()、编辑调 update({id}, data)，
 * 成功后 emit('success') 并关闭弹窗。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import {
  YdForm,
  YdFormItem,
  YdInput,
  YdNumberFieldInput,
  YdRadioGroup,
  YdRadioGroupItem,
  YdSelect,
  YdSelectItem,
  YdTextarea,
} from '@ydsz-core/ydsz-ui';
import { useYdModal } from '@ydsz/common-ui';
import { computed, reactive, ref } from 'vue';

import { useI18n } from 'vue-i18n';

import {
  create,
  update,
  type MsgErrorCodeVO,
} from '#/api/messageErrorCodes';

const { t } = useI18n();

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/**
 * 错误码配置表单状态（字段对应 ErrorCodeUpsertDTO）。
 */
interface ErrorCodeFormState {
  id: string;
  errorCode: string;
  errorMessage: string;
  channelType: string;
  retryPolicy: string;
  notifyPolicy: string;
  maxRetryCount: number;
  retryIntervalBase: number;
  status: string;
  description: string;
}

const formData = reactive<ErrorCodeFormState>({
  id: '',
  errorCode: '',
  errorMessage: '',
  channelType: '',
  retryPolicy: 'NONE',
  notifyPolicy: 'NONE',
  maxRetryCount: 0,
  retryIntervalBase: 0,
  status: 'ENABLED',
  description: '',
});

const rules = {
  errorCode: [
    {
      required: true,
      message: t('errorCode.validation.errorCodeRequired'),
      trigger: 'blur',
    },
  ],
  errorMessage: [
    {
      required: true,
      message: t('errorCode.validation.errorMessageRequired'),
      trigger: 'blur',
    },
  ],
  channelType: [
    {
      required: true,
      message: t('errorCode.validation.channelTypeRequired'),
      trigger: 'blur',
    },
  ],
};

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: MsgErrorCodeVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        id: data.record.id ?? '',
        errorCode: data.record.errorCode ?? '',
        errorMessage: data.record.errorMessage ?? '',
        channelType: data.record.channelType ?? '',
        retryPolicy: data.record.retryPolicy ?? 'NONE',
        notifyPolicy: data.record.notifyPolicy ?? 'NONE',
        maxRetryCount: data.record.maxRetryCount ?? 0,
        retryIntervalBase: data.record.retryIntervalBase ?? 0,
        status: data.record.status ?? 'ENABLED',
        description: data.record.description ?? '',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        id: '',
        errorCode: '',
        errorMessage: '',
        channelType: '',
        retryPolicy: 'NONE',
        notifyPolicy: 'NONE',
        maxRetryCount: 0,
        retryIntervalBase: 0,
        status: 'ENABLED',
        description: '',
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
        errorCode: formData.errorCode,
        errorMessage: formData.errorMessage,
        channelType: formData.channelType,
        retryPolicy: formData.retryPolicy || undefined,
        notifyPolicy: formData.notifyPolicy || undefined,
        maxRetryCount: formData.maxRetryCount,
        retryIntervalBase: formData.retryIntervalBase,
        status: formData.status || undefined,
        description: formData.description || undefined,
      };
      if (isEdit.value) {
        await update({ id: formData.id }, payload);
        showToast.success(t('errorCode.editSuccess'));
      } else {
        await create(payload);
        showToast.success(t('errorCode.createSuccess'));
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() =>
  isEdit.value ? t('errorCode.editTitle') : t('errorCode.createTitle'),
);
</script>
<template>
  <Modal :title="title">
    <YdForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <YdFormItem :label="t('errorCode.columns.errorCode')" prop="errorCode">
        <YdInput
          v-model="formData.errorCode"
          :placeholder="t('errorCode.placeholder.errorCode')"
          :disabled="isEdit"
        />
      </YdFormItem>
      <YdFormItem :label="t('errorCode.columns.errorMessage')" prop="errorMessage">
        <YdTextarea
          v-model="formData.errorMessage"
          :placeholder="t('errorCode.placeholder.errorMessage')"
          :rows="3"
        />
      </YdFormItem>
      <YdFormItem :label="t('errorCode.columns.channelType')" prop="channelType">
        <YdSelect
          v-model="formData.channelType"
          :placeholder="t('errorCode.placeholder.channelType')"
        >
          <YdSelectItem
            value="SMS"
            :label="t('errorCode.channel.SMS')"
          />
          <YdSelectItem
            value="EMAIL"
            :label="t('errorCode.channel.EMAIL')"
          />
          <YdSelectItem
            value="WEBHOOK"
            :label="t('errorCode.channel.WEBHOOK')"
          />
          <YdSelectItem
            value="PUSH"
            :label="t('errorCode.channel.PUSH')"
          />
          <YdSelectItem
            value="WECHAT"
            :label="t('errorCode.channel.WECHAT')"
          />
          <YdSelectItem
            value="INSITE"
            :label="t('errorCode.channel.INSITE')"
          />
        </YdSelect>
      </YdFormItem>
      <YdFormItem :label="t('errorCode.columns.retryPolicy')" prop="retryPolicy">
        <YdSelect
          v-model="formData.retryPolicy"
          :placeholder="t('errorCode.placeholder.retryPolicy')"
        >
          <YdSelectItem
            value="NONE"
            :label="t('errorCode.retryPolicy.NONE')"
          />
          <YdSelectItem
            value="SIMPLE"
            :label="t('errorCode.retryPolicy.SIMPLE')"
          />
          <YdSelectItem
            value="EXPONENTIAL_BACKOFF"
            :label="t('errorCode.retryPolicy.EXPONENTIAL_BACKOFF')"
          />
        </YdSelect>
      </YdFormItem>
      <YdFormItem :label="t('errorCode.columns.notifyPolicy')" prop="notifyPolicy">
        <YdSelect
          v-model="formData.notifyPolicy"
          :placeholder="t('errorCode.placeholder.notifyPolicy')"
        >
          <YdSelectItem
            value="NONE"
            :label="t('errorCode.notifyPolicy.NONE')"
          />
          <YdSelectItem
            value="EMAIL_ADMIN"
            :label="t('errorCode.notifyPolicy.EMAIL_ADMIN')"
          />
          <YdSelectItem
            value="SMS_ADMIN"
            :label="t('errorCode.notifyPolicy.SMS_ADMIN')"
          />
          <YdSelectItem
            value="WEBHOOK_ALERT"
            :label="t('errorCode.notifyPolicy.WEBHOOK_ALERT')"
          />
        </YdSelect>
      </YdFormItem>
      <YdFormItem :label="t('errorCode.columns.maxRetryCount')" prop="maxRetryCount">
        <YdNumberFieldInput v-model="formData.maxRetryCount" :min="0" :max="99" />
      </YdFormItem>
      <YdFormItem
        :label="t('errorCode.columns.retryIntervalBase')"
        prop="retryIntervalBase"
      >
        <YdNumberFieldInput
          v-model="formData.retryIntervalBase"
          :min="0"
          :max="3600"
        />
      </YdFormItem>
      <YdFormItem :label="t('common.status')" prop="status">
        <YdRadioGroup v-model="formData.status">
          <YdRadioGroupItem value="ENABLED">
            {{ t('errorCode.status.enabled') }}
          </YdRadioGroupItem>
          <YdRadioGroupItem value="DISABLED">
            {{ t('errorCode.status.disabled') }}
          </YdRadioGroupItem>
        </YdRadioGroup>
      </YdFormItem>
      <YdFormItem :label="t('errorCode.columns.description')" prop="description">
        <YdTextarea
          v-model="formData.description"
          :placeholder="t('errorCode.placeholder.description')"
          :rows="2"
        />
      </YdFormItem>
    </YdForm>
  </Modal>
</template>
