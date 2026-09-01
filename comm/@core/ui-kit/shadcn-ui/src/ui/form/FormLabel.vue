<!--
 * 字段标签：自动把 for 指向本字段控件的 id，从而无需手写 for / id 配对。
 *
 * peer-disabled 相关类名让标签能跟随相邻控件的禁用态变灰 ——
 * 依赖 Tailwind 的 peer 机制，故标签与控件必须是同级相邻节点，中间不能再套层。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\form\FormLabel.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import type { LabelProps } from 'radix-vue';

import { cn } from '@YDSZ-core/shared/utils';

import { Label } from '../label';
import { useFormField } from './useFormField';

const props = defineProps<LabelProps & { class?: any }>();

const { formItemId } = useFormField();
</script>

<template>
  <Label :class="cn(props.class)" :for="formItemId">
    <slot></slot>
  </Label>
</template>
