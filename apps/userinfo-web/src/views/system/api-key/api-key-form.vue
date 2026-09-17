<!--
 * API Key 创建表单弹窗
 *
 * <p>提供创建 API Key 的表单，创建成功后展示明文 apiKey（仅此一次）。
 *
 * @path apps/userinfo-web/src/views/system/api-key/api-key-form.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * API Key 创建表单弹窗。
 *
 * <p>提供 API Key 的创建向导，包括名称、授权范围、过期天数、限流配置。
 * 创建成功后一次性展示明文 apiKey（仅此一次可见，需用户手动保存）。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import type { FormInstance } from 'element-plus';
import { YdButtonBase, YdDialog, YdDialogContent, YdDialogDescription, YdDialogFooter, YdDialogHeader, YdDialogTitle } from '@ydsz-core/ydsz-ui';
import { Loader2 } from 'lucide-vue-next';
import { cn } from '@ydsz-core/shared/utils';
import { YdAlertBanner, YdForm, YdFormItem, YdInput, YdNumberFieldInput } from '@ydsz-core/ydsz-ui';
import { reactive, ref } from 'vue';
import { createKey } from '#/api/apiKey';

defineOptions({ name: 'ApiKeyForm' });

/** 弹窗显示控制 */
const visible = ref(false);
/** 加载状态 */
const loading = ref(false);
/** 表单引用 */
const formRef = ref<FormInstance>();
/** 创建成功的明文 key（仅展示一次） */
const createdApiKey = ref('');

/** 表单数据 */
const form = reactive({
  keyName: '',
  scopes: 'read',
  expireDays: undefined as number | undefined,
  rateLimit: undefined as number | undefined,
});

/**
 * 打开弹窗。
 */
function open() {
  visible.value = true;
  createdApiKey.value = '';
}

/**
 * 关闭弹窗。
 */
function close() {
  visible.value = false;
  form.keyName = '';
  form.scopes = 'read';
  form.expireDays = undefined;
  form.rateLimit = undefined;
}

/**
 * 提交创建。
 */
async function handleSubmit() {
  if (!formRef.value) {
    return;
  }
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const result = await createKey({
      keyName: form.keyName,
      scopes: form.scopes,
      expireDays: form.expireDays,
      rateLimit: form.rateLimit,
    });
    if (result.apiKey) {
      createdApiKey.value = result.apiKey;
      showToast.success('创建成功，请立即保存下方明文 Key');
    }
  } catch {
    /* 错误由拦截器处理 */
  } finally {
    loading.value = false;
  }
}

defineExpose({ open, close });
</script>

<template>
  <YdDialog v-model:open="visible">
    <YdDialogContent :class="cn('max-w-[500px]')">
      <YdDialogHeader>
        <YdDialogTitle>创建 API Key</YdDialogTitle>
      </YdDialogHeader>
      <YdDialogDescription v-if="createdApiKey">
        <strong class="text-yellow-600 dark:text-yellow-400">请立即保存以下明文 API Key，关闭此弹窗后将无法再次获取！</strong>
      </YdDialogDescription>

      <div v-if="createdApiKey" class="mb-4 p-3 bg-muted rounded font-mono text-sm break-all">
        {{ createdApiKey }}
      </div>

      <YdForm v-show="!createdApiKey" ref="formRef" :model="form" label-width="100px">
        <YdFormItem label="Key 名称" prop="keyName" required>
          <YdInput v-model="form.keyName" placeholder="如 jenkins-deploy" maxlength="64" show-word-limit />
        </YdFormItem>
        <YdFormItem label="授权范围" prop="scopes">
          <YdInput v-model="form.scopes" placeholder="逗号分隔，如 read,write" />
        </YdFormItem>
        <YdFormItem label="过期天数" prop="expireDays">
          <YdNumberFieldInput v-model="form.expireDays" :min="1" :max="3650" placeholder="留空永不过期" class="w-full" />
        </YdFormItem>
        <YdFormItem label="限流(次/分)" prop="rateLimit">
          <YdNumberFieldInput v-model="form.rateLimit" :min="1" :max="10000" placeholder="留空使用默认" class="w-full" />
        </YdFormItem>
      </YdForm>

      <YdDialogFooter class="gap-2">
        <YdButtonBase variant="outline" @click="close">{{ createdApiKey ? '关闭' : '取消' }}</YdButtonBase>
        <YdButtonBase v-if="!createdApiKey" :disabled="loading" @click="handleSubmit">
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          创建
        </YdButtonBase>
      </YdDialogFooter>
    </YdDialogContent>
  </YdDialog>
</template>

<style lang="scss" scoped>
.mb-4 {
  margin-bottom: 16px;
}

.p-3 {
  padding: 12px;
}

.bg-gray-100 {
  background-color: #f3f4f6;
}

.rounded {
  border-radius: 4px;
}

.font-mono {
  font-family: ui-monospace, monospace;
}

.text-sm {
  font-size: 14px;
}

.break-all {
  word-break: break-all;
}

.w-full {
  width: 100%;
}
</style>
