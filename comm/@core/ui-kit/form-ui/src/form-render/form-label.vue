<!--
 * 表单项标签：渲染必填星号、冒号与帮助提示，并支持标签内容自定义。
 *
 * 独立成组件是因为必填标记、冒号与帮助气泡在各表单间的表现必须一致；
 * 集中一处便于统一维护无障碍语义（标签与控件的关联关系）。
 * label 与 help 均为 CustomRenderType，支持传字符串或渲染函数，
 * 冒号仅在同时存在 label 时渲染，避免空标签后残留孤立标点。
 *
 * @path comm\@core\ui-kit\form-ui\src\form-render\form-label.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import type { CustomRenderType } from '../types';

import {
  FormLabel,
  YDSZHelpTooltip,
  YDSZRenderContent,
} from '@YDSZ-core/shadcn-ui';
import { cn } from '@YDSZ-core/shared/utils';

interface Props {
  class?: string;
  colon?: boolean;
  help?: CustomRenderType;
  label?: CustomRenderType;
  required?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <FormLabel :class="cn('flex items-center', props.class)">
    <span v-if="required" class="text-destructive mr-[2px]">*</span>
    <slot></slot>
    <YDSZHelpTooltip v-if="help" trigger-class="size-3.5 ml-1">
      <YDSZRenderContent :content="help" />
    </YDSZHelpTooltip>
    <span v-if="colon && label" class="ml-[2px]">:</span>
  </FormLabel>
</template>

