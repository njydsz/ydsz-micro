<!--
 * 任务连接器（连接测试组件）
 *
 * @path apps\cronjob-web\src\views\connector\connector-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 任务连接器（连接测试弹窗）
 * <p>录入连接参数（类型、端点、认证方式、凭据等），调用契约 testConnection()（src/api/connector.ts，auto-generated）
 * 校验连通性：返回 true 提示连接成功，否则提示连接失败。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { useYDSZModal } from '@ydsz/common-ui';
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ydsz-core/ui-kit/shadcn-ui';
// TODO: ElForm/ElFormItem 表单组件保留 element-plus（有专门迁移批次）
import { ElForm, ElFormItem } from 'element-plus';
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { testConnection } from '#/api/connector';
import type { ConnectorConfigPostDTO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();
const { t } = useI18n();

const formRef = ref();

/** 连接参数状态（type 为 testConnection 的 path 参数，其余对应 ConnectorConfigPostDTO） */
interface ConnectorFormState {
  type: string;
  endpoint: string;
  authType: string;
  username: string;
  password: string;
  accessKey: string;
  secretKey: string;
}

const formData = reactive<ConnectorFormState>({
  type: '',
  endpoint: '',
  authType: '',
  username: '',
  password: '',
  accessKey: '',
  secretKey: '',
});

/** 支持的类型下拉候选（由 index.vue 传入） */
const connectorTypes = ref<string[]>([]);

const rules = {
  type: [{ required: true, message: '请选择连接器类型', trigger: 'change' }],
  endpoint: [{ required: true, message: '请输入连接端点', trigger: 'blur' }],
};

/** 组装 ConnectorConfigPostDTO 请求体 */
function toConnectorConfig(): ConnectorConfigPostDTO {
  return {
    endpoint: formData.endpoint,
    authType: formData.authType || undefined,
    username: formData.username || undefined,
    password: formData.password || undefined,
    accessKey: formData.accessKey || undefined,
    secretKey: formData.secretKey || undefined,
  };
}

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) return;
    const data = modalApi.getData<{ record?: Partial<ConnectorFormState> & { types?: string[] } }>();
    connectorTypes.value = data?.record?.types ?? [];
    Object.assign(formData, {
      type: data?.record?.type ?? '',
      endpoint: data?.record?.endpoint ?? '',
      authType: data?.record?.authType ?? '',
      username: data?.record?.username ?? '',
      password: data?.record?.password ?? '',
      accessKey: data?.record?.accessKey ?? '',
      secretKey: data?.record?.secretKey ?? '',
    });
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      const ok = await testConnection({ type: formData.type }, toConnectorConfig());
      if (ok) {
        showToast.success('连接成功');
      } else {
        showToast.error('连接失败，请检查连接参数');
      }
      emit('success');
      modalApi.close();
    } catch {
      // 错误提示由请求拦截器统一处理
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => '连接测试');
</script>

<template>
  <Modal :title="title">
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="right">
      <ElFormItem :label="t('business.connectorType')" prop="type">
        <Select v-model="formData.type">
          <SelectTrigger placeholder="请选择连接器类型" />
          <SelectContent>
            <SelectItem v-for="item in connectorTypes" :key="item" :value="item">
              {{ item }}
            </SelectItem>
          </SelectContent>
        </Select>
      </ElFormItem>
      <ElFormItem :label="t('business.connectorUrl')" prop="endpoint">
        <Input v-model="formData.endpoint" placeholder="请输入连接端点" />
      </ElFormItem>
      <ElFormItem label="认证方式" prop="authType">
        <Input v-model="formData.authType" placeholder="如 basic / ak-sk" />
      </ElFormItem>
      <ElFormItem label="用户名" prop="username">
        <Input v-model="formData.username" placeholder="请输入用户名" />
      </ElFormItem>
      <ElFormItem label="密码" prop="password">
        <Input v-model="formData.password" type="password" placeholder="请输入密码" />
      </ElFormItem>
      <ElFormItem label="AccessKey" prop="accessKey">
        <Input v-model="formData.accessKey" placeholder="请输入AccessKey" />
      </ElFormItem>
      <ElFormItem label="SecretKey" prop="secretKey">
        <Input v-model="formData.secretKey" type="password" placeholder="请输入SecretKey" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>