<!--
 * YdForm —— 表单容器包装器，内置「提交时自动聚焦首个错误字段」能力。
 *
 * 设计目标：
 *  - 包装 vee-validate 的 Form 组件，统一表单提交行为；
 *  - 表单校验失败时，自动 scrollIntoView + focus 到第一个错误字段
 *    （对齐 EP / Naive UI 的 submitForm 交互）；
 *  - 暴露 `submitWithErrorFocus` 方法，供外部按钮手动调用；
 *  - 支持 `isDisabled` 全局禁用、`isSubmitting` 提交中遮罩。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\YdForm.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { GenericObject } from 'vee-validate';

import { useForm } from 'vee-validate';

interface Props {
  /** 初始值 */
  initialValues?: Record<string, unknown>;
  /** 全局禁用所有字段 */
  isDisabled?: boolean;
  /** 提交中状态（显示 loading 遮罩） */
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDisabled: false,
  isSubmitting: false,
});

const emit = defineEmits<{
  (e: 'submit', values: Record<string, unknown>): void;
  (e: 'invalidSubmit', errors: GenericObject): void;
}>();

const { handleSubmit, validate, errors, values } = useForm({
  initialValues: props.initialValues,
});

/**
 * 带错误聚焦的提交处理器。
 *
 * <p>先调用 vee-validate 的 handleSubmit 包裹：若有错误，则查找其对应的 DOM 节点并聚焦；
 * 若无错误，则 emit('submit')。
 */
const submitWithErrorFocus = handleSubmit(
  (formValues) => {
    emit('submit', formValues);
  },
  (ctx) => {
    // 聚焦首个错误字段
    const firstErrorField = Object.keys(ctx.errors)[0];
    if (firstErrorField) {
      const el = document.querySelector(`[name="${firstErrorField}"]`) as HTMLInputElement | null;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    }
    emit('invalidSubmit', ctx.errors);
  },
);

defineExpose({
  errors,
  submitWithErrorFocus,
  validate,
  values,
});
</script>

<template>
  <form
    class="relative space-y-4"
    :class="{ 'pointer-events-none opacity-60': isDisabled }"
    novalidate
    @submit.prevent="submitWithErrorFocus"
  >
    <slot :errors="errors" :is-submitting="isSubmitting" />
    <!-- 提交 loading 遮罩 -->
    <div
      v-if="isSubmitting"
      class="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      aria-live="polite"
      role="status"
    >
      <div class="flex flex-col items-center gap-2">
        <div
          class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
        <span class="text-sm text-muted-foreground">提交中...</span>
      </div>
    </div>
  </form>
</template>
