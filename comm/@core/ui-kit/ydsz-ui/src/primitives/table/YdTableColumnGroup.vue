<!--
 * 表格列组（多级表头容器，无可见渲染）。
 *
 * <p>作为 YdTable 的子组件使用：向父级注册一个"组列"，
 * 组的子级 YdTableColumn 自动归属为该组的子列，渲染为两行表头。
 *
 * <p>示例：
 * <pre>
 *   &lt;YdTable :data="rows"&gt;
 *     &lt;YdTableColumnGroup label="用户信息"&gt;
 *       &lt;YdTableColumn prop="name" label="姓名" /&gt;
 *       &lt;YdTableColumn prop="age" label="年龄" /&gt;
 *     &lt;/YdTableColumnGroup&gt;
 *     &lt;YdTableColumn prop="remark" label="备注" /&gt;
 *   &lt;/YdTable&gt;
 * </pre>
 *
 * @path comm\@core\ui-kit\ydsz-ui\src\ui\table\YdTableColumnGroup.vue
 * @author ydsz-team
 * @since 4.2.0
 -->
<script setup lang="ts">
import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted } from 'vue';

import { YD_TABLE_COLUMN_REGISTRY } from './injectionKeys';

import type { ColumnDef } from './ColumnDef';
import type { ColumnRegistry } from './injectionKeys';

defineOptions({ name: 'YdTableColumnGroup' });

interface Props {
  /** 组表头文本 */
  label?: string;
}

const props = defineProps<Props>();

const instance = getCurrentInstance();
const groupId = computed(() => `group_${instance?.uid ?? 0}`);

const registry = inject<ColumnRegistry | null>(YD_TABLE_COLUMN_REGISTRY, null);

// 组列通过带 children 的对象注入，子列在组挂载后再注册（需要确保顺序）
// 简化方案：组先占位，子列注入时检测父组 uid（通过 parent 链）
onMounted(() => {
  if (!registry) return;
  const groupColumn: ColumnDef = {
    label: props.label,
    _uid: instance?.uid,
    children: [],
  };
  registry.addColumn(groupId.value, groupColumn);
});

onBeforeUnmount(() => {
  registry?.removeColumn(groupId.value);
});
</script>

<template>
  <!-- 无可见模板：列组定义由父级 YdTable 收集后统一渲染 -->
</template>
