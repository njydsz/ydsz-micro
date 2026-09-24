<!--
 * 字段说明文字：渲染为 p 并带上由 useFormField 生成的 formDescriptionId。
 *
 * 这个 id 是 aria-describedby 的拼图之一，组件本身不负责关联，
 * 关联动作统一由 YdFormControl 完成，因此说明文字可以放在控件之前或之后都不影响无障碍链路。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\form\YdFormDescription.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { cn } from '@ydsz-core/shared/utils';

import { useFormField } from './useFormField';

const props = defineProps<{
  class?: any;
}>();

const { formDescriptionId } = useFormField();
</script>

<template>
  <p
    :id="formDescriptionId"
    :class="cn('text-muted-foreground text-sm', props.class)"
  >
    <slot></slot>
  </p>
</template>
