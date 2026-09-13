<!--
 * 认证策略表单弹窗
 *
 * <p>提供认证策略的新增/编辑表单，字段包括租户ID、策略名称、密码策略、
 * MFA认证、图形验证码、身份提供者、会话配置、备注等。
 *
 * @path apps/userinfo-web/src/views/system/auth-policy/auth-policy-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 认证策略表单弹窗
 *
 * <p>认证策略的创建/编辑表单，字段对应 AuthPolicyDTO（src/api/models.ts，auto-generated）。
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
  ElInputNumber,
  ElMessage,
  ElSelect,
  ElSwitch,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';
import type { AuthPolicyDTO, AuthPolicyVO } from '#/api/models';

const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const isEdit = ref(false);

/** 身份提供者选项 */
const IDENTITY_PROVIDER_OPTIONS = [
  { label: '本地账号', value: 'LOCAL' },
  { label: 'LDAP', value: 'LDAP' },
  { label: 'SAML', value: 'SAML' },
  { label: 'OAuth2', value: 'OAUTH2' },
];

interface AuthPolicyFormState {
  tenantId: string;
  name: string;
  passwordMinLength: number;
  isPasswordRequireUppercase: boolean;
  isPasswordRequireDigit: boolean;
  isMfaEnabled: boolean;
  isCaptchaEnabled: boolean;
  allowedIdentityProviders: string;
  maxSessionsPerUser: number;
  sessionTimeoutSeconds: number;
  remark: string;
}

const formData = reactive<AuthPolicyFormState>({
  tenantId: '',
  name: '',
  passwordMinLength: 8,
  isPasswordRequireUppercase: true,
  isPasswordRequireDigit: true,
  isMfaEnabled: false,
  isCaptchaEnabled: true,
  allowedIdentityProviders: 'LOCAL',
  maxSessionsPerUser: 3,
  sessionTimeoutSeconds: 3600,
  remark: '',
});

const rules = {
  name: [{ required: true, message: '请输入策略名称', trigger: 'blur' }],
};

/**
 * 处理身份提供者多选结果，拼接为逗号分隔字符串。
 *
 * @param values - 选中的提供者值数组
 */
function joinProviders(values: string[]): string {
  return values.join(',');
}

/**
 * 将逗号分隔的身份提供者字符串解析为数组。
 *
 * @param providers - 逗号分隔字符串
 */
function splitProviders(providers?: string): string[] {
  if (!providers) {
    return [];
  }
  return providers.split(',').map((item) => item.trim()).filter(Boolean);
}

