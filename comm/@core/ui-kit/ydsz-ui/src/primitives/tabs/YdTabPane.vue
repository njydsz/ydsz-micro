<!--
 * 标签页面板触发器 —— 便利性封装（Convenience Wrapper）。
 *
 * 组合 YdTabsTrigger 的便利性封装，常与 YdTabsContent 配对使用。
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\tabs\YdTabPane.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
/**
 * 标签页面板组件 —— 便利性封装。
 * <p>简化 Tab 面板的一次性声明：label + name 只写一次。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import YdTabsTrigger from './YdTabsTrigger.vue';

withDefaults(defineProps<{
  /** 标签页显示文本 */
  label: string;
  /** 标签页唯一标识（与 YdTabsContent 的 value 配对） */
  name: string;
  /** 是否禁用 */
  disabled?: boolean;
}>(), {
  disabled: false,
});
</script>

<template>
  <!-- 便利性 wrapper：渲染为 YdTabsTrigger，label 和 name 只声明一次。推荐与 YdTabsContent 配对使用。 -->
  <YdTabsTrigger
    :value="name"
    :disabled="disabled"
  >
    <slot name="label">{{ label }}</slot>
    <slot />
  </YdTabsTrigger>
</template>
