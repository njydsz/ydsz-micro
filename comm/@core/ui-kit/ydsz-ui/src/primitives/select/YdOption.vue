<!--
 * 选择器选项 —— 便利性封装（Convenience Wrapper）。
 *
 * YdSelectItem 的别名，对齐 Element Plus ElOption 的命名惯例。
 * 迁移 EP 项目时避免全文替换带来的心理负担。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\select\YdOption.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
/**
 * 选择器选项便利性封装。
 * <p>YdSelectItem 的别名，API 完全等价。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { SelectItem, useForwardProps } from '@ydsz-core/ydsz-vue';

import type { SelectItemProps } from '@ydsz-core/ydsz-vue';

import { computed } from 'vue';

type ClassValue = string | Record<string, boolean> | (string | Record<string, boolean>)[];

const props = defineProps<SelectItemProps & { class?: ClassValue }>();

const delegatedProps = computed(() => {
  // eslint-disable-next-line unused-imports/no-unused-vars
  const { class: _cls, ...delegated } = props;

  return delegated;
});

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <!--
    YdOption = YdSelectItem 命名 alias。

    推荐用法：
    ```html
    <YdSelect v-model="selected">
      <YdOption value="apple" label="苹果" />
      <YdOption value="banana" label="香蕉" />
      <YdOption value="orange" label="橙子" disabled />
    </YdSelect>
    ```
    等价的写法：
    ```html
    <YdSelect v-model="selected">
      <YdSelectItem value="apple">苹果</YdSelectItem>
      <YdSelectItem value="banana">香蕉</YdSelectItem>
      <YdSelectItem value="orange" disabled>橙子</YdSelectItem>
    </YdSelect>
    ```
  -->
  <SelectItem v-bind="forwardedProps">
    <slot />
  </SelectItem>
</template>