const [Modal, modalApi] = useYDSZModal({
  onOpenChange: (isOpen: boolean) => {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ record?: AuthPolicyVO }>();
    if (data?.record) {
      isEdit.value = true;
      Object.assign(formData, {
        tenantId: data.record.tenantId ?? '',
        name: data.record.name ?? '',
        passwordMinLength: data.record.passwordMinLength ?? 8,
        isPasswordRequireUppercase: data.record.isPasswordRequireUppercase ?? true,
        isPasswordRequireDigit: data.record.isPasswordRequireDigit ?? true,
        isMfaEnabled: data.record.isMfaEnabled ?? false,
        isCaptchaEnabled: data.record.isCaptchaEnabled ?? true,
        allowedIdentityProviders: data.record.allowedIdentityProviders ?? 'LOCAL',
        maxSessionsPerUser: data.record.maxSessionsPerUser ?? 3,
        sessionTimeoutSeconds: data.record.sessionTimeoutSeconds ?? 3600,
        remark: data.record.remark ?? '',
      });
    } else {
      isEdit.value = false;
      Object.assign(formData, {
        tenantId: '',
        name: '',
        passwordMinLength: 8,
        isPasswordRequireUppercase: true,
        isPasswordRequireDigit: true,
        isMfaEnabled: false,
        isCaptchaEnabled: true,
        allowedIdentityProviders: 'LOCAL',
        maxSessionsPerUser: 3,
        sessionTimeoutSeconds: 3600,
        remark: '',
      });
    }
    // 同步身份提供者多选值
    selectedProviders.value = splitProviders(formData.allowedIdentityProviders);
  },
  onConfirm: async () => {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      const payload: AuthPolicyDTO = {
        tenantId: formData.tenantId || undefined,
        name: formData.name,
        passwordMinLength: formData.passwordMinLength,
        isPasswordRequireUppercase: formData.isPasswordRequireUppercase,
        isPasswordRequireDigit: formData.isPasswordRequireDigit,
        isMfaEnabled: formData.isMfaEnabled,
        isCaptchaEnabled: formData.isCaptchaEnabled,
        allowedIdentityProviders: formData.allowedIdentityProviders,
        maxSessionsPerUser: formData.maxSessionsPerUser,
        sessionTimeoutSeconds: formData.sessionTimeoutSeconds,
        remark: formData.remark,
      };
      if (isEdit.value) {
        const { update } = await import('#/api/authPolicy');
        await update({ tenantId: formData.tenantId }, payload);
        ElMessage.success('更新成功');
      } else {
        const { create: createApi } = await import('#/api/authPolicy');
        await createApi(payload);
        ElMessage.success('创建成功');
      }
      emit('success');
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

const title = computed(() => (isEdit.value ? '编辑认证策略' : '新增认证策略'));

/** 身份提供者多选值（由逗号分隔字符串派生） */
const selectedProviders = ref<string[]>(splitProviders(formData.allowedIdentityProviders));

/**
 * 同步身份提供者选择到表单数据。
 *
 * @param values - 选中值数组
 */
function handleProviderChange(values: string[]): void {
  selectedProviders.value = values;
  formData.allowedIdentityProviders = joinProviders(values);
}

</script>

<template>
  <Modal :title="title">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="right"
    >
      <ElFormItem label="租户ID" prop="tenantId">
        <ElInput
          v-model="formData.tenantId"
          placeholder="为空表示全局默认策略"
          :disabled="isEdit"
          maxlength="64"
          show-word-limit
        />
      </ElFormItem>
      <ElFormItem label="策略名称" prop="name">
        <ElInput v-model="formData.name" placeholder="如：默认密码策略" maxlength="64" show-word-limit />
      </ElFormItem>
      <ElFormItem label="密码最小长度" prop="passwordMinLength">
        <ElInputNumber v-model="formData.passwordMinLength" :min="6" :max="64" class="w-full" />
      </ElFormItem>
      <ElFormItem label="需大写字母">
        <ElSwitch v-model="formData.isPasswordRequireUppercase" />
      </ElFormItem>
      <ElFormItem label="需数字">
        <ElSwitch v-model="formData.isPasswordRequireDigit" />
      </ElFormItem>
      <ElFormItem label="MFA认证">
        <ElSwitch v-model="formData.isMfaEnabled" />
      </ElFormItem>
      <ElFormItem label="图形验证码">
        <ElSwitch v-model="formData.isCaptchaEnabled" />
      </ElFormItem>
      <ElFormItem label="身份提供者">
        <ElSelect
          :model-value="selectedProviders"
          multiple
          placeholder="选择允许的身份提供者"
          class="w-full"
          @update:model-value="handleProviderChange"
        >
          <ElOption
            v-for="opt in IDENTITY_PROVIDER_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="最大会话数" prop="maxSessionsPerUser">
        <ElInputNumber v-model="formData.maxSessionsPerUser" :min="1" :max="20" class="w-full" />
      </ElFormItem>
      <ElFormItem label="会话超时(秒)" prop="sessionTimeoutSeconds">
        <ElInputNumber v-model="formData.sessionTimeoutSeconds" :min="60" :max="86400" class="w-full" />
      </ElFormItem>
      <ElFormItem label="备注" prop="remark">
        <ElInput v-model="formData.remark" type="textarea" :rows="3" placeholder="备注说明" maxlength="255" show-word-limit />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>

<style lang="scss" scoped>
.w-full {
  width: 100%;
}
</style>
