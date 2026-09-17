<!--
 * 个人中心（用户资料）页面
 *
 * <p>提供当前登录用户的个人中心设置：头像上传、基本信息编辑、修改密码、MFA设置。
 *
 * @path apps/userinfo-web/src/views/system/user-profile/index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 个人中心（用户资料）
 * <p>消费后端 UserProfileController（apps/userinfo-web/src/api/userProfile.ts）：
 * getCurrentUserProfile() 获取资料，updateCurrentUserProfile() 更新资料，
 * changePassword() 修改密码，uploadAvatar() 上传头像，
 * getMfaStatus() 获取MFA状态，setupMfa() 设置MFA，
 * activateMfa() 激活MFA，disableMfa() 禁用MFA。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { Page } from '@ydsz/common-ui';
import { YdButtonBase, YdCard, YdCardContent, YdCardHeader, YdCardTitle, YdTabs, YdTabsContent, YdTabsList, YdTabsTrigger } from '@ydsz-core/ydsz-ui';
import { Loader2 } from 'lucide-vue-next';
import { YdForm, YdFormItem, YdInput, YdSwitch, type FormInstance, type UploadRequestOptions } from '@ydsz-core/ydsz-ui';
import { reactive, ref } from 'vue';
import { createLogger } from '@ydsz/utils';
import {
  activateMfa,
  changePassword,
  disableMfa,
  getCurrentUserProfile,
  getMfaStatus,
  setupMfa,
  updateCurrentUserProfile,
  uploadAvatar,
} from '#/api/userProfile';
import type { MfaSetupVO } from '#/api/models';

defineOptions({ name: 'UserProfileManagement' });

const logger = createLogger('userinfo-profile');

/** 当前激活 tab */
const activeTab = ref('profile');

// ========== 基本信息 ==========
const profileFormRef = ref<FormInstance>();
const isProfileLoading = ref(false);
const avatarUrl = ref('');

const profileForm = reactive({
  realName: '',
  phone: '',
  email: '',
  avatar: '',
});

const profileRules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
};

/**
 * 加载用户资料。
 */
async function loadProfile(): Promise<void> {
  try {
    const data = await getCurrentUserProfile();
    profileForm.realName = (data?.realName ?? '') as string;
    profileForm.phone = (data?.phone ?? '') as string;
    profileForm.email = (data?.email ?? '') as string;
    profileForm.avatar = (data?.avatar ?? '') as string;
    avatarUrl.value = (data?.avatar ?? '') as string;
  } catch (error) {
    logger.warn('加载用户资料失败:', error);
  }
}

/**
 * 提交基本信息。
 */
async function handleUpdateProfile(): Promise<void> {
  if (!profileFormRef.value) {
    return;
  }
  try {
    await profileFormRef.value.validate();
  } catch {
    return;
  }
  isProfileLoading.value = true;
  try {
    await updateCurrentUserProfile({
      realName: profileForm.realName,
      phone: profileForm.phone,
      email: profileForm.email,
      avatar: profileForm.avatar,
    });
    showToast.success('资料更新成功');
  } catch {
    /* 错误由拦截器处理 */
  } finally {
    isProfileLoading.value = false;
  }
}

/**
 * 上传头像。
 *
 * @param options - 上传请求选项
 */
async function handleAvatarUpload(options: UploadRequestOptions): Promise<unknown> {
  const file = options.file as File;
  try {
    const url = await uploadAvatar({ file: file as unknown as Record<string, unknown> });
    avatarUrl.value = url;
    profileForm.avatar = url;
    showToast.success('头像上传成功');
    return url;
  } catch (error) {
    logger.warn('头像上传失败:', error);
    throw error;
  }
}

// ========== 修改密码 ==========
const passwordFormRef = ref<FormInstance>();
const isPasswordLoading = ref(false);

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认新密码', trigger: 'blur' }],
};

/**
 * 确认新密码是否一致。
 */
function validateConfirmPassword(): boolean {
  return passwordForm.newPassword === passwordForm.confirmPassword;
}

/**
 * 提交密码修改。
 */
