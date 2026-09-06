<!--
 * 二次身份验证弹窗组件
 *
 * <p>受控弹窗组件 —— 内部所有状态由外部通过 props 注入：
 * visible / hint / error / loading 由 props 传入，confirm / cancel 由 emit 提交。
 *
 * <p>安全约束：
 * 关闭方式仅限「取消按钮」，遮罩点击与 ESC 已被禁止（close-on-click-modal=false / close-on-press-escape=false），
 * 防止用户绕过密码输入直接关闭导致 Promise 永不结算。
 *
 * @path apps\system-web\src\components\secondary-auth-modal\index.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 二次身份验证弹窗
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onBeforeUnmount, ref, watch } from 'vue';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  /** 弹窗显隐 */
  visible: boolean;
  /** 顶部提示文案 */
  hint?: string;
  /** 表单校验错误 */
  error?: string;
  /** 按钮 loading 状态 */
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'confirm', password: string): void;
  (e: 'cancel'): void;
}>();

const { t } = useI18n();

/** 密码输入值 */
const password = ref('');
/** 本地提交重复点击保护 */
const submitting = ref(false);

/** 监听 visible：弹出时清空上次输入 */
watch(
  () => props.visible,
  (val) => {
    if (val) {
      password.value = '';
      submitting.value = false;
    }
  },
);

/** 处理确认（提交密码） */
function handleConfirm() {
  if (!password.value || submitting.value) return;
  submitting.value = true;
  emit('confirm', password.value);
}

/** 处理取消 */
function handleCancel() {
  if (submitting.value) return;
  emit('cancel');
}

/** 清理：组件卸载时防止 Promise 泄漏 */
onBeforeUnmount(() => {
  password.value = '';
  submitting.value = false;
});
</script>

<template>
  <ElDialog
    :model-value="props.visible"
    :title="t('secondaryAuth.title')"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    append-to-body
    @update:model-value="(val) => { if (!val) handleCancel(); }"
  >
    <ElAlert v-if="props.hint" :title="props.hint" type="warning" :closable="false" show-icon style="margin-bottom: 16px" />
    <ElForm @submit.prevent="handleConfirm">
      <ElFormItem :error="props.error">
        <template #label>
          <span>{{ t('secondaryAuth.password') }}</span>
        </template>
        <ElInput
          v-model="password"
          type="password"
          :placeholder="t('secondaryAuth.passwordPlaceholder')"
          show-password
          @keyup.enter="handleConfirm"
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleCancel">{{ t('secondaryAuth.cancel') }}</ElButton>
      <ElButton type="primary" :loading="props.loading || submitting" @click="handleConfirm">
        {{ t('secondaryAuth.confirm') }}
      </ElButton>
    </template>
  </ElDialog>
</template>
