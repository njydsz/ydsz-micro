<!--
 * 二次身份验证弹窗组件
 *
 * <p>受控弹窗组件 —— 内部所有状态由外部通过 props 注入：
 * visible / hint / error / loading 由 props 传入，confirm / cancel 由 emit 提交。
 *
 * <p>安全约束：
 * 关闭方式仅限「取消按钮」，遮罩点击与 ESC 已被禁止（closeOnOverlayClick=false / closeOnEsc=false），
 * 防止用户绕过密码输入直接关闭导致 Promise 永不结算。
 *
 * 使用自研 YdDialog + InputPassword + YdAlertBanner + YdButton，零 element-plus 依赖。
 *
 * @path comm\effects\shared-business\src\components\secondary-auth-modal\index.vue
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

import { useI18n } from 'vue-i18n';

import {
  YdAlertBanner,
  YdButton,
  YdDialog,
  YdDialogContent,
  YdDialogFooter,
  YdDialogHeader,
  YdDialogTitle,
  InputPassword,
} from '@ydsz-core/ydsz-ui';

defineOptions({ name: 'YdSecondaryAuthModal' });

const props = withDefaults(
  defineProps<{
    /** 弹窗显隐 */
    visible: boolean;
    /** 顶部提示文案 */
    hint?: string;
    /** 表单校验错误 */
    error?: string;
    /** 按钮 loading 状态 */
    loading?: boolean;
  }>(),
  {
    error: '',
    hint: '',
    loading: false,
  },
);

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
function handleConfirm(): void {
  if (!password.value || submitting.value) return;
  submitting.value = true;
  emit('confirm', password.value);
}

/** 处理取消 */
function handleCancel(): void {
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
  <YdDialog :open="visible">
    <YdDialogContent
      class="secondary-auth-modal"
      :close-on-esc="false"
      :close-on-overlay-click="false"
      :show-close="false"
      @update:open="(open) => { if (!open) handleCancel(); }"
    >
      <YdDialogHeader>
        <YdDialogTitle>{{ t('secondaryAuth.title') }}</YdDialogTitle>
      </YdDialogHeader>

      <!-- 顶部提示 -->
      <YdAlertBanner
        v-if="props.hint"
        :closable="false"
        :show-icon="true"
        :title="props.hint"
        class="secondary-auth-modal__hint"
        type="warning"
      />

      <!-- 表单区 -->
      <form
        class="secondary-auth-modal__form"
        @submit.prevent="handleConfirm"
      >
        <label class="secondary-auth-modal__label">
          <span class="secondary-auth-modal__label-text">
            {{ t('secondaryAuth.password') }}
          </span>
          <InputPassword
            v-model="password"
            :placeholder="t('secondaryAuth.passwordPlaceholder')"
            class="secondary-auth-modal__input"
            :aria-invalid="!!props.error"
            :aria-describedby="props.error ? 'secondary-auth-error' : undefined"
            @keyup.enter="handleConfirm"
          />
        </label>
        <p
          v-if="props.error"
          id="secondary-auth-error"
          class="secondary-auth-modal__error"
          role="alert"
        >
          {{ props.error }}
        </p>
      </form>

      <!-- 操作区 -->
      <YdDialogFooter class="secondary-auth-modal__footer">
        <YdButton
          :disabled="submitting"
          type="button"
          variant="outline"
          @click="handleCancel"
        >
          {{ t('secondaryAuth.cancel') }}
        </YdButton>
        <YdButton
          :loading="props.loading || submitting"
          type="button"
          @click="handleConfirm"
        >
          {{ t('secondaryAuth.confirm') }}
        </YdButton>
      </YdDialogFooter>
    </YdDialogContent>
  </YdDialog>
</template>

<style scoped>
.secondary-auth-modal {
  width: 400px;
  max-width: calc(100vw - 32px);
}

.secondary-auth-modal__hint {
  margin-bottom: 16px;
}

.secondary-auth-modal__form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.secondary-auth-modal__label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.secondary-auth-modal__label-text {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--txt-primary, #1f2937));
}

.secondary-auth-modal__input {
  width: 100%;
}

.secondary-auth-modal__error {
  font-size: 12px;
  color: hsl(var(--destructive-500, #ef4444));
  margin: 0;
  min-height: 18px;
}

.secondary-auth-modal__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
