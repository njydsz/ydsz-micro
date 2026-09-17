<!--
 * 表格容器：负责整体布局（overflow-auto）与无障碍角色。
 *
 * 设计目标：
 *  - 提供语义化的 <table> 结构与响应式容器；
 *  - 转发 ref 便于外部调用 scrollIntoView API；
 *  - 不含任何数据逻辑（排序、筛选、分页），纯粹 UI 容器。
 *
 * a11y 实现：使用原生 <table> 语义，不额外加 role="grid"；
 * 屏幕阅读器自动识别 thead / tbody / th scope 并朗读行列关系。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\YdTable.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
import { cn } from '@ydsz-core/shared/utils';

defineOptions({ name: 'YdTable' });

interface Props {
  /** 整个表格的宽度，默认 '100%' */
  width?: string;
  /** 自定义类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
});
</script>

<template>
  <div class="relative w-full overflow-auto">
    <table
      :class="cn('w-full caption-bottom text-sm', props.class)"
      :style="{ width }"
    >
      <slot />
    </table>
  </div>
</template>