async function handleChangePassword(): Promise<void> {
  if (!passwordFormRef.value) {
    return;
  }
  try {
    await passwordFormRef.value.validate();
  } catch {
    return;
  }
  if (!validateConfirmPassword()) {
    showToast.error('两次输入的新密码不一致');
    return;
  }
  isPasswordLoading.value = true;
  try {
    await changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
    showToast.success('密码修改成功');
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch {
    /* 错误由拦截器处理 */
  } finally {
    isPasswordLoading.value = false;
  }
}

// ========== MFA设置 ==========
const isMfaEnabled = ref(false);
const isMfaLoading = ref(false);
const mfaSetupData = ref<MfaSetupVO | null>(null);
const activateCode = ref('');

const mfaActivateFormRef = ref<FormInstance>();

/**
 * 加载MFA状态。
 */
async function loadMfaStatus(): Promise<void> {
  try {
    isMfaEnabled.value = await getMfaStatus();
  } catch (error) {
    logger.warn('加载MFA状态失败:', error);
    isMfaEnabled.value = false;
  }
}

/**
 * 开始MFA设置（生成密钥和二维码）。
 */
async function handleSetupMfa(): Promise<void> {
  isMfaLoading.value = true;
  try {
    mfaSetupData.value = await setupMfa();
    showToast.success('MFA密钥已生成，请使用Authenticator应用扫描二维码');
  } catch {
    /* 错误由拦截器处理 */
  } finally {
    isMfaLoading.value = false;
  }
}

/**
 * 激活MFA（输入动态码确认）。
 */
async function handleActivateMfa(): Promise<void> {
  if (!mfaActivateFormRef.value) {
    return;
  }
  try {
    await mfaActivateFormRef.value.validate();
  } catch {
    return;
  }
  try {
    await activateMfa({ code: activateCode.value });
    showToast.success('MFA已激活');
    isMfaEnabled.value = true;
    mfaSetupData.value = null;
    activateCode.value = '';
  } catch {
    /* 错误由拦截器处理 */
  }
}

/**
 * 禁用MFA。
 */
async function handleDisableMfa(): Promise<void> {
  try {
    await ydszConfirm('确定禁用MFA双因素认证吗？禁用后账号安全性将降低。', { title: '禁用MFA', type: 'warning' });
  } catch {
    return;
  }
  try {
    await disableMfa({ code: '' });
    showToast.success('MFA已禁用');
    isMfaEnabled.value = false;
  } catch {
    /* 错误由拦截器处理 */
  }
}

/**
 * 取消MFA设置。
 */
function handleCancelMfaSetup(): void {
  mfaSetupData.value = null;
  activateCode.value = '';
}

// 初始化加载
loadProfile();
loadMfaStatus();
</script>

<template>
  <Page auto-content-height>
    <YdCard shadow="never" class="mx-4 my-3">
      <YdCardContent class="pt-6">
      <YdTabs v-model="activeTab">
        <!-- 基本信息 -->
        <YdTabsList class="grid w-full grid-cols-3">
          <YdTabsTrigger value="profile">基本信息</YdTabsTrigger>
          <YdTabsTrigger value="password">修改密码</YdTabsTrigger>
          <YdTabsTrigger value="mfa">MFA设置</YdTabsTrigger>
        </YdTabsList>
        <YdTabsContent value="profile">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-5">
            <div class="md:col-span-4">
              <YdForm
                ref="profileFormRef"
                :model="profileForm"
                :rules="profileRules"
                label-width="100px"
                label-position="right"
              >
                <YdFormItem label="真实姓名" prop="realName">
                  <YdInput v-model="profileForm.realName" placeholder="请输入真实姓名" maxlength="32" show-word-limit />
                </YdFormItem>
                <YdFormItem label="手机号码" prop="phone">
                  <YdInput v-model="profileForm.phone" placeholder="请输入手机号码" maxlength="20" />
                </YdFormItem>
                <YdFormItem label="邮箱地址" prop="email">
                  <YdInput v-model="profileForm.email" placeholder="请输入邮箱地址" maxlength="64" />
                </YdFormItem>
                <YdFormItem label="头像URL" prop="avatar">
                  <YdInput v-model="profileForm.avatar" placeholder="头像地址（上传后自动填充）" />
                </YdFormItem>
                <YdFormItem>
                  <YdButtonBase variant="default" :disabled="isProfileLoading" @click="handleUpdateProfile">
                    <Loader2 v-if="isProfileLoading" class="mr-2 h-4 w-4 animate-spin" />
                    保存修改
                  </YdButtonBase>
                </YdFormItem>
              </YdForm>
            </div>
            <div class="md:col-span-1 flex flex-col items-center gap-3">
              <YdImage
                v-if="avatarUrl"
                :src="avatarUrl"
                class="h-24 w-24 rounded-full border object-cover"
                :preview-src-list="[avatarUrl]"
                fit="cover"
              />
              <div v-else class="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed bg-muted text-muted-foreground">
                <span class="text-xs">无头像</span>
              </div>
              <YdUpload
                :show-file-list="false"
                accept="image/png,image/jpeg,image/jpg,image/gif"
                :http-request="handleAvatarUpload"
              >
                <YdButtonBase size="sm" variant="default">上传头像</YdButtonBase>
              </YdUpload>
              <span class="text-xs text-muted-foreground">支持 PNG/JPG/GIF，建议 200x200</span>
            </div>
          </div>
        </YdTabsContent>

        <!-- 修改密码 -->
        <YdTabsContent value="password">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-5">
            <div class="md:col-span-4">
              <YdForm
                ref="passwordFormRef"
                :model="passwordForm"
                :rules="passwordRules"
                label-width="100px"
                label-position="right"
              >
                <YdFormItem label="原密码" prop="oldPassword">
                  <YdInput v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
                </YdFormItem>
                <YdFormItem label="新密码" prop="newPassword">
                  <YdInput v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
                </YdFormItem>
                <YdFormItem label="确认密码" prop="confirmPassword">
                  <YdInput v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
                </YdFormItem>
                <YdFormItem>
                  <YdButtonBase variant="default" :disabled="isPasswordLoading" @click="handleChangePassword">
                    <Loader2 v-if="isPasswordLoading" class="mr-2 h-4 w-4 animate-spin" />
                    修改密码
                  </YdButtonBase>
                </YdFormItem>
              </YdForm>
            </div>
          </div>
        </YdTabsContent>

        <!-- MFA设置 -->
        <YdTabsContent value="mfa">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-5">
            <div class="md:col-span-4">
              <div class="mb-4">
                <span class="mr-2 text-sm text-gray-600">MFA状态：</span>
                <YdSwitch
                  :model-value="isMfaEnabled"
                  disabled
                  active-text="已开启"
                  inactive-text="未开启"
                />
              </div>

              <!-- 未开启 MFA：引导启用 -->
              <div v-if="!isMfaEnabled">
                <template v-if="!mfaSetupData">
                  <p class="mb-4 text-sm text-gray-500">
                    双因素认证（MFA）为您的账号增加额外的安全保障。启用后，登录时需输入Authenticator应用生成的6位动态码。
                  </p>
                  <YdButtonBase variant="default" :disabled="isMfaLoading" @click="handleSetupMfa">
                    <Loader2 v-if="isMfaLoading" class="mr-2 h-4 w-4 animate-spin" />
                    启用MFA
                  </YdButtonBase>
                </template>

                <!-- MFA 设置引导 -->
                <template v-else>
                  <div class="rounded-lg border bg-blue-50 p-4">
                    <h4 class="mb-3 text-sm font-medium text-blue-800">步骤1：扫描二维码</h4>
                    <div class="mb-3 flex items-center gap-4">
                      <div class="flex h-40 w-40 items-center justify-center rounded border bg-white">
                        <span class="text-xs text-gray-400">请使用<br />Authenticator<br />扫描</span>
                      </div>
                      <div class="text-xs text-gray-500">
                        <p class="mb-1">使用 Google Authenticator、</p>
                        <p class="mb-1">Microsoft Authenticator 或</p>
                        <p class="mb-1">任意兼容TOTP的应用扫描二维码。</p>
                        <p class="mt-2">密钥（手动输入）：</p>
                        <code class="mt-1 block rounded bg-gray-100 p-1 text-xs">{{ mfaSetupData.secret }}</code>
                      </div>
                    </div>
                  </div>

                  <YdForm
                    ref="mfaActivateFormRef"
                    class="mt-4"
                    label-width="100px"
                    label-position="right"
                  >
                    <YdFormItem label="动态码" prop="code">
                      <YdInput
                        v-model="activateCode"
                        placeholder="输入Authenticator中的6位动态码"
                        maxlength="6"
                        class="max-w-64"
                      />
                    </YdFormItem>
                    <YdFormItem>
                      <YdButtonBase variant="default" @click="handleActivateMfa">验证并激活</YdButtonBase>
                      <YdButtonBase variant="ghost" @click="handleCancelMfaSetup">取消</YdButtonBase>
                    </YdFormItem>
                  </YdForm>
                </template>
              </div>

              <!-- 已开启 MFA -->
              <div v-else>
                <p class="mb-4 text-sm text-gray-500">MFA双因素认证已开启。如不再需要，可点击下方按钮禁用（需二次确认）。</p>
                <YdButtonBase variant="destructive" @click="handleDisableMfa">禁用MFA</YdButtonBase>
              </div>
            </div>
          </div>
        </YdTabsContent>
      </YdTabs>
      </YdCardContent>
    </YdCard>
  </Page>
</template>

<style lang="scss" scoped>
.mx-4 {
  margin-left: 16px;
  margin-right: 16px;
}

.my-3 {
  margin-top: 12px;
  margin-bottom: 12px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-2 {
  margin-right: 8px;
}

.mt-1 {
  margin-top: 4px;
}

.mt-2 {
  margin-top: 8px;
}

.rounded-lg {
  border-radius: 8px;
}

.rounded-full {
  border-radius: 9999px;
}

.rounded {
  border-radius: 4px;
}

.border {
  border-width: 1px;
  border-style: solid;
  border-color: #e5e7eb;
}

.border-2 {
  border-width: 2px;
}

.border-dashed {
  border-style: dashed;
}

.bg-blue-50 {
  background-color: #eff6ff;
}

.bg-gray-50 {
  background-color: #f9fafb;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.bg-white {
  background-color: #fff;
}

.p-4 {
  padding: 16px;
}

.p-1 {
  padding: 4px;
}

.text-sm {
  font-size: 14px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-blue-800 {
  color: #1e40af;
}

.font-medium {
  font-weight: 500;
}

.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.gap-3 {
  gap: 12px;
}

.gap-4 {
  gap: 16px;
}

.h-24 {
  height: 96px;
}

.w-24 {
  width: 96px;
}

.h-40 {
  height: 160px;
}

.w-40 {
  width: 160px;
}

.object-cover {
  object-fit: cover;
}

.max-w-64 {
  max-width: 256px;
}

code {
  font-family: ui-monospace, monospace;
}

:deep(.el-tabs__content) {
  padding-top: 16px;
}
</style>
