<!--
 * 订阅表单组件
 *
 * <p>用于新增和编辑消息订阅关系。
 *
 * @path apps/message-web/src/views/subscription/subscription-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 订阅表单
 * <p>支持选择用户、主题、通道，配置订阅状态。
 *
 * @author ydsz-team
 * @since 1.0.0
*/
import { useYDSZModal } from '@ydsz/common-ui';
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';
import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { upsert } from '#/api/subscription';

defineOptions({ name: 'SubscriptionForm' });

const { t } = useI18n();

/** 订阅表单数据形状 */
interface SubscriptionFormData {
  id?: string;
  userId?: string;
  topicCode?: string;
  topicName?: string;
  channel?: string;
  status?: string;
  remark?: string;
}

interface Props {
  record?: SubscriptionFormData | null;
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

/** 是否为编辑模式 */
const isEditMode = computed(() => !!props.record?.id);

/** 表单数据 */
const formData = reactive({
  id: '',
  userId: '',
  topicCode: '',
  topicName: '',
  channel: 'EMAIL',
  status: 'ACTIVE',
  remark: '',
});

/** 通道选项 */
const channelOptions = [
  { label: '邮件', value: 'EMAIL' },
  { label: '短信', value: 'SMS' },
  { label: '站内信', value: 'INBOX' },
  { label: 'Webhook', value: 'WEBHOOK' },
  { label: '企业微信', value: 'WECHAT_WORK' },
  { label: '钉钉', value: 'DINGTALK' },
];

/**
 * 提交表单
 */
async function handleSubmit(): Promise<void> {
  if (!formData.userId.trim()) {
    ElMessage.warning('请输入用户ID');
    return;
  }
  if (!formData.topicCode.trim()) {
    ElMessage.warning('请输入主题编码');
    return;
  }
  if (!formData.topicName.trim()) {
    ElMessage.warning('请输入主题名称');
    return;
  }
  try {
    await upsert({
      userId: formData.userId,
      topicCode: formData.topicCode,
      topicName: formData.topicName,
      channel: formData.channel,
      status: formData.status,
      remark: formData.remark,
    });
    ElMessage.success(isEditMode.value ? '更新成功' : '订阅成功');
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
    } else {
      formData.id = '';
      formData.userId = '';
      formData.topicCode = '';
      formData.topicName = '';
      formData.channel = 'EMAIL';
      formData.status = 'ACTIVE';
      formData.remark = '';
    }
  },
  { immediate: true },
);
</script>

<template>
  <Modal :title="isEditMode ? '编辑订阅' : '新增订阅'" width="500px">
    <ElForm label-width="100px" class="mt-3">
      <ElFormItem label="用户ID" required>
        <ElInput
          v-model="formData.userId"
          placeholder="请输入用户ID"
          :disabled="isEditMode"
        />
      </ElFormItem>
      <ElFormItem label="主题编码" required>
        <ElInput
          v-model="formData.topicCode"
          placeholder="请输入主题编码"
          :disabled="isEditMode"
        />
      </ElFormItem>
      <ElFormItem label="主题名称" required>
        <ElInput v-model="formData.topicName" placeholder="请输入主题名称" />
      </ElFormItem>
      <ElFormItem label="通知通道" required>
        <ElSelect v-model="formData.channel" placeholder="请选择通道" class="w-full">
          <ElOption
            v-for="opt in channelOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="订阅状态">
        <ElSwitch
          v-model="formData.status"
          active-value="ACTIVE"
          inactive-value="UNSUBSCRIBED"
          :active-text="t('common.enabled')"
          :inactive-text="t('common.disabled')"
        />
      </ElFormItem>
      <ElFormItem label="备注">
        <ElInput v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="modalApi.close()">{{ t('common.cancel') }}</ElButton>
      <ElButton type="primary" @click="handleSubmit">保存</ElButton>
    </template>
  </Modal>
</template>
