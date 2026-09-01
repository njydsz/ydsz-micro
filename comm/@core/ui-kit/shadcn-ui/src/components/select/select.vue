<!--
 * 开箱即用的下拉选择器：在 radix Select 之上补齐本项目最常用的三项能力 ——
 * options 数组直接渲染（省去逐条手写 SelectItem）、v-model 双向绑定、allowClear 一键清空。
 *
 * 清空把 modelValue 置为 undefined 而不是空字符串，
 * 便于表单校验区分「未选择」与「选中了空值」两种状态。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\components\select\select.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
import { CircleX } from '@YDSZ-core/icons';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui';

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
  <Select v-model="modelValue">
    <SelectTrigger :class="props.class" class="flex w-full items-center" aria-label="选择框">
      <SelectValue class="flex-auto text-left" :placeholder="placeholder" />
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
    </SelectTrigger>
    <SelectContent>
      <template v-for="item in options" :key="item.value">
        <SelectItem :value="item.value"> {{ item.label }} </SelectItem>
      </template>
    </SelectContent>
  </Select>
</template>

<style lang="scss" scoped>
button[role='combobox'][data-placeholder] {
  color: hsl(var(--muted-foreground));
}

button {
  --ring: var(--primary);
}
</style>
