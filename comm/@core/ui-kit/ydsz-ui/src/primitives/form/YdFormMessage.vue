<!--
 * YdFormMessage —— 字段错误消息 + 异步校验 loading 态。
 *
 * P0-5 增强：当字段处于 isValidating 状态时，显示 loading spinner，
 * 让用户明确感知「校验中」状态，避免异步校验时用户误以为无响应。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\YdFormMessage.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { toValue } from 'vue';

import { ErrorMessage } from 'vee-validate';

import { Loader2 } from 'lucide-vue-next';

import { useFormField } from './useFormField';

const { error, formMessageId, isValidating, name } = useFormField();
</script>

<template>
  <!-- 异步校验 loading 态 -->
  <p
    v-if="isValidating"
    :id="`${formMessageId}-validating`"
    class="flex items-center gap-1 text-[0.8rem] text-muted-foreground"
    aria-live="polite"
    role="status"
  >
    <Loader2 class="size-3 animate-spin" aria-hidden="true" />
    <span>校验中...</span>
  </p>
  <!-- 错误消息 -->
  <ErrorMessage
    v-else
    :id="formMessageId"
    :name="toValue(name)"
    as="p"
    class="text-destructive text-[0.8rem]"
  />
</template>
