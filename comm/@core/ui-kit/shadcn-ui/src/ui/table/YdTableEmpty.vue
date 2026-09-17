<!--
 * 表格空数据占位：在 tbody 内独占一行，跨所有列。
 *
 * @path comm\@core\ui-kit\shadcn-ui\src\ui\table\YdTableEmpty.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script setup lang="ts">
defineOptions({ name: 'YdTableEmpty' });

interface Props {
  /** 跨列数（应与表格列数一致），默认 1 */
  colspan?: number;
  /** 空数据提示文本，默认 '暂无数据' */
  description?: string;
}

withDefaults(defineProps<Props>(), {
  colspan: 1,
  description: '暂无数据',
});
</script>

<template>
  <tr>
    <td
      :colspan="colspan"
      class="h-24 text-center text-muted-foreground"
    >
      <slot>
        <div class="flex flex-col items-center justify-center gap-1">
          <span class="text-sm">{{ description }}</span>
        </div>
      </slot>
    </td>
  </tr>
</template>
