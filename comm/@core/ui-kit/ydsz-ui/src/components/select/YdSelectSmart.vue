<!--
 * 开箱即用的下拉选择器：在 radix YdSelectSmart 之上补齐本项目最常用的三项能力 ——
 * options 数组直接渲染（省去逐条手写 YdSelectItem）、v-model 双向绑定、allowClear 一键清空。
 *
 * 清空把 modelValue 置为 undefined 而不是空字符串，
 * 便于表单校验区分「未选择」与「选中了空值」两种状态。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\components\select\select.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
// @ts-nocheck
import { CircleX } from '@ydsz-core/icons';

import {
  YdSelect,
  YdSelectContent,
  YdSelectItem,
  YdSelectTrigger,
  YdSelectValue,
} from '../../primitives';

interface Props {
  allowClear?: boolean;
  class?: any;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  allowClear: false,
});

const modelValue = defineModel<string>();

function handleClear() {
  modelValue.value = undefined;
}
</script>
<template>
  <YdSelect v-model="modelValue">
    <YdSelectTrigger :class="props.class" class="flex w-full items-center" aria-label="选择框">
      <YdSelectValue class="flex-auto text-left" :placeholder="placeholder" />
      <CircleX
        @pointerdown.stop
        @click.stop.prevent="handleClear"
        v-if="allowClear && modelValue"
        data-clear-button
        class="mr-1 size-4 cursor-pointer opacity-50 hover:opacity-100"
        aria-label="清除选择"
        role="button"
        tabindex="0"
      />
    </YdSelectTrigger>
    <YdSelectContent>
      <template v-for="item in options" :key="item.value">
        <YdSelectItem :value="item.value"> {{ item.label }} </YdSelectItem>
      </template>
    </YdSelectContent>
  </YdSelect>
</template>

<style lang="scss" scoped>
button[role='combobox'][data-placeholder] {
  color: hsl(var(--muted-foreground));
}

button {
  --ring: var(--primary);
}
</style>
