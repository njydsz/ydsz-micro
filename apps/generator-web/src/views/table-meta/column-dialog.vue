<!--
 * 列元数据对话框
 *
 * <p>展示指定表的列元数据，支持刷新列缓存。
 *
 * @path apps/generator-web/src/views/table-meta/column-dialog.vue
 * @author ydsz-team
 * @since 1.0.0
-->
<script lang="ts" setup>
/**
 * 列元数据对话框组件。
 *
 * <p>展示表的所有列及其数据类型、是否主键、是否可空等属性。
 *
 * @author ydsz-team
 * @since 1.0.0
 */
import { onMounted, ref, watch } from 'vue';

import { YdBadge, YdButtonBase, YdTable, YdTableColumn, YdDialog, YdDialogContent, YdDialogHeader, YdDialogTitle } from '@ydsz-core/ydsz-ui';
// FIXME-P3-EP-EXIT;

import { getColumns, refreshColumns } from '#/api/table-meta';
import type { GenColumnMeta } from '#/api/models';

interface Props {
  visible: boolean;
  tableMetaId?: number;
  tableName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  tableName: '',
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

defineOptions({ name: 'ColumnDialog' });

const loading = ref(false);
const columns = ref<GenColumnMeta[]>([]);

/** 加载列元数据 */
async function loadColumns() {
  if (!props.tableMetaId) return;
  loading.value = true;
  try {
    columns.value = await getColumns({ tableMetaId: props.tableMetaId });
  } finally {
    loading.value = false;
  }
}

/** 刷新列元数据 */
async function handleRefreshColumns() {
  if (!props.tableMetaId) return;
  loading.value = true;
  try {
    columns.value = await refreshColumns({
      datasourceId: 0,
      tableName: props.tableName,
    });
    showToast.success('刷新列缓存成功');
  } finally {
    loading.value = false;
  }
}

/** 关闭对话框 */
function handleClose() {
  emit('update:visible', false);
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.tableMetaId) {
      void loadColumns();
    }
  },
);

onMounted(() => {
  if (props.visible && props.tableMetaId) {
    void loadColumns();
  }
});
</script>

<template>
  <YdDialog :open="visible" @update:open="handleClose">
    <YdDialogContent style="max-width: 900px">
      <YdDialogHeader>
        <YdDialogTitle>列元数据 - {{ tableName }}</YdDialogTitle>
      </YdDialogHeader>
      <div class="mb-3 flex justify-end">
        <YdButtonBase size="sm" @click="handleRefreshColumns">刷新列缓存</YdButtonBase>
      </div>
      <YdTable loading="loading" :data="columns" stripe max-height="400">
        <YdTableColumn prop="columnName" label="列名" width="150" />
        <YdTableColumn prop="dataType" label="数据类型" width="120" />
        <YdTableColumn prop="columnSize" label="长度" width="80" />
        <YdTableColumn label="主键" width="70">
          <template #default="{ row }">
            <YdBadge v-if="row.pk" variant="destructive">PK</YdBadge>
            <span v-else>-</span>
          </template>
        </YdTableColumn>
        <YdTableColumn label="可空" width="70">
          <template #default="{ row }">
            <YdBadge :variant="row.nullable ? 'secondary' : 'destructive'">
              {{ row.nullable ? '是' : '否' }}
            </YdBadge>
          </template>
        </YdTableColumn>
        <YdTableColumn prop="comment" label="注释" min-width="150" />
        <YdTableColumn prop="overrideJavaType" label="Java类型" width="120" />
        <YdTableColumn prop="overrideFieldName" label="字段名" width="120" />
      </YdTable>
    </YdDialogContent>
  </YdDialog>
</template>
