<!--
 * 表单控件的无障碍包裹层：把这层壳套在输入框外，即可自动完成 id 与 aria 的接线。
 *
 * aria-describedby 会按是否有错误动态拼接 —— 无错时只关联描述，有错时追加错误信息的 id，
 * 这样读屏在校验失败时才会读出原因，平时不会重复播报。
 * 使用 Slot 而非额外 DOM 节点，避免破坏表单的布局结构。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\FormControl.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { Slot } from 'radix-vue';

import { useFormField } from './useFormField';

const { error, formDescriptionId, formItemId, formMessageId } = useFormField();
</script>

<template>
  <Slot
    :id="formItemId"
    :aria-describedby="
      !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`
    "
    :aria-invalid="!!error"
  >
    <slot></slot>
  </Slot>
</template>
