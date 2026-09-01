<!--
 * 字段错误提示：渲染 vee-validate 的 ErrorMessage，并带上 formMessageId 供 aria 引用。
 *
 * 错误文案按字段名（name）从校验上下文里取，而不是由父级传入 ——
 * 这样校验规则变化时提示文案自动跟随，不必在多处同步同一句话。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\FormMessage.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { toValue } from 'vue';

import { ErrorMessage } from 'vee-validate';

import { useFormField } from './useFormField';

const { formMessageId, name } = useFormField();
</script>

<template>
  <ErrorMessage
    :id="formMessageId"
    :name="toValue(name)"
    as="p"
    class="text-destructive text-[0.8rem]"
  />
</template>
