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
import { useYdModal } from '@ydsz/common-ui';
import { ElForm, ElFormItem } from 'element-plus';
import { createLogger } from '@ydsz-core/shared/utils';
import { computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Textarea } from '@ydsz-core/ui-kit/shadcn-ui';
import { upsert } from '#/api/subscription';

defineOptions({ name: 'SubscriptionForm' });

const logger = createLogger('message-subscription');

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

const [Modal, modalApi] = useYdModal({
  onOpenChange: (isOpen: boolean) => {
    if (isOpen && props.record) {
      Object.assign(formData, props.record);
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
  { label: t('channel.email'), value: 'EMAIL' },
  { label: t('channel.sms'), value: 'SMS' },
  { label: t('channel.inbox'), value: 'INBOX' },
  { label: 'Webhook', value: 'WEBHOOK' },
  { label: t('channel.wechatWork'), value: 'WECHAT_WORK' },
  { label: t('channel.dingtalk'), value: 'DINGTALK' },
];

/**
 * 提交表单
 */
async function handleSubmit(): Promise<void> {
  if (!formData.userId.trim()) {
    showToast.warning('请输入用户ID');
    return;
  }
  if (!formData.topicCode.trim()) {
    showToast.warning('请输入主题编码');
    return;
  }
  if (!formData.topicName.trim()) {
    showToast.warning('请输入主题名称');
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
    showToast.success(isEditMode.value ? t('common.updateSuccess') : t('subscription.subscribeSuccess'));
    emit('success');
    modalApi.close();
  } catch (error) {
    logger.warn('提交订阅表单失败: {}', error);
    // 错误提示由请求拦截器统一处理
  }
}

</script>

<template>
  <Modal :title="isEditMode ? '编辑订阅' : '新增订阅'" width="500px">
    <ElForm label-width="100px" class="mt-3">
      <ElFormItem label="用户ID" required>
        <Input
          v-model="formData.userId"
          placeholder="请输入用户ID"
          :disabled="isEditMode"
        />
      </ElFormItem>
      <ElFormItem label="主题编码" required>
        <Input
          v-model="formData.topicCode"
          placeholder="请输入主题编码"
          :disabled="isEditMode"
        />
      </ElFormItem>
      <ElFormItem label="主题名称" required>
        <Input v-model="formData.topicName" placeholder="请输入主题名称" />
      </ElFormItem>
      <ElFormItem label="通知通道" required>
        <Select v-model="formData.channel">
          <SelectTrigger>
            <SelectValue placeholder="请选择通道" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in channelOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </ElFormItem>
      <ElFormItem label="订阅状态">
        <Switch
          :checked="formData.status === 'ACTIVE'"
          @update:checked="(val: boolean) => formData.status = val ? 'ACTIVE' : 'UNSUBSCRIBED'"
        />
      </ElFormItem>
      <ElFormItem label="备注">
        <Textarea v-model="formData.remark" placeholder="请输入备注" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <Button variant="outline" @click="modalApi.close()">{{ t('common.cancel') }}</Button>
      <Button @click="handleSubmit">保存</Button>
    </template>
  </Modal>
</template>
