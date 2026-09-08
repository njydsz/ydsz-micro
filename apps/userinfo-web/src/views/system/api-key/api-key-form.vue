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
 * API Key 创建表单
 */
import type { FormInstance } from 'element-plus';
import { ElAlert, ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElMessage } from 'element-plus';
import { createLogger } from '@ydsz/utils';
import { nextTick, reactive, ref } from 'vue';
import { createKey } from '#/api/apiKey';

defineOptions({ name: 'ApiKeyForm' });

const logger = createLogger('userinfo-apikey-form');

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
      ElMessage.success('创建成功，请立即保存下方明文 Key');
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
  <ElDialog v-model="visible" title="创建 API Key" width="500px" :close-on-click-modal="false" @close="close">
    <ElAlert
      v-if="createdApiKey"
      type="warning"
      :closable="false"
      show-icon
      class="mb-4"
      title="请立即保存以下明文 API Key，关闭此弹窗后将无法再次获取！"
    />
    <div v-if="createdApiKey" class="mb-4 p-3 bg-gray-100 rounded font-mono text-sm break-all">
      {{ createdApiKey }}
    </div>

    <ElForm v-show="!createdApiKey" ref="formRef" :model="form" label-width="100px">
      <ElFormItem label="Key 名称" prop="keyName" required>
        <ElInput v-model="form.keyName" placeholder="如 jenkins-deploy" maxlength="64" show-word-limit />
      </ElFormItem>
      <ElFormItem label="授权范围" prop="scopes">
        <ElInput v-model="form.scopes" placeholder="逗号分隔，如 read,write" />
      </ElFormItem>
      <ElFormItem label="过期天数" prop="expireDays">
        <ElInputNumber v-model="form.expireDays" :min="1" :max="3650" placeholder="留空永不过期" class="w-full" />
      </ElFormItem>
      <ElFormItem label="限流(次/分)" prop="rateLimit">
        <ElInputNumber v-model="form.rateLimit" :min="1" :max="10000" placeholder="留空使用默认" class="w-full" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="close">{{ createdApiKey ? '关闭' : '取消' }}</ElButton>
      <ElButton v-if="!createdApiKey" type="primary" :loading="loading" @click="handleSubmit">创建</ElButton>
    </template>
  </ElDialog>
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
